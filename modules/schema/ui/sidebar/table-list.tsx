import { ChevronRight, Grid4 as Table2 } from "reicon-react";
import { cn } from "@/lib/utils";
import type { Table } from "../../domain";
import { useSchemaStore } from "../../store/schema.store";
import { useUIStore } from "../../store/ui.store";

interface TableListProps {
  tables: Table[];
}

export function TableList({ tables }: TableListProps) {
  const select = useUIStore((s) => s.select);
  const selectedTableId = useUIStore((s) => s.selectedTableId);
  const dialect = useSchemaStore((s) => s.project.dialect);

  return (
    <div className="flex flex-col gap-1.5">
      {tables.map((table) => (
        <button
          key={table.id}
          type="button"
          onClick={() => select("table", table.id)}
          className={cn(
            "flex items-center gap-2 rounded-xl border border-border/60 bg-background px-2.5 py-2 text-left text-xs transition-colors hover:bg-muted",
            selectedTableId === table.id && "border-primary/40 bg-primary/5",
          )}
        >
          <Table2 className="size-3.5 shrink-0 text-muted-foreground" />
          <span className="min-w-0 flex-1 truncate font-medium">
            {table.name}
          </span>
          <span className="shrink-0 text-[10px] text-muted-foreground">
            {table.fields.length} cols
          </span>
          <ChevronRight className="size-3 shrink-0 text-muted-foreground" />
        </button>
      ))}
      {tables.length === 0 && (
        <p className="px-1 text-xs text-muted-foreground">
          No tables. Add one with the toolbar or press{" "}
          <kbd className="rounded-md border border-border bg-secondary px-1 py-px font-mono text-[10px]">
            ⌘N
          </kbd>
        </p>
      )}
      {dialect === "mongodb" && (
        <p className="px-1 pt-1 text-[10px] text-muted-foreground">
          MongoDB is collection-based — relations are embedded at export time.
        </p>
      )}
    </div>
  );
}
