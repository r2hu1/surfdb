import type {
  Edge,
  Node,
  OnEdgesChange,
  OnNodeDrag,
  OnNodesChange,
} from "@xyflow/react";
import { useEdgesState, useNodesState } from "@xyflow/react";
import { useEffect, useRef } from "react";
import { useSchemaStore } from "../store/schema.store";
import { useUIStore } from "../store/ui.store";

export interface TableNodeData extends Record<string, unknown> {
  tableId: string;
  name: string;
}

const toNodes = (
  tables: { id: string; name: string; position: { x: number; y: number } }[],
): Node[] =>
  tables.map((table) => ({
    id: table.id,
    type: "table",
    position: table.position,
    data: { tableId: table.id, name: table.name } satisfies TableNodeData,
  }));

const toEdges = (
  relations: {
    id: string;
    sourceTableId: string;
    sourceFieldId: string;
    targetTableId: string;
    targetFieldId: string;
  }[],
): Edge[] =>
  relations.map((relation) => ({
    id: relation.id,
    source: relation.sourceTableId,
    sourceHandle: `${relation.sourceFieldId}:source`,
    target: relation.targetTableId,
    targetHandle: `${relation.targetFieldId}:target`,
    type: "relation",
    data: { relationId: relation.id },
  }));

export function useCanvasSync() {
  const project = useSchemaStore((s) => s.project);
  const updateTable = useSchemaStore((s) => s.updateTable);
  const deleteRelation = useSchemaStore((s) => s.deleteRelation);
  const setSelected = useUIStore((s) => s.select);

  const [nodes, setNodes, onNodesChange] = useNodesState(
    toNodes(project.tables),
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState(
    toEdges(project.relations),
  );
  const draggingRef = useRef(false);
  const nodesRef = useRef(nodes);
  nodesRef.current = nodes;

  useEffect(() => {
    if (draggingRef.current) return;
    setNodes(toNodes(project.tables));
  }, [project.tables, setNodes]);

  useEffect(() => {
    setEdges(toEdges(project.relations));
  }, [project.relations, setEdges]);

  const handleNodesChange: OnNodesChange = (changes) => {
    for (const change of changes) {
      if (change.type === "select") {
        setSelected("table", change.selected ? change.id : null);
      }
    }
    onNodesChange(changes);
  };

  const handleEdgesChange: OnEdgesChange = (changes) => {
    for (const change of changes) {
      if (change.type === "remove") {
        deleteRelation(change.id);
      }
      if (change.type === "select") {
        setSelected("relation", change.selected ? change.id : null);
      }
    }
    onEdgesChange(changes);
  };

  const handleNodeDragStart: OnNodeDrag = () => {
    draggingRef.current = true;
  };

  const handleNodeDragStop: OnNodeDrag = (_event, node) => {
    draggingRef.current = false;
    updateTable(node.id, { position: node.position });
  };

  return {
    nodes,
    edges,
    onNodesChange: handleNodesChange,
    onEdgesChange: handleEdgesChange,
    onNodeDragStart: handleNodeDragStart,
    onNodeDragStop: handleNodeDragStop,
  };
}
