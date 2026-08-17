export const DEFAULTS = {
  projectName: "Untitled Schema",
  tablePrefix: "table",
  fieldPrefix: "field",
  tableWidth: 240,
  nodeGapX: 80,
  nodeGapY: 40,
  maxUndoDepth: 100,
} as const;

export function createId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}
