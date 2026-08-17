import type { DatabaseDialect } from "../../config/db-dialects";
import { getFieldTypesForDialect } from "../../config/field-types";
import type { Field, FieldType } from "../types";

export function getTypesForDialect(dialect: DatabaseDialect): FieldType[] {
  return getFieldTypesForDialect(dialect).map((c) => c.type);
}

export function toDialectType(field: Field, dialect: DatabaseDialect): string {
  if (dialect === "mongodb") {
    return field.type;
  }
  const config = getFieldTypesForDialect(dialect).find(
    (c) => c.type === field.type,
  );
  return config?.drizzle ?? field.type;
}

const MONGODB_TYPE_MAP: Record<string, FieldType> = {
  string: "string",
  str: "string",
  int: "integer",
  int32: "integer",
  int64: "bigint",
  long: "bigint",
  double: "double",
  float: "float",
  decimal: "decimal",
  bool: "boolean",
  boolean: "boolean",
  date: "date",
  object: "json",
  json: "json",
  binData: "binary",
  uuid: "uuid",
};

const SQL_TYPE_MAP: Record<string, FieldType> = {
  varchar: "string",
  char: "string",
  text: "text",
  integer: "integer",
  int: "integer",
  smallint: "smallint",
  bigint: "bigint",
  serial: "integer",
  bigserial: "bigint",
  real: "float",
  float: "float",
  double: "double",
  doubleprecision: "double",
  "double precision": "double",
  decimal: "decimal",
  numeric: "decimal",
  boolean: "boolean",
  bool: "boolean",
  date: "date",
  datetime: "datetime",
  timestamp: "timestamp",
  timestamptz: "timestamp",
  time: "time",
  json: "json",
  jsonb: "jsonb",
  uuid: "uuid",
  bytea: "binary",
  blob: "blob",
  binary: "binary",
};

export function fromDialectType(
  typeStr: string,
  dialect: DatabaseDialect,
): FieldType {
  const normalized = typeStr.trim().toLowerCase();
  const map = dialect === "mongodb" ? MONGODB_TYPE_MAP : SQL_TYPE_MAP;
  const mapped = map[normalized] ?? map[normalized.replace(/\s+/g, "")];
  if (mapped) {
    return mapped;
  }
  const available = getTypesForDialect(dialect);
  return available.includes("string") ? "string" : available[0];
}
