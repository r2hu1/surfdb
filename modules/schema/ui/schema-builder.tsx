"use client";

import { ReactFlowProvider } from "@xyflow/react";
import { useKeyboard } from "../hooks/use-keyboard";
import { SchemaCanvas } from "./canvas/schema-canvas";
import { PropertiesPanel } from "./panels/properties-panel";
import { CodePreview } from "./preview/code-preview";
import { SchemaSidebar } from "./sidebar/sidebar";
import { SchemaToolbar } from "./toolbar/schema-toolbar";

export function SchemaBuilder() {
  useKeyboard();

  return (
    <ReactFlowProvider>
      <div className="flex h-full min-h-0 flex-col">
        <SchemaToolbar />
        <div className="flex min-h-0 flex-1">
          <SchemaSidebar />
          <main className="relative min-w-0 flex-1">
            <SchemaCanvas />
          </main>
          <PropertiesPanel />
        </div>
        <CodePreview />
      </div>
    </ReactFlowProvider>
  );
}
