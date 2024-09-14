<template>
  <v-autocomplete
    label="Search for entities or indicators"
    :items="items"
    item-title="name"
    v-model="selectedEntity"
    return-object
    clearable
    @update:search="updateItemsDebounced"
    @update:model-value="emitSelectedObject"
    :hide-details="inline"
    :density="inline ? 'compact' : 'default'"
    :persistent-hint="getHintForTypes.length > 0"
    :hint="getHintForTypes"
  >
    <template v-slot:no-data>
      <v-list-item>
        <v-list-item-title>No entities found...</v-list-item-title>
      </v-list-item>
    </template>
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
            class="mt-2"
            >details</v-btn
          >
        </div>
      </v-list-item>
    </template>
  </v-autocomplete>
</template>

<script lang="ts" setup>
import axios from "axios";

import { ENTITY_TYPES } from "@/definitions/entityDefinitions.js";
import { INDICATOR_TYPES } from "@/definitions/indicatorDefinitions.js";
import { DFIQ_TYPES } from "@/definitions/dfiqDefinitions.js";

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
    },
    inline: {
      type: Boolean,
      default: false
    },
    typeFilter: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      errors: [],
      items: [],
      selectedEntity: null
    };
  },
  mounted() {
    this.loadObjects("");
  },
  methods: {
    async loadObjects(searchQuery: String = "") {
      const params = { query: { name: searchQuery }, count: 20 };
      const entities = (await axios.post("/api/v2/entities/search", params)).data.entities;
      const indicators = (await axios.post("/api/v2/indicators/search", params)).data.indicators;
      const dfiq = (await axios.post("/api/v2/dfiq/search", params)).data.dfiq;
      let items = entities
        .concat(indicators)
        .concat(dfiq)
        .map(item => {
          return {
            id: item.id,
            root_type: item.root_type,
            name: item.name,
            type: item.type
          };
        });
      if (this.typeFilter.length > 0) {
        items = items.filter(item => this.typeFilter.includes(item.type) || this.typeFilter.includes(item.root_type));
      }
      this.items = items;
    },
    updateItemsDebounced: _.debounce(function (searchQuery) {
      this.loadObjects(searchQuery);
    }, 200),
    emitSelectedObject() {
      this.$emit("selected-object", this.selectedEntity);
    },
    getIconForType(type) {
      return (
        ENTITY_TYPES.find(t => t.type === type) ||
        INDICATOR_TYPES.find(t => t.type === type) ||
        DFIQ_TYPES.find(t => t.type === type)
      ).icon;
    }
  },
  computed: {
    getHintForTypes() {
      if (this.typeFilter.length > 0) {
        return "Filtering for " + this.typeFilter.join(", ");
      } else {
        return "Filtering for all object types";
      }
    }
  },
  watch: {
    object: {
      handler: function (val) {
        this.selectedEntity = val;
      },
      deep: true
    }
  }
};
</script>

<style>
.yeti-code textarea {
  font-family: monospace;
}
</style>
