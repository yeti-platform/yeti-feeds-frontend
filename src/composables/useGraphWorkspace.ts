import { computed, onBeforeUnmount, ref, shallowRef, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

import type { GraphCanvasEdge, GraphCanvasNode } from "@/components/graph/GraphCanvas.vue";
import { explore } from "@/services/graph";
import type {
  GraphExploreItemScope,
  GraphExploreQueryScope,
  GraphExploreRequest,
  GraphExploreResponse
} from "@/services/types";

export type GraphScope = GraphExploreItemScope | GraphExploreQueryScope;
export type WorkspaceStatus = "idle" | "loading" | "ready" | "empty" | "error" | "cancelled";

interface SerializedGraphWorkspace {
  version: 1;
  scope: GraphScope;
  direction: GraphExploreRequest["direction"];
  link_types: string[];
  target_types: string[];
}

const DEFAULT_LIMITS = { nodes: 2000, edges: 10000 };

function parseWorkspaceHash(hash: string): SerializedGraphWorkspace | null {
  try {
    const raw = new URLSearchParams(hash.replace(/^#/, "")).get("state");
    if (!raw) return null;
    const state = JSON.parse(raw) as Partial<SerializedGraphWorkspace>;
    if (state.version !== 1 || !state.scope || !["items", "query"].includes(state.scope.kind)) return null;
    if (state.scope.kind === "items" && (!Array.isArray(state.scope.items) || state.scope.items.length === 0)) return null;
    return {
      version: 1,
      scope: state.scope,
      direction: state.direction ?? "any",
      link_types: Array.isArray(state.link_types) ? state.link_types : [],
      target_types: Array.isArray(state.target_types) ? state.target_types : []
    };
  } catch {
    return null;
  }
}

function serializeWorkspaceHash(state: SerializedGraphWorkspace): string {
  const parameters = new URLSearchParams();
  parameters.set("state", JSON.stringify(state));
  return `#${parameters.toString()}`;
}

export function itemScope(items: string[]): GraphExploreItemScope {
  return { kind: "items", items: [...new Set(items.map(item => item.trim()).filter(Boolean))].slice(0, 100) };
}

export function useGraphWorkspace() {
  const route = useRoute();
  const router = useRouter();
  const response = shallowRef<GraphExploreResponse | null>(null);
  const scope = shallowRef<GraphScope | null>(null);
  const status = ref<WorkspaceStatus>("idle");
  const error = ref("");
  const direction = ref<GraphExploreRequest["direction"]>("any");
  const linkTypes = ref<string[]>([]);
  const targetTypes = ref<string[]>([]);
  let requestGeneration = 0;
  let activeRequest: AbortController | null = null;

  const canvasNodes = computed<GraphCanvasNode[]>(() => {
    const nodes = response.value?.nodes ?? [];
    return nodes.map((node, index) => {
      const angle = (index * 2 * Math.PI) / Math.max(nodes.length, 1);
      return {
        id: node.id,
        label: node.label,
        x: Math.cos(angle),
        y: Math.sin(angle),
        color: node.role === "anchor" ? "#1565c0" : node.role === "scope_match" ? "#6a1b9a" : "#546e7a",
        size: node.role === "neighbor" ? 5 : 8
      };
    });
  });

  const canvasEdges = computed<GraphCanvasEdge[]>(() =>
    (response.value?.edges ?? []).map(edge => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      label: edge.type
    }))
  );

  function buildRequest(nextScope: GraphScope): GraphExploreRequest {
    return {
      schema_version: 1,
      scope: nextScope,
      direction: direction.value,
      link_types: linkTypes.value,
      target_types: targetTypes.value,
      filters: [],
      requested_limits: DEFAULT_LIMITS
    };
  }

  async function load(nextScope: GraphScope, updateUrl = true) {
    activeRequest?.abort();
    const controller = new AbortController();
    activeRequest = controller;
    const generation = ++requestGeneration;
    scope.value = nextScope;
    status.value = "loading";
    error.value = "";
    if (updateUrl) {
      await router.replace({
        hash: serializeWorkspaceHash({
          version: 1,
          scope: nextScope,
          direction: direction.value,
          link_types: linkTypes.value,
          target_types: targetTypes.value
        })
      });
    }

    try {
      const result = await explore(buildRequest(nextScope), controller.signal);
      if (generation !== requestGeneration) return;
      response.value = result;
      status.value = result.nodes.length === 0 ? "empty" : "ready";
    } catch (loadError) {
      if (generation !== requestGeneration) return;
      if (controller.signal.aborted) {
        status.value = "cancelled";
        return;
      }
      status.value = "error";
      const apiError = loadError as { response?: { status?: number } };
      error.value =
        apiError.response?.status === 404
          ? "One or more scope objects are unavailable. Edit the scope and try again."
          : "The graph could not be loaded. Try again or narrow the scope.";
    }
  }

  function clear() {
    activeRequest?.abort();
    requestGeneration += 1;
    response.value = null;
    scope.value = null;
    status.value = "idle";
    error.value = "";
    void router.replace({ hash: "" });
  }

  watch(
    () => route.hash,
    hash => {
      const restored = parseWorkspaceHash(hash);
      if (!restored || scope.value) return;
      direction.value = restored.direction;
      linkTypes.value = restored.link_types;
      targetTypes.value = restored.target_types;
      void load(restored.scope, false);
    },
    { immediate: true }
  );

  onBeforeUnmount(() => activeRequest?.abort());

  return {
    response,
    scope,
    status,
    error,
    direction,
    linkTypes,
    targetTypes,
    canvasNodes,
    canvasEdges,
    load,
    clear
  };
}
