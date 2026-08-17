import type { FieldType } from "../domain";
import { useSchemaStore } from "../store/schema.store";

export function useSchema() {
  const {
    project,
    addTableWithName,
    updateTable,
    deleteTable,
    addField,
    addFieldToTable,
    updateField,
    deleteField,
    reorderFields,
    addRelation,
    deleteRelation,
    updateRelation,
    addIndex,
    deleteIndex,
    setDialect,
    renameProject,
    loadProject,
    newProject,
    applyAutoLayout,
  } = useSchemaStore();

  const getTable = (tableId: string) =>
    project.tables.find((t) => t.id === tableId);
  const getField = (tableId: string, fieldId: string) =>
    getTable(tableId)?.fields.find((f) => f.id === fieldId);

  return {
    project,
    getTable,
    getField,
    addTableWithName,
    updateTable,
    deleteTable,
    addField,
    addFieldToTable,
    updateField,
    deleteField,
    reorderFields,
    addRelation,
    deleteRelation,
    updateRelation,
    addIndex,
    deleteIndex,
    setDialect,
    renameProject,
    loadProject,
    newProject,
    applyAutoLayout,
    addTypedField: (tableId: string, name: string, type: FieldType) =>
      addFieldToTable(tableId, name, type),
  };
}
