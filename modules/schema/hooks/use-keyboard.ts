import { useCallback, useEffect } from "react";
import { adapters } from "../adapters";
import { useSchemaStore } from "../store/schema.store";
import { useUIStore } from "../store/ui.store";

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName.toLowerCase();
  return (
    tag === "input" ||
    tag === "textarea" ||
    tag === "select" ||
    target.isContentEditable
  );
}

function matchesShortcut(event: KeyboardEvent, keys: string[]): boolean {
  return keys.some((key) => {
    const parts = key.toLowerCase().split("+");
    return parts.every((part) => {
      if (part === "mod") return event.metaKey || event.ctrlKey;
      if (part === "shift") return event.shiftKey;
      if (part === "alt") return event.altKey;
      return event.key.toLowerCase() === part;
    });
  });
}

export function useKeyboard() {
  const project = useSchemaStore((s) => s.project);
  const deleteTable = useSchemaStore((s) => s.deleteTable);
  const deleteField = useSchemaStore((s) => s.deleteField);
  const deleteRelation = useSchemaStore((s) => s.deleteRelation);
  const addTableWithName = useSchemaStore((s) => s.addTableWithName);
  const downloadProject = useCallback(() => {
    const code = adapters.json.export(project);
    const blob = new Blob([code], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${project.name}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [project]);
  const openExport = useUIStore((s) => s.openExportDialog);
  const togglePreview = useUIStore((s) => s.toggleCodePreview);
  const { selectedTableId, selectedFieldId, selectedRelationId, select } =
    useUIStore();

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (isEditableTarget(event.target)) return;
      const key = event.key.toLowerCase();

      if (matchesShortcut(event, ["Mod+z"]) && !event.shiftKey) {
        event.preventDefault();
        useSchemaStore.temporal.getState().undo();
        return;
      }
      if (matchesShortcut(event, ["Mod+Shift+z", "Mod+y"])) {
        event.preventDefault();
        useSchemaStore.temporal.getState().redo();
        return;
      }
      if (matchesShortcut(event, ["Mod+s"])) {
        event.preventDefault();
        openExport(true);
        return;
      }
      if (matchesShortcut(event, ["Mod+Shift+s"])) {
        event.preventDefault();
        downloadProject();
        return;
      }
      if (matchesShortcut(event, ["Mod+e"])) {
        event.preventDefault();
        togglePreview();
        return;
      }
      if (matchesShortcut(event, ["Mod+n"])) {
        event.preventDefault();
        const offset = 40 * project.tables.length;
        addTableWithName(`table_${project.tables.length + 1}`, {
          x: 80 + offset,
          y: 80 + offset,
        });
        return;
      }
      if (key === "escape") {
        select("table", null);
        return;
      }
      if (key === "backspace" || key === "delete") {
        event.preventDefault();
        if (selectedRelationId) {
          deleteRelation(selectedRelationId);
          select("relation", null);
        } else if (selectedFieldId && selectedTableId) {
          deleteField(selectedTableId, selectedFieldId);
          select("field", null);
        } else if (selectedTableId) {
          deleteTable(selectedTableId);
          select("table", null);
        }
        return;
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [
    project.tables.length,
    selectedTableId,
    selectedFieldId,
    selectedRelationId,
    deleteTable,
    deleteField,
    deleteRelation,
    addTableWithName,
    openExport,
    togglePreview,
    select,
    downloadProject,
  ]);
}
