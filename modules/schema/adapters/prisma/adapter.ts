import type { Field, Relation, SchemaProject, Table } from "../../domain";
import { normalizeRelationDirection } from "../../domain/services/schema.service";
import type { SchemaAdapter } from "../adapter.interface";
import { importPrismaSchema } from "./import";

const PRISMA_TYPE: Record<string, string> = {
  string: "String",
  text: "String",
  integer: "Int",
  bigint: "BigInt",
  smallint: "Int",
  float: "Float",
  double: "Float",
  decimal: "Decimal",
  boolean: "Boolean",
  date: "DateTime",
  datetime: "DateTime",
  timestamp: "DateTime",
  time: "DateTime",
  json: "Json",
  jsonb: "Json",
  uuid: "String",
  binary: "Bytes",
  blob: "Bytes",
  enum: "String",
};

const MONGODB_FIELD_MAP: Record<string, string> = {
  string: "String",
  text: "String",
  integer: "Int",
  bigint: "BigInt",
  float: "Float",
  double: "Float",
  decimal: "Decimal",
  boolean: "Boolean",
  date: "DateTime",
  timestamp: "DateTime",
  json: "Json",
  uuid: "String",
  binary: "Bytes",
};

const ON_DELETE_MAP: Record<string, string> = {
  cascade: "Cascade",
  set_null: "SetNull",
  set_default: "SetDefault",
  restrict: "Restrict",
  no_action: "NoAction",
};

interface RelationEntry {
  relation: Relation;
  sourceTable: Table;
  sourceField: Field;
  targetTable: Table;
  targetField: Field;
}

interface RelationFieldInfo {
  fieldName: string;
  modelName: string;
  isArray: boolean;
  nullable: boolean;
  scalarFieldName: string;
  targetFieldName: string;
  onDelete: string;
  explicitRelationName?: string;
  relationId?: string;
}

function modelName(name: string): string {
  const pascal = name
    .split(/[^A-Za-z0-9]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
  return /^[A-Za-z]/.test(pascal) ? pascal : `M${pascal}`;
}

function prismaScalar(f: Field, relationless: boolean): string {
  const map = relationless ? MONGODB_FIELD_MAP : PRISMA_TYPE;
  return map[f.type] ?? "String";
}

function onDeleteSyntax(value?: string): string {
  if (!value) return "NoAction";
  return ON_DELETE_MAP[value] ?? "NoAction";
}

function sanitizeEnumValue(value: string): string {
  let identifier = value
    .replace(/[^a-zA-Z0-9_]/g, "_")
    .replace(/^(\d)/, "_$1")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
  if (!identifier) identifier = `val_${Math.random().toString(36).slice(2, 6)}`;
  identifier = identifier.charAt(0).toLowerCase() + identifier.slice(1);
  return identifier;
}

function singularize(name: string): string {
  if (name.endsWith("ies")) return `${name.slice(0, -3)}y`;
  if (name.endsWith("ses")) return `${name.slice(0, -2)}`;
  if (name.endsWith("s") && !name.endsWith("ss")) return name.slice(0, -1);
  return name;
}

function relationFieldName(
  fkFieldName: string,
  targetModelName: string,
): string {
  if (fkFieldName.endsWith("_id")) {
    const base = fkFieldName.slice(0, -3);
    return base.charAt(0).toLowerCase() + base.slice(1);
  }
  const singular = singularize(targetModelName);
  return singular.charAt(0).toLowerCase() + singular.slice(1);
}

function arrayFieldName(sourceModelName: string): string {
  return sourceModelName.charAt(0).toLowerCase() + sourceModelName.slice(1);
}

function enumDefs(table: Table, model: string): string[] {
  return table.fields
    .filter((f) => f.type === "enum" && f.enumValues?.length)
    .map((f) => {
      const enumIdent = `${model}${f.name.charAt(0).toUpperCase() + f.name.slice(1)}`;
      const values = (f.enumValues ?? []).map((v) => {
        const ident = sanitizeEnumValue(v);
        if (ident === v) return `  ${ident}`;
        return `  ${ident} @map("${v.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}")`;
      });
      return `enum ${enumIdent} {\n${values.join("\n")}\n}`;
    });
}

function defaultAttr(
  field: Field,
  isFK: boolean,
  relationless: boolean,
): string {
  if (field.primaryKey && field.type === "uuid" && !relationless)
    return "@default(uuid())";
  if (field.autoIncrement) return "@default(autoincrement())";
  if (field.type === "uuid" && !relationless && !isFK)
    return "@default(uuid())";
  if (field.defaultValue) {
    const v = field.defaultValue.trim();
    if (
      v === "now" ||
      v === "NOW()" ||
      v === "now()" ||
      v === "CURRENT_TIMESTAMP"
    )
      return "@default(now())";
    if (/^-?\d+(\.\d+)?$/.test(v)) return `@default(${v})`;
    if (v === "true" || v === "false") return `@default(${v})`;
    if (v.startsWith("[") || v.startsWith("{"))
      return `@default(${v.replaceAll("\n", " ").replace(/\s+/g, " ")})`;
    return `@default("${v.replaceAll('"', '\\"')}")`;
  }
  return "";
}

function fieldLine(
  field: Field,
  model: string,
  isFK: boolean,
  relationless: boolean,
): string {
  const type =
    field.type === "enum" && field.enumValues?.length
      ? `${model}${field.name.charAt(0).toUpperCase() + field.name.slice(1)}`
      : prismaScalar(field, relationless);
  const arraySuffix = field.isArray ? "[]" : "";
  let line = `  ${field.name} ${type}${arraySuffix}`;
  if (field.nullable && !field.primaryKey) line += "?";
  if (field.primaryKey) line += " @id";
  if (field.unique && !field.primaryKey) line += " @unique";
  const dflt = defaultAttr(field, isFK, relationless);
  if (dflt) line += ` ${dflt}`;
  if (field.comment) line += ` /// ${field.comment.replaceAll("\n", " ")}`;
  return line;
}

function buildRelationGraph(project: SchemaProject): {
  entries: RelationEntry[];
  scalarFieldMap: Map<string, string>;
  relationFieldsForTable: Map<string, RelationFieldInfo[]>;
} {
  const entries: RelationEntry[] = [];
  const scalarFieldMap = new Map<string, string>();
  const relationFieldsForTable = new Map<string, RelationFieldInfo[]>();

  for (const rel of project.relations) {
    const sourceTable = project.tables.find((t) => t.id === rel.sourceTableId);
    const targetTable = project.tables.find((t) => t.id === rel.targetTableId);
    if (!sourceTable || !targetTable) continue;
    const sourceField = sourceTable.fields.find(
      (f) => f.id === rel.sourceFieldId,
    );
    const targetField = targetTable.fields.find(
      (f) => f.id === rel.targetFieldId,
    );
    if (!sourceField || !targetField) continue;
    entries.push({
      relation: rel,
      sourceTable,
      sourceField,
      targetTable,
      targetField,
    });
  }

  for (const entry of entries) {
    const {
      relation: rel,
      sourceTable,
      sourceField,
      targetTable,
      targetField,
    } = entry;
    const sourceModel = modelName(sourceTable.name);
    const targetModel = modelName(targetTable.name);
    const onDelete = onDeleteSyntax(rel.onDelete);
    const fkFieldName = relationFieldName(sourceField.name, targetModel);

    let needsExplicitName = false;
    let pairIndex = 0;

    // same-pair dedup: multiple FKs between same two tables
    const samePair = entries.filter(
      (e) =>
        e.sourceTable.id === sourceTable.id &&
        e.targetTable.id === targetTable.id,
    );
    if (samePair.length > 1) {
      needsExplicitName = true;
      pairIndex = samePair.indexOf(entry) + 1;
    }
    // same-target dedup: multiple tables FK into same target
    if (!needsExplicitName) {
      const sameTarget = entries.filter(
        (e) => e.targetTable.id === targetTable.id,
      );
      const srcModels = new Set(sameTarget.map((e) => e.sourceTable.id));
      if (sameTarget.length > 1 && srcModels.size > 1) {
        needsExplicitName = true;
        pairIndex = sameTarget.indexOf(entry) + 1;
      }
    }

    let explicitName: string | undefined;
    if (needsExplicitName) {
      explicitName = `${targetModel.toLowerCase()}${singularize(targetModel)}${pairIndex > 1 ? pairIndex : ""}`;
    }

    if (rel.type === "one_to_one") {
      scalarFieldMap.set(
        `${sourceTable.id}:${sourceField.id}`,
        sourceField.name,
      );
      const srcFields = relationFieldsForTable.get(sourceTable.id) ?? [];
      srcFields.push({
        fieldName: fkFieldName,
        modelName: targetModel,
        isArray: false,
        nullable: sourceField.nullable,
        scalarFieldName: sourceField.name,
        targetFieldName: targetField.name,
        onDelete,
        explicitRelationName: explicitName,
        relationId: rel.id,
      });
      relationFieldsForTable.set(sourceTable.id, srcFields);

      const inverseFieldName = singularize(sourceModel.toLowerCase());
      const tgtFields = relationFieldsForTable.get(targetTable.id) ?? [];
      tgtFields.push({
        fieldName: inverseFieldName,
        modelName: sourceModel,
        isArray: false,
        nullable: targetField.nullable,
        scalarFieldName: targetField.name,
        targetFieldName: sourceField.name,
        onDelete,
        explicitRelationName: explicitName,
        relationId: rel.id,
      });
      relationFieldsForTable.set(targetTable.id, tgtFields);
    } else {
      scalarFieldMap.set(
        `${sourceTable.id}:${sourceField.id}`,
        sourceField.name,
      );
      const pkFieldName = arrayFieldName(sourceModel);

      const srcFields = relationFieldsForTable.get(sourceTable.id) ?? [];
      srcFields.push({
        fieldName: fkFieldName,
        modelName: targetModel,
        isArray: false,
        nullable: sourceField.nullable,
        scalarFieldName: sourceField.name,
        targetFieldName: targetField.name,
        onDelete,
        explicitRelationName: explicitName,
        relationId: rel.id,
      });
      relationFieldsForTable.set(sourceTable.id, srcFields);

      const tgtFields = relationFieldsForTable.get(targetTable.id) ?? [];
      tgtFields.push({
        fieldName: pkFieldName,
        modelName: sourceModel,
        isArray: true,
        nullable: false,
        scalarFieldName: targetField.name,
        targetFieldName: sourceField.name,
        onDelete,
        explicitRelationName: explicitName,
        relationId: rel.id,
      });
      relationFieldsForTable.set(targetTable.id, tgtFields);
    }
  }

  for (const tableId of relationFieldsForTable.keys()) {
    const fields = relationFieldsForTable.get(tableId) ?? [];
    const seen = new Map<string, number>();
    for (const f of fields) {
      const count = (seen.get(f.fieldName) ?? 0) + 1;
      seen.set(f.fieldName, count);
      if (count > 1) {
        f.fieldName = `${f.fieldName}${count}`;
      }
    }
  }

  return { entries, scalarFieldMap, relationFieldsForTable };
}

function renderRelationField(info: RelationFieldInfo): string {
  const relParts: string[] = [];
  if (info.explicitRelationName)
    relParts.push(`"${info.explicitRelationName}"`);
  relParts.push(`fields: [${info.scalarFieldName}]`);
  relParts.push(`references: [${info.targetFieldName}]`);
  relParts.push(`onDelete: ${info.onDelete}`);
  const q = info.nullable ? "?" : "";
  return `  ${info.fieldName} ${info.modelName}${info.isArray ? "[]" : q} @relation(${relParts.join(", ")})`;
}

function renderModel(
  table: Table,
  project: SchemaProject,
  graph: ReturnType<typeof buildRelationGraph>,
): string {
  const model = modelName(table.name);
  const relationless = project.dialect === "mongodb";

  const body: string[] = [];
  for (const field of table.fields) {
    const isFK = graph.scalarFieldMap.has(`${table.id}:${field.id}`);
    body.push(fieldLine(field, model, isFK, relationless));
  }

  if (!relationless) {
    const relFields = graph.relationFieldsForTable.get(table.id) ?? [];
    const renderedNames = new Set(body.map((l) => l.split(/\s/)[1]));
    for (const info of relFields) {
      if (renderedNames.has(info.fieldName)) continue;
      body.push(renderRelationField(info));
    }

    for (const idx of table.indexes) {
      const cols = idx.fieldIds
        .map((id) => table.fields.find((f) => f.id === id)?.name)
        .filter((n): n is string => Boolean(n));
      if (!cols.length) continue;
      if (idx.unique) {
        body.push(`  @@unique([${cols.join(", ")}], name: "${idx.name}")`);
      } else {
        body.push(`  @@index([${cols.join(", ")}], name: "${idx.name}")`);
      }
    }
  }

  const blocks = [...enumDefs(table, model)];
  blocks.push(`model ${model} {\n${body.join("\n")}\n}`);
  return blocks.join("\n\n");
}

export const prismaAdapter: SchemaAdapter = {
  key: "prisma",
  name: "Prisma",
  description: "Prisma schema file (schema.prisma)",
  language: "prisma",
  extension: "prisma",
  mimeType: "text/plain",
  supportsImport: true,

  export(project: SchemaProject): string {
    const provider =
      project.dialect === "postgresql"
        ? "postgresql"
        : project.dialect === "mysql"
          ? "mysql"
          : project.dialect === "sqlite"
            ? "sqlite"
            : "mongodb";
    const header = [
      "generator client {",
      '  provider = "prisma-client-js"',
      "}",
      "",
      "datasource db {",
      `  provider = "${provider}"`,
      '  url      = env("DATABASE_URL")',
      "}",
      "",
    ].join("\n");

    const normalized = normalizeRelationDirection(project);
    const graph = buildRelationGraph(normalized);
    const models = normalized.tables
      .map((table) => renderModel(table, normalized, graph))
      .join("\n\n");
    return `${header}${models}\n`;
  },

  import(code: string): SchemaProject {
    return importPrismaSchema(code);
  },
};
