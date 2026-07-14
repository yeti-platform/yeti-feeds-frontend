<template>
  <v-sheet class="ma-5" width="100%">
    <v-tabs v-model="activeTab" color="primary">
      <v-tab
        :value="typeDef.type"
        v-for="typeDef in displayedIndicatorTypes"
        @click="autoTab = false"
        :href="'#' + typeDef.type"
      >
        <v-icon size="x-large" start>{{ typeDef.icon }}</v-icon
        >{{ typeDef.name }} <v-chip class="ml-3" density="comfortable">{{ indicatorCount[typeDef.type] }}</v-chip>
      </v-tab>
    </v-tabs>
    <v-window v-model="activeTab">
      <v-window-item v-for="typeDef in indicatorTypes" :value="typeDef.type" v-bind:key="typeDef.type" eager>
        <object-list
          searchType="indicators"
          :search-subtype="typeDef.type"
          :search-query="searchQuery"
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
        v-model="searchQueryLocal"
        prepend-inner-icon="mdi-magnify"
        label="Search indicators ↵"
        density="compact"
        class="mt-2"
        hint="e.g. created>2024-01-01, supported_os=windows"
        @click:prepend-inner="() => (searchQuery = searchQueryLocal)"
        @keyup.enter="() => (searchQuery = searchQueryLocal)"
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

<script setup lang="ts">
import NewObject from "@/components/NewObject.vue";
import ObjectList from "@/components/ObjectList.vue";
import { useTypeTabs } from "@/composables/useTypeTabs";
import { INDICATOR_TYPES } from "@/definitions/indicatorDefinitions";
import { ref } from "vue";

const indicatorTypes = INDICATOR_TYPES;

const searchQuery = ref("");
const searchQueryLocal = ref("");

const {
  counts: indicatorCount,
  activeTab,
  autoTab,
  fullScreenEdit,
  editWidth,
  displayedTypes: displayedIndicatorTypes,
  countObjects: countIndicators,
  getFieldForType,
  getAliasesForType,
  toggleNewObjectFullscreen
} = useTypeTabs(indicatorTypes);
</script>
