import {
  Code2,
  Database,
  Download,
  LayoutGrid,
  PanelLeft,
  Plus,
  Redo2,
  Undo2,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { DIALECTS } from "../../config/db-dialects";
import { useSchemaStore } from "../../store/schema.store";
import { useUIStore } from "../../store/ui.store";
import { ExportDialog } from "./export-dialog";
import { ImportDialog } from "./import-dialog";

export function SchemaToolbar() {
  const project = useSchemaStore((s) => s.project);
  const setDialect = useSchemaStore((s) => s.setDialect);
  const addTableWithName = useSchemaStore((s) => s.addTableWithName);
  const applyAutoLayout = useSchemaStore((s) => s.applyAutoLayout);
  const {
    toggleSidebar,
    codePreviewOpen,
    toggleCodePreview,
    openSettings,
    openExportDialog,
    openImportDialog,
  } = useUIStore();

  const undo = () => useSchemaStore.temporal.getState().undo();
  const redo = () => useSchemaStore.temporal.getState().redo();

  return (
    <header className="flex h-12 shrink-0 items-center gap-1.5 border-b border-border bg-background px-3">
      <div className="ml-1 flex items-center gap-2">
        <span className="flex size-6 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Database className="size-3.5" />
        </span>
        <button
          type="button"
          onClick={openSettings}
          className="max-w-40 truncate rounded-md px-1.5 py-0.5 font-heading text-sm font-medium transition-colors hover:bg-muted"
          aria-label="Project settings"
        >
          {project.name}
        </button>
      </div>

      <div className="mx-2 h-5 w-px bg-border" />

      <Button
        size="sm"
        variant="outline"
        onClick={() =>
          addTableWithName(`table_${project.tables.length + 1}`, {
            x: 80 + 40 * project.tables.length,
            y: 80 + 40 * project.tables.length,
          })
        }
      >
        <Plus className="size-3.5" />
        Table
      </Button>
      <Button size="sm" variant="ghost" onClick={applyAutoLayout}>
        <LayoutGrid className="size-3.5" />
        Auto-layout
      </Button>
    </header>
  );
}
