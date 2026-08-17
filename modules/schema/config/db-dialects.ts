export type DatabaseDialect = "postgresql" | "mysql" | "sqlite" | "mongodb";

export interface DialectMeta {
  id: DatabaseDialect;
  label: string;
  description: string;
  supportsSchemas: boolean;
  supportsEnums: boolean;
  supportsArrays: boolean;
  supportsAutoIncrement: boolean;
  relationless: boolean;
}

export const DIALECTS: DialectMeta[] = [
  {
    id: "postgresql",
    label: "PostgreSQL",
    description: "Advanced relational database",
    supportsSchemas: true,
    supportsEnums: true,
    supportsArrays: true,
    supportsAutoIncrement: true,
    relationless: false,
  },
  {
    id: "mysql",
    label: "MySQL",
    description: "Widely used relational database",
    supportsSchemas: false,
    supportsEnums: true,
    supportsArrays: false,
    supportsAutoIncrement: true,
    relationless: false,
  },
  {
    id: "sqlite",
    label: "SQLite",
    description: "Embedded file-based database",
    supportsSchemas: false,
    supportsEnums: false,
    supportsArrays: false,
    supportsAutoIncrement: true,
    relationless: false,
  },
  {
    id: "mongodb",
    label: "MongoDB",
    description: "Document-oriented NoSQL database",
    supportsSchemas: false,
    supportsEnums: true,
    supportsArrays: true,
    supportsAutoIncrement: false,
    relationless: true,
  },
];

export function getDialect(dialect: DatabaseDialect): DialectMeta {
  return DIALECTS.find((d) => d.id === dialect) ?? DIALECTS[0];
}
