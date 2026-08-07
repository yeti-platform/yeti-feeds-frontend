<template>
  <v-card variant="outlined" class="evidence-panel">
    <v-card-title><h2 class="text-h6">Evidence</h2></v-card-title>
    <v-card-text>
      <v-alert v-if="selectedEdge" type="info" variant="tonal" class="mb-3">
        <strong>Selected relationship {{ selectedEdge.id }}</strong>
        <span class="d-block">{{ selectedEdge.source }} → {{ selectedEdge.target }}</span>
        <span class="d-block">{{ selectedEdge.type }} · {{ selectedEdge.description }} · count {{ selectedEdge.count }}</span>
      </v-alert>
      <v-alert v-else-if="selectedNode" type="info" variant="tonal" class="mb-3">
        <strong>Selected object {{ selectedNode.label }}</strong>
        <span class="d-block">{{ selectedNode.id }} · {{ selectedNode.object_type }}</span>
      </v-alert>

      <div class="evidence-table mb-4" tabindex="0" aria-label="Visible graph objects">
        <table>
          <caption>Visible objects</caption>
          <thead>
            <tr><th>Object</th><th>Type</th><th>Role</th><th>Origins</th><th>Actions</th></tr>
          </thead>
          <tbody>
            <tr v-for="node in nodes" :key="node.id">
              <td>
                <button type="button" class="evidence-select" @click="emit('selectNode', node.id)">{{ node.label }}</button>
                <small class="d-block">{{ node.id }}</small>
              </td>
              <td>{{ node.object_type }}</td>
              <td>{{ roleLabel(node.role) }}</td>
              <td>{{ node.origin_ids.join(", ") }}</td>
              <td class="text-no-wrap">
                <v-btn size="x-small" variant="text" :aria-label="`Expand ${node.label}`" @click="emit('expand', node.id)">
                  Expand
                </v-btn>
                <v-btn size="x-small" variant="text" :to="detailPath(node)">Details</v-btn>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="evidence-table" tabindex="0" aria-label="Visible graph relationships">
        <table>
          <caption>Visible directed relationships</caption>
          <thead>
            <tr><th>ID</th><th>Direction</th><th>Type</th><th>Description</th><th>Count</th></tr>
          </thead>
          <tbody>
            <tr v-for="edge in edges" :key="edge.id">
              <td>
                <button
                  type="button"
                  class="evidence-select"
                  :aria-label="`Select relationship ${edge.id}`"
                  @click="emit('selectEdge', edge.id)"
                >
                  {{ edge.id }}
                </button>
              </td>
              <td>{{ edge.source }} → {{ edge.target }}</td>
              <td>{{ edge.type }}</td>
              <td>{{ edge.description }}</td>
              <td>{{ edge.count }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from "vue";

import type { GraphExploreEdge, GraphExploreNode } from "@/services/types";

const props = defineProps<{
  nodes: GraphExploreNode[];
  edges: GraphExploreEdge[];
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
}>();
const emit = defineEmits<{
  selectNode: [id: string | null];
  selectEdge: [id: string | null];
  expand: [id: string];
}>();

const selectedNode = computed(() => props.nodes.find(node => node.id === props.selectedNodeId));
const selectedEdge = computed(() => props.edges.find(edge => edge.id === props.selectedEdgeId));

function roleLabel(role: GraphExploreNode["role"]) {
  return role === "scope_match" ? "Scope match" : role.charAt(0).toUpperCase() + role.slice(1);
}

function detailPath(node: GraphExploreNode) {
  const key = node.id.split("/", 2)[1];
  const collections: Record<string, string> = {
    observable: "observables",
    entity: "entities",
    indicator: "indicators",
    dfiq: "dfiq"
  };
  const collection = collections[node.root_type] ?? node.root_type;
  return `/${collection}/${key}`;
}
</script>

<style scoped>
.evidence-table {
  overflow: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

caption,
th,
td {
  padding: 0.45rem;
  text-align: left;
  vertical-align: top;
}

caption {
  font-weight: 600;
}

th,
td {
  border-bottom: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.evidence-select {
  color: rgb(var(--v-theme-primary));
  text-decoration: underline;
}

.evidence-select:focus-visible {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: 2px;
}
</style>
