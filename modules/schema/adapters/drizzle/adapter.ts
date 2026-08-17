import type { DatabaseDialect } from "../../config/db-dialects";
import type { Field, Relation, SchemaProject, Table } from "../../domain";
import type { SchemaAdapter } from "../adapter.interface";

type DrizzleCore =
  | "drizzle-orm/pg-core"
  | "drizzle-orm/mysql-core"
  | "drizzle-orm/sqlite-core";

interface DrizzleConfig {
  core: DrizzleCore;
  tableFn: string;
  typeMap: Record<string, (f: Field) => string>;
  defaultFn: (f: Field) => string;
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
    enum: (f) => `"${f.name}"`,
  },
  defaultFn: (f) => {
    if (f.autoIncrement) return "";
    if (f.type === "uuid") return ".defaultRandom()";
    if (f.defaultValue) return `.default(${f.defaultValue})`;
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
  defaultFn: (f) => {
    if (f.type === "uuid") return "";
    if (f.autoIncrement) return ".autoIncrement()";
    if (f.defaultValue) return `.default(${f.defaultValue})`;
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
  defaultFn: (f) => {
    if (f.defaultValue) return `.default(${f.defaultValue})`;
    if (f.type === "boolean") return ".default(false)";
    return "";
  },
};

const CONFIGS: Record<DatabaseDialect, DrizzleConfig> = {
  postgresql: PG,
  mysql: MYSQL,
  sqlite: SQLITE,
  mongodb: PG,
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
  if (config.core !== "drizzle-orm/pg-core" || !f.isArray) {
    return (config.typeMap[f.type] ?? config.typeMap.string)(f);
  }
  const inner = (config.typeMap[f.type] ?? config.typeMap.string)(f);
  if (!ARRAY_TYPES.has(f.type)) return inner;
  const fn = inner.split("(")[0];
  const args = inner.slice(inner.indexOf("("), inner.lastIndexOf(")"));
  return `${fn}(${args}, { array: true })`;
}

function fieldDefinition(
  config: DrizzleConfig,
  f: Field,
  enumJsName?: string,
): string {
  const isEnumPg = f.type === "enum" && config.core === "drizzle-orm/pg-core";
  const base =
    isEnumPg && enumJsName
      ? `${enumJsName}("${f.name}")`
      : columnType(config, f);
  let out = `  ${f.name}: ${base}`;
  if (f.primaryKey) out += ".primaryKey()";
  if (f.unique) out += ".unique()";
  if (!f.nullable) out += ".notNull()";
  const dflt = config.defaultFn(f);
  if (dflt) out += dflt;
  if (f.comment) out += `.comment("${f.comment.replaceAll('"', '\\"')}")`;
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
      ? `, { onDelete: "${action.replaceAll("_", " ")}" }`
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
    let def = fieldDefinition(config, f, enumJsNameOf(table, f.id));
    const rel = relationRefs.find((r) => r.sourceFieldId === f.id);
    if (rel) {
      def = def.replace(/\.primaryKey\(\)$/, "");
      def += referenceSuffix(rel, jsNameOfTarget, targetFieldOf);
    }
    return def;
  });
  const idxs = renderIndexes(table);
  if (idxs.length) {
    lines.push(`export const ${jsName} = ${config.tableFn}("${table.name}", {`);
    lines.push(fields.join(",\n"));
    lines.push("}, (t) => [");
    lines.push(...idxs);
    lines.push("])");
  } else {
    lines.push(`export const ${jsName} = ${config.tableFn}("${table.name}", {`);
    lines.push(fields.join(",\n"));
    lines.push("})");
  }
  return lines;
}

function sanitizeJsName(name: string): string {
  const camel = name.replace(/[^a-zA-Z0-9_]/g, "_").replace(/_+$/g, "");
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
    const config = CONFIGS[project.dialect] ?? PG;
    const nameToJs = new Map<string, string>();
    for (const table of project.tables) {
      nameToJs.set(table.name, sanitizeJsName(table.name));
    }

    const imports = new Set<string>();
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
          enums.push(
            `export const ${enumName} = pgEnum("${enumName}", [${field.enumValues.map((v) => `'${v}'`).join(", ")}])`,
          );
        }
      }
    }

    const relationMap = new Map<string, Relation[]>();
    for (const rel of project.relations) {
      if (!relationMap.has(rel.sourceTableId))
        relationMap.set(rel.sourceTableId, []);
      relationMap.get(rel.sourceTableId)?.push(rel);
    }

    const targetFieldOf = (tableId: string, fieldId: string) =>
      project.tables
        .find((t) => t.id === tableId)
        ?.fields.find((f) => f.id === fieldId);

    const skipped: string[] = [];
    const chunks: string[] = [];
    chunks.push(
      `import { ${config.tableFn}${imports.size ? `, ${[...imports].join(", ")}` : ""} } from "${config.core}"\n`,
    );
    if (enums.length) chunks.push(enums.join("\n\n"));

    for (const table of project.tables) {
      const jsName = nameToJs.get(table.name) ?? sanitizeJsName(table.name);
      const rels = relationMap.get(table.id) ?? [];
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

  import(_code: string): SchemaProject {
    throw new Error("Drizzle import is not supported yet");
  },
};
