import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSchemaStore } from "../../store/schema.store";
import { useUIStore } from "../../store/ui.store";
import { FieldPalette } from "./field-palette";
import { TableList } from "./table-list";
import { TypeReference } from "./type-reference";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DIALECTS } from "../../config/db-dialects";
import { Button } from "@/components/ui/button";
import {
  Database,
  Download,
  PanelLeft,
  Plus,
  Redo2,
  Undo2,
  Upload,
} from "lucide-react";
import { ExportDialog } from "../toolbar/export-dialog";
import { ImportDialog } from "../toolbar/import-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function SchemaSidebar() {
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
  const sidebarTab = useUIStore((s) => s.sidebarTab);
  const setSidebarTab = useUIStore((s) => s.setSidebarTab);
  const project = useSchemaStore((s) => s.project);
  const setDialect = useSchemaStore((s) => s.setDialect);
  const addTableWithName = useSchemaStore((s) => s.addTableWithName);
  const {
    toggleSidebar,
    codePreviewOpen,
    toggleCodePreview,
    openExportDialog,
    openImportDialog,
  } = useUIStore();
  const undo = () => useSchemaStore.temporal.getState().undo();
  const redo = () => useSchemaStore.temporal.getState().redo();

  if (!sidebarOpen) return null;

  return (
    <aside className="flex rounded-xl m-2 mr-0! justify-between shrink-0 flex-col border w-70 bg-background">
      <div>
        <div className="flex p-3 items-center gap-1">
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
          <span className="max-w-40 truncate font-heading text-sm font-medium">
            {project.name}
          </span>

          <Button
            size="sm"
            className="ml-auto"
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
        </div>
        <Tabs
          value={sidebarTab}
          onValueChange={(v) => setSidebarTab(v as typeof sidebarTab)}
          className="flex h-full flex-col gap-0"
        >
          <div className="px-3 pt-3">
            <TabsList className="w-full">
              <TabsTrigger value="palette" className="flex-1">
                Fields
              </TabsTrigger>
              <TabsTrigger value="tables" className="flex-1">
                Tables
              </TabsTrigger>
              <TabsTrigger value="reference" className="flex-1">
                Types
              </TabsTrigger>
            </TabsList>
          </div>
          <ScrollArea className="flex-1 max-h-145">
            <TabsContent value="palette" className="px-3 py-3">
              <FieldPalette />
            </TabsContent>
            <TabsContent value="tables" className="px-3 py-3">
              <TableList tables={project.tables} />
            </TabsContent>
            <TabsContent value="reference" className="px-3 py-3">
              <TypeReference />
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </div>
      <div className="p-3 grid gap-2">
        <Select
          value={project.dialect}
          onValueChange={(v) => setDialect(v as typeof project.dialect)}
        >
          <SelectTrigger
            size="sm"
            className="w-full"
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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Button
              size="icon"
              variant="secondary"
              onClick={() => openImportDialog(true)}
            >
              <Upload className="size-3.5" />
            </Button>
            <Button
              // size="icon"
              variant="default"
              onClick={() => openExportDialog(true)}
            >
              Export
              <Download className="size-3.5" />
            </Button>
          </div>
          <div className="flex gap-1">
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="icon" onClick={undo} aria-label="Undo">
                    <Undo2 className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Undo (⌘Z)</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="icon" onClick={redo} aria-label="Redo">
                    <Redo2 className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Redo (⌘⇧Z)</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>
      <ExportDialog />
      <ImportDialog />
    </aside>
  );
}
