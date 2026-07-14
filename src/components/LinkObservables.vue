<template>
  <v-card>
    <v-card-title
      >Link observables to <span class="text-primary">{{ linkTarget.name || linkTarget.value }}</span>
    </v-card-title>
    <v-card-text>
      <v-textarea label="Add one observable per line" v-model="observables" hide-details></v-textarea>
      <div class="text-subtitle-2 mt-2">Observable data</div>

      <v-row no-gutters class="mt-2">
        <v-col cols="4">
          <v-select
            class="me-3"
            v-model="addType"
            :items="observableTypes"
            density="compact"
            placeholder="Force type"
            variant="outlined"
            hide-details
          ></v-select>
        </v-col>
        <v-col>
          <v-combobox
            density="compact"
            chips
            multiple
            v-model="optionalTags"
            hide-details
            placeholder="Optional tags"
            :delimiters="[',', ' ', ';']"
          ></v-combobox>
        </v-col>
      </v-row>

      <div class="text-subtitle-2 mt-2">Link metadata</div>

      <v-row no-gutters class="mt-2">
        <v-col cols="4">
          <v-text-field
            class="me-3"
            v-model="linkType"
            density="compact"
            placeholder="Link type"
            variant="outlined"
            hide-details
          ></v-text-field>
        </v-col>
        <v-col>
          <v-text-field
            density="compact"
            v-model="linkDescription"
            hide-details
            placeholder="Link description"
          ></v-text-field>
        </v-col>
      </v-row>
      <v-row no-gutters class="mt-5">
        <v-col>
          <v-btn size="small" text @click="linkDirectionOutgoing = !linkDirectionOutgoing"> Swap direction </v-btn>
        </v-col>
        <v-col
          >Observables {{ linkDirectionOutgoing ? "→" : "←" }}
          <v-chip
            v-if="linkTarget"
            :text="linkTarget.name || linkTarget.value"
            :prepend-icon="getIconForType(linkTarget.type)"
        /></v-col>
      </v-row>

      <v-divider v-if="addedObservables.length > 0" class="my-5"></v-divider>
      <div v-if="addedObservables.length > 0">
        <p class="mt-3 mb-1 text-h6">Succesfully linked:</p>
        <v-data-table :items="addedObservables" :headers="observableTableHeaders" density="compact">
          <template v-slot:item.tags="{ item }">
            <v-chip
              v-for="tag in item.tags"
              :color="tag.fresh ? 'blue ' : 'grey'"
              :text="tag.name"
              class="mr-1"
              size="small"
            ></v-chip>
          </template>
        </v-data-table>
      </div>
      <div v-if="failedObservables.length > 0">
        <p class="mt-3 mb-1 text-h6">Failed to add:</p>
        {{ failedObservables }}
      </div>
    </v-card-text>

    <v-card-actions>
      <v-spacer></v-spacer>
      <v-btn text="Cancel" color="cancel" @click="isActive.value = false"></v-btn>
      <v-btn text="Link observables" @click="linkObservables"></v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";

import EntitySelector from "@/components/EntitySelector.vue";
import { OBSERVABLE_TYPES } from "@/definitions/observableDefinitions";
import { getIconForType } from "@/definitions/typeIcons";
import { eventBus } from "@/plugins/eventbus";
import * as graphApi from "@/services/graph";
import * as observablesApi from "@/services/observables";
import type { LooseYetiObject } from "@/services/types";

const props = defineProps<{
  linkTarget: LooseYetiObject;
  isActive: { value: boolean };
}>();

const addType = ref("guess");
const observables = ref("");
const optionalTags = ref<string[]>([]);
const addedObservables = ref<LooseYetiObject[]>([]);
const failedObservables = ref<string[]>([]);
const linkType = ref("manual");
const linkDescription = ref("Linked manually from the Web UI");
const linkDirectionOutgoing = ref(true);

const observableTableHeaders = [
  { title: "Value", key: "value" },
  { title: "Detected type", key: "type" },
  { title: "Tags", key: "tags" }
];

const observableTypes = computed(() => [
  { value: "guess", title: "Guess observable type" },
  ...OBSERVABLE_TYPES.map(type => ({ value: type.type, title: type.name }))
]);

/** Links one already-created observable to the target object. */
function linkKnownObservable(observable: LooseYetiObject, linkTarget: LooseYetiObject) {
  const observableId = `${observable.root_type}/${observable.id}`;
  const targetId = `${linkTarget.root_type}/${linkTarget.id}`;

  return graphApi.add({
    source: linkDirectionOutgoing.value ? observableId : targetId,
    target: linkDirectionOutgoing.value ? targetId : observableId,
    link_type: linkType.value,
    description: linkDescription.value
  } as Parameters<typeof graphApi.add>[0]);
}

async function linkObservables() {
  const requested = observables.value
    .split("\n")
    .map(line => line.trim())
    .filter(Boolean)
    .map(value => ({ value, type: addType.value, tags: optionalTags.value }));

  const response = await observablesApi.bulkAdd({
    observables: requested
  } as Parameters<typeof observablesApi.bulkAdd>[0]);

  let message = `${response.added.length} observables added`;
  if (response.failed.length > 0) {
    message += `, ${response.failed.length} failed`;
  }
  eventBus.emit("displayMessage", { status: "success", message });

  addedObservables.value = response.added as LooseYetiObject[];
  failedObservables.value = response.failed;
  addType.value = "guess";
  optionalTags.value = [];

  await Promise.all(
    addedObservables.value.map(observable => linkKnownObservable(observable, props.linkTarget))
  );
}
</script>

<style>
.yeti-code textarea {
  font-family: monospace;
}
</style>
