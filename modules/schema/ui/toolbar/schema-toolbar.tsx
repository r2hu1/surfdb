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
    openExportDialog,
    openImportDialog,
  } = useUIStore();

  const undo = () => useSchemaStore.temporal.getState().undo();
  const redo = () => useSchemaStore.temporal.getState().redo();

  return (
    <>
      <header className="flex h-12 shrink-0 items-center gap-1.5 border-b border-border bg-background px-3">
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon-sm"
                variant="ghost"
                onClick={toggleSidebar}
                aria-label="Toggle sidebar"
              >
                <PanelLeft className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Toggle sidebar</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <div className="ml-1 flex items-center gap-2">
          <span className="flex size-6 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Database className="size-3.5" />
          </span>
          <span className="max-w-40 truncate font-heading text-sm font-medium">
            {project.name}
          </span>
        </div>

        <div className="mx-2 h-5 w-px bg-border" />

        <Select
          value={project.dialect}
          onValueChange={(v) => setDialect(v as typeof project.dialect)}
        >
          <SelectTrigger
            size="sm"
            className="w-32"
            aria-label="Database dialect"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DIALECTS.map((d) => (
              <SelectItem key={d.id} value={d.id}>
                {d.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="mx-2 h-5 w-px bg-border" />

        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon-sm"
                variant="ghost"
                onClick={undo}
                aria-label="Undo"
              >
                <Undo2 className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Undo (⌘Z)</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon-sm"
                variant="ghost"
                onClick={redo}
                aria-label="Redo"
              >
                <Redo2 className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Redo (⌘⇧Z)</TooltipContent>
          </Tooltip>
        </TooltipProvider>

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

        <div className="flex-1" />

        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon-sm"
                variant={codePreviewOpen ? "secondary" : "ghost"}
                onClick={toggleCodePreview}
                aria-label="Toggle code preview"
              >
                <Code2 className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Code preview (⌘E)</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <Button
          size="sm"
          variant="ghost"
          onClick={() => openImportDialog(true)}
        >
          <Upload className="size-3.5" />
          Import
        </Button>
        <Button size="sm" onClick={() => openExportDialog(true)}>
          <Download className="size-3.5" />
          Export
        </Button>
      </header>

      <ExportDialog />
      <ImportDialog />
    </>
  );
}
