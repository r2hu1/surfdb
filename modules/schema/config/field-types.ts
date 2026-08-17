import type { DatabaseDialect } from "./db-dialects";

export type FieldType =
  | "string"
  | "text"
  | "integer"
  | "bigint"
  | "smallint"
  | "float"
  | "double"
  | "decimal"
  | "boolean"
  | "date"
  | "datetime"
  | "timestamp"
  | "time"
  | "json"
  | "jsonb"
  | "uuid"
  | "binary"
  | "blob"
  | "enum";

export interface FieldTypeConfig {
  type: FieldType;
  label: string;
  drizzle: string;
  prisma: string;
  mongodb: string;
  hasLength?: boolean;
  hasPrecision?: boolean;
  defaultLength?: number;
  recommended?: boolean;
}

const COMMON: Record<FieldType, Omit<FieldTypeConfig, "type">> = {
  string: {
    label: "string",
    drizzle: "varchar",
    prisma: "String",
    mongodb: "string",
    hasLength: true,
    defaultLength: 255,
    recommended: true,
  },
  text: { label: "text", drizzle: "text", prisma: "String", mongodb: "string" },
  integer: {
    label: "integer",
    drizzle: "integer",
    prisma: "Int",
    mongodb: "int32",
    recommended: true,
  },
  bigint: {
    label: "bigint",
    drizzle: "bigint",
    prisma: "BigInt",
    mongodb: "int64",
  },
  smallint: {
    label: "smallint",
    drizzle: "smallint",
    prisma: "Int",
    mongodb: "int32",
  },
  float: {
    label: "float",
    drizzle: "real",
    prisma: "Float",
    mongodb: "double",
  },
  double: {
    label: "double",
    drizzle: "doublePrecision",
    prisma: "Float",
    mongodb: "double",
  },
  decimal: {
    label: "decimal",
    drizzle: "numeric",
    prisma: "Decimal",
    mongodb: "decimal",
    hasPrecision: true,
    defaultLength: 10,
  },
  boolean: {
    label: "boolean",
    drizzle: "boolean",
    prisma: "Boolean",
    mongodb: "bool",
  },
  date: { label: "date", drizzle: "date", prisma: "DateTime", mongodb: "date" },
  datetime: {
    label: "datetime",
    drizzle: "timestamp",
    prisma: "DateTime",
    mongodb: "date",
  },
  timestamp: {
    label: "timestamp",
    drizzle: "timestamp",
    prisma: "DateTime",
    mongodb: "date",
  },
  time: {
    label: "time",
    drizzle: "time",
    prisma: "DateTime",
    mongodb: "string",
  },
  json: {
    label: "json",
    drizzle: "json",
    prisma: "Json",
    mongodb: "object",
    recommended: true,
  },
  jsonb: {
    label: "jsonb",
    drizzle: "jsonb",
    prisma: "Json",
    mongodb: "object",
  },
  uuid: { label: "uuid", drizzle: "uuid", prisma: "String", mongodb: "string" },
  binary: {
    label: "binary",
    drizzle: "bytea",
    prisma: "Bytes",
    mongodb: "binData",
  },
  blob: { label: "blob", drizzle: "blob", prisma: "Bytes", mongodb: "binData" },
  enum: { label: "enum", drizzle: "enum", prisma: "enum", mongodb: "string" },
};

type DialectOverride = Record<DatabaseDialect, FieldType[]>;

const DIALECT_TYPES: DialectOverride = {
  postgresql: [
    "string",
    "text",
    "integer",
    "bigint",
    "smallint",
    "float",
    "double",
    "decimal",
    "boolean",
    "date",
    "timestamp",
    "time",
    "json",
    "jsonb",
    "uuid",
    "binary",
    "enum",
  ],
  mysql: [
    "string",
    "text",
    "integer",
    "bigint",
    "smallint",
    "float",
    "double",
    "decimal",
    "boolean",
    "date",
    "datetime",
    "timestamp",
    "time",
    "json",
    "uuid",
    "blob",
    "enum",
  ],
  sqlite: [
    "string",
    "text",
    "integer",
    "bigint",
    "smallint",
    "float",
    "double",
    "decimal",
    "boolean",
    "date",
    "datetime",
    "timestamp",
    "time",
    "json",
    "uuid",
    "blob",
  ],
  mongodb: [
    "string",
    "text",
    "integer",
    "bigint",
    "float",
    "double",
    "decimal",
    "boolean",
    "date",
    "timestamp",
    "json",
    "uuid",
    "binary",
  ],
};

export function getFieldTypesForDialect(
  dialect: DatabaseDialect,
): FieldTypeConfig[] {
  return DIALECT_TYPES[dialect].map((type) => ({
    type,
    ...COMMON[type],
  }));
}

export function getFieldTypeConfig(type: FieldType): FieldTypeConfig {
  return { type, ...COMMON[type] };
}
