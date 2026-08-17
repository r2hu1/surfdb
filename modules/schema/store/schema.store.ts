import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { DatabaseDialect } from "../config/db-dialects";
import type {
  Field,
  FieldType,
  Relation,
  SchemaProject,
  Table,
} from "../domain";
import {
  autoLayout,
  createDefaultProject,
  createProject,
  addField as domainAddField,
  addFieldToTable as domainAddFieldToTable,
  addIndex as domainAddIndex,
  addRelation as domainAddRelation,
  addTableWithName as domainAddTableWithName,
  deleteField as domainDeleteField,
  deleteIndex as domainDeleteIndex,
  deleteRelation as domainDeleteRelation,
  deleteTable as domainDeleteTable,
  reorderFields as domainReorderFields,
  updateField as domainUpdateField,
  updateRelation as domainUpdateRelation,
  updateTable as domainUpdateTable,
} from "../domain";
import type { CreateRelationParams } from "../domain/entities/relation";
import { HISTORY_OPTIONS, temporal } from "./history.plugin";
import { PERSIST_OPTIONS, persist } from "./persistence.plugin";

export interface SchemaStore {
  project: SchemaProject;
  addTableWithName: (
    name: string,
    position: { x: number; y: number },
  ) => string;
  updateTable: (tableId: string, patch: Partial<Table>) => void;
  deleteTable: (tableId: string) => void;
  addField: (tableId: string, field: Field) => void;
  addFieldToTable: (tableId: string, name: string, type: FieldType) => void;
  updateField: (
    tableId: string,
    fieldId: string,
    patch: Partial<Field>,
  ) => void;
  deleteField: (tableId: string, fieldId: string) => void;
  reorderFields: (tableId: string, fieldIds: string[]) => void;
  addRelation: (params: CreateRelationParams) => string;
  deleteRelation: (relationId: string) => void;
  updateRelation: (relationId: string, patch: Partial<Relation>) => void;
  addIndex: (
    tableId: string,
    name: string,
    fieldIds: string[],
    unique?: boolean,
  ) => void;
  deleteIndex: (tableId: string, indexId: string) => void;
  setDialect: (dialect: DatabaseDialect) => void;
  renameProject: (name: string) => void;
  loadProject: (project: SchemaProject) => void;
  newProject: (name: string, dialect: DatabaseDialect) => void;
  applyAutoLayout: () => void;
}

export const useSchemaStore = create<SchemaStore>()(
  devtools(
    persist(
      temporal(
        (set) => ({
          project: createDefaultProject(),

          addTableWithName: (name, position) => {
            let createdId = "";
            set((state) => {
              const next = domainAddTableWithName(
                state.project,
                name,
                position,
              );
              createdId = next.tables[next.tables.length - 1].id;
              return { project: next };
            });
            return createdId;
          },

          updateTable: (tableId, patch) =>
            set((state) => ({
              project: domainUpdateTable(state.project, tableId, patch),
            })),

          deleteTable: (tableId) =>
            set((state) => ({
              project: domainDeleteTable(state.project, tableId),
            })),

          addField: (tableId, field) =>
            set((state) => ({
              project: domainAddField(state.project, tableId, field),
            })),

          addFieldToTable: (tableId, name, type) =>
            set((state) => ({
              project: domainAddFieldToTable(
                state.project,
                tableId,
                name,
                type,
              ),
            })),

          updateField: (tableId, fieldId, patch) =>
            set((state) => ({
              project: domainUpdateField(
                state.project,
                tableId,
                fieldId,
                patch,
              ),
            })),

          deleteField: (tableId, fieldId) =>
            set((state) => ({
              project: domainDeleteField(state.project, tableId, fieldId),
            })),

          reorderFields: (tableId, fieldIds) =>
            set((state) => ({
              project: domainReorderFields(state.project, tableId, fieldIds),
            })),

          addRelation: (params) => {
            let createdId = "";
            set((state) => {
              const next = domainAddRelation(state.project, params);
              createdId = next.relations[next.relations.length - 1].id;
              return { project: next };
            });
            return createdId;
          },

          deleteRelation: (relationId) =>
            set((state) => ({
              project: domainDeleteRelation(state.project, relationId),
            })),

          updateRelation: (relationId, patch) =>
            set((state) => ({
              project: domainUpdateRelation(state.project, relationId, patch),
            })),

          addIndex: (tableId, name, fieldIds, unique = false) =>
            set((state) => ({
              project: domainAddIndex(
                state.project,
                tableId,
                name,
                fieldIds,
                unique,
              ),
            })),

          deleteIndex: (tableId, indexId) =>
            set((state) => ({
              project: domainDeleteIndex(state.project, tableId, indexId),
            })),

          setDialect: (dialect) =>
            set((state) => ({
              project: { ...state.project, dialect, updatedAt: Date.now() },
            })),

          renameProject: (name) =>
            set((state) => ({
              project: { ...state.project, name, updatedAt: Date.now() },
            })),

          loadProject: (project) =>
            set(() => ({ project: { ...project, updatedAt: Date.now() } })),

          newProject: (name, dialect) =>
            set(() => ({ project: createProject(name, dialect) })),

          applyAutoLayout: () =>
            set((state) => ({ project: autoLayout(state.project) })),
        }),
        HISTORY_OPTIONS,
      ),
      PERSIST_OPTIONS,
    ),
    { name: "schema-store" },
  ),
);
