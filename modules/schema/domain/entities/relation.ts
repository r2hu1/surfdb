import { createId } from "../../config/defaults";
import type { Relation, RelationType } from "../types";

export interface CreateRelationParams {
  type: RelationType;
  sourceTableId: string;
  sourceFieldId: string;
  targetTableId: string;
  targetFieldId: string;
  name?: string;
  onDelete?: Relation["onDelete"];
  onUpdate?: Relation["onUpdate"];
}

export function createRelation(params: CreateRelationParams): Relation {
  return {
    id: createId("rel"),
    name: params.name,
    type: params.type,
    sourceTableId: params.sourceTableId,
    sourceFieldId: params.sourceFieldId,
    targetTableId: params.targetTableId,
    targetFieldId: params.targetFieldId,
    onDelete: params.onDelete,
    onUpdate: params.onUpdate,
  };
}

export function getRelationLabel(
  relation: Relation,
  tableName: (id: string) => string,
): string {
  return (
    relation.name ??
    `${tableName(relation.sourceTableId)}.${relation.sourceFieldId} → ${tableName(relation.targetTableId)}.${relation.targetFieldId}`
  );
}
