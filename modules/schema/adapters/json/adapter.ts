import type { DatabaseDialect } from "../../config/db-dialects";
import type { SchemaProject } from "../../domain";
import { createTable } from "../../domain/entities/table";
import {
  createProject,
  validateFieldName,
  validateTableName,
} from "../../domain/services/schema.service";
import { fromDialectType } from "../../domain/value-objects/field-type";
import type { SchemaAdapter } from "../adapter.interface";

export const jsonAdapter: SchemaAdapter = {
  key: "json",
  name: "Project JSON",
  description: "Full project backup (tables, fields, relations, layout)",
  language: "json",
  extension: "json",
  mimeType: "application/json",
  supportsImport: true,

  export(project: SchemaProject): string {
    return JSON.stringify(project, null, 2);
  },

  import(code: string): SchemaProject {
    const parsed = JSON.parse(code) as SchemaProject;
    if (
      !parsed ||
      typeof parsed !== "object" ||
      !Array.isArray(parsed.tables)
    ) {
      throw new Error("Invalid project JSON: missing tables array");
    }
    const dialect: DatabaseDialect = [
      "postgresql",
      "mysql",
      "sqlite",
      "mongodb",
    ].includes(parsed.dialect)
      ? parsed.dialect
      : "postgresql";
    const project = createProject(parsed.name || "Imported Schema", dialect);
    for (const raw of parsed.tables) {
      const validation = validateTableName(raw.name, project.tables);
      const name = validation.valid ? raw.name : `${raw.name}_imported`;
      const table = createTable(name, raw.position ?? { x: 0, y: 0 }, dialect, {
        includeId: false,
      });
      table.schema = raw.schema;
      table.comment = raw.comment;
      table.width = raw.width ?? 240;
      for (const rawField of raw.fields ?? []) {
        const fieldValidation = validateFieldName(rawField.name, table.fields);
        const fieldName = fieldValidation.valid
          ? rawField.name
          : `${rawField.name}_imported`;
        table.fields.push({
          id: rawField.id ?? `fld_${Math.random().toString(36).slice(2, 10)}`,
          name: fieldName,
          type: fromDialectType(rawField.type, dialect),
          nullable: rawField.nullable ?? true,
          primaryKey: rawField.primaryKey ?? false,
          unique: rawField.unique ?? false,
          autoIncrement: rawField.autoIncrement ?? false,
          length: rawField.length,
          precision: rawField.precision,
          isArray: rawField.isArray ?? false,
          defaultValue: rawField.defaultValue,
          comment: rawField.comment,
          enumValues: rawField.enumValues,
        });
      }
      for (const rawIndex of raw.indexes ?? []) {
        table.indexes.push({
          id: rawIndex.id ?? `idx_${Math.random().toString(36).slice(2, 10)}`,
          name: rawIndex.name,
          fieldIds: rawIndex.fieldIds ?? [],
          unique: rawIndex.unique ?? false,
          type: rawIndex.type,
        });
      }
      project.tables.push(table);
    }
    for (const raw of parsed.relations ?? []) {
      project.relations.push({
        id: raw.id ?? `rel_${Math.random().toString(36).slice(2, 10)}`,
        name: raw.name,
        type: raw.type,
        sourceTableId: raw.sourceTableId,
        sourceFieldId: raw.sourceFieldId,
        targetTableId: raw.targetTableId,
        targetFieldId: raw.targetFieldId,
        onDelete: raw.onDelete,
        onUpdate: raw.onUpdate,
      });
    }
    return project;
  },
};
