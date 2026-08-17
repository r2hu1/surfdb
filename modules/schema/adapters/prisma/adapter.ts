import type { Field, SchemaProject, Table } from "../../domain";
import type { SchemaAdapter } from "../adapter.interface";

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

function enumName(model: string, field: Field): string {
  return `${model}${field.name.charAt(0).toUpperCase() + field.name.slice(1)}`;
}

function enumDefs(table: Table, model: string): string[] {
  return table.fields
    .filter((f) => f.type === "enum" && f.enumValues?.length)
    .map(
      (f) =>
        `enum ${enumName(model, f)} {\n${f.enumValues?.map((v) => `  ${v}`).join("\n")}\n}`,
    );
}

function defaultAttr(field: Field, relationless: boolean): string {
  if (field.autoIncrement) return "@default(autoincrement())";
  if (field.type === "uuid" && !relationless) return "@default(uuid())";
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

function fieldLine(field: Field, model: string, relationless: boolean): string {
  const type =
    field.type === "enum" && field.enumValues?.length
      ? enumName(model, field)
      : prismaScalar(field, relationless);
  const arraySuffix = field.isArray ? "[]" : "";
  let line = `  ${field.name} ${type}${arraySuffix}`;
  if (field.primaryKey) line += " @id";
  if (field.unique) line += " @unique";
  const dflt = defaultAttr(field, relationless);
  if (dflt) line += ` ${dflt}`;
  if (field.comment) line += ` /// ${field.comment.replaceAll("\n", " ")}`;
  return line;
}

function renderModel(table: Table, project: SchemaProject): string {
  const model = modelName(table.name);
  const relationless = project.dialect === "mongodb";

  const body: string[] = [];
  for (const field of table.fields) {
    body.push(fieldLine(field, model, relationless));
  }

  if (!relationless) {
    for (const rel of project.relations) {
      const otherTable = project.tables.find(
        (t) =>
          t.id ===
          (rel.sourceTableId === table.id
            ? rel.targetTableId
            : rel.sourceTableId),
      );
      if (!otherTable) continue;
      const otherModel = modelName(otherTable.name);
      const localField = table.fields.find(
        (f) =>
          f.id ===
          (rel.sourceTableId === table.id
            ? rel.sourceFieldId
            : rel.targetFieldId),
      );
      const otherField = otherTable.fields.find(
        (f) =>
          f.id ===
          (rel.sourceTableId === table.id
            ? rel.targetFieldId
            : rel.sourceFieldId),
      );
      if (!localField || !otherField) continue;
      const relName = rel.name ?? `${model}To${otherModel}`;
      const isOneSide =
        rel.type === "one_to_many" && rel.sourceTableId === table.id;
      const isOneToOneSource =
        rel.type === "one_to_one" && rel.sourceTableId === table.id;

      if (isOneSide) {
        body.push(`  ${otherField.name} ${otherModel}[]`);
      } else if (
        rel.type === "one_to_many" &&
        rel.sourceTableId === otherTable.id
      ) {
        body.push(
          `  ${localField.name} ${model}? @relation("${relName}", fields: [${localField.name}], references: [${otherField.name}], onDelete: ${rel.onDelete ? rel.onDelete.replaceAll("_", "") : "NoAction"})`,
        );
      } else if (rel.type === "one_to_one" && isOneToOneSource) {
        body.push(`  ${otherModel.toLowerCase()} ${otherModel}?`);
      } else if (
        rel.type === "one_to_one" &&
        rel.sourceTableId === otherTable.id
      ) {
        body.push(
          `  ${localField.name} ${model}? @relation("${relName}", fields: [${localField.name}], references: [${otherField.name}], onDelete: ${rel.onDelete ? rel.onDelete.replaceAll("_", "") : "NoAction"})`,
        );
      }
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

    const models = project.tables
      .map((table) => renderModel(table, project))
      .join("\n\n");
    return `${header + models}\n`;
  },

  import(_code: string): SchemaProject {
    throw new Error("Prisma import is not supported yet");
  },
};
