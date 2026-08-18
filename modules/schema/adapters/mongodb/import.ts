import type { Field, FieldType, SchemaProject, Table } from "../../domain";
import { createTable } from "../../domain/entities/table";
import {
  createProject,
  validateFieldName,
  validateTableName,
} from "../../domain/services/schema.service";

const MONGO_TYPE: Record<string, FieldType> = {
  String: "string",
  Number: "integer",
  Long: "bigint",
  Float: "float",
  Double: "double",
  Decimal128: "decimal",
  Boolean: "boolean",
  Date: "date",
  Mixed: "json",
  Buffer: "binary",
  ObjectId: "uuid",
  Array: "json",
};

function stripComments(code: string): string {
  return code
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split("\n")
    .map((line) => {
      const idx = line.indexOf("//");
      return idx >= 0 ? line.slice(0, idx) : line;
    })
    .join("\n");
}

function findBalanced(
  code: string,
  start: number,
  open: string,
  close: string,
): { content: string; end: number } {
  let depth = 0;
  let i = start;
  while (i < code.length) {
    if (code[i] === open) depth++;
    if (code[i] === close) {
      depth--;
      if (depth === 0) return { content: code.slice(start + 1, i), end: i };
    }
    i++;
  }
  return { content: code.slice(start + 1), end: code.length };
}

function splitTopLevel(input: string, sep = ","): string[] {
  const parts: string[] = [];
  let depth = 0;
  let cur = "";
  for (const ch of input) {
    if (ch === "(" || ch === "[" || ch === "{") depth++;
    if (ch === ")" || ch === "]" || ch === "}") depth--;
    if (ch === sep && depth === 0) {
      parts.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  if (cur.trim()) parts.push(cur);
  return parts;
}

interface SchemaDecl {
  jsName: string;
  body: string;
  collection?: string;
}

interface MongoRef {
  targetTable: string;
  onDelete?: string;
}

function parseSchemaDecls(code: string): SchemaDecl[] {
  const decls: SchemaDecl[] = [];
  const re = /const\s+([A-Za-z_$][\w$]*)\s*=\s*new\s+Schema\s*\(/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(code))) {
    const call = findBalanced(code, m.index + m[0].length - 1, "(", ")");
    const args = splitTopLevel(call.content);
    if (!args.length) continue;
    const body = args[0].trim().replace(/^\{/, "").replace(/\}$/, "");
    const opts = args.slice(1).join(",");
    const collection = opts.match(/collection\s*:\s*["'`]([^"'`]+)["'`]/)?.[1];
    decls.push({ jsName: m[1], body, collection });
  }
  return decls;
}

function parseModelRegs(code: string): Map<string, string> {
  const regs = new Map<string, string>();
  const re = /model\s*\(\s*["'`]([^"'`]+)["'`]\s*,\s*([A-Za-z_$][\w$]*)\s*\)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(code))) {
    regs.set(m[2], m[1]);
  }
  const modelsRe = /models\.([A-Za-z_$][\w$]*)/g;
  while ((m = modelsRe.exec(code))) {
    if (!regs.has(m[1])) regs.set(m[1], m[1]);
  }
  return regs;
}

function parseDefault(raw: string): string | undefined {
  const v = raw.trim();
  if (!v || v === "undefined" || v === "null" || v === "new Date()")
    return undefined;
  if (v === "Date.now") return "now";
  if (v === "true" || v === "false") return v;
  if (/^-?\d+(\.\d+)?$/.test(v)) return v;
  if (/^["'`][\s\S]*["'`]$/.test(v))
    return v.slice(1, -1).replace(/^["'`]|["'`]$/g, "");
  if (/^[A-Za-z_$][\w$]*\.[\w$]+$/.test(v)) return v.split(".").pop();
  return undefined;
}

function resolveType(
  raw: string,
  enums: string[] | undefined,
): { type: FieldType; isArray: boolean; enumValues?: string[] } {
  let t = raw.trim();
  let isArray = false;
  if (t.startsWith("[") && t.endsWith("]")) {
    isArray = true;
    t = t.slice(1, -1).trim();
  }
  if (t.endsWith("[]")) {
    isArray = true;
    t = t.slice(0, -2).trim();
  }
  t = t
    .replace(/^Schema\.Types\./, "")
    .replace(/^mongoose\.Schema\.Types\./, "");
  if (enums?.length) return { type: "enum", isArray, enumValues: enums };
  return { type: MONGO_TYPE[t] ?? "string", isArray };
}

export function importMongooseSchema(code: string): SchemaProject {
  const cleaned = stripComments(code);
  const decls = parseSchemaDecls(cleaned);
  if (!decls.length) {
    throw new Error("No mongoose Schema definitions found");
  }
  const modelRegs = parseModelRegs(cleaned);
  const project = createProject("Imported MongoDB Schema", "mongodb");

  const declTables = new Map<string, Table>();
  for (const decl of decls) {
    const jsName = decl.jsName.replace(/Schema$/, "");
    const regName =
      modelRegs.get(decl.jsName) ?? modelRegs.get(jsName) ?? jsName;
    const tableName = decl.collection ?? regName;
    const tableValidation = validateTableName(tableName, project.tables);
    const name = tableValidation.valid ? tableName : `${tableName}_imported`;
    const table = createTable(
      name,
      {
        x: (project.tables.length % 4) * 300,
        y: Math.floor(project.tables.length / 4) * 260,
      },
      "mongodb",
      { includeId: false },
    );
    declTables.set(decl.jsName, table);
    project.tables.push(table);
  }

  const pendingRefs: Array<{
    source: Table;
    sourceField: Field;
    targetJsName: string;
    onDelete?: string;
  }> = [];

  for (const decl of decls) {
    const table = declTables.get(decl.jsName);
    if (!table) continue;
    for (const entry of splitTopLevel(decl.body)) {
      const colon = entry.indexOf(":");
      if (colon <= 0) continue;
      const key = entry
        .slice(0, colon)
        .trim()
        .replace(/^["'`]|["'`]$/g, "");
      let spec = entry.slice(colon + 1).trim();
      let typeRaw = spec;
      let required = false;
      let unique = false;
      let defaultValue: string | undefined;
      let enumValues: string[] | undefined;
      let ref: string | undefined;
      let onDelete: string | undefined;
      let description: string | undefined;

      if (spec.startsWith("{")) {
        const inner = findBalanced(spec, 0, "{", "}");
        spec = inner.content;
        for (const prop of splitTopLevel(spec)) {
          const kv = prop.match(/^\s*(\w+)\s*:\s*(.+)$/);
          if (!kv) continue;
          const [, k, v] = kv;
          const val = v.trim();
          if (k === "type") typeRaw = val;
          else if (k === "required") required = val === "true";
          else if (k === "unique") unique = val === "true";
          else if (k === "default") defaultValue = parseDefault(val);
          else if (k === "description")
            description = val.replace(/^["'`]|["'`]$/g, "");
          else if (k === "enum") {
            enumValues = val
              .replace(/^\[/, "")
              .replace(/\]$/, "")
              .split(",")
              .map((s) => s.trim().replace(/^["'`]|["'`]$/g, ""))
              .filter(Boolean);
          } else if (k === "ref") {
            ref = val.replace(/^["'`]|["'`]$/g, "");
          } else if (k === "onDelete") {
            onDelete = val.replace(/^["'`]|["'`]$/g, "");
          }
        }
      } else if (spec.startsWith("[")) {
        typeRaw = spec;
      }

      const {
        type,
        isArray,
        enumValues: resolvedEnums,
      } = resolveType(typeRaw, enumValues);
      const fieldValidation = validateFieldName(key, table.fields);
      const fieldName = fieldValidation.valid ? key : `${key}_imported`;
      const field: Field = {
        id: `fld_${Math.random().toString(36).slice(2, 10)}`,
        name: fieldName,
        type,
        nullable: !required,
        primaryKey: false,
        unique,
        autoIncrement: false,
        isArray,
        defaultValue,
        comment: description,
        enumValues: resolvedEnums,
      };
      table.fields.push(field);
      if (ref) {
        pendingRefs.push({
          source: table,
          sourceField: field,
          targetJsName: ref,
          onDelete,
        });
      }
    }
  }

  for (const pending of pendingRefs) {
    const target = [...declTables.values()].find(
      (t) =>
        t.name === pending.targetJsName ||
        t.name === pending.targetJsName.replace(/Schema$/, "") ||
        t.name === pending.targetJsName.toLowerCase(),
    );
    if (!target) continue;
    let targetField =
      target.fields.find((f) => f.name === "_id") ??
      target.fields.find((f) => f.primaryKey);
    if (!targetField) {
      targetField = {
        id: `fld_${Math.random().toString(36).slice(2, 10)}`,
        name: "_id",
        type: "string",
        nullable: false,
        primaryKey: true,
        unique: true,
        autoIncrement: false,
        isArray: false,
        defaultValue: "crypto.randomUUID()",
      };
      target.fields.unshift(targetField);
    }
    project.relations.push({
      id: `rel_${Math.random().toString(36).slice(2, 10)}`,
      name: `${pending.source.name}To${target.name}`,
      type: "one_to_many",
      sourceTableId: pending.source.id,
      sourceFieldId: pending.sourceField.id,
      targetTableId: target.id,
      targetFieldId: targetField.id,
      onDelete: pending.onDelete as
        | "cascade"
        | "restrict"
        | "set_null"
        | "no_action"
        | undefined,
    });
  }

  return project;
}
