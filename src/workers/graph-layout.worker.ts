import { MultiDirectedGraph } from "graphology";
import forceAtlas2 from "graphology-layout-forceatlas2";

interface LayoutNode {
  id: string;
  x: number;
  y: number;
}

interface LayoutEdge {
  id: string;
  source: string;
  target: string;
}

self.onmessage = (event: MessageEvent<{ generation: number; nodes: LayoutNode[]; edges: LayoutEdge[] }>) => {
  const graph = new MultiDirectedGraph();
  event.data.nodes.forEach(node => graph.addNode(node.id, { x: node.x, y: node.y }));
  event.data.edges.forEach(edge => {
    if (graph.hasNode(edge.source) && graph.hasNode(edge.target)) {
      graph.addDirectedEdgeWithKey(edge.id, edge.source, edge.target);
    }
  });

  const positions =
    graph.order > 1 && graph.size > 0
      ? forceAtlas2(graph, {
          iterations: 50,
          settings: { ...forceAtlas2.inferSettings(graph), barnesHutOptimize: graph.order > 100 }
        })
      : Object.fromEntries(event.data.nodes.map(node => [node.id, { x: node.x, y: node.y }]));
  self.postMessage({ generation: event.data.generation, positions });
};
