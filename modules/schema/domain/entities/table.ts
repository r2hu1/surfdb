import type { DatabaseDialect } from "../../config/db-dialects";
import { createId, DEFAULTS } from "../../config/defaults";
import type { Index, Position, Table } from "../types";
import { createField, createIdField } from "./field";

export { createField };

export interface CreateTableOptions {
  includeId?: boolean;
}

export function createTable(
  name: string,
  position: Position,
  dialect: DatabaseDialect,
  options: CreateTableOptions = {},
): Table {
  const includeId = options.includeId ?? true;
  const fields = includeId ? [createIdField(dialect)] : [];
  return {
    id: createId("tbl"),
    name,
    position,
    width: DEFAULTS.tableWidth,
    fields,
    indexes: [],
  };
}

export function createIndex(
  name: string,
  fieldIds: string[],
  unique = false,
): Index {
  return { id: createId("idx"), name, fieldIds, unique };
}

export function tableHasField(table: Table, fieldId: string): boolean {
  return table.fields.some((f) => f.id === fieldId);
}
