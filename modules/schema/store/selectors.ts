import type { SchemaProject } from "../domain";

export function selectTable(project: SchemaProject, tableId: string) {
  return project.tables.find((t) => t.id === tableId);
}

export function selectField(
  project: SchemaProject,
  tableId: string,
  fieldId: string,
) {
  return selectTable(project, tableId)?.fields.find((f) => f.id === fieldId);
}

export function selectRelation(project: SchemaProject, relationId: string) {
  return project.relations.find((r) => r.id === relationId);
}

export function getFieldPath(
  project: SchemaProject,
  tableId: string,
  fieldId: string,
): string {
  const table = selectTable(project, tableId);
  const field = table?.fields.find((f) => f.id === fieldId);
  if (!table || !field) return "";
  return `${table.name}.${field.name}`;
}

export function relationsForTable(project: SchemaProject, tableId: string) {
  return project.relations.filter(
    (r) => r.sourceTableId === tableId || r.targetTableId === tableId,
  );
}

export function findRelationByEndpoints(
  project: SchemaProject,
  sourceTableId: string,
  sourceFieldId: string,
  targetTableId: string,
  targetFieldId: string,
) {
  return project.relations.find(
    (r) =>
      r.sourceTableId === sourceTableId &&
      r.sourceFieldId === sourceFieldId &&
      r.targetTableId === targetTableId &&
      r.targetFieldId === targetFieldId,
  );
}
