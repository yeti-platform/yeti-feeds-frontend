<template>
  <v-card class="ma-2">
    <v-expansion-panels :readonly="context.length === 0" flat static>
      <v-expansion-panel>
        <v-expansion-panel-title class="edit-ctx-title break-title">
          <p class="text-subtitle-1 me-2">Context entries</p>
          <v-chip
            label
            color="green"
            v-for="source in new Set(context.map(c => c.source))"
            v-bind:key="source"
            size="small"
            density="comfortable"
            class="me-2"
          >
            {{ source }}
          </v-chip>

          <v-dialog height="90%">
            <template v-slot:activator="{ props }">
              <v-btn v-bind="props" class="ms-2 edit-ctx-btn" size="small" variant="text" density="comfortable"
                ><v-icon class="me-2">mdi-pencil</v-icon>{{ context.length === 0 ? "add" : "edit" }}</v-btn
              >
            </template>
            <template v-slot:default="{ isActive }">
              <v-card max-height="100%">
                <v-card-title class="text-h6">Edit context</v-card-title>
                <v-card-text>
                  <v-textarea class="yeti-code" v-model="jsonContext" v-on:input="checkJson" rows="1" auto-grow />
                  <v-alert type="error" v-if="jsonError !== ''">Invalid JSON: {{ jsonError }}</v-alert>
                </v-card-text>
                <v-card-actions>
                  <v-btn color="cancel" variant="tonal" @click="isActive.value = false">Cancel</v-btn>
                  <v-btn color="primary" variant="tonal" @click="updateContext(isActive)">Save</v-btn>
                </v-card-actions>
              </v-card>
            </template>
          </v-dialog>
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <v-treeview
            :items="ContextTreeView()"
            item-value="id"
            activatable
            open-on-click
            slim
            density="compact"
            max-height="300"
            width="100%"
            v-if="showCtxDetails"
          >
          </v-treeview>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
  </v-card>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { VTreeview } from "vuetify/components";

import * as objectsApi from "@/services/objects";

/** One context entry, keyed by the source that produced it. */
type ContextEntry = Record<string, unknown> & { source?: string };

const props = defineProps<{
  /** The object's context. It is a list of entries, not a single object — the
   * old `type: Object` prop declaration was wrong. */
  context: ContextEntry[];
  /** The "<endpoint>/<id>" segment to PUT the updated context to. */
  updateEndpoint: string;
}>();

const emit = defineEmits<{ "update:context": [context: unknown[]] }>();

const jsonContext = ref(JSON.stringify(props.context, null, 2));
const jsonError = ref("");
const showCtxDetails = ref(true);

interface TreeItem {
  id: number;
  title: string;
  children?: TreeItem[];
  color?: string;
}

function checkJson(): string {
  try {
    JSON.parse(jsonContext.value);
    jsonError.value = "";
  } catch (e) {
    jsonError.value = e instanceof Error ? e.message : String(e);
  }
  return jsonError.value;
}

async function updateContext(isActive: { value: boolean }) {
  let contextPayload: unknown[];
  try {
    contextPayload = JSON.parse(jsonContext.value);
  } catch {
    return;
  }
  const updated = await objectsApi.replaceContextAtPath(props.updateEndpoint, contextPayload);
  emit("update:context", updated.context);
  isActive.value = false;
}

/** Flattens the context entries into the tree VTreeview renders. */
function ContextTreeView(): TreeItem[] {
  let id = 0;

  function treeify(root: TreeItem[], data: unknown) {
    if (Array.isArray(data)) {
      data.forEach((item, index) => {
        const element: TreeItem = { id: id++, title: String(index), children: [] };
        root.push(element);
        treeify(element.children!, item);
      });
      return;
    }
    if (data !== null && typeof data === "object") {
      for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
        if (key === "source") {
          continue;
        }
        if (value === null) {
          root.push({ id: id++, title: `${key}: N/A` });
        } else if (Array.isArray(value) || typeof value === "object") {
          const element: TreeItem = { id: id++, title: key, children: [] };
          root.push(element);
          treeify(element.children!, value);
        } else {
          root.push({ id: id++, title: `${key}: ${value}` });
        }
      }
    }
  }

  const items: TreeItem[] = [];
  for (const ctx of props.context) {
    const element: TreeItem = { id: id++, title: String(ctx.source), children: [], color: "warning" };
    items.push(element);
    treeify(element.children!, ctx);
  }
  return items;
}
</script>

<style>
.yeti-code-container {
  max-height: 100%;
  overflow: auto;
}

.yeti-code textarea,
.yeti-code input {
  font-family: monospace;
}

.edit-ctx-title .edit-ctx-btn {
  display: none;
}

.edit-ctx-title:hover .edit-ctx-btn {
  display: inline;
}
</style>
