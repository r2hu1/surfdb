import type { DatabaseDialect } from "../../config/db-dialects";
import type {
  Field,
  FieldType,
  Index,
  ReferentialAction,
  SchemaProject,
  Table,
} from "../../domain";
import { createTable } from "../../domain/entities/table";
import {
  createProject,
  validateFieldName,
  validateTableName,
} from "../../domain/services/schema.service";
import { fromDialectType } from "../../domain/value-objects/field-type";

interface DrizzleColumn {
  key: string;
  builder: string;
  dbName: string;
  opts: Map<string, string>;
  modifiers: Array<{ name: string; args: string }>;
}

interface DrizzleTable {
  constName: string;
  fn: string;
  dbName: string;
  body: string;
  extraConfig: string;
}

interface DrizzleRef {
  targetConst: string;
  targetField: string;
  onDelete?: ReferentialAction;
  onUpdate?: ReferentialAction;
}

const FN_DIALECT: Record<string, DatabaseDialect> = {
  pgTable: "postgresql",
  mysqlTable: "mysql",
  sqliteTable: "sqlite",
};

const BUILDER_TYPE: Record<string, string> = {
  uuid: "uuid",
  varchar: "string",
  char: "string",
  text: "text",
  longtext: "text",
  integer: "integer",
  int: "integer",
  serial: "integer",
  bigserial: "bigint",
  bigint: "bigint",
  smallint: "smallint",
  real: "float",
  float: "float",
  double: "double",
  doublePrecision: "double",
  numeric: "decimal",
  decimal: "decimal",
  boolean: "boolean",
  date: "date",
  datetime: "datetime",
  timestamp: "timestamp",
  timestamptz: "timestamp",
  time: "time",
  json: "json",
  jsonb: "jsonb",
  bytea: "binary",
  binary: "binary",
  blob: "blob",
  interval: "string",
  inet: "string",
  citext: "string",
  year: "integer",
};

const ONDELETE_MAP: Record<string, ReferentialAction> = {
  cascade: "cascade",
  restrict: "restrict",
  "set null": "set_null",
  "no action": "no_action",
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
      if (depth === 0) {
        return { content: code.slice(start + 1, i), end: i };
      }
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

function parseTableDecls(code: string): DrizzleTable[] {
  const decls: DrizzleTable[] = [];
  const re =
    /(?:export\s+)?const\s+([A-Za-z_$][\w$]*)\s*=\s*(pgTable|mysqlTable|sqliteTable)\s*\(/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(code))) {
    const call = findBalanced(code, m.index + m[0].length - 1, "(", ")");
    const args = splitTopLevel(call.content);
    if (args.length < 2) continue;
    const dbName = args[0].trim().replace(/^["'`]|["'`]$/g, "");
    const body = args[1].trim();
    const extra = args[2]?.trim() ?? "";
    decls.push({
      constName: m[1],
      fn: m[2],
      dbName,
      body: body.replace(/^\{/, "").replace(/\}$/, ""),
      extraConfig: extra,
    });
  }
  return decls;
}

function parseColumn(raw: string): DrizzleColumn | null {
  const trimmed = raw.trim();
  const colon = trimmed.indexOf(":");
  if (colon <= 0) return null;
  const key = trimmed
    .slice(0, colon)
    .trim()
    .replace(/^["'`]|["'`]$/g, "");
  const rest = trimmed.slice(colon + 1).trim();
  const fnMatch = rest.match(/^([A-Za-z_$][\w$]*)\s*\(/);
  if (!fnMatch || fnMatch.index === undefined) return null;
  const call = findBalanced(
    rest,
    fnMatch.index + fnMatch[0].length - 1,
    "(",
    ")",
  );
  const opts = new Map<string, string>();
  let dbName = key;
  for (const arg of splitTopLevel(call.content)) {
    const a = arg.trim();
    if (/^["'`]/.test(a)) {
      dbName = a.replace(/^["'`]|["'`]$/g, "");
    } else if (/^\{/.test(a)) {
      const inner = a.replace(/^\{/, "").replace(/\}$/, "");
      for (const entry of splitTopLevel(inner)) {
        const kv = entry.match(/^\s*(\w+)\s*:\s*(.+)$/);
        if (kv) opts.set(kv[1], kv[2].trim());
      }
    } else if (/^\[/.test(a)) {
      opts.set("_enumValues", a);
    }
  }
  const modifiers: Array<{ name: string; args: string }> = [];
  const pos = call.end + 1;
  const modRe = /\.(\w+)\s*\(/g;
  modRe.lastIndex = pos;
  let mm: RegExpExecArray | null;
  while ((mm = modRe.exec(rest))) {
    const mcall = findBalanced(rest, mm.index + mm[0].length - 1, "(", ")");
    modifiers.push({ name: mm[1], args: mcall.content });
    modRe.lastIndex = mcall.end + 1;
  }
  return { key, builder: fnMatch[1], dbName, opts, modifiers };
}

function resolveModifiers(col: DrizzleColumn): {
  primaryKey: boolean;
  unique: boolean;
  nullable: boolean;
  autoIncrement: boolean;
  isArray: boolean;
  comment?: string;
  defaultValue?: string;
  ref?: DrizzleRef;
} {
  let primaryKey = false;
  let unique = false;
  let nullable = true;
  let autoIncrement = false;
  let isArray = false;
  let comment: string | undefined;
  let defaultValue: string | undefined;
  let ref: DrizzleRef | undefined;

  for (const mod of col.modifiers) {
    switch (mod.name) {
      case "primaryKey":
        primaryKey = true;
        break;
      case "unique":
        unique = true;
        break;
      case "notNull":
        nullable = false;
        break;
      case "autoIncrement":
        autoIncrement = true;
        break;
      case "array":
        isArray = true;
        break;
      case "comment": {
        const m = mod.args.trim().match(/^["'`]([\s\S]*)["'`]$/);
        if (m) comment = m[1];
        break;
      }
      case "defaultNow":
        defaultValue = "now";
        break;
      case "defaultRandom":
        defaultValue = "random";
        break;
      case "default": {
        const v = mod.args.trim();
        if (v === "now()") defaultValue = "now";
        else if (/^sql`([\s\S]*)`$/.test(v))
          defaultValue = v.slice(4, -1).trim();
        else if (/^sql\.raw\(([\s\S]*)\)$/.test(v))
          defaultValue = v
            .slice(9, -1)
            .trim()
            .replace(/^["'`]|["'`]$/g, "");
        else if (v === "true" || v === "false") defaultValue = v;
        else if (/^-?\d+(\.\d+)?$/.test(v)) defaultValue = v;
        else if (/^["'`][\s\S]*["'`]$/.test(v))
          defaultValue = v.slice(1, -1).replace(/^["'`]|["'`]$/g, "");
        else if (v === "null" || v === "undefined" || v === "new Date()")
          defaultValue = undefined;
        else if (/randomUUID|randomBytes/.test(v)) defaultValue = "uuid";
        else if (/^(cuid|nanoid|ulid)\(\)$/.test(v))
          defaultValue = v.replace("()", "");
        else if (/^[\w.$]+\.[A-Z][\w]*$/.test(v)) {
          defaultValue = v.split(".").pop();
        }
        break;
      }
      case "references": {
        const t = mod.args.match(/\(\)\s*=>\s*([A-Za-z_$][\w$]*)\.([\w$]+)/);
        const opt = mod.args.match(/onDelete:\s*"([^"]+)"/);
        const optUpd = mod.args.match(/onUpdate:\s*"([^"]+)"/);
        if (t) {
          ref = {
            targetConst: t[1],
            targetField: t[2],
            onDelete: opt ? ONDELETE_MAP[opt[1].toLowerCase()] : undefined,
            onUpdate: optUpd
              ? ONDELETE_MAP[optUpd[1].toLowerCase()]
              : undefined,
          };
        }
        break;
      }
    }
  }
  return {
    primaryKey,
    unique,
    nullable,
    autoIncrement,
    isArray,
    comment,
    defaultValue,
    ref,
  };
}

function resolveFieldType(
  col: DrizzleColumn,
  dialect: DatabaseDialect,
  enums: Map<string, string[]>,
): { type: FieldType; enumValues?: string[] } {
  const inlineEnum = col.opts.get("_enumValues");
  if (inlineEnum) {
    const values = inlineEnum
      .replace(/^\[/, "")
      .replace(/\]$/, "")
      .split(",")
      .map((s) => s.trim().replace(/^["'`]|["'`]$/g, ""))
      .filter(Boolean);
    return { type: "enum", enumValues: values };
  }
  if (enums.has(col.builder)) {
    return { type: "enum", enumValues: enums.get(col.builder) };
  }
  const mode = col.opts.get("mode");
  if (col.builder === "text" && mode === "json") return { type: "json" };
  if (col.builder === "integer" && mode === "boolean")
    return { type: "boolean" };
  if (col.builder === "integer" && mode?.startsWith("timestamp"))
    return { type: "timestamp" };
  if (col.builder === "text" && mode?.startsWith("timestamp"))
    return { type: "timestamp" };
  const mapped = BUILDER_TYPE[col.builder];
  if (mapped) {
    if (mapped === "decimal" && dialect === "postgresql")
      return { type: "decimal" };
    return { type: mapped as FieldType };
  }
  return { type: fromDialectType(col.builder, dialect) };
}

function parseEnumDecls(code: string): Map<string, string[]> {
  const enums = new Map<string, string[]>();
  const re =
    /const\s+([A-Za-z_$][\w$]*)\s*=\s*(?:pgEnum|mysqlEnum|sqliteEnum)\s*\([^)]*,\s*\[([\s\S]*?)\]\)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(code))) {
    enums.set(
      m[1],
      m[2]
        .split(",")
        .map((s) => s.trim().replace(/^["'`]|["'`]$/g, ""))
        .filter(Boolean),
    );
  }
  return enums;
}

function parseIndexes(extraConfig: string, table: Table): Index[] {
  const indexes: Index[] = [];
  if (!extraConfig) return indexes;
  const re =
    /(unique)?[Ii]ndex\s*\(\s*["'`]([\w$]+)["'`]\s*\)\s*\.on\s*\(([\s\S]*?)\)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(extraConfig))) {
    const cols = splitTopLevel(m[3])
      .map((c) => {
        const hit = c.trim().match(/\.([\w$]+)$/);
        return hit ? hit[1] : "";
      })
      .filter(Boolean);
    const fieldIds = cols
      .map((n) => table.fields.find((f) => f.name === n)?.id)
      .filter((id): id is string => Boolean(id));
    if (fieldIds.length) {
      indexes.push({
        id: `idx_${Math.random().toString(36).slice(2, 10)}`,
        name: m[2],
        fieldIds,
        unique: Boolean(m[1]),
      });
    }
  }
  return indexes;
}

export function importDrizzleSchema(code: string): SchemaProject {
  const cleaned = stripComments(code);
  const enums = parseEnumDecls(cleaned);
  const decls = parseTableDecls(cleaned);
  if (!decls.length) {
    throw new Error(
      "No drizzle table definitions found (pgTable/mysqlTable/sqliteTable)",
    );
  }
  const dialect = FN_DIALECT[decls[0].fn] ?? "postgresql";
  const project = createProject("Imported Drizzle Schema", dialect);

  const byConst = new Map<string, Table>();
  const relations: Array<{
    source: Table;
    sourceField: Field;
    ref: DrizzleRef;
  }> = [];

  for (const decl of decls) {
    const tableValidation = validateTableName(decl.dbName, project.tables);
    const tableName = tableValidation.valid
      ? decl.dbName
      : `${decl.dbName}_imported`;
    const table = createTable(
      tableName,
      {
        x: (project.tables.length % 4) * 300,
        y: Math.floor(project.tables.length / 4) * 260,
      },
      dialect,
      { includeId: false },
    );
    for (const entry of splitTopLevel(decl.body)) {
      const col = parseColumn(entry);
      if (!col) continue;
      const mods = resolveModifiers(col);
      const { type, enumValues } = resolveFieldType(col, dialect, enums);
      const fieldValidation = validateFieldName(col.key, table.fields);
      const fieldName = fieldValidation.valid ? col.key : `${col.key}_imported`;
      const lengthRaw = col.opts.get("length");
      const precisionRaw = col.opts.get("precision");
      const field: Field = {
        id: `fld_${Math.random().toString(36).slice(2, 10)}`,
        name: fieldName,
        type,
        nullable: mods.nullable,
        primaryKey: mods.primaryKey,
        unique: mods.unique || mods.primaryKey,
        autoIncrement: mods.autoIncrement,
        length: lengthRaw ? Number(lengthRaw) : undefined,
        precision: precisionRaw ? Number(precisionRaw) : undefined,
        isArray: mods.isArray,
        defaultValue: mods.defaultValue,
        comment: mods.comment,
        enumValues,
      };
      table.fields.push(field);
      if (mods.ref)
        relations.push({ source: table, sourceField: field, ref: mods.ref });
    }
    for (const idx of parseIndexes(decl.extraConfig, table)) {
      table.indexes.push(idx);
    }
    project.tables.push(table);
    byConst.set(decl.constName, table);
  }

  for (const rel of relations) {
    const target = byConst.get(rel.ref.targetConst);
    const targetField = target?.fields.find(
      (f) => f.name === rel.ref.targetField,
    );
    if (!target || !targetField) continue;
    project.relations.push({
      id: `rel_${Math.random().toString(36).slice(2, 10)}`,
      name: `${rel.source.name}To${target.name}`,
      type: rel.sourceField.unique ? "one_to_one" : "one_to_many",
      sourceTableId: rel.source.id,
      sourceFieldId: rel.sourceField.id,
      targetTableId: target.id,
      targetFieldId: targetField.id,
      onDelete: rel.ref.onDelete,
      onUpdate: rel.ref.onUpdate,
    });
  }

  return project;
}
