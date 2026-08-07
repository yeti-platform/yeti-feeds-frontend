import { computed, onBeforeUnmount, ref, watch } from "vue";
import type { ComputedRef } from "vue";

import type { GraphCanvasEdge, GraphCanvasNode } from "@/components/graph/GraphCanvas.vue";
import type { GraphExploreEdge, GraphExploreNode } from "@/services/types";

export interface GraphCluster {
  id: string;
  label: string;
  memberIds: string[];
  dominantObjectType: string;
  dominantRelationshipType: string;
}

function dominant(counts: Map<string, number>, fallback: string) {
  return (
    [...counts].sort(
      ([leftType, leftCount], [rightType, rightCount]) =>
        rightCount - leftCount || leftType.localeCompare(rightType)
    )[0]?.[0] ?? fallback
  );
}

export function useGraphClusters(
  nodes: ComputedRef<GraphExploreNode[]>,
  edges: ComputedRef<GraphExploreEdge[]>,
  canvasNodes: ComputedRef<GraphCanvasNode[]>,
  canvasEdges: ComputedRef<GraphCanvasEdge[]>
) {
  const communities = ref<Record<string, number>>({});
  const collapsed = ref(new Set<string>());
  const worker = new Worker(new URL("../workers/graph-cluster.worker.ts", import.meta.url), { type: "module" });
  let generation = 0;

  worker.onmessage = (event: MessageEvent<{ generation: number; communities: Record<string, number> }>) => {
    if (event.data.generation === generation) communities.value = event.data.communities;
  };

  watch(
    [nodes, edges],
    () => {
      generation += 1;
      communities.value = {};
      collapsed.value = new Set();
      worker.postMessage({
        generation,
        nodes: nodes.value.map(node => ({ id: node.id, objectType: node.object_type })),
        edges: edges.value.map(edge => ({ id: edge.id, source: edge.source, target: edge.target }))
      });
    },
    { immediate: true }
  );

  const clusters = computed<GraphCluster[]>(() => {
    const grouped = new Map<number, GraphExploreNode[]>();
    for (const node of nodes.value) {
      const community = communities.value[node.id];
      if (community === undefined) continue;
      const members = grouped.get(community) ?? [];
      members.push(node);
      grouped.set(community, members);
    }
    return [...grouped.values()]
      .map(members => members.sort((left, right) => left.id.localeCompare(right.id)))
      .sort((left, right) => left[0].id.localeCompare(right[0].id))
      .map((members, index) => {
        const objectCounts = new Map<string, number>();
        members.forEach(member =>
          objectCounts.set(member.object_type, (objectCounts.get(member.object_type) ?? 0) + 1)
        );
        const memberIds = new Set(members.map(member => member.id));
        const relationshipCounts = new Map<string, number>();
        edges.value
          .filter(edge => memberIds.has(edge.source) && memberIds.has(edge.target))
          .forEach(edge => relationshipCounts.set(edge.type, (relationshipCounts.get(edge.type) ?? 0) + 1));
        return {
          id: `cluster-${index + 1}`,
          label: `Cluster ${index + 1}`,
          memberIds: [...memberIds],
          dominantObjectType: dominant(objectCounts, "unknown"),
          dominantRelationshipType: dominant(relationshipCounts, "none")
        };
      });
  });

  const nodeCluster = computed(() => {
    const mapping = new Map<string, string>();
    clusters.value.forEach(cluster => cluster.memberIds.forEach(id => mapping.set(id, cluster.id)));
    return mapping;
  });

  const displayNodes = computed<GraphCanvasNode[]>(() => {
    const hiddenMembers = new Set<string>();
    const result: GraphCanvasNode[] = [];
    for (const cluster of clusters.value) {
      if (!collapsed.value.has(cluster.id) || cluster.memberIds.length < 2) continue;
      cluster.memberIds.forEach(id => hiddenMembers.add(id));
      const members = canvasNodes.value.filter(node => cluster.memberIds.includes(node.id));
      result.push({
        id: cluster.id,
        label: `${cluster.label} · ${members.length} objects`,
        x: members.reduce((sum, node) => sum + node.x, 0) / Math.max(members.length, 1),
        y: members.reduce((sum, node) => sum + node.y, 0) / Math.max(members.length, 1),
        color: "#ef6c00",
        size: 10
      });
    }
    result.push(...canvasNodes.value.filter(node => !hiddenMembers.has(node.id)));
    return result;
  });

  const displayEdges = computed<GraphCanvasEdge[]>(() => {
    return canvasEdges.value.flatMap(edge => {
      const sourceCluster = nodeCluster.value.get(edge.source);
      const targetCluster = nodeCluster.value.get(edge.target);
      const source = sourceCluster && collapsed.value.has(sourceCluster) ? sourceCluster : edge.source;
      const target = targetCluster && collapsed.value.has(targetCluster) ? targetCluster : edge.target;
      if (source === target) return [];
      return [{ ...edge, source, target }];
    });
  });

  function toggle(clusterId: string) {
    const next = new Set(collapsed.value);
    if (next.has(clusterId)) next.delete(clusterId);
    else next.add(clusterId);
    collapsed.value = next;
  }

  onBeforeUnmount(() => worker.terminate());

  return { clusters, collapsed, displayNodes, displayEdges, toggle };
}
