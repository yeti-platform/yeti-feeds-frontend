<template>
  <v-sheet class="mt-2">
    <v-data-table-server
      v-model:page="page"
      :itemsLength="total"
      :items-per-page="perPage"
      :headers="headers"
      density="compact"
      :items="items"
      @update:options="loadOjects"
      :search="searchQuery"
      :item-value="item => item.id"
      hover
      class="fixed-table"
    >
      <template v-slot:item.name="{ item }">
        <span class="short-links">
          <v-tooltip activator="parent" location="top" :open-delay="200">{{ item.name }}</v-tooltip>
          <router-link
            :to="{
              name: this.searchType === 'entities' ? 'EntityDetails' : 'IndicatorDetails',
              params: { id: item.id }
            }"
            >{{ item.name }}</router-link
          >
        </span>
      </template>
      <template v-slot:item.tags="{ item }">
        <v-chip
          v-for="name in Object.keys(item.tags)"
          :color="item.tags[name].fresh ? 'blue ' : 'red'"
          :text="name"
          class="mr-1"
          size="small"
        ></v-chip>
      </template>
      <template v-slot:item.relevant_tags="{ item }">
        <v-chip v-for="name in item.relevant_tags" :text="name" class="mr-1" size="small"></v-chip>
      </template>
      <template v-slot:item.aliases="{ item }">
        <v-chip v-for="value in item.aliases" :text="value" class="mr-1" size="small"></v-chip>
      </template>
      <template v-slot:item.threat_actor_types="{ item }">
        <v-chip v-for="value in item.threat_actor_types" :text="value" class="mr-1" size="small"></v-chip>
      </template>
      <template v-slot:item.kill_chain_phases="{ item }">
        <v-chip v-for="value in item.kill_chain_phases" :text="value" class="mr-1" size="small">
          {{ value.split(":")[1] }}
        </v-chip>
      </template>
      <template v-slot:item.target_systems="{ item }">
        <v-chip v-for="value in item.target_systems" :text="value" class="mr-1" size="small"></v-chip>
      </template>
      <template v-slot:item.created="{ item }">
        {{ moment(item.created).format("YYYY-MM-DD HH:mm:ss") }}
      </template>
      <template v-slot:item.last_seen="{ item }">
        {{ moment(item.last_seen).format("YYYY-MM-DD HH:mm:ss") }}
      </template>
      <template v-slot:item.first_seen="{ item }">
        {{ moment(item.first_seen).format("YYYY-MM-DD HH:mm:ss") }}
      </template>
    </v-data-table-server>
  </v-sheet>
</template>

<script lang="ts" setup>
import axios from "axios";
import { ENTITY_TYPES } from "@/definitions/entityDefinitions.js";

import moment from "moment";
</script>

<script lang="ts">
export default {
  name: "objectList",
  props: {
    searchQuery: {
      type: String,
      default: ""
    },
    searchType: {
      type: String,
      default: "entity"
    },
    searchSubtype: {
      type: String,
      default: ""
    },
    headers: {
      type: Array,
      default: () => [
        { title: "Name", key: "name" },
        { title: "Tags", key: "tags" },
        { title: "Created on", key: "created", width: "200px" }
      ]
    },
    checkable: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      items: [],
      page: 1,
      perPage: 20,
      total: 0
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
        query: this.extractParamsFromSearchQuery(this.searchQuery, "name")
      };
      if (this.searchSubtype != "") {
        params["type"] = this.searchSubtype;
      }
      axios.post(`/api/v2/${this.searchType}/search`, params).then(response => {
        this.items = response.data[this.searchType];
        if (response.data.total != this.total) {
          this.total = response.data.total;
          this.$emit("totalUpdated", this.total);
        }
      });
    }
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

.fixed-table {
  table-layout: fixed;
}
</style>
