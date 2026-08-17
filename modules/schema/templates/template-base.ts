import type { SchemaProject } from "../domain";
import type { Table } from "../domain/types";

export interface Template {
  key: string;
  name: string;
  description: string;
  build: () => SchemaProject;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/(^_|_$)/g, "");
}

export function field(
  table: Table,
  name: string,
  type: Table["fields"][number]["type"],
  patch: Partial<Table["fields"][number]> = {},
): void {
  const id = `fld_${Math.random().toString(36).slice(2, 10)}`;
  table.fields.push({
    id,
    name,
    type,
    nullable: true,
    primaryKey: false,
    unique: false,
    autoIncrement: false,
    isArray: false,
    ...patch,
  });
}

export function buildTemplateProject(
  name: string,
  tables: Table[],
  positions: Record<string, { x: number; y: number }>,
): SchemaProject {
  const now = Date.now();
  for (const table of tables) {
    table.position = positions[table.name] ?? table.position;
  }
  return {
    id: `prj_${Math.random().toString(36).slice(2, 10)}`,
    name,
    dialect: "postgresql",
    tables,
    relations: [],
    createdAt: now,
    updatedAt: now,
  };
}

export function idField(
  table: Table,
  dialect: "postgresql" | "mysql" | "sqlite" = "postgresql",
): void {
  const isSqlite = dialect === "sqlite";
  field(table, "id", isSqlite ? "integer" : "uuid", {
    primaryKey: true,
    unique: true,
    autoIncrement: !isSqlite,
    nullable: false,
    comment: "Primary key",
  });
}

export function relation(
  project: SchemaProject,
  type: "one_to_one" | "one_to_many" | "many_to_many",
  sourceTableName: string,
  sourceFieldName: string,
  targetTableName: string,
  targetFieldName: string,
): void {
  const source = project.tables.find((t) => t.name === sourceTableName);
  const target = project.tables.find((t) => t.name === targetTableName);
  if (!source || !target) return;
  const sourceField = source.fields.find((f) => f.name === sourceFieldName);
  const targetField = target.fields.find((f) => f.name === targetFieldName);
  if (!sourceField || !targetField) return;
  project.relations.push({
    id: `rel_${Math.random().toString(36).slice(2, 10)}`,
    type,
    sourceTableId: source.id,
    sourceFieldId: sourceField.id,
    targetTableId: target.id,
    targetFieldId: targetField.id,
    onDelete: "cascade",
  });
}

export function toProjectName(templateName: string): string {
  return slugify(templateName);
}
