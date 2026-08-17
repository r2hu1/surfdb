export type ShortcutId =
  | "delete"
  | "undo"
  | "redo"
  | "export"
  | "togglePreview"
  | "newTable"
  | "deselect"
  | "save";

export interface ShortcutDefinition {
  id: ShortcutId;
  label: string;
  keys: string[];
  description: string;
}

export const SHORTCUTS: ShortcutDefinition[] = [
  {
    id: "delete",
    label: "Delete selection",
    keys: ["Backspace", "Delete"],
    description: "Delete selected table, field, or relation",
  },
  {
    id: "undo",
    label: "Undo",
    keys: ["Mod+z"],
    description: "Revert last action",
  },
  {
    id: "redo",
    label: "Redo",
    keys: ["Mod+Shift+z"],
    description: "Re-apply undone action",
  },
  {
    id: "export",
    label: "Export",
    keys: ["Mod+s"],
    description: "Open export dialog",
  },
  {
    id: "togglePreview",
    label: "Toggle code preview",
    keys: ["Mod+e"],
    description: "Show/hide generated code panel",
  },
  {
    id: "newTable",
    label: "New table",
    keys: ["Mod+n"],
    description: "Add a new table to the canvas",
  },
  {
    id: "deselect",
    label: "Deselect",
    keys: ["Escape"],
    description: "Clear selection or cancel connecting",
  },
  {
    id: "save",
    label: "Save project",
    keys: ["Mod+Shift+s"],
    description: "Download project as JSON",
  },
];
