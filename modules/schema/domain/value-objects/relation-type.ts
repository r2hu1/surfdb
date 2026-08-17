import type { RelationType } from "../types";

export const RELATION_TYPES: {
  id: RelationType;
  label: string;
  description: string;
}[] = [
  { id: "one_to_one", label: "One-to-One", description: "1:1" },
  { id: "one_to_many", label: "One-to-Many", description: "1:N" },
  { id: "many_to_many", label: "Many-to-Many", description: "N:M" },
];

export function getRelationTypeLabel(type: RelationType): string {
  return RELATION_TYPES.find((r) => r.id === type)?.label ?? type;
}

export function isManyToMany(type: RelationType): boolean {
  return type === "many_to_many";
}
