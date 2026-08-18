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

const PROVIDER_DIALECT: Record<string, DatabaseDialect> = {
  postgresql: "postgresql",
  postgres: "postgresql",
  mysql: "mysql",
  mariadb: "mysql",
  sqlite: "sqlite",
  mongodb: "mongodb",
};

const PRISMA_SCALAR: Record<string, string> = {
  String: "string",
  Text: "text",
  Int: "integer",
  SmallInt: "smallint",
  BigInt: "bigint",
  Float: "float",
  Double: "double",
  Decimal: "decimal",
  Boolean: "boolean",
  DateTime: "timestamp",
  Json: "json",
  Bytes: "blob",
  Unsupported: "binary",
};

const NATIVE_OVERRIDES: Array<[RegExp, FieldType]> = [
  [/^@db\.(Text|MediumText|LongText)/, "text"],
  [/^@db\.(VarChar|Char)/, "string"],
  [/^@db\.SmallInt/, "smallint"],
  [/^@db\.(TinyInt|SmallInt)/, "smallint"],
  [/^@db\.Date/, "date"],
  [/^@db\.Time/, "time"],
  [/^@db\.(Timestamp|Timestamptz)/, "timestamp"],
  [/^@db\.(Jsonb|Json)/, "json"],
  [/^@db\.(Bytea|Blob|VarBinary)/, "binary"],
  [/^@db\.(Decimal|Numeric)/, "decimal"],
];

const ONDELETE_MAP: Record<string, string> = {
  cascade: "cascade",
  restrict: "restrict",
  noaction: "no_action",
  setnull: "set_null",
  setdefault: "set_default",
};

interface RelationSpec {
  modelName: string;
  fieldName: string;
  name?: string;
  fields: string[];
  references: string[];
  onDelete?: ReferentialAction;
  onUpdate?: ReferentialAction;
}

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

function findBlock(
  code: string,
  keyword: string,
  start: number,
): { index: number; name: string; body: string; end: number } | null {
  const match = new RegExp(`\\b${keyword}\\s+([A-Za-z_][\\w]*)\\s*\\{`, "g");
  match.lastIndex = start;
  const open = match.exec(code);
  if (!open) return null;
  let depth = 1;
  let i = open.index + open[0].length;
  while (i < code.length && depth > 0) {
    if (code[i] === "{") depth++;
    if (code[i] === "}") depth--;
    i++;
  }
  return {
    index: open.index,
    name: open[1],
    body: code.slice(open.index + open[0].length, i - 1),
    end: i,
  };
}

function parseDatasource(code: string): DatabaseDialect {
  const m = code.match(
    /datasource\s+[\w]+\s*\{[\s\S]*?provider\s*=\s*"([^"]+)"/,
  );
  return PROVIDER_DIALECT[m?.[1]?.toLowerCase() ?? ""] ?? "postgresql";
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

function parseAttrs(tokens: string[]): Map<string, string> {
  const attrs = new Map<string, string>();
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (!token.startsWith("@")) continue;
    if (!token.includes("(")) {
      attrs.set(token, "");
      continue;
    }
    let depth = 0;
    for (const ch of token) {
      if (ch === "(") depth++;
      if (ch === ")") depth--;
    }
    let cur = token;
    while (depth > 0 && i + 1 < tokens.length) {
      const next = tokens[++i];
      cur += ` ${next}`;
      for (const ch of next) {
        if (ch === "(") depth++;
        if (ch === ")") depth--;
      }
    }
    const m = cur.match(/^(@\w+)\(([\s\S]*)\)$/);
    if (m) attrs.set(m[1], m[2]);
  }
  return attrs;
}

function nativeType(attrs: Map<string, string>): FieldType | null {
  for (const [name, args] of attrs) {
    if (!name.startsWith("@db.")) continue;
    const key = `${name}${args ? `(${args})` : ""}`;
    for (const [re, type] of NATIVE_OVERRIDES) {
      if (re.test(key)) return type;
    }
  }
  return null;
}

function parseDefault(
  raw: string | undefined,
  dialect: DatabaseDialect,
): {
  defaultValue?: string;
  autoIncrement?: boolean;
} {
  if (!raw) return {};
  const v = raw.trim();
  if (v === "autoincrement()")
    return { defaultValue: "autoincrement", autoIncrement: true };
  if (v === "now()") return { defaultValue: "now" };
  if (v === "uuid()") return { defaultValue: "uuid" };
  if (/^dbgenerated\(/.test(v)) {
    const inner = v.replace(/^dbgenerated\(/, "").replace(/\)$/, "");
    return { defaultValue: inner.replace(/^"(.*)"$/, "$1") };
  }
  if (v === "true" || v === "false") return { defaultValue: v };
  if (/^-?\d+(\.\d+)?$/.test(v)) return { defaultValue: v };
  if (/^"[^"]*"$/.test(v))
    return { defaultValue: v.slice(1, -1).replaceAll('\\"', '"') };
  if (v === "cuid()" || v === "nanoid()" || v === "ulid()")
    return { defaultValue: v.replace("()", "") };
  if (dialect === "postgresql" && /^[A-Z_][A-Z0-9_]*$/.test(v))
    return { defaultValue: v };
  return { defaultValue: v };
}

function parseFieldLine(
  line: string,
  modelName: string,
  enums: Map<string, string[]>,
  dialect: DatabaseDialect,
  table: Table,
): { field: Field; relation?: RelationSpec } | null {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("@") || trimmed.startsWith("//")) {
    return null;
  }
  const tokens = trimmed.split(/\s+/);
  const name = tokens[0];
  const typeRaw = tokens[1] ?? "";
  const isArray = typeRaw.endsWith("[]");
  const typeToken = isArray ? typeRaw.slice(0, -2) : typeRaw;
  const attrs = parseAttrs(tokens.slice(2));

  const native = nativeType(attrs);
  let fieldType: FieldType;
  let enumValues: string[] | undefined;
  if (enums.has(typeToken)) {
    fieldType = "enum";
    enumValues = enums.get(typeToken);
  } else if (native) {
    fieldType = native;
  } else {
    fieldType =
      (PRISMA_SCALAR[typeToken] as FieldType | undefined) ??
      fromDialectType(typeToken, dialect);
  }

  const dflt = parseDefault(attrs.get("@default"), dialect);
  const relRaw = attrs.get("@relation");
  let relation: RelationSpec | undefined;
  if (relRaw !== undefined) {
    let relName: string | undefined;
    let fields: string[] = [];
    let references: string[] = [];
    let onDelete: string | undefined;
    let onUpdate: string | undefined;
    for (const part of splitTopLevel(relRaw)) {
      const kv = part.match(/^\s*(\w+)\s*:\s*(.+)$/);
      if (!kv) {
        if (/^"[^"]*"$/.test(part.trim())) {
          relName = part.trim().slice(1, -1);
        }
        continue;
      }
      const [, key, value] = kv;
      if (key === "fields") {
        fields = value
          .trim()
          .slice(1, -1)
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      } else if (key === "references") {
        references = value
          .trim()
          .slice(1, -1)
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      } else if (key === "onDelete") {
        onDelete = ONDELETE_MAP[value.trim().toLowerCase()] ?? value.trim();
      } else if (key === "onUpdate") {
        onUpdate = ONDELETE_MAP[value.trim().toLowerCase()] ?? value.trim();
      }
    }
    if (fields.length && references.length) {
      relation = {
        modelName,
        fieldName: name,
        name: relName,
        fields,
        references,
        onDelete: onDelete as ReferentialAction | undefined,
        onUpdate: onUpdate as ReferentialAction | undefined,
      };
    }
  }

  const lengthRaw = /@db\.(VarChar|Char|Decimal|Numeric)\((\d+)/.exec(
    tokens.slice(2).join(" "),
  );
  const length = lengthRaw ? Number(lengthRaw[2]) : undefined;
  const precisionRaw = /@db\.(Decimal|Numeric)\(\s*\d+\s*,\s*(\d+)/.exec(
    tokens.slice(2).join(" "),
  );
  const precision = precisionRaw ? Number(precisionRaw[1]) : undefined;

  const fieldValidation = validateFieldName(name, table.fields);
  const fieldName = fieldValidation.valid ? name : `${name}_imported`;
  const field: Field = {
    id: `fld_${Math.random().toString(36).slice(2, 10)}`,
    name: fieldName,
    type: fieldType,
    nullable: !attrs.has("@id") && !isArray,
    primaryKey: attrs.has("@id"),
    unique: attrs.has("@unique") || attrs.has("@id"),
    autoIncrement: dflt.autoIncrement ?? false,
    length: length ?? undefined,
    precision,
    isArray,
    defaultValue: dflt.defaultValue,
    enumValues,
  };
  return { field, relation };
}

function parseModelAttrs(body: string): {
  compositeIds: string[];
  indexes: Index[];
} {
  const compositeIds: string[] = [];
  const indexes: Index[] = [];
  for (const line of body.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("@@")) continue;
    if (trimmed.startsWith("@@id")) {
      const cols = trimmed.match(/\[([^\]]*)\]/)?.[1] ?? "";
      compositeIds.push(
        ...cols
          .split(",")
          .map((c) => c.trim())
          .filter(Boolean),
      );
    } else if (trimmed.startsWith("@@unique")) {
      const cols = trimmed.match(/\[([^\]]*)\]/)?.[1] ?? "";
      const name =
        trimmed.match(/name:\s*"([^"]+)"/)?.[1] ??
        `uq_${cols.replace(/[^a-z0-9]/gi, "_").toLowerCase()}`;
      indexes.push({
        id: `idx_${Math.random().toString(36).slice(2, 10)}`,
        name,
        fieldIds: [],
        unique: true,
      });
      for (const c of cols
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean)) {
        indexes[indexes.length - 1].fieldIds.push(c);
      }
    } else if (trimmed.startsWith("@@index")) {
      const cols = trimmed.match(/\[([^\]]*)\]/)?.[1] ?? "";
      const name =
        trimmed.match(/name:\s*"([^"]+)"/)?.[1] ??
        `idx_${cols.replace(/[^a-z0-9]/gi, "_").toLowerCase()}`;
      indexes.push({
        id: `idx_${Math.random().toString(36).slice(2, 10)}`,
        name,
        fieldIds: cols
          .split(",")
          .map((c) => c.trim())
          .filter(Boolean),
        unique: false,
      });
    }
  }
  return { compositeIds, indexes };
}

export function importPrismaSchema(code: string): SchemaProject {
  const cleaned = stripComments(code);
  const dialect = parseDatasource(cleaned);

  const enums = new Map<string, string[]>();
  const models = new Map<string, Table>();
  const relations: RelationSpec[] = [];
  const backRelationTypes = new Map<
    string,
    Map<string, { isArray: boolean; modelName: string }>
  >();

  let cursor = 0;
  const found = true;
  while (found) {
    const enumBlock = findBlock(cleaned, "enum", cursor);
    const modelBlock = findBlock(cleaned, "model", cursor);
    let next: {
      index: number;
      name: string;
      body: string;
      end: number;
    } | null = null;
    if (enumBlock && modelBlock) {
      next = enumBlock.index < modelBlock.index ? enumBlock : modelBlock;
    } else {
      next = enumBlock ?? modelBlock;
    }
    if (!next) break;
    cursor = next.end;
    if (enumBlock && next === enumBlock) {
      enums.set(
        next.name,
        next.body
          .split(/\s+/)
          .map((l) => l.trim())
          .filter(
            (l) =>
              l &&
              !l.startsWith("@@") &&
              !l.startsWith("//") &&
              !l.startsWith("/*"),
          )
          .map((l) => l.split(/\s+/)[0]),
      );
      continue;
    }
    const tableValidation = validateTableName(next.name, [...models.values()]);
    const tableName = tableValidation.valid
      ? next.name
      : `${next.name}_imported`;
    const table = createTable(
      tableName,
      { x: (models.size % 4) * 300, y: Math.floor(models.size / 4) * 260 },
      dialect,
      { includeId: false },
    );
    const { compositeIds, indexes } = parseModelAttrs(next.body);
    const backFields = new Map<
      string,
      { isArray: boolean; modelName: string }
    >();
    for (const line of next.body.split("\n")) {
      const parsed = parseFieldLine(line, next.name, enums, dialect, table);
      if (!parsed) continue;
      table.fields.push(parsed.field);
      if (parsed.relation) relations.push(parsed.relation);
      const typeToken = line.trim().split(/\s+/)[1] ?? "";
      const isBackArray = typeToken.endsWith("[]");
      const backType = isBackArray ? typeToken.slice(0, -2) : typeToken;
      if (
        !enums.has(backType) &&
        !(backType in PRISMA_SCALAR) &&
        !backType.startsWith("@")
      ) {
        backFields.set(parsed.field.name, {
          isArray: isBackArray,
          modelName: backType,
        });
      }
    }
    backRelationTypes.set(next.name, backFields);
    for (const idx of indexes) {
      const fieldIds = idx.fieldIds
        .map((n) => table.fields.find((f) => f.name === n)?.id)
        .filter((id): id is string => Boolean(id));
      if (fieldIds.length) table.indexes.push({ ...idx, fieldIds });
    }
    if (compositeIds.length) {
      const fieldIds = compositeIds
        .map((n) => table.fields.find((f) => f.name === n)?.id)
        .filter((id): id is string => Boolean(id));
      if (fieldIds.length) {
        table.indexes.push({
          id: `idx_${Math.random().toString(36).slice(2, 10)}`,
          name: `pk_${tableName.toLowerCase()}`,
          fieldIds,
          unique: true,
        });
      }
    }
    models.set(next.name, table);
  }

  const project = createProject("Imported Prisma Schema", dialect);
  project.tables.push(...models.values());

  if (dialect !== "mongodb") {
    for (const rel of relations) {
      const source = models.get(rel.modelName);
      const sourceField = source?.fields.find((f) => f.name === rel.fields[0]);
      if (!source || !sourceField) continue;
      const refName = rel.references[0];
      let target: Table | undefined;
      let isOne = false;
      for (const [modelName, table] of models) {
        if (modelName === rel.modelName) continue;
        const refField = table.fields.find((f) => f.name === refName);
        if (!refField) continue;
        const back = [
          ...(backRelationTypes.get(modelName)?.values() ?? []),
        ].find((b) => b.modelName === rel.modelName);
        isOne = back
          ? !back.isArray
          : Boolean(refField.primaryKey || refField.unique);
        target = table;
        break;
      }
      if (!target) continue;
      const targetField = target.fields.find((f) => f.name === refName);
      if (!targetField) continue;
      project.relations.push({
        id: `rel_${Math.random().toString(36).slice(2, 10)}`,
        name: rel.name ?? `${rel.modelName}To${target.name}`,
        type: isOne ? "one_to_one" : "one_to_many",
        sourceTableId: source.id,
        sourceFieldId: sourceField.id,
        targetTableId: target.id,
        targetFieldId: targetField.id,
        onDelete: rel.onDelete,
        onUpdate: rel.onUpdate,
      });
    }
  }

  return project;
}
