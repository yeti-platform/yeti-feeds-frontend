import { MultiDirectedGraph } from "graphology";
import louvain from "graphology-communities-louvain";

interface ClusterNode {
  id: string;
  objectType: string;
}

interface ClusterEdge {
  id: string;
  source: string;
  target: string;
}

self.onmessage = (event: MessageEvent<{ generation: number; nodes: ClusterNode[]; edges: ClusterEdge[] }>) => {
  const graph = new MultiDirectedGraph();
  const nodes = [...event.data.nodes].sort((left, right) => left.id.localeCompare(right.id));
  const edges = [...event.data.edges].sort((left, right) => left.id.localeCompare(right.id));
  nodes.forEach(node => graph.addNode(node.id, { objectType: node.objectType }));
  edges.forEach(edge => {
    if (graph.hasNode(edge.source) && graph.hasNode(edge.target)) {
      graph.addDirectedEdgeWithKey(edge.id, edge.source, edge.target);
    }
  });

  const communities = graph.order > 1 ? louvain(graph, { randomWalk: false }) : Object.fromEntries(nodes.map(node => [node.id, 0]));
  self.postMessage({ generation: event.data.generation, communities });
};
