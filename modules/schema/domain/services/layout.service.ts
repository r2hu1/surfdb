import dagre from "@dagrejs/dagre";
import { DEFAULTS } from "../../config/defaults";
import type { SchemaProject } from "../types";

const NODE_H = 220;

export function autoLayout(project: SchemaProject): SchemaProject {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({
    rankdir: "LR",
    nodesep: DEFAULTS.nodeGapX,
    ranksep: DEFAULTS.nodeGapY,
  });

  for (const table of project.tables) {
    g.setNode(table.id, { width: table.width, height: NODE_H });
  }
  for (const relation of project.relations) {
    if (relation.sourceTableId === relation.targetTableId) continue;
    g.setEdge(relation.sourceTableId, relation.targetTableId);
  }

  dagre.layout(g);

  return {
    ...project,
    tables: project.tables.map((table) => {
      const node = g.node(table.id);
      return {
        ...table,
        position: node
          ? { x: node.x - table.width / 2, y: node.y - NODE_H / 2 }
          : table.position,
      };
    }),
  };
}
