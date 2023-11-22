<template>
  <v-data-table-server
    v-model:page="page"
    :itemsLength="total"
    :items-per-page="perPage"
    :headers="headers"
    density="compact"
    :items="items"
    @update:options="loadOjects"
    :search="searchQuery"
    :show-select="showSelect"
    :item-value="item => item.id"
    v-model="selectedObservables"
    hover
    class="ma-5"
  >
    <template v-slot:item.name="{ item }">
      <router-link
        :to="{ name: 'EntityDetails', params: { id: item.id } }"
        class="text-blue"
        style="text-decoration:none"
        >{{ item.name }}</router-link
      >
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
  </v-data-table-server>
  <v-navigation-drawer permament location="right" width="400" ref="drawer">
    <v-list-item class="mt-4">
      <v-text-field
        v-model="searchQuery"
        prepend-inner-icon="mdi-magnify"
        label="Search entities"
        variant="outlined"
        density="compact"
        class="mt-2"
      />
    </v-list-item>
  </v-navigation-drawer>
</template>

<script lang="ts" setup>
import axios from "axios";
</script>

<script lang="ts">
export default {
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
      showSelect: false,
      selectedObservables: [],
      bulkTags: [],
      exportTemplates: [],
      selectedExportTemplate: null
    };
  },
  methods: {
    extractParamsFromSearchQuery(searchQuery, defaultKey) {
      const pattern = /(?<key>\w+)=(?<keyed_terms>[^\s,]+(?:,[^\s,]+)*)|(?<isolated_term>[^"\s]+)|"(?<quoted_term>[^"]+)"/g;

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
        query: this.extractParamsFromSearchQuery(this.searchQuery, "name")
      };
      axios.post("http://localhost:3000/api/v2/entities/search", params).then(response => {
        this.items = response.data.entities;
        this.total = response.data.total;
      });
    }
  },
  mounted() {}
};
</script>
