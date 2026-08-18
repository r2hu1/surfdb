import { Database, Sparkles } from "reicon-react";
import { Button } from "@/components/ui/button";
import { useSchemaStore } from "../../store/schema.store";
import { useUIStore } from "../../store/ui.store";
import { templates } from "../../templates";

export function EmptyState() {
  const addTableWithName = useSchemaStore((s) => s.addTableWithName);
  const loadProject = useSchemaStore((s) => s.loadProject);
  const openImport = useUIStore((s) => s.openImportDialog);
  const openSettings = useUIStore((s) => s.openSettings);

  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
      <div className="pointer-events-auto mx-4 flex w-full max-w-sm flex-col items-center gap-4 rounded-[min(var(--radius-4xl),24px)] border border-dashed border-border bg-card/80 p-8 text-center shadow-sm backdrop-blur-sm">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-secondary">
          <Database className="size-6 text-muted-foreground" />
        </div>
        <div className="flex flex-col gap-1">
          <h3 className="font-heading text-base font-medium">No tables yet</h3>
          <p className="text-sm text-muted-foreground">
            Start with a blank canvas, a template, or import an existing schema.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button onClick={() => addTableWithName("users", { x: 40, y: 40 })}>
            New table
            <Database className="size-3.5" />
          </Button>
          <Button variant="outline" onClick={openSettings}>
            Use template
            <Sparkles className="size-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
