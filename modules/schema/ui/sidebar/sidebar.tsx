import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSchemaStore } from "../../store/schema.store";
import { useUIStore } from "../../store/ui.store";
import { FieldPalette } from "./field-palette";
import { TableList } from "./table-list";
import { TypeReference } from "./type-reference";

export function SchemaSidebar() {
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
  const sidebarTab = useUIStore((s) => s.sidebarTab);
  const setSidebarTab = useUIStore((s) => s.setSidebarTab);
  const project = useSchemaStore((s) => s.project);

  if (!sidebarOpen) return null;

  return (
    <aside className="flex h-full w-60 shrink-0 flex-col border-r border-border bg-background">
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
        <ScrollArea className="flex-1">
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
    </aside>
  );
}
