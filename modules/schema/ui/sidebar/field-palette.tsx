import type { FieldType } from "../../config/field-types";
import { getFieldTypesForDialect } from "../../config/field-types";
import { useDragPalette } from "../../hooks/use-drag-palette";
import { useSchemaStore } from "../../store/schema.store";

export function FieldPalette() {
  const dialect = useSchemaStore((s) => s.project.dialect);
  const { startDrag, endDrag } = useDragPalette();
  const types = getFieldTypesForDialect(dialect);

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-muted-foreground">
        Drag a field type onto a table to add it.
      </p>
      <div className="grid grid-cols-2 gap-1.5">
        {types.map((type) => (
          <button
            key={type.type}
            type="button"
            draggable
            onDragStart={(e) => startDrag(e, type.type as FieldType)}
            onDragEnd={endDrag}
            className="flex cursor-grab items-center justify-between gap-1 rounded-xl border border-border/60 bg-background px-2.5 py-1.5 text-left text-xs transition-colors hover:bg-muted active:cursor-grabbing"
          >
            <span className="truncate font-medium">{type.label}</span>
            {type.recommended && (
              <span className="shrink-0 rounded-md bg-secondary px-1 py-px text-[9px] font-semibold text-secondary-foreground">
                POP
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
