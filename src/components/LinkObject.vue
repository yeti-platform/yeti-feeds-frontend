<template>
  <v-card>
    <v-card-title
      >New link for <span class="text-primary">{{ object.name }}</span>
    </v-card-title>
    <v-card-text>
      <v-autocomplete
        label="Search for entities or indicators"
        :items="items"
        item-title="name"
        v-model="linkTarget"
        return-object
        clearable
      >
        <template v-slot:chip="{ props, item }">
          <v-chip
            v-if="item.raw.type"
            v-bind="props"
            :text="item.raw.name"
            :prepend-icon="getIconForType(item.raw.type)"
          ></v-chip>
        </template>

        <template v-slot:item="{ props, item }">
          <v-list-item :prepend-icon="getIconForType(item.raw.type)">
            <div class="d-flex">
              <v-btn variant="text" v-bind="props">{{ item.raw.name }}</v-btn>
              <v-spacer></v-spacer>
              <v-btn
                variant="text"
                :to="{ name: 'EntityDetails', params: { id: item.raw.id } }"
                target="_blank"
                prepend-icon="mdi-open-in-new"
                size="x-small"
                rounded="sm"
                >open</v-btn
              >
            </div>
          </v-list-item>
        </template>
      </v-autocomplete>
      <v-text-field label="Link type" v-model="linkType"></v-text-field>
      <v-textarea label="Link description (supports markdown)" v-model="linkDescription"></v-textarea>
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
  data() {
    return {
      errors: [],
      items: [],
      linkTarget: null,
      linkType: "",
      linkDescription: ""
    };
  },
  mounted() {
    this.loadObjects();
  },
  methods: {
    async loadObjects() {
      const params = { query: { name: "" }, count: 0 };
      let entities = (await axios.post("/api/v2/entities/search", params)).data.entities;
      let indicators = (await axios.post("/api/v2/indicators/search", params)).data.indicators;
      this.items = entities.concat(indicators).map(item => {
        return {
          id: item.id,
          root_type: item.root_type,
          name: item.name,
          type: item.type
        };
      });
    },
    createLink() {
      axios
        .post("/api/v2/graph/add", {
          source: `${this.object.root_type}/${this.object.id}`,
          target: `${this.linkTarget.root_type}/${this.linkTarget.id}`,
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
              id: this.object.id,
              root_type: this.object.root_type,
              type: this.object.type,
              name: this.object.name
            },
            target: {
              id: this.linkTarget.id,
              root_type: this.linkTarget.root_type,
              type: this.linkTarget.type,
              name: this.linkTarget.name
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
    getIconForType(type) {
      return (ENTITY_TYPES.find(t => t.type === type) || INDICATOR_TYPES.find(t => t.type === type)).icon;
    }
  }
};
</script>

<style>
.yeti-code textarea {
  font-family: monospace;
}
</style>
