<template>
  <v-sheet class="ma-5" width="100%">
    <v-data-table-server
      v-model:page="page"
      :itemsLength="total"
      :items-per-page="perPage"
      :headers="headers"
      density="compact"
      :items="items"
      @update:options="loadOjects"
      :search="searchQueryDebounced"
      :show-select="showSelect"
      :item-value="item => item.id"
      v-model="selectedObservables"
      hover
      class="fixed-table"
    >
      <template v-slot:item.value="{ item }">
        <span class="short-links">
          <v-tooltip activator="parent" location="top" :open-delay="200">{{ item.value }}</v-tooltip>
          <router-link :to="{ name: 'ObservableDetails', params: { id: item.id } }">{{ item.value }}</router-link>
        </span>
      </template>
      <template v-slot:item.tags="{ item }">
        <v-chip
          v-for="name in Object.keys(item.tags)"
          :color="item.tags[name].fresh ? 'blue ' : 'red'"
          :text="name"
          class="mx-1"
          label
          size="small"
        ></v-chip>
      </template>
      <template v-slot:item.context="{ item }">
        <v-chip
          v-for="context in item.context"
          color="green"
          :text="context.source"
          class="mx-1"
          label
          size="small"
        ></v-chip>
      </template>
      <template v-slot:item.created="{ item }"> {{ moment(item.created).format("YYYY-MM-DD HH:mm:ss") }} </template>
    </v-data-table-server>
  </v-sheet>
  <v-navigation-drawer permament location="right" width="400" ref="drawer">
    <v-list-item class="mt-4">
      <v-text-field
        v-model="searchQuery"
        prepend-inner-icon="mdi-magnify"
        label="Search observables"
        density="compact"
        class="mt-2"
      />
    </v-list-item>
    <v-list-item>
      <v-btn prepend-icon="mdi-plus">
          New Observable
          <v-menu activator="parent">
            <v-list>
              <v-dialog v-for="typeDef in observableTypes" :width="editWidth" :fullscreen="fullScreenEdit">
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
    <v-divider></v-divider>
    <v-expansion-panels>
      <v-expansion-panel title="Bulk actions" @group:selected="showSelect = $event.value">
        <v-expansion-panel-text>
          <v-card title="Bulk tag" class="pb-4" rounded="0" variant="flat">
            <v-combobox v-model="bulkTags" chips clearable multiple density="compact">
              <template v-slot:chip="tag"> <v-chip :text="tag.item.value" label /></template>
            </v-combobox>
            <v-btn density="compact" variant="tonal" color="primary" class="me-2" @click="changeTags">Apply</v-btn>
            <small>Will apply {{ bulkTags.length }} tags to {{ selectedObservables.length }} observables</small>
          </v-card>
          <v-card title="Export observables" class="pb-4" rounded="0" variant="flat">
            <v-autocomplete
              label="Select template"
              density="compact"
              :items="exportTemplates"
              item-title="name"
              item-value="id"
              v-model="selectedExportTemplate"
            ></v-autocomplete>
            <v-btn density="compact" variant="tonal" color="primary" class="me-2" @click="downloadExport">Export</v-btn>
            <small>Will export {{ selectedObservables.length || total }} observables</small>
          </v-card>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
  </v-navigation-drawer>
</template>

<script lang="ts" setup>
import axios from "axios";
import moment from "moment";
import { OBSERVABLE_TYPES } from "@/definitions/observableDefinitions.js";
import NewObject from "@/components/NewObject.vue";

import _ from "lodash";
</script>

<script lang="ts">
export default {
  data() {
    return {
      items: [],
      observableTypes: OBSERVABLE_TYPES,
      headers: [
        { title: "Value", key: "value" },
        { title: "Tags", key: "tags", width: "300px" },
        { title: "Context", key: "context", width: "300px" },
        { title: "Created on", key: "created", width: "200px" }
      ],
      page: 1,
      perPage: 25,
      total: 0,
      searchQuery: "",
      searchQueryDebounced: "",
      showSelect: false,
      selectedObservables: [],
      bulkTags: [],
      exportTemplates: [],
      selectedExportTemplate: null,
      fullScreenEdit: false,
      editWidth: "50%",
      newDialogActive: false
    };
  },
  methods: {
    extractParamsFromSearchQuery(searchQuery, defaultKey) {
      const pattern =
        /(?<key>\w+)=(?<keyed_terms>[^\s,]+(?:,[^\s,]+)*)|(?<isolated_term>[^"\s]+)|"(?<quoted_term>[^"]+)"/g;

      let resultObj: Record<string, string | string[]> = {};
      let match;

      while ((match = pattern.exec(searchQuery)) !== null) {
        let isolatedTerm = match.groups.isolated_term;
        let quotedTerm = match.groups.quoted_term;
        let key = match.groups.key;
        let keyedTerms = match.groups.keyed_terms;

        let values;
        if (key) {
          if (key.startsWith("in__") || key.endsWith("__in") || key == "tags" || keyedTerms.includes(",")) {
            values = keyedTerms.split(",").map(term => term.trim());
          } else {
            values = keyedTerms;
          }
          resultObj[key] = values;
        }

        // Logging isolated and quoted terms (optional)
        if (isolatedTerm) {
          resultObj[defaultKey] = isolatedTerm;
        }
        if (quotedTerm) {
          resultObj[defaultKey] = quotedTerm;
        }
      }
      return resultObj;
    },
    loadOjects({ page, itemsPerPage, sortBy }: { page: number; itemsPerPage: number; sortBy: string }) {
      let params = {
        page: page - 1,
        count: itemsPerPage,
        query: this.extractParamsFromSearchQuery(this.searchQuery, "value")
      };
      axios.post("/api/v2/observables/search", params).then(response => {
        this.items = response.data.observables;
        this.total = response.data.total;
      });
    },
    loadExportTemplates() {
      axios
        .post("/api/v2/templates/search", { query: { name: "" } })
        .then(response => {
          this.exportTemplates = response.data.templates;
        })
        .catch(error => {});
    },
    changeTags() {
      var params = {
        tags: this.bulkTags,
        ids: this.selectedObservables,
        strict: false
      };
      axios
        .post(`/api/v2/observables/tag`, params)
        .then(() => {
          this.loadOjects({ page: this.page, itemsPerPage: this.perPage, sortBy: "" });
          this.bulkTags = [];
        })
        .catch(error => {
          return console.log(error);
        });
    },
    downloadExport() {
      var params = {
        template_id: this.selectedExportTemplate,
        observable_ids: [],
        search_query: ""
      };
      if (this.selectedObservables.length) {
        params.observable_ids = this.selectedObservables;
      } else {
        params.search_query = this.searchQuery;
      }

      axios
        .post("/api/v2/templates/render", params)
        .then(response => {
          var fileURL = window.URL.createObjectURL(new Blob([response.data]));
          var fileLink = document.createElement("a");
          var fileName = response.headers["content-disposition"].split("filename=")[1];
          fileLink.href = fileURL;
          fileLink.setAttribute("download", fileName);
          document.body.appendChild(fileLink);

          fileLink.click();
        })
        .catch(error => {
          console.log(error);
        });
    },
    toggleNewObjectFullscreen(fullscreen: boolean) {
      this.fullScreenEdit = !this.fullScreenEdit;
      this.editWidth = fullscreen ? "100%" : "50%";
    }
  },
  mounted() {
    this.loadExportTemplates();
  },
  watch: {
    searchQuery: _.debounce(function () {
      this.searchQueryDebounced = this.searchQuery;
    }, 200)
  }
};
</script>

<style>
.short-links {
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  display: block;
}

.fixed-table table {
  table-layout: fixed;
}
</style>
