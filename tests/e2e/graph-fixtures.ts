import type { GraphExploreResponse } from "../../src/services/types";

export function boundedGraphFixture(candidateNodes: number, candidateEdges: number): GraphExploreResponse {
  const nodeLimit = 2_000;
  const edgeLimit = 10_000;
  const returnedNodes = Math.min(candidateNodes, nodeLimit);
  const returnedEdges = returnedNodes > 0 ? Math.min(candidateEdges, edgeLimit) : 0;
  const nodes = Array.from({ length: returnedNodes }, (_, index) => ({
    id: `entities/${100_000 + index}`,
    label: `Synthetic object ${index}`,
    root_type: "entity",
    object_type: index % 2 === 0 ? "threat-actor" : "malware",
    role: "scope_match" as const,
    origin_ids: [`entities/${100_000 + index}`]
  }));
  const edges = Array.from({ length: returnedEdges }, (_, index) => ({
    id: `links/scale-${index}`,
    source: `entities/${100_000 + (index % returnedNodes)}`,
    target: `entities/${100_000 + ((index * 17 + 1) % returnedNodes)}`,
    type: index % 2 === 0 ? "uses" : "communicates-with",
    description: "Synthetic scale evidence",
    count: 1
  }));
  const reasons: Array<"node_limit" | "edge_limit"> = [];
  if (candidateNodes > nodeLimit) reasons.push("node_limit");
  if (candidateEdges > edgeLimit) reasons.push("edge_limit");
  return {
    schema_version: 1,
    scope: {
      kind: "query",
      anchor_ids: [],
      accessible_match_count: candidateNodes,
      ranking: [["modified", false], ["_id", true]]
    },
    nodes,
    edges,
    budget: {
      node_limit: nodeLimit,
      edge_limit: edgeLimit,
      returned_nodes: returnedNodes,
      returned_edges: returnedEdges,
      is_truncated: reasons.length > 0,
      reasons
    }
  };
}
