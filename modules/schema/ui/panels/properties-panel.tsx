import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Field, Table } from "../../domain";
import { useSchemaStore } from "../../store/schema.store";
import { useUIStore } from "../../store/ui.store";
import { FieldEditor } from "./field-editor";
import { RelationEditor } from "./relation-editor";
import { SchemaSettings } from "./schema-settings";
import { TableEditor } from "./table-editor";

export function PropertiesPanel() {
  const project = useSchemaStore((s) => s.project);
  const {
    selectedTableId,
    selectedFieldId,
    selectedRelationId,
    propertiesPanelOpen,
    togglePropertiesPanel,
    select,
  } = useUIStore();

  if (!propertiesPanelOpen) return null;

  let content: React.ReactNode = null;
  let title = "Properties";

  const relation = project.relations.find((r) => r.id === selectedRelationId);

  let table: Table | null = null;
  let field: Field | null = null;
  if (selectedFieldId) {
    const hit = project.tables.find((t) =>
      t.fields.some((f) => f.id === selectedFieldId),
    );
    table = hit ?? null;
    field = hit?.fields.find((f) => f.id === selectedFieldId) ?? null;
  } else {
    table = project.tables.find((t) => t.id === selectedTableId) ?? null;
  }

  if (relation && selectedRelationId) {
    title = "Relation";
    content = <RelationEditor relation={relation} />;
  } else if (field && table && selectedFieldId) {
    title = "Field";
    content = <FieldEditor tableId={table.id} field={field} />;
  } else if (table && selectedTableId) {
    title = "Table";
    content = <TableEditor table={table} />;
  } else {
    title = "Settings";
    content = <SchemaSettings />;
  }

  return (
    <aside className="flex h-full shrink-0 flex-col bg-background">
      <div className="flex items-center justify-between px-4 py-3">
        <h2 className="font-heading text-sm font-medium">{title}</h2>
        <Button
          size="icon-sm"
          variant="ghost"
          className="text-muted-foreground"
          onClick={() => {
            togglePropertiesPanel();
            select("table", null);
          }}
          aria-label="Close properties panel"
        >
          <X className="size-3.5" />
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="px-4 pb-6">{content}</div>
      </ScrollArea>
    </aside>
  );
}
