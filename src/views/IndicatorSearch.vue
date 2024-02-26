<template>
  <v-sheet class="ma-5" width="100%">
    <v-tabs v-model="activeTab" color="primary">
      <v-tab :value="typeDef.type" v-for="typeDef in displayedindicatorTypes" @click="autoTab = false">
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
          :filter-aliases="getAliasesForType(typeDef.type)"
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
        hint="e.g. created>2024-01-01, supported_os=windows"
      />
    </v-list-item>
    <v-list-item>
      <v-btn prepend-icon="mdi-plus">
        New Indicator
        <v-menu activator="parent">
          <v-list>
            <v-dialog v-for="typeDef in indicatorTypes" :width="editWidth" :fullscreen="fullScreenEdit">
              <template v-slot:activator="{ props }">
                <v-list-item v-bind="props" :prepend-icon="typeDef.icon"> {{ typeDef.name }} </v-list-item>
              </template>
              <template v-slot:default="{ isActive }">
                <new-object
                  :object-type="typeDef.type"
                  @close="isActive.value = false"
                  @toggle-fullscreen="toggleNewObjectFullscreen"
                />
              </template>
            </v-dialog>
          </v-list>
        </v-menu>
      </v-btn>
    </v-list-item>
  </v-navigation-drawer>
</template>

<script lang="ts" setup>
import { INDICATOR_TYPES } from "@/definitions/indicatorDefinitions.js";
import ObjectList from "@/components/ObjectList.vue";
import NewObject from "@/components/NewObject.vue";

import _ from "lodash";
</script>

<script lang="ts">
export default {
  name: "indicatorSearch",
  components: {
    ObjectList,
    NewObject
  },
  data() {
    return {
      searchQuery: "",
      searchQueryDebounced: "",
      indicatorTypes: INDICATOR_TYPES,
      indicatorCount: INDICATOR_TYPES.reduce((acc, cur) => {
        acc[cur.type] = 0;
        return acc;
      }, {}),
      activeTab: "",
      autoTab: true,
      fullScreenEdit: false,
      editWidth: "50%",
      newDialogActive: false
    };
  },
  methods: {
    countIndicators(type, count) {
      this.indicatorCount[type] = count;
      if (!this.$route.hash && this.autoTab) {
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
          key: field.field,
          width: field.width
        };
      });
    },
    getAliasesForType(typeName) {
      let typeDef = this.indicatorTypes.find(type => type.type === typeName);
      return typeDef.filterAliases.map(alias => {
        return [alias, typeDef.fields.find(field => field.field === alias).type];
      });
    },
    toggleNewObjectFullscreen(fullscreen: boolean) {
      this.fullScreenEdit = !this.fullScreenEdit;
      this.editWidth = fullscreen ? "100%" : "50%";
    }
  },
  computed: {
    displayedindicatorTypes() {
      return this.indicatorTypes.filter(type => this.indicatorCount[type.type] > 0);
    }
  },
  watch: {
    searchQuery: _.debounce(function () {
      this.searchQueryDebounced = this.searchQuery;
    }, 200)
  }
};
</script>
