import type { DatabaseDialect } from "../../config/db-dialects";
import { createId, DEFAULTS } from "../../config/defaults";
import type { Field } from "../types";

export function createField(
  name: string,
  type: Field["type"],
  _dialect: DatabaseDialect,
): Field {
  return {
    id: createId("fld"),
    name,
    type,
    nullable: !name.toLowerCase().startsWith("id"),
    primaryKey: false,
    unique: false,
    autoIncrement: false,
    isArray: false,
    length: undefined,
    precision: undefined,
    defaultValue: undefined,
    comment: undefined,
    enumValues: undefined,
  };
}

export function createIdField(dialect: DatabaseDialect): Field {
  const isSqlite = dialect === "sqlite";
  const isMongo = dialect === "mongodb";
  return {
    id: createId("fld"),
    name: "id",
    type: isMongo ? "string" : isSqlite ? "integer" : "uuid",
    nullable: false,
    primaryKey: true,
    unique: true,
    autoIncrement: !isMongo,
    isArray: false,
    defaultValue: isMongo ? "crypto.randomUUID()" : undefined,
    comment: "Primary key",
  };
}

export function getDefaultTableWidth(): number {
  return DEFAULTS.tableWidth;
}
