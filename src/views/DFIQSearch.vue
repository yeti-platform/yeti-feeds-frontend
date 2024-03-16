<template>
  <v-sheet class="ma-5" width="100%">
    <v-tabs v-model="activeTab" color="primary">
      <v-tab :value="typeDef.type" v-for="typeDef in displayedDFIQTypes" @click="autoTab = false">
        <v-icon size="x-large" start>{{ typeDef.icon }}</v-icon
        >{{ typeDef.name }} <v-chip class="ml-3" density="comfortable">{{ DFIQCount[typeDef.type] }}</v-chip>
      </v-tab>
    </v-tabs>
    <v-window v-model="activeTab">
      <v-window-item v-for="typeDef in DFIQTypes" :value="typeDef.type" v-bind:key="typeDef.type" eager>
        <object-list
          searchType="dfiq"
          :search-subtype="typeDef.type"
          :search-query="searchQueryDebounced"
          :headers="getFieldForType(typeDef.type)"
          :filter-aliases="getAliasesForType(typeDef.type)"
          @totalUpdated="countDFIQ(typeDef.type, $event)"
        />
      </v-window-item>
    </v-window>
  </v-sheet>

  <v-navigation-drawer permament location="right" width="400" ref="drawer">
    <v-list-item class="mt-4">
      <v-text-field
        v-model="searchQuery"
        prepend-inner-icon="mdi-magnify"
        label="Search DFIQ"
        density="compact"
        class="mt-2"
        hint="s1007, dfiq_tags=malware, created>2024-01-01"
      />
    </v-list-item>
    <v-list-item>
      <v-btn prepend-icon="mdi-plus">
        New DFIQ object
        <v-menu activator="parent">
          <v-list>
            <v-dialog v-for="typeDef in DFIQTypes" :width="editWidth" :fullscreen="fullScreenEdit">
              <template v-slot:activator="{ props }">
                <v-list-item v-bind="props" :prepend-icon="typeDef.icon"> {{ typeDef.name }} </v-list-item>
              </template>
              <template v-slot:default="{ isActive }">
                <new-DFIQ-object
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
import { DFIQ_TYPES } from "@/definitions/dfiqDefinitions.js";
import ObjectList from "@/components/ObjectList.vue";
import NewDFIQObject from "@/components/NewDFIQObject.vue";

import _ from "lodash";
</script>

<script lang="ts">
export default {
  name: "DFIQSearch",
  components: {
    ObjectList,
    NewDFIQObject
  },
  data() {
    return {
      searchQuery: "",
      searchQueryDebounced: "",
      DFIQTypes: DFIQ_TYPES,
      DFIQCount: DFIQ_TYPES.reduce((acc, cur) => {
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
    countDFIQ(type, count) {
      this.DFIQCount[type] = count;
      if (!this.$route.hash && this.autoTab) {
        this.navigateToFirstPopulatedTab();
      }
    },
    navigateToFirstPopulatedTab() {
      for (const typeDef of this.DFIQTypes) {
        if (this.DFIQCount[typeDef.type] > 0) {
          this.activeTab = typeDef.type;
          break;
        }
      }
    },
    getFieldForType(typeName) {
      let fields = this.DFIQTypes.find(type => type.type === typeName).fields.filter(field => field.displayList);
      return fields.map(field => {
        return {
          title: field.label,
          key: field.field,
          width: field.width
        };
      });
    },
    getAliasesForType(typeName) {
      let typeDef = this.DFIQTypes.find(type => type.type === typeName);
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
    displayedDFIQTypes() {
      return this.DFIQTypes.filter(type => this.DFIQCount[type.type] > 0);
    }
  },
  watch: {
    searchQuery: _.debounce(function () {
      this.searchQueryDebounced = this.searchQuery;
    }, 200)
  }
};
</script>
