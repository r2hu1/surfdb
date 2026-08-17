import {
  BaseEdge,
  type Edge,
  EdgeLabelRenderer,
  type EdgeProps,
  getBezierPath,
} from "@xyflow/react";
import { cn } from "@/lib/utils";
import { getRelationTypeLabel } from "../../domain/value-objects/relation-type";
import { useSchemaStore } from "../../store/schema.store";
import { useUIStore } from "../../store/ui.store";

interface RelationEdgeData extends Record<string, unknown> {
  relationId: string;
}

export type RelationEdge = Edge<RelationEdgeData, "relation">;

export function RelationEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  selected,
  data,
}: EdgeProps<RelationEdge>) {
  const relation = useSchemaStore((s) =>
    s.project.relations.find((r) => r.id === data?.relationId),
  );
  const deleteRelation = useSchemaStore((s) => s.deleteRelation);
  const select = useUIStore((s) => s.select);

  const [path, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });

  const label = relation ? getRelationTypeLabel(relation.type) : "";

  return (
    <>
      <BaseEdge
        id={id}
        path={path}
        className={cn(
          "stroke-border stroke-[1.5] transition-colors hover:stroke-primary/50",
          selected && "stroke-primary",
        )}
      />
      <EdgeLabelRenderer>
        {relation && (
          // biome-ignore lint/a11y/noStaticElementInteractions: relation label is a click target for selection
          // biome-ignore lint/a11y/useKeyWithClickEvents: selection is pointer-driven inside the flow canvas
          <div
            className={cn(
              "nodrag nopan pointer-events-auto absolute rounded-lg border border-border bg-background px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground shadow-sm transition-colors",
              selected && "border-primary/40 bg-primary/10 text-primary",
            )}
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            }}
            onClick={(e) => {
              e.stopPropagation();
              select("relation", relation.id);
            }}
            onDoubleClick={(e) => {
              e.stopPropagation();
              deleteRelation(relation.id);
              select("relation", null);
            }}
            title="Click to edit, double-click to delete"
          >
            {label}
          </div>
        )}
      </EdgeLabelRenderer>
    </>
  );
}
