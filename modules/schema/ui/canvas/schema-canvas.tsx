"use client";

import {
  Background,
  BackgroundVariant,
  Controls,
  MarkerType,
  MiniMap,
  ReactFlow,
  useReactFlow,
} from "@xyflow/react";
import { MousePointer2, X } from "lucide-react";
import "@xyflow/react/dist/style.css";
import "./react-flow.css";
import type { FieldType } from "../../config/field-types";
import { useCanvasSync } from "../../hooks/use-canvas-sync";
import { FIELD_TYPE_MIME } from "../../hooks/use-drag-palette";
import { useSchemaStore } from "../../store/schema.store";
import { useUIStore } from "../../store/ui.store";
import { EmptyState } from "../shared/empty-state";
import { edgeTypes } from "./edge-types";
import { nodeTypes } from "./node-types";

export function SchemaCanvas() {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onNodeDragStart,
    onNodeDragStop,
  } = useCanvasSync();
  const select = useUIStore((s) => s.select);
  const setDraggingFieldType = useUIStore((s) => s.setDraggingFieldType);
  const setConnectFrom = useUIStore((s) => s.setConnectFrom);
  const connectFrom = useUIStore((s) => s.connectFrom);
  const project = useSchemaStore((s) => s.project);
  const addTableWithName = useSchemaStore((s) => s.addTableWithName);
  const addFieldToTable = useSchemaStore((s) => s.addFieldToTable);
  const { screenToFlowPosition } = useReactFlow();

  const connectSourceField = connectFrom
    ? project.tables
        .find((t) => t.id === connectFrom.tableId)
        ?.fields.find((f) => f.id === connectFrom.fieldId)
    : null;

  const handleDragOver = (event: React.DragEvent) => {
    if (event.dataTransfer.types.includes(FIELD_TYPE_MIME)) {
      event.preventDefault();
      event.dataTransfer.dropEffect = "copy";
    }
  };

  const handleDrop = (event: React.DragEvent) => {
    const type = event.dataTransfer.getData(FIELD_TYPE_MIME) as FieldType;
    if (!type) return;
    event.preventDefault();
    setDraggingFieldType(null);
    const position = screenToFlowPosition({
      x: event.clientX,
      y: event.clientY,
    });
    const tableId = addTableWithName(
      `table_${project.tables.length + 1}`,
      position,
    );
    addFieldToTable(tableId, "field_1", type);
    select("table", tableId);
  };

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: drag/drop of field types is native HTML5 DnD; no keyboard equivalent inside the canvas
    <div
      className="relative h-full w-full"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDragStart={onNodeDragStart}
        onNodeDragStop={onNodeDragStop}
        onPaneClick={() => select("table", null)}
        deleteKeyCode={null}
        fitView
        fitViewOptions={{ padding: 0.2, maxZoom: 1 }}
        colorMode="system"
        defaultEdgeOptions={{
          markerEnd: { type: MarkerType.ArrowClosed, color: "var(--border)" },
        }}
        proOptions={{ hideAttribution: false }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1.5}
          color="var(--border)"
        />
        <MiniMap
          pannable
          zoomable
          nodeColor="var(--secondary)"
          maskColor="var(--background)"
          className="!bottom-4 !right-4 !m-0"
          style={{ width: 160, height: 100 }}
        />
        <Controls position="bottom-left" showInteractive={false} />
      </ReactFlow>

      {project.tables.length === 0 && <EmptyState />}

      {connectFrom && (
        <div className="pointer-events-none absolute inset-x-0 top-4 z-10 flex justify-center">
          <div className="flex items-center gap-2 rounded-full border border-primary/30 bg-background/95 px-3.5 py-1.5 text-xs shadow-md backdrop-blur">
            <MousePointer2 className="size-3.5 text-primary" />
            <span>
              Click a field in another table to link{" "}
              <span className="font-semibold text-primary">
                {connectSourceField?.name ?? "…"}
              </span>
            </span>
            <button
              type="button"
              onClick={() => setConnectFrom(null)}
              aria-label="Cancel linking"
              className="pointer-events-auto rounded-full p-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
