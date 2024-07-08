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
    <v-alert v-if="errors.length > 0" type="error">
      Error saving {{ typeDefinition.name }}:
      <ul>
        <li v-for="error in errors">
          <strong>{{ error.field }}</strong
          >: {{ error.message }}
        </li>
      </ul>
    </v-alert>
  </v-card>
</template>

<script lang="ts" setup>
import axios from "axios";

import { ENTITY_TYPES } from "@/definitions/entityDefinitions.js";
import { INDICATOR_TYPES } from "@/definitions/indicatorDefinitions.js";
import { OBSERVABLE_TYPES } from "@/definitions/observableDefinitions.js";
import { DFIQ_TYPES } from "@/definitions/dfiqDefinitions.js";

import { LINK_SUGGESTIONS } from "@/definitions/linkSuggestions.js";
import EntitySelector from "@/components/EntitySelector.vue";
import NewObject from "@/components/NewObject.vue";

import _ from "lodash";
</script>

<script lang="ts">
export default {
  props: {
    object: {
      type: Object,
      default: () => {}
    },
    isActive: {
      type: Object,
      default: () => {}
    }
  },
  components: {
    EntitySelector,
    NewObject
  },
  data() {
    return {
      errors: [],
      items: [],
      linkTarget: null,
      linkType: "",
      linkDescription: "",
      autocompleteLoading: false,
      filterRecommended: true,
      linkDirectionOutgoing: true,
      entityTypes: ENTITY_TYPES,
      indicatorTypes: INDICATOR_TYPES,
      fullScreenEdit: false,
      editWidth: "50%",
      newEntityMenu: false,
      newIndicatorMenu: false
    };
  },
  methods: {
    createLink() {
      let source = this.linkDirectionOutgoing ? this.object : this.linkTarget;
      let target = this.linkDirectionOutgoing ? this.linkTarget : this.object;

      axios
        .post("/api/v2/graph/add", {
          source: `${source.root_type}/${source.id}`,
          target: `${target.root_type}/${target.id}`,
          link_type: this.linkType,
          description: this.linkDescription
        })
        .then(response => {
          this.isActive.value = false;
          this.$eventBus.emit("displayMessage", {
            message: `Link succesfully created`,
            status: "success"
          });
          const linkData = {
            source: {
              id: source.id,
              root_type: source.root_type,
              type: source.type,
              name: source.name
            },
            target: {
              id: target.id,
              root_type: target.root_type,
              type: target.type,
              name: target.name
            },
            link_type: this.linkType,
            description: this.linkDescription,
            id: response.data.id
          };
          this.$eventBus.emit("linkCreated", linkData);
        })
        .catch(error => {
          this.errors = error.response.data.errors;
        });
    },
    targetSelected(target) {
      this.linkTarget = target;
      this.linkType = "";
    },
    checkLinkDirection(linkType) {
      if (this.getOutgoingLinkTypeSuggestions.includes(linkType)) {
        this.linkDirectionOutgoing = true;
      } else if (this.getIncomingLinkTypeSuggestions.includes(linkType)) {
        this.linkDirectionOutgoing = false;
      } else {
        this.linkDirectionOutgoing = true;
      }
    },
    getIconForType(type) {
      return (
        ENTITY_TYPES.find(t => t.type === type) ||
        INDICATOR_TYPES.find(t => t.type === type) ||
        OBSERVABLE_TYPES.find(t => t.type === type) ||
        DFIQ_TYPES.find(t => t.type === type)
      ).icon;
    },
    toggleNewObjectFullscreen(fullscreen: boolean) {
      this.fullScreenEdit = !this.fullScreenEdit;
      this.editWidth = fullscreen ? "100%" : "50%";
    },
    assignLinkTarget(target) {
      this.linkTarget = target;
      this.newEntityMenu = false;
      this.newIndicatorMenu = false;
    }
  },
  computed: {
    getSuggestedTypes() {
      let outgoingTypes = [
        ...new Set(
          (LINK_SUGGESTIONS[this.object.type] || LINK_SUGGESTIONS[this.object.root_type]).flatMap(
            entry => entry.targets
          )
        )
      ];
      let incomingTypes = [
        ...new Set(
          Object.keys(LINK_SUGGESTIONS).filter(key =>
            LINK_SUGGESTIONS[key].some(
              entry => entry.targets.includes(this.object.type) || entry.targets.includes(this.object.root_type)
            )
          )
        )
      ];
      return [...new Set(outgoingTypes.concat(incomingTypes))];
    },
    getOutgoingLinkTypeSuggestions() {
      return (LINK_SUGGESTIONS[this.object.type] || LINK_SUGGESTIONS[this.object.root_type])
        .filter(
          suggestion =>
            suggestion.targets.includes(this.linkTarget.type) || suggestion.targets.includes(this.linkTarget.root_type)
        )
        .map(suggestion => suggestion.verb);
    },
    getIncomingLinkTypeSuggestions() {
      return (LINK_SUGGESTIONS[this.linkTarget.type] || LINK_SUGGESTIONS[this.linkTarget.root_type])
        .filter(
          suggestion =>
            suggestion.targets.includes(this.object.type) || suggestion.targets.includes(this.object.root_type)
        )
        .map(suggestion => suggestion.verb);
    },
    getLinkTypeSuggestions() {
      if (!this.object || !this.linkTarget) {
        return [];
      }
      return [...new Set(this.getOutgoingLinkTypeSuggestions.concat(this.getIncomingLinkTypeSuggestions))];
    },
    getLinkTypeLabel() {
      if (this.getLinkTypeSuggestions.length === 0 || this.linkTarget === null) {
        return "Link type";
      } else {
        return `Link type (suggestions for ${this.object.type} → ${this.linkTarget.type} links)`;
      }
    }
  }
};
</script>

<style>
.yeti-code textarea {
  font-family: monospace;
}
</style>
