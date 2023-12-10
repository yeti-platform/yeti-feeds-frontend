<template>
  <v-sheet class="ma-5">
    <v-tabs v-model="activeTab" color="primary">
      <v-tab :value="typeDef.type" v-for="typeDef in displayedindicatorTypes">
        <v-icon size="x-large" start>{{ typeDef.icon }}</v-icon
        >{{ typeDef.name }} <v-chip class="ml-3" density="comfortable">{{ indicatorCount[typeDef.type] }}</v-chip>
      </v-tab>
    </v-tabs>
    <v-window v-model="activeTab">
      <v-window-item v-for="typeDef in indicatorTypes" :value="typeDef.type" v-bind:key="typeDef.type" eager>
        <object-list
          searchType="indicators"
          :search-subtype="typeDef.type"
          :search-query="searchQueryDebounced"
          :headers="getFieldForType(typeDef.type)"
          @totalUpdated="countIndicators(typeDef.type, $event)"
        />
      </v-window-item>
    </v-window>
  </v-sheet>

  <v-navigation-drawer permament location="right" width="400" ref="drawer">
    <v-list-item class="mt-4">
      <v-text-field
        v-model="searchQuery"
        prepend-inner-icon="mdi-magnify"
        label="Search indicators"
        density="compact"
        class="mt-2"
      />
    </v-list-item>
  </v-navigation-drawer>
</template>

<script lang="ts" setup>
import { INDICATOR_TYPES } from "@/definitions/indicatorDefinitions.js";
import ObjectList from "@/components/ObjectList.vue";
import _ from "lodash";
</script>

<script lang="ts">
export default {
  name: "indicatorSearch",
  components: {
    ObjectList
  },
  data() {
    return {
      items: [],
      headers: [
        { title: "Name", key: "name" },
        { title: "Tags", key: "tags" },
        { title: "Created on", key: "created" }
      ],
      page: 1,
      perPage: 20,
      total: 0,
      searchQuery: "",
      searchQueryDebounced: "",
      indicatorTypes: INDICATOR_TYPES,
      indicatorCount: INDICATOR_TYPES.reduce((acc, cur) => {
        acc[cur.type] = 0;
        return acc;
      }, {}),
      activeTab: ""
    };
  },
  methods: {
    countIndicators(type, count) {
      this.indicatorCount[type] = count;
      if (!this.$route.hash) {
        this.navigateToFirstPopulatedTab();
      }
    },
    navigateToFirstPopulatedTab() {
      for (const typeDef of this.indicatorTypes) {
        if (this.indicatorCount[typeDef.type] > 0) {
          this.activeTab = typeDef.type;
          break;
        }
      }
    },
    getFieldForType(typeName) {
      let fields = this.indicatorTypes.find(type => type.type === typeName).fields.filter(field => field.displayList);
      return fields.map(field => {
        return {
          title: field.label,
          key: field.field
        };
      });
    }
  },
  computed: {
    displayedindicatorTypes() {
      return this.indicatorTypes.filter(type => this.indicatorCount[type.type] > 0);
    }
  },
  watch: {
    searchQuery: _.debounce(function() {
      this.searchQueryDebounced = this.searchQuery;
    }, 200)
  }
};
</script>
