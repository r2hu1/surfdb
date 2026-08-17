"use client";

import { ReactFlowProvider } from "@xyflow/react";
import { PanelLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useKeyboard } from "../hooks/use-keyboard";
import { useSchemaStore } from "../store/schema.store";
import { useUIStore } from "../store/ui.store";
import { SchemaCanvas } from "./canvas/schema-canvas";
import { PropertiesPanel } from "./panels/properties-panel";
import { CodePreview } from "./preview/code-preview";
import { SchemaSidebar } from "./sidebar/sidebar";
import { SchemaToolbar } from "./toolbar/schema-toolbar";

export function SchemaBuilder() {
  useKeyboard();
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
  const propertiesPanelOpen = useUIStore((s) => s.propertiesPanelOpen);
  const codePreviewOpen = useUIStore((s) => s.codePreviewOpen);
  const {
    toggleSidebar,
    toggleCodePreview,
    openExportDialog,
    openImportDialog,
  } = useUIStore();
  const project = useSchemaStore((s) => s.project);

  return (
    <ReactFlowProvider>
      <div className="flex h-full min-h-0 flex-col">
        {/*<SchemaToolbar />*/}
        <div className="flex min-h-0 flex-1">
          {sidebarOpen ? (
            <SchemaSidebar />
          ) : (
            <div className="bg-background fixed top-0 left-0 z-100 pr-3 h-fit w-fit m-4 border rounded-xl flex items-center">
              <Button
                size="icon-sm"
                variant="ghost"
                onClick={toggleSidebar}
                aria-label="Toggle sidebar"
              >
                <PanelLeft className="size-4" />
              </Button>
              <span className="max-w-40 truncate font-heading text-sm font-medium">
                {project.name}
              </span>
            </div>
          )}
          <main className="relative min-w-0 flex-1">
            <SchemaCanvas />
          </main>
          {propertiesPanelOpen && <PropertiesPanel />}
        </div>
        {codePreviewOpen && <CodePreview />}
      </div>
    </ReactFlowProvider>
  );
}
