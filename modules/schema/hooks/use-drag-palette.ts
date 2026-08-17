import { useCallback, useState } from "react";
import type { FieldType } from "../config/field-types";
import { getFieldTypeConfig } from "../config/field-types";
import { useSchemaStore } from "../store/schema.store";
import { useUIStore } from "../store/ui.store";

export const FIELD_TYPE_MIME = "application/x-surfdb-field-type";

export function useDragPalette() {
  const setDraggingFieldType = useUIStore((s) => s.setDraggingFieldType);
  const [ghostRef, setGhostRef] = useState<HTMLElement | null>(null);

  const startDrag = useCallback(
    (event: React.DragEvent, type: FieldType) => {
      event.dataTransfer.effectAllowed = "copy";
      event.dataTransfer.setData(FIELD_TYPE_MIME, type);
      setDraggingFieldType(type);

      const ghost = document.createElement("div");
      ghost.textContent = getFieldTypeConfig(type).label;
      ghost.style.cssText =
        "position:fixed;top:0;left:0;background:var(--primary);color:var(--primary-foreground);border-radius:8px;padding:4px 10px;font:500 12px/1.2 var(--font-sans, sans-serif);box-shadow:0 4px 12px rgb(0 0 0 / .25);pointer-events:none;z-index:9999;";
      document.body.appendChild(ghost);
      event.dataTransfer.setDragImage(ghost, 16, 16);
      setGhostRef(ghost);
    },
    [setDraggingFieldType],
  );

  const endDrag = useCallback(() => {
    setDraggingFieldType(null);
    if (ghostRef) ghostRef.remove();
    setGhostRef(null);
  }, [ghostRef, setDraggingFieldType]);

  return { endDrag, startDrag };
}

export function useDropField(tableId: string) {
  const addFieldToTable = useSchemaStore((s) => s.addFieldToTable);
  const [isOver, setIsOver] = useState(false);

  const onDragOver = useCallback((event: React.DragEvent) => {
    if (event.dataTransfer.types.includes(FIELD_TYPE_MIME)) {
      event.preventDefault();
      event.dataTransfer.dropEffect = "copy";
    }
  }, []);

  const onDragEnter = useCallback((event: React.DragEvent) => {
    if (event.dataTransfer.types.includes(FIELD_TYPE_MIME)) {
      event.preventDefault();
      setIsOver(true);
    }
  }, []);

  const onDragLeave = useCallback((event: React.DragEvent) => {
    if (event.currentTarget.contains(event.relatedTarget as Node | null)) {
      return;
    }
    setIsOver(false);
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      const type = event.dataTransfer.getData(FIELD_TYPE_MIME) as FieldType;
      if (!type) return;
      event.preventDefault();
      event.stopPropagation();
      setIsOver(false);
      addFieldToTable(
        tableId,
        `field_${Date.now().toString().slice(-4)}`,
        type,
      );
    },
    [tableId, addFieldToTable],
  );

  return { isOver, onDragOver, onDragEnter, onDragLeave, onDrop };
}
