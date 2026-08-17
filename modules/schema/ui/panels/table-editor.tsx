import { ListPlus, Plus, Table2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getFieldTypesForDialect } from "../../config/field-types";
import type { Table } from "../../domain";
import { useSchemaStore } from "../../store/schema.store";
import { useUIStore } from "../../store/ui.store";

interface TableEditorProps {
  table: Table;
}

export function TableEditor({ table }: TableEditorProps) {
  const dialect = useSchemaStore((s) => s.project.dialect);
  const updateTable = useSchemaStore((s) => s.updateTable);
  const deleteTable = useSchemaStore((s) => s.deleteTable);
  const addFieldToTable = useSchemaStore((s) => s.addFieldToTable);
  const select = useUIStore((s) => s.select);
  const defaultType = getFieldTypesForDialect(dialect)[0]?.type ?? "string";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <Table2 className="size-4 shrink-0 text-muted-foreground" />
          <span className="truncate font-heading text-sm font-medium">
            {table.name}
          </span>
        </div>
        <Button
          size="icon-sm"
          variant="ghost"
          className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          onClick={() => {
            deleteTable(table.id);
            select("table", null);
          }}
          aria-label="Delete table"
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="table-name">Name</Label>
        <Input
          id="table-name"
          value={table.name}
          onChange={(e) => updateTable(table.id, { name: e.target.value })}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="table-schema">Schema (PostgreSQL)</Label>
        <Input
          id="table-schema"
          value={table.schema ?? ""}
          placeholder="public"
          onChange={(e) =>
            updateTable(table.id, { schema: e.target.value || undefined })
          }
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="table-comment">Comment</Label>
        <Input
          id="table-comment"
          value={table.comment ?? ""}
          onChange={(e) =>
            updateTable(table.id, { comment: e.target.value || undefined })
          }
        />
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">
            Fields ({table.fields.length})
          </Label>
          <Button
            size="xs"
            variant="outline"
            onClick={() =>
              addFieldToTable(
                table.id,
                `field_${table.fields.length + 1}`,
                defaultType,
              )
            }
          >
            <Plus className="size-3" />
            Add
          </Button>
        </div>
        <div className="flex flex-col gap-1">
          {table.fields.map((field) => (
            <button
              key={field.id}
              type="button"
              onClick={() => select("field", field.id)}
              className="flex items-center justify-between rounded-xl border border-border/60 bg-background px-2.5 py-1.5 text-left text-xs transition-colors hover:bg-muted"
            >
              <span className="truncate font-medium">{field.name}</span>
              <span className="shrink-0 text-muted-foreground">
                {field.type}
              </span>
            </button>
          ))}
          {table.fields.length === 0 && (
            <div className="flex items-center gap-1.5 rounded-xl border border-dashed border-border px-2.5 py-2 text-xs text-muted-foreground">
              <ListPlus className="size-3" />
              No fields yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
