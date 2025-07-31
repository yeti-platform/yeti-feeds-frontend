<template>
  <v-container fluid class="mx-10 mt-3">
    <v-row>
      <v-col>
        <v-text-field
          prepend-inner-icon="mdi-magnify"
          v-model="textSearch"
          label="Search for anything..."
          @keyup.enter="loadOjects({ page: page, itemsPerPage: perPage, sortBy: [] })"
        />
        <v-progress-linear v-show="loading" class="mt-3" color="primary" indeterminate></v-progress-linear>
      </v-col>
    </v-row>

    <v-row v-if="searchResults && textSearch">
      <v-col>
        <v-row class="mb-4">
          <v-data-table-server
            :items="searchResults"
            density="compact"
            :headers="[
              { title: 'Name', key: 'name' },
              { title: 'Type', key: 'type' },
              { title: 'Tags', key: 'tags' },
              { title: 'Created on', key: 'created', width: '200px' }
            ]"
            :search="textSearch"
            @update:options="loadObjectDebounced"
            v-model:page="page"
            :items-per-page="perPage"
            :itemsLength="total"
            :loading="loading"
            :sort-by="sortBy"
          >
            <template v-slot:item.name="{ item }">
              <router-link :to="`${typeToEndpointMapping[item.root_type]}/${item.id}`">{{
                item.name || item.value
              }}</router-link>
            </template>

            <template v-slot:item.type="{ item }">
              <v-icon :icon="getIconForType(item.type)" class="mr-2"></v-icon>
              {{ item.type }}
            </template>

            <template v-slot:item.tags="{ item }">
              <v-chip v-for="tag in item.tags" :text="tag.name" class="mr-1" size="small"></v-chip>
            </template>
            <template v-slot:item.created="{ item }">
              {{ moment(item.created).format("YYYY-MM-DD HH:mm:ss") }}
            </template>
          </v-data-table-server>
        </v-row>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import axios, { all } from "axios";
import moment from "moment";
import { OBSERVABLE_TYPES } from "@/definitions/observableDefinitions.js";
import { ENTITY_TYPES } from "@/definitions/entityDefinitions.js";
import { INDICATOR_TYPES } from "@/definitions/indicatorDefinitions.js";
import { DFIQ_TYPES } from "@/definitions/dfiqDefinitions.js";
import EntitySelector from "@/components/EntitySelector.vue";
import router from "@/router";
import _ from "lodash";
</script>

<script lang="ts">
export default {
  name: "ObservableMatch",
  components: {
    EntitySelector
  },
  data() {
    return {
      textSearch: this.$route.query.q,
      searchResults: null,
      loading: false,
      page: 1,
      perPage: 50,
      sortBy: [{ key: "name", order: "asc" }],
      total: 1000,
      headers: {
        type: Array,
        default: () => [
          { title: "Name", key: "name" },
          { title: "Type", key: "type" },
          { title: "Tags", key: "tags" },
          { title: "Created on", key: "created", width: "200px" }
        ]
      },
      typeToEndpointMapping: {
        entity: "entities",
        observable: "observables",
        indicator: "indicators",
        dfiq: "dfiq"
      }
    };
  },
  methods: {
    loadOjects({ page, itemsPerPage, sortBy }) {
      let params = {
        query: { name: this.textSearch },
        filter_aliases: [
          ["value", "text"],
          ["tags", ""],
          ["dfiq_tags", "list"]
        ],
        page: page - 1,
        count: itemsPerPage,
        sorting: sortBy.map(sort => [sort.key, sort.order === "asc"])
      };
      this.loading = true;
      axios
        .post("/api/v2/search/", params)
        .then(response => {
          this.searchResults = response.data.results;
          this.total = response.data.total;
        })
        .catch(error => {
          console.error("Error loading objects:", error);
        })
        .finally(() => {
          this.loading = false;
        });
    },
    loadObjectDebounced: _.debounce(function (params) {
      this.loadOjects(params);
    }, 200),
    getIconForType(type) {
      return (
        ENTITY_TYPES.find(t => t.type === type)?.icon ||
        OBSERVABLE_TYPES.find(t => t.type === type)?.icon ||
        INDICATOR_TYPES.find(t => t.type === type)?.icon ||
        DFIQ_TYPES.find(t => t.type === type)?.icon ||
        "mdi-help-circle"
      );
    }
  },
  mounted() {
    this.textSearch = this.$route.query.q || "";
    this.loadOjects({ page: this.page, itemsPerPage: this.perPage, sortBy: this.sortBy });
  },
  watch: {
    textSearch() {
      router.replace({ query: { q: this.textSearch } });
    }
  }
};
</script>

<style lang="scss"></style>
