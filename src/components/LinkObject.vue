<template>
  <v-card>
    <v-card-title
      >New link for <span class="text-primary">{{ object.name }}</span>
    </v-card-title>
    <v-card-text>
      <v-menu v-model="newEntityMenu">
        <template v-slot:activator="{ props }">
          <v-btn prepend-icon="mdi-plus" v-bind="props" size="small" variant="outlined" class="me-2">
            New Entity
          </v-btn>
        </template>
        <v-list>
          <v-dialog
            v-for="typeDef in entityTypes"
            :width="editWidth"
            :fullscreen="fullScreenEdit"
            v-bind:key="typeDef.type"
          >
            <template v-slot:activator="{ props }">
              <v-list-item v-bind="props" :prepend-icon="typeDef.icon"> {{ typeDef.name }} </v-list-item>
            </template>
            <template v-slot:default="{ isActive }">
              <new-object
                :object-type="typeDef.type"
                @close="isActive.value = false"
                @toggle-fullscreen="toggleNewObjectFullscreen"
                @success="assignLinkTarget"
                :redirect="false"
              />
            </template>
          </v-dialog>
        </v-list>
      </v-menu>

      <v-menu v-model="newIndicatorMenu">
        <template v-slot:activator="{ props }">
          <v-btn prepend-icon="mdi-plus" v-bind="props" size="small" variant="outlined" class="me-2">
            New Indicator
          </v-btn>
        </template>
        <v-list>
          <v-dialog
            v-for="typeDef in indicatorTypes"
            :width="editWidth"
            :fullscreen="fullScreenEdit"
            v-bind:key="typeDef.type"
          >
            <template v-slot:activator="{ props }">
              <v-list-item v-bind="props" :prepend-icon="typeDef.icon"> {{ typeDef.name }} </v-list-item>
            </template>
            <template v-slot:default="{ isActive }">
              <new-object
                :object-type="typeDef.type"
                @close="isActive.value = false"
                @toggle-fullscreen="toggleNewObjectFullscreen"
                @success="assignLinkTarget"
                :redirect="false"
              />
            </template>
          </v-dialog>
        </v-list>
      </v-menu>
      <v-checkbox
        hide-details
        color="primary"
        :label="`Filter on suggested types (${getSuggestedTypes.length})`"
        v-model="filterRecommended"
        density="compact"
        :disabled="getSuggestedTypes.length === 0"
      ></v-checkbox>
      <entity-selector
        :object="linkTarget"
        @selected-object="targetSelected"
        :type-filter="filterRecommended ? getSuggestedTypes : []"
      />

      <v-divider class="mt-4 mb-6" />
      <v-combobox
        @update:modelValue="checkLinkDirection"
        :label="getLinkTypeLabel"
        v-model="linkType"
        :items="getLinkTypeSuggestions"
      ></v-combobox>

      <v-textarea label="Link description (supports markdown)" v-model="linkDescription"></v-textarea>
      <v-btn variant="outlined" @click="linkDirectionOutgoing = !linkDirectionOutgoing">Swap direction</v-btn>
      <br />
      <br />
      <div class="d-flex justify-center">
        <table>
          <tr>
            <td><v-chip :text="object.name || object.value" :prepend-icon="getIconForType(object.type)" /></td>
            <td>{{ linkDirectionOutgoing ? "→" : "←" }}</td>
            <td>
              <code>{{ linkType || "?" }}</code>
            </td>
            <td>{{ linkDirectionOutgoing ? "→" : "←" }}</td>
            <td>
              <v-chip v-if="linkTarget" :text="linkTarget.name" :prepend-icon="getIconForType(linkTarget.type)" />
              <span v-else>Select target</span>
            </td>
          </tr>
        </table>
      </div>
    </v-card-text>

    <v-card-actions>
      <v-spacer></v-spacer>
      <v-btn text="Cancel" color="cancel" @click="isActive.value = false"></v-btn>
      <v-btn text="Save" :disabled="linkTarget === null" @click="createLink"></v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";

import EntitySelector from "@/components/EntitySelector.vue";
import NewObject from "@/components/NewObject.vue";
import { ENTITY_TYPES } from "@/definitions/entityDefinitions";
import { INDICATOR_TYPES } from "@/definitions/indicatorDefinitions";
import { LINK_SUGGESTIONS } from "@/definitions/linkSuggestions";
import type { LinkSuggestion } from "@/definitions/types";
import { getIconForType } from "@/definitions/typeIcons";
import { eventBus } from "@/plugins/eventbus";
import * as graphApi from "@/services/graph";
import type { LooseYetiObject } from "@/services/types";

const props = defineProps<{
  object: LooseYetiObject;
  isActive: { value: boolean };
}>();

const entityTypes = ENTITY_TYPES;
const indicatorTypes = INDICATOR_TYPES;

const linkTarget = ref<LooseYetiObject | null>(null);
const linkType = ref("");
const linkDescription = ref("");
const autocompleteLoading = ref(false);
const filterRecommended = ref(true);
const linkDirectionOutgoing = ref(true);
const fullScreenEdit = ref(false);
const editWidth = ref("75%");
const newEntityMenu = ref(false);
const newIndicatorMenu = ref(false);

/**
 * The link suggestions for an object, looked up by its type and falling back to
 * its root type. An object with neither returns none — the old code did
 * `(LINK_SUGGESTIONS[a] || LINK_SUGGESTIONS[b]).filter(...)` and threw a
 * TypeError when both were missing.
 */
function suggestionsFor(object: LooseYetiObject | null): LinkSuggestion[] {
  if (!object) {
    return [];
  }
  return LINK_SUGGESTIONS[object.type] ?? LINK_SUGGESTIONS[object.root_type] ?? [];
}

/** Link verbs that go from `object` to `linkTarget`. */
const getOutgoingLinkTypeSuggestions = computed(() =>
  suggestionsFor(props.object)
    .filter(
      suggestion =>
        suggestion.targets.includes(linkTarget.value?.type) ||
        suggestion.targets.includes(linkTarget.value?.root_type)
    )
    .map(suggestion => suggestion.verb)
);

/** Link verbs that go from `linkTarget` back to `object`. */
const getIncomingLinkTypeSuggestions = computed(() =>
  suggestionsFor(linkTarget.value)
    .filter(
      suggestion =>
        suggestion.targets.includes(props.object?.type) ||
        suggestion.targets.includes(props.object?.root_type)
    )
    .map(suggestion => suggestion.verb)
);

const getLinkTypeSuggestions = computed(() => {
  if (!props.object || !linkTarget.value) {
    return [];
  }
  return [...new Set(getOutgoingLinkTypeSuggestions.value.concat(getIncomingLinkTypeSuggestions.value))];
});

/** Object types it makes sense to link this object to, in either direction. */
const getSuggestedTypes = computed(() => {
  const outgoing = suggestionsFor(props.object).flatMap(entry => entry.targets);
  const incoming = Object.keys(LINK_SUGGESTIONS).filter(key =>
    LINK_SUGGESTIONS[key].some(
      entry => entry.targets.includes(props.object?.type) || entry.targets.includes(props.object?.root_type)
    )
  );
  return [...new Set([...outgoing, ...incoming])];
});

const getLinkTypeLabel = computed(() => {
  if (getLinkTypeSuggestions.value.length === 0 || linkTarget.value === null) {
    return "Link type";
  }
  return `Link type (suggestions for ${props.object.type} \u2192 ${linkTarget.value.type} links)`;
});

function checkLinkDirection(type: string) {
  if (getOutgoingLinkTypeSuggestions.value.includes(type)) {
    linkDirectionOutgoing.value = true;
  } else if (getIncomingLinkTypeSuggestions.value.includes(type)) {
    linkDirectionOutgoing.value = false;
  } else {
    linkDirectionOutgoing.value = true;
  }
}

function targetSelected(target: LooseYetiObject | null) {
  linkTarget.value = target;
  linkType.value = getLinkTypeSuggestions.value.length ? getLinkTypeSuggestions.value[0] : "";
  checkLinkDirection(linkType.value);
}

function assignLinkTarget(target: LooseYetiObject) {
  linkTarget.value = target;
  newEntityMenu.value = false;
  newIndicatorMenu.value = false;
}

function toggleNewObjectFullscreen(fullscreen: boolean) {
  fullScreenEdit.value = !fullScreenEdit.value;
  editWidth.value = fullscreen ? "100%" : "75%";
}

async function createLink() {
  if (!linkTarget.value) {
    return;
  }
  const source = linkDirectionOutgoing.value ? props.object : linkTarget.value;
  const target = linkDirectionOutgoing.value ? linkTarget.value : props.object;

  const created = (await graphApi.add({
    source: `${source.root_type}/${source.id}`,
    target: `${target.root_type}/${target.id}`,
    link_type: linkType.value,
    description: linkDescription.value
  } as Parameters<typeof graphApi.add>[0])) as LooseYetiObject;

  props.isActive.value = false;
  eventBus.emit("displayMessage", { message: "Link succesfully created", status: "success" });

  eventBus.emit("linkCreated", {
    source: { id: source.id, root_type: source.root_type, type: source.type, name: source.name },
    target: { id: target.id, root_type: target.root_type, type: target.type, name: target.name },
    link_type: linkType.value,
    description: linkDescription.value,
    id: created?.id
  });
}
</script>

<style>
.yeti-code textarea {
  font-family: monospace;
}
</style>
