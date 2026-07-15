<template>
  <v-card>
    <template v-slot:title>
      Edit: {{ vertices[edge.source].value || vertices[edge.source].name }}
      <v-icon>mdi-arrow-right</v-icon>
      {{ vertices[edge.target].value || vertices[edge.target].name }}</template
    >
    <v-card-text>
      <!-- <v-text-field label="Type" v-model="localEdge.type"></v-text-field> -->
      <v-combobox label="Type" v-model="localEdge.type" :items="getLinkTypeSuggestions"></v-combobox>
      <v-textarea label="Description" v-model="localEdge.description"></v-textarea>
      <div class="d-flex justify-center">
        <table>
          <tbody>
            <tr>
              <td>
                <v-chip
                  :text="vertices[edge.source].name || vertices[edge.source].value"
                  :prepend-icon="getIconForType(vertices[edge.source].type)"
                />
              </td>
              <td>→</td>
              <td>
                <code>{{ localEdge.type || "?" }}</code>
              </td>
              <td>→</td>
              <td>
                <v-chip :text="vertices[edge.target].name" :prepend-icon="getIconForType(vertices[edge.target].type)" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </v-card-text>

    <v-card-actions>
      <v-btn append-icon="mdi-swap-horizontal" text="Swap link direction" color="primary" @click="swapLink"></v-btn>
      <v-spacer></v-spacer>
      <v-btn text="Cancel" color="cancel" @click="isActive.value = false"></v-btn>
      <v-btn text="Save" color="primary" @click="saveLink" variant="tonal"></v-btn>
    </v-card-actions>
    <v-alert v-if="error" type="error">Error updating link: {{ error }}</v-alert>
  </v-card>
</template>

<script lang="ts" setup>
import { computed, ref } from "vue";

import { ENTITY_TYPES } from "@/definitions/entityDefinitions";
import { INDICATOR_TYPES } from "@/definitions/indicatorDefinitions";
import { LINK_SUGGESTIONS } from "@/definitions/linkSuggestions";
import { OBSERVABLE_TYPES } from "@/definitions/observableDefinitions";
import { eventBus } from "@/plugins/eventbus";
import * as graphApi from "@/services/graph";
import type { LooseYetiObject } from "@/services/types";

const props = withDefaults(
  defineProps<{
    vertices?: Record<string, LooseYetiObject>;
    edge?: LooseYetiObject;
    /** Vuetify's dialog activator ref; set .value = false to close. */
    isActive?: { value: boolean };
  }>(),
  {
    vertices: () => ({}),
    edge: () => ({}),
    isActive: () => ({ value: false })
  }
);

const emit = defineEmits<{ success: [relationship: LooseYetiObject] }>();

const localEdge = ref<LooseYetiObject>({ ...props.edge });
const error = ref<unknown>(null);

/** Link-type verbs suggested for either direction between the two objects. */
const getLinkTypeSuggestions = computed<string[]>(() => {
  const source = props.vertices[props.edge.source];
  const target = props.vertices[props.edge.target];
  const suggestionsFor = (from: LooseYetiObject, to: LooseYetiObject): string[] =>
    (LINK_SUGGESTIONS[from.type] || LINK_SUGGESTIONS[from.root_type] || [])
      .filter(suggestion => suggestion.targets.includes(to.type))
      .map(suggestion => suggestion.verb);
  return [...new Set(suggestionsFor(source, target).concat(suggestionsFor(target, source)))];
});

async function saveLink() {
  try {
    const updated = await graphApi.patch(props.edge.id, {
      description: localEdge.value.description,
      link_type: localEdge.value.type
    });
    eventBus.emit("displayMessage", { message: "Link updated succesfully!", status: "success" });
    props.isActive.value = false;
    emit("success", updated);
  } catch (e) {
    error.value = e;
  }
}

async function swapLink() {
  try {
    const swapped = await graphApi.swap(props.edge.id);
    props.edge.source = swapped.source;
    props.edge.target = swapped.target;
    localEdge.value = { ...props.edge };
    eventBus.emit("displayMessage", { message: "Link direction swapped succesfully!", status: "success" });
    emit("success", swapped);
  } catch (e) {
    error.value = e;
  }
}

function getIconForType(type: string): string | undefined {
  return (
    ENTITY_TYPES.find(t => t.type === type) ||
    INDICATOR_TYPES.find(t => t.type === type) ||
    OBSERVABLE_TYPES.find(t => t.type === type)
  )?.icon;
}
</script>
