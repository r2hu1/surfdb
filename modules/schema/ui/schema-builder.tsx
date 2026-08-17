"use client";

import { ReactFlowProvider } from "@xyflow/react";
import { useKeyboard } from "../hooks/use-keyboard";
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

  return (
    <ReactFlowProvider>
      <div className="flex h-full min-h-0 flex-col">
        {/*<SchemaToolbar />*/}
        <div className="flex min-h-0 flex-1">
          {sidebarOpen && <SchemaSidebar />}
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
