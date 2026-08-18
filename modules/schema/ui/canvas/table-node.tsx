import type { Node, NodeProps } from "@xyflow/react";
import { Plus, Grid4 as Table2, Trash2 } from "reicon-react";
import { memo } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getFieldTypesForDialect } from "../../config/field-types";
import type { TableNodeData } from "../../hooks/use-canvas-sync";
import { useDropField } from "../../hooks/use-drag-palette";
import { useSchemaStore } from "../../store/schema.store";
import { useUIStore } from "../../store/ui.store";
import { FieldRow } from "./field-row";

export type TableNode = Node<TableNodeData, "table">;

export const TableNode = memo(function TableNode({
  data,
  selected,
}: NodeProps<TableNode>) {
  const table = useSchemaStore((s) =>
    s.project.tables.find((t) => t.id === data.tableId),
  );
  const dialect = useSchemaStore((s) => s.project.dialect);
  const deleteTable = useSchemaStore((s) => s.deleteTable);
  const addFieldToTable = useSchemaStore((s) => s.addFieldToTable);
  const select = useUIStore((s) => s.select);
  const { isOver, onDragOver, onDragEnter, onDragLeave, onDrop } = useDropField(
    data.tableId,
  );

  if (!table) return null;

  const defaultType = getFieldTypesForDialect(dialect)[0]?.type ?? "string";

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: drag/drop is handled by native DnD events on the node card
    // biome-ignore lint/a11y/useKeyWithClickEvents: click on a flow node is pointer-driven; keyboard handled in properties panel
    <div
      onDragOver={onDragOver}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={(e) => {
        e.stopPropagation();
        select("table", table.id);
      }}
      className={cn(
        "w-60 rounded-lg bg-card text-sm text-card-foreground shadow-sm ring-1 ring-foreground/5 transition-shadow dark:ring-foreground/10",
        selected && "ring-2 ring-primary",
        isOver && "ring-2 ring-primary ring-offset-2",
      )}
    >
      <div className="relative overflow-hidden rounded-lg">
        <div className="flex items-center gap-2 border-b border-border/60 px-3 py-2">
          <Table2 className="size-3.5 shrink-0 text-muted-foreground" />
          <span className="min-w-0 flex-1 truncate font-heading text-sm font-medium">
            {table.name}
          </span>
          <span className="shrink-0 rounded-md bg-secondary px-1.5 py-px text-[10px] font-medium text-secondary-foreground">
            {table.fields.length}
          </span>
          <button
            type="button"
            aria-label={`Delete table ${table.name}`}
            onClick={(e) => {
              e.stopPropagation();
              deleteTable(table.id);
              select("table", null);
            }}
            className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="size-3" />
          </button>
        </div>

        <div className="py-0.5">
          {table.fields.map((field) => (
            <FieldRow key={field.id} tableId={table.id} field={field} />
          ))}
        </div>

        <div className="border-t border-border/60 p-1.5">
          <Button
            type="button"
            size="sm"
            className="w-full rounded-md"
            variant="secondary"
            onClick={(e) => {
              e.stopPropagation();
              addFieldToTable(
                table.id,
                `field_${table.fields.length + 1}`,
                defaultType,
              );
            }}
          >
            <Plus className="size-3" />
            Add field
          </Button>
        </div>

        {isOver && (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center border-2 border-dashed border-primary/60 bg-primary/10">
            <span className="rounded-full bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground shadow-md">
              Add field to {table.name}
            </span>
          </div>
        )}
      </div>
    </div>
  );
});
