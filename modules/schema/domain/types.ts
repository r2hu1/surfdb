import type { DatabaseDialect } from "../config/db-dialects";
import type { FieldType } from "../config/field-types";

export type { DatabaseDialect };
export type { FieldType };

export interface SchemaProject {
  id: string;
  name: string;
  dialect: DatabaseDialect;
  tables: Table[];
  relations: Relation[];
  createdAt: number;
  updatedAt: number;
}

export interface Table {
  id: string;
  name: string;
  schema?: string;
  comment?: string;
  position: { x: number; y: number };
  width: number;
  fields: Field[];
  indexes: Index[];
}

export interface Field {
  id: string;
  name: string;
  type: FieldType;
  nullable: boolean;
  primaryKey: boolean;
  unique: boolean;
  autoIncrement: boolean;
  length?: number;
  precision?: number;
  isArray: boolean;
  defaultValue?: string;
  comment?: string;
  enumValues?: string[];
}

export type RelationType = "one_to_one" | "one_to_many" | "many_to_many";

export type ReferentialAction =
  | "cascade"
  | "restrict"
  | "set_null"
  | "no_action";

export interface Relation {
  id: string;
  name?: string;
  type: RelationType;
  sourceTableId: string;
  sourceFieldId: string;
  targetTableId: string;
  targetFieldId: string;
  onDelete?: ReferentialAction;
  onUpdate?: ReferentialAction;
}

export interface Index {
  id: string;
  name: string;
  fieldIds: string[];
  unique: boolean;
  type?: "btree" | "hash" | "gin" | "gist";
}

export interface Position {
  x: number;
  y: number;
}
