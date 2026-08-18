import type { DatabaseDialect } from "../../config/db-dialects";
import { DEFAULTS } from "../../config/defaults";
import type { FieldType } from "../../config/field-types";
import {
  type CreateRelationParams,
  createRelation,
} from "../entities/relation";
import { createIndex, createTable } from "../entities/table";
import type { Field, Index, Relation, SchemaProject, Table } from "../types";
import { isManyToMany } from "../value-objects/relation-type";

export interface ValidationResult {
  valid: boolean;
  message?: string;
}

export const NAME_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/;

export function createProject(
  name: string,
  dialect: DatabaseDialect,
  options: { withId?: boolean } = {},
): SchemaProject {
  const now = Date.now();
  const table = createTable("users", { x: 0, y: 0 }, dialect, {
    includeId: options.withId ?? false,
  });
  return {
    id: `prj_${Math.random().toString(36).slice(2, 10)}`,
    name,
    dialect,
    tables: options.withId ? [table] : [],
    relations: [],
    createdAt: now,
    updatedAt: now,
  };
}

export function createDefaultProject(): SchemaProject {
  const project = createProject(DEFAULTS.projectName, "postgresql", {
    withId: false,
  });
  const table = createTable("users", { x: 0, y: 0 }, project.dialect);
  project.tables.push(table);
  return project;
}

export function validateTableName(
  name: string,
  existing: Table[],
): ValidationResult {
  const trimmed = name.trim();
  if (!trimmed) {
    return { valid: false, message: "Table name is required" };
  }
  if (!NAME_PATTERN.test(trimmed)) {
    return {
      valid: false,
      message:
        "Name must start with a letter or underscore, alphanumeric + underscore only",
    };
  }
  if (existing.some((t) => t.name.toLowerCase() === trimmed.toLowerCase())) {
    return { valid: false, message: `Table "${trimmed}" already exists` };
  }
  return { valid: true };
}

export function validateFieldName(
  name: string,
  existing: Field[],
): ValidationResult {
  const trimmed = name.trim();
  if (!trimmed) {
    return { valid: false, message: "Field name is required" };
  }
  if (!NAME_PATTERN.test(trimmed)) {
    return {
      valid: false,
      message:
        "Name must start with a letter or underscore, alphanumeric + underscore only",
    };
  }
  if (existing.some((f) => f.name.toLowerCase() === trimmed.toLowerCase())) {
    return { valid: false, message: `Field "${trimmed}" already exists` };
  }
  return { valid: true };
}

export function validateRelation(
  project: SchemaProject,
  params: Omit<CreateRelationParams, "type">,
): ValidationResult {
  if (
    params.sourceTableId === params.targetTableId &&
    params.sourceFieldId === params.targetFieldId
  ) {
    return { valid: false, message: "Cannot relate a field to itself" };
  }
  const duplicate = project.relations.some(
    (r) =>
      r.sourceTableId === params.sourceTableId &&
      r.sourceFieldId === params.sourceFieldId &&
      r.targetTableId === params.targetTableId &&
      r.targetFieldId === params.targetFieldId,
  );
  if (duplicate) {
    return { valid: false, message: "This relation already exists" };
  }
  return { valid: true };
}

export function addTable(project: SchemaProject, table: Table): SchemaProject {
  return {
    ...project,
    tables: [...project.tables, table],
    updatedAt: Date.now(),
  };
}

export function addTableWithName(
  project: SchemaProject,
  name: string,
  position: { x: number; y: number },
): SchemaProject {
  const existing = project.tables;
  const base = name || `table_${existing.length + 1}`;
  let final = base;
  let counter = 1;
  while (existing.some((t) => t.name === final)) {
    final = `${base}_${counter}`;
    counter++;
  }
  const table = createTable(final, position, project.dialect);
  return addTable(project, table);
}

export function updateTable(
  project: SchemaProject,
  tableId: string,
  patch: Partial<Table>,
): SchemaProject {
  return {
    ...project,
    tables: project.tables.map((t) =>
      t.id === tableId ? { ...t, ...patch } : t,
    ),
    updatedAt: Date.now(),
  };
}

export function deleteTable(
  project: SchemaProject,
  tableId: string,
): SchemaProject {
  return {
    ...project,
    tables: project.tables.filter((t) => t.id !== tableId),
    relations: project.relations.filter(
      (r) => r.sourceTableId !== tableId && r.targetTableId !== tableId,
    ),
    updatedAt: Date.now(),
  };
}

export function addField(
  project: SchemaProject,
  tableId: string,
  field: Field,
): SchemaProject {
  return {
    ...project,
    tables: project.tables.map((t) =>
      t.id === tableId ? { ...t, fields: [...t.fields, field] } : t,
    ),
    updatedAt: Date.now(),
  };
}

export function addFieldToTable(
  project: SchemaProject,
  tableId: string,
  name: string,
  type: FieldType,
): SchemaProject {
  const table = project.tables.find((t) => t.id === tableId);
  if (!table) return project;
  const base = name || `field_${table.fields.length + 1}`;
  let final = base;
  let counter = 1;
  while (table.fields.some((f) => f.name === final)) {
    final = `${base}_${counter}`;
    counter++;
  }
  const field: Field = {
    id: `fld_${Math.random().toString(36).slice(2, 10)}`,
    name: final,
    type,
    nullable: true,
    primaryKey: false,
    unique: false,
    autoIncrement: false,
    isArray: false,
  };
  return addField(project, tableId, field);
}

export function updateField(
  project: SchemaProject,
  tableId: string,
  fieldId: string,
  patch: Partial<Field>,
): SchemaProject {
  return {
    ...project,
    tables: project.tables.map((t) =>
      t.id === tableId
        ? {
            ...t,
            fields: t.fields.map((f) =>
              f.id === fieldId ? { ...f, ...patch } : f,
            ),
          }
        : t,
    ),
    updatedAt: Date.now(),
  };
}

export function deleteField(
  project: SchemaProject,
  tableId: string,
  fieldId: string,
): SchemaProject {
  return {
    ...project,
    tables: project.tables.map((t) => {
      if (t.id !== tableId) return t;
      const fields = t.fields.filter((f) => f.id !== fieldId);
      const indexes = t.indexes
        .map((idx) => ({
          ...idx,
          fieldIds: idx.fieldIds.filter((id) => id !== fieldId),
        }))
        .filter((idx) => idx.fieldIds.length > 0);
      return { ...t, fields, indexes };
    }),
    relations: project.relations.filter(
      (r) =>
        !(r.sourceTableId === tableId && r.sourceFieldId === fieldId) &&
        !(r.targetTableId === tableId && r.targetFieldId === fieldId),
    ),
    updatedAt: Date.now(),
  };
}

export function reorderFields(
  project: SchemaProject,
  tableId: string,
  fieldIds: string[],
): SchemaProject {
  return {
    ...project,
    tables: project.tables.map((t) => {
      if (t.id !== tableId) return t;
      const order = new Map(fieldIds.map((id, i) => [id, i]));
      const sorted = [...t.fields].sort((a, b) => {
        const ia = order.get(a.id) ?? Infinity;
        const ib = order.get(b.id) ?? Infinity;
        return ia - ib;
      });
      return { ...t, fields: sorted };
    }),
    updatedAt: Date.now(),
  };
}

export function addRelation(
  project: SchemaProject,
  params: CreateRelationParams,
): SchemaProject {
  const validation = validateRelation(project, params);
  if (!validation.valid) return project;
  const relation = createRelation(params);
  return normalizeRelationDirection({
    ...project,
    relations: [...project.relations, relation],
    updatedAt: Date.now(),
  });
}

export function normalizeRelationDirection(
  project: SchemaProject,
): SchemaProject {
  const fieldOf = (tableId: string, fieldId: string) =>
    project.tables
      .find((t) => t.id === tableId)
      ?.fields.find((f) => f.id === fieldId);
  const relations = project.relations.map((r) => {
    const source = fieldOf(r.sourceTableId, r.sourceFieldId);
    const target = fieldOf(r.targetTableId, r.targetFieldId);
    const sourceIsKey = Boolean(source?.primaryKey || source?.unique);
    const targetIsKey = Boolean(target?.primaryKey || target?.unique);
    if (!targetIsKey && sourceIsKey) {
      return {
        ...r,
        sourceTableId: r.targetTableId,
        sourceFieldId: r.targetFieldId,
        targetTableId: r.sourceTableId,
        targetFieldId: r.sourceFieldId,
      };
    }
    return r;
  });
  return { ...project, relations };
}

export function deleteRelation(
  project: SchemaProject,
  relationId: string,
): SchemaProject {
  return {
    ...project,
    relations: project.relations.filter((r) => r.id !== relationId),
    updatedAt: Date.now(),
  };
}

export function updateRelation(
  project: SchemaProject,
  relationId: string,
  patch: Partial<Relation>,
): SchemaProject {
  return {
    ...project,
    relations: project.relations.map((r) =>
      r.id === relationId ? { ...r, ...patch } : r,
    ),
    updatedAt: Date.now(),
  };
}

export function addIndex(
  project: SchemaProject,
  tableId: string,
  name: string,
  fieldIds: string[],
  unique = false,
): SchemaProject {
  const index = createIndex(name, fieldIds, unique);
  return {
    ...project,
    tables: project.tables.map((t) =>
      t.id === tableId ? { ...t, indexes: [...t.indexes, index] } : t,
    ),
    updatedAt: Date.now(),
  };
}

export function deleteIndex(
  project: SchemaProject,
  tableId: string,
  indexId: string,
): SchemaProject {
  return {
    ...project,
    tables: project.tables.map((t) =>
      t.id === tableId
        ? { ...t, indexes: t.indexes.filter((i) => i.id !== indexId) }
        : t,
    ),
    updatedAt: Date.now(),
  };
}

export function isManyToManyRelation(relation: Relation): boolean {
  return isManyToMany(relation.type);
}

export type { Index };
