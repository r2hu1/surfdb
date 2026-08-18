import type { Field, Relation, SchemaProject, Table } from "../../domain";
import { normalizeRelationDirection } from "../../domain/services/schema.service";
import type { SchemaAdapter } from "../adapter.interface";
import { importDrizzleSchema } from "./import";

type DrizzleCore =
  | "drizzle-orm/pg-core"
  | "drizzle-orm/mysql-core"
  | "drizzle-orm/sqlite-core";

type DialectConfigKey = "postgresql" | "mysql" | "sqlite";

interface DrizzleConfig {
  core: DrizzleCore;
  tableFn: string;
  typeMap: Record<string, (f: Field) => string>;
  defaultFn: (f: Field, isFK: boolean) => string;
}

const PG: DrizzleConfig = {
  core: "drizzle-orm/pg-core",
  tableFn: "pgTable",
  typeMap: {
    string: (f) => `varchar("${f.name}", { length: ${f.length ?? 255} })`,
    text: (f) => `text("${f.name}")`,
    integer: (f) => `integer("${f.name}")`,
    bigint: (f) =>
      f.autoIncrement
        ? `bigserial("${f.name}")`
        : `bigint("${f.name}", { mode: "number" })`,
    smallint: (f) => `smallint("${f.name}")`,
    float: (f) => `real("${f.name}")`,
    double: (f) => `doublePrecision("${f.name}")`,
    decimal: (f) =>
      `numeric("${f.name}", { precision: ${f.precision ?? 10}, scale: 2 })`,
    boolean: (f) => `boolean("${f.name}")`,
    date: (f) => `date("${f.name}")`,
    timestamp: (f) => `timestamp("${f.name}")`,
    time: (f) => `time("${f.name}")`,
    json: (f) => `json("${f.name}")`,
    jsonb: (f) => `jsonb("${f.name}")`,
    uuid: (f) => `uuid("${f.name}")`,
    binary: (f) => `bytea("${f.name}")`,
    blob: (f) => `bytea("${f.name}")`,
    enum: (f) => `text("${f.name}")`,
  },
  defaultFn: (f, isFK) => {
    if (f.autoIncrement) return "";
    if (f.type === "uuid" && !isFK) return ".defaultRandom()";
    if (f.defaultValue) {
      const v = f.defaultValue;
      if (f.type === "enum" && !/^['"`]/.test(v))
        return `.default('${v.replaceAll("'", "\\'")}')`;
      return `.default(${v})`;
    }
    return "";
  },
};

const MYSQL: DrizzleConfig = {
  core: "drizzle-orm/mysql-core",
  tableFn: "mysqlTable",
  typeMap: {
    string: (f) => `varchar("${f.name}", { length: ${f.length ?? 255} })`,
    text: (f) =>
      f.length && f.length > 65535
        ? `longtext("${f.name}")`
        : `text("${f.name}")`,
    integer: (f) => `int("${f.name}")`,
    bigint: (f) =>
      f.autoIncrement
        ? `bigint("${f.name}", { autoIncrement: true })`
        : `bigint("${f.name}")`,
    smallint: (f) => `smallint("${f.name}")`,
    float: (f) => `float("${f.name}")`,
    double: (f) => `double("${f.name}")`,
    decimal: (f) =>
      `decimal("${f.name}", { precision: ${f.precision ?? 10}, scale: 2 })`,
    boolean: (f) => `boolean("${f.name}")`,
    date: (f) => `date("${f.name}")`,
    datetime: (f) => `datetime("${f.name}")`,
    timestamp: (f) => `timestamp("${f.name}")`,
    time: (f) => `time("${f.name}")`,
    json: (f) => `json("${f.name}")`,
    jsonb: (f) => `json("${f.name}")`,
    uuid: (f) => `char("${f.name}", { length: 36 })`,
    binary: (f) => `binary("${f.name}")`,
    blob: (f) => `blob("${f.name}")`,
    enum: (f) =>
      `enum("${f.name}", [${(f.enumValues ?? []).map((v) => `'${v}'`).join(", ")}])`,
  },
  defaultFn: (f, _isFK) => {
    if (f.type === "uuid") return "";
    if (f.autoIncrement) return ".autoIncrement()";
    if (f.defaultValue) {
      const v = f.defaultValue;
      if (f.type === "enum" && !/^['"`]/.test(v))
        return `.default('${v.replaceAll("'", "\\'")}')`;
      return `.default(${v})`;
    }
    return "";
  },
};

const SQLITE: DrizzleConfig = {
  core: "drizzle-orm/sqlite-core",
  tableFn: "sqliteTable",
  typeMap: {
    string: (f) => `text("${f.name}")`,
    text: (f) => `text("${f.name}")`,
    integer: (f) => `integer("${f.name}")`,
    bigint: (f) => `integer("${f.name}")`,
    smallint: (f) => `integer("${f.name}")`,
    float: (f) => `real("${f.name}")`,
    double: (f) => `real("${f.name}")`,
    decimal: (f) => `numeric("${f.name}")`,
    boolean: (f) => `integer("${f.name}", { mode: "boolean" })`,
    date: (f) => `text("${f.name}")`,
    datetime: (f) => `integer("${f.name}", { mode: "timestamp_ms" })`,
    timestamp: (f) => `integer("${f.name}", { mode: "timestamp" })`,
    time: (f) => `text("${f.name}")`,
    json: (f) => `text("${f.name}", { mode: "json" })`,
    jsonb: (f) => `text("${f.name}", { mode: "json" })`,
    uuid: (f) => `text("${f.name}")`,
    binary: (f) => `blob("${f.name}")`,
    blob: (f) => `blob("${f.name}")`,
    enum: (f) => `text("${f.name}")`,
  },
  defaultFn: (f, _isFK) => {
    if (f.defaultValue) return `.default(${f.defaultValue})`;
    if (f.type === "boolean") return ".default(false)";
    return "";
  },
};

const CONFIGS: Partial<Record<DialectConfigKey, DrizzleConfig>> = {
  postgresql: PG,
  mysql: MYSQL,
  sqlite: SQLITE,
};

const ARRAY_TYPES = new Set([
  "string",
  "text",
  "integer",
  "bigint",
  "smallint",
  "float",
  "double",
  "decimal",
  "boolean",
  "date",
  "timestamp",
  "time",
  "json",
  "jsonb",
  "uuid",
]);

function columnType(config: DrizzleConfig, f: Field): string {
  return (config.typeMap[f.type] ?? config.typeMap.string)(f);
}

const COLUMN_TYPE_IMPORTS: Record<string, string> = {
  varchar: "varchar",
  text: "text",
  integer: "integer",
  bigint: "bigint",
  bigserial: "bigint",
  smallint: "smallint",
  real: "real",
  doublePrecision: "doublePrecision",
  numeric: "numeric",
  boolean: "boolean",
  date: "date",
  timestamp: "timestamp",
  time: "time",
  json: "json",
  jsonb: "jsonb",
  uuid: "uuid",
  bytea: "bytea",
  char: "char",
  int: "int",
  float: "float",
  double: "double",
  datetime: "datetime",
  binary: "binary",
  blob: "blob",
};

function formatOptions(typeStr: string): string {
  return typeStr.replace(/,\s*\{([^}]+)\}/g, (_match, inner: string) => {
    const props = inner.split(",").map((s: string) => s.trim());
    if (props.length <= 1) return `, { ${props[0]} }`;
    return `,\n${props.map((p: string) => `      ${p}`).join(",\n")},\n    `;
  });
}

function fieldDefinition(
  config: DrizzleConfig,
  f: Field,
  enumJsName?: string,
  isFK = false,
): string {
  const isEnumPg = f.type === "enum" && config.core === "drizzle-orm/pg-core";
  const base =
    isEnumPg && enumJsName
      ? `${enumJsName}("${f.name}")`
      : columnType(config, f);
  const arraySuffix =
    config.core === "drizzle-orm/pg-core" &&
    f.isArray &&
    ARRAY_TYPES.has(f.type)
      ? ".array()"
      : "";
  let out = `  ${f.name}: ${formatOptions(base)}${arraySuffix}`;
  if (f.primaryKey) {
    const dflt = config.defaultFn(f, isFK);
    if (dflt) out += dflt;
    out += ".primaryKey()";
    if (!f.nullable) out += ".notNull()";
  } else {
    if (!f.nullable) out += ".notNull()";
    if (f.unique) out += ".unique()";
    const dflt = config.defaultFn(f, isFK);
    if (dflt) out += dflt;
  }
  return out;
}

function renderIndexes(table: Table): string[] {
  return table.indexes.map((idx) => {
    const cols = idx.fieldIds
      .map((id) => {
        const field = table.fields.find((f) => f.id === id);
        return field ? `t.${field.name}` : "";
      })
      .filter(Boolean)
      .join(", ");
    const fn = idx.unique ? "uniqueIndex" : "index";
    return `  ${fn}("${idx.name}").on(${cols}),`;
  });
}

const NUMERIC_TYPES = new Set([
  "integer",
  "bigint",
  "smallint",
  "float",
  "double",
  "decimal",
]);
const TEXTUAL_TYPES = new Set(["string", "text"]);

function typesCompatible(source: Field, target: Field): boolean {
  if (source.type === target.type) return true;
  if (NUMERIC_TYPES.has(source.type) && NUMERIC_TYPES.has(target.type))
    return true;
  if (TEXTUAL_TYPES.has(source.type) && TEXTUAL_TYPES.has(target.type))
    return true;
  return false;
}

function referenceSuffix(
  relation: Relation,
  jsNameOfTarget: (tableId: string) => string | undefined,
  targetFieldOf: (tableId: string, fieldId: string) => Field | undefined,
): string {
  const targetJs = jsNameOfTarget(relation.targetTableId);
  const targetField = targetFieldOf(
    relation.targetTableId,
    relation.targetFieldId,
  );
  if (!targetJs || !targetField) return "";
  const action = relation.onDelete ?? "no_action";
  const ref = `() => ${targetJs}.${targetField.name}`;
  const onDelete =
    action !== "no_action"
      ? `, { onDelete: "${action.replace(/_/g, " ")}" }`
      : "";
  return `.references(${ref}${onDelete})`;
}

function buildTable(
  config: DrizzleConfig,
  table: Table,
  relationRefs: Relation[],
  jsName: string,
  jsNameOfTarget: (tableId: string) => string | undefined,
  enumJsNameOf: (table: Table, fieldId: string) => string | undefined,
  targetFieldOf: (tableId: string, fieldId: string) => Field | undefined,
): string[] {
  const lines: string[] = [];
  const fields = table.fields.map((f) => {
    const rel = relationRefs.find((r) => r.sourceFieldId === f.id);
    let def = fieldDefinition(config, f, enumJsNameOf(table, f.id), !!rel);
    if (rel) {
      def = def.replace(/\.primaryKey\(\)$/, "");
      const ref = referenceSuffix(rel, jsNameOfTarget, targetFieldOf);
      def += ref;
    }
    return def;
  });
  const idxs = renderIndexes(table);
  if (idxs.length) {
    lines.push(`export const ${jsName} = ${config.tableFn}("${table.name}", {`);
    lines.push(fields.join(",\n"));
    lines.push("}, (t) => [");
    lines.push(...idxs);
    lines.push("]);");
  } else {
    lines.push(`export const ${jsName} = ${config.tableFn}("${table.name}", {`);
    lines.push(fields.join(",\n"));
    lines.push("});");
  }
  return lines;
}

function sanitizeJsName(name: string): string {
  const camel = name
    .replace(/[^a-zA-Z0-9_]/g, "_")
    .split(/_+/)
    .filter(Boolean)
    .map((part, i) =>
      i === 0
        ? part.charAt(0).toLowerCase() + part.slice(1)
        : part.charAt(0).toUpperCase() + part.slice(1).toLowerCase(),
    )
    .join("");
  return /^[A-Za-z_]/.test(camel) ? camel : `t_${camel}`;
}

export const drizzleAdapter: SchemaAdapter = {
  key: "drizzle",
  name: "Drizzle ORM",
  description: "TypeScript ORM schema file",
  language: "typescript",
  extension: "ts",
  mimeType: "text/typescript",
  supportsImport: true,

  export(project: SchemaProject): string {
    const config = CONFIGS[project.dialect as DialectConfigKey] ?? PG;
    const nameToJs = new Map<string, string>();
    for (const table of project.tables) {
      nameToJs.set(table.name, sanitizeJsName(table.name));
    }

    const imports = new Set<string>();
    const columnImports = new Set<string>();
    const enums: string[] = [];
    const enumJsNames = new Map<string, string>();

    for (const table of project.tables) {
      for (const field of table.fields) {
        if (
          field.type === "enum" &&
          config.core === "drizzle-orm/pg-core" &&
          field.enumValues?.length
        ) {
          const enumName = `${sanitizeJsName(table.name)}_${field.name}_enum`;
          imports.add("pgEnum");
          enumJsNames.set(`${table.id}:${field.id}`, enumName);
          const values = field.enumValues.map((v) => `  "${v}",`).join("\n");
          enums.push(
            `export const ${enumName} = pgEnum("${enumName}", [\n${values}\n]);`,
          );
        }
        const typeStr = (config.typeMap[field.type] ?? config.typeMap.string)(
          field,
        );
        const fnName = COLUMN_TYPE_IMPORTS[typeStr.split("(")[0]];
        if (fnName) columnImports.add(fnName);
      }
    }

    const relations = normalizeRelationDirection(project).relations;

    const targetFieldOf = (tableId: string, fieldId: string) =>
      project.tables
        .find((t) => t.id === tableId)
        ?.fields.find((f) => f.id === fieldId);

    const skipped: string[] = [];
    const chunks: string[] = [];

    const allImports = [
      config.tableFn,
      ...[...imports].sort(),
      ...[...columnImports].sort(),
    ];
    chunks.push(
      `import {\n${allImports.map((i) => `  ${i},`).join("\n")}\n} from "${config.core}";\n`,
    );
    if (enums.length) chunks.push(enums.join("\n\n"));

    for (const table of project.tables) {
      const jsName = nameToJs.get(table.name) ?? sanitizeJsName(table.name);
      const rels = relations.filter((r) => r.sourceTableId === table.id);
      const usedSourceFields = new Set<string>();
      const validRels = rels.filter((r) => {
        const sourceField = table.fields.find((f) => f.id === r.sourceFieldId);
        const targetTable = project.tables.find(
          (t) => t.id === r.targetTableId,
        );
        const targetField = targetTable?.fields.find(
          (f) => f.id === r.targetFieldId,
        );
        const label = `${table.name}.${sourceField?.name ?? r.sourceFieldId} -> ${targetTable?.name ?? r.targetTableId}.${targetField?.name ?? r.targetFieldId}`;
        if (!sourceField) {
          skipped.push(`relation ${label}: source field does not exist`);
          return false;
        }
        if (usedSourceFields.has(r.sourceFieldId)) {
          skipped.push(
            `relation ${label}: multiple references on the same source field`,
          );
          return false;
        }
        if (!targetTable || !targetField) {
          skipped.push(`relation ${label}: target field does not exist`);
          return false;
        }
        if (!nameToJs.has(targetTable.name)) {
          skipped.push(`relation ${label}: target table has no JS name`);
          return false;
        }
        if (!targetField.primaryKey && !targetField.unique) {
          skipped.push(
            `relation ${label}: target field is not a primary key or unique`,
          );
          return false;
        }
        if (!typesCompatible(sourceField, targetField)) {
          skipped.push(
            `relation ${label}: incompatible types (${sourceField.type} -> ${targetField.type})`,
          );
          return false;
        }
        usedSourceFields.add(r.sourceFieldId);
        return true;
      });

      const tableHeader = table.name.toUpperCase().replace(/_/g, " ");
      chunks.push(
        `/* ${"*".repeat(57)} */\n/* ${tableHeader.padEnd(57)} */\n/* ${"*".repeat(57)} */`,
      );
      chunks.push(
        buildTable(
          config,
          table,
          validRels,
          jsName,
          (tableId) => {
            const target = project.tables.find((t) => t.id === tableId);
            return target ? nameToJs.get(target.name) : undefined;
          },
          (t, fieldId) => enumJsNames.get(`${t.id}:${fieldId}`),
          targetFieldOf,
        ).join("\n"),
      );
    }

    if (skipped.length) {
      const report = skipped.map((s) => `// - ${s}`).join("\n");
      chunks.unshift(
        `// skipped ${skipped.length} invalid relation(s):\n${report}\n`,
      );
    }
    return `${chunks.join("\n\n")}\n`;
  },

  import(code: string): SchemaProject {
    return importDrizzleSchema(code);
  },
};
