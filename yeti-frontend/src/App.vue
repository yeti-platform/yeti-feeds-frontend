<template>
  <v-app id="inspire">
    <v-layout class="rounded rounded-md">
      <v-app-bar :elevation="2" title="Yeti (appbar)">
        <template v-slot:append>
          <v-btn>Observables</v-btn>
          <v-btn>Entities</v-btn>
          <v-btn>indicators</v-btn>
          <v-divider vertical></v-divider>
          <v-btn icon>
            <v-icon>mdi-magnify</v-icon>
          </v-btn>
          <v-btn icon>
            <v-icon>mdi-heart</v-icon>
          </v-btn>
          <v-btn icon>
            <v-icon>mdi-dots-vertical</v-icon>
          </v-btn>
        </template>
      </v-app-bar>

      <v-main
        class="d-flex align-center justify-center"
        style="min-height: 300px"
      >
        <v-data-table-server
          :itemsLength="total"
          :items-per-page="perPage"
          :headers="headers"
          density="compact"
          :items="items"
          @update:options="loadOjects"
        ></v-data-table-server>
      </v-main>
    </v-layout>
  </v-app>
</template>

<script lang="ts" setup>
import { ref } from "vue";
import axios from "axios";

const drawer = ref(null);
</script>

<script lang="ts">
export default {
  data() {
    return {
      items: [],
      headers: [
        { title: "Value", key: "value" },
        { title: "Types", key: "type" },
      ],
      page: 0,
      perPage: 20,
      total: 0,
    };
  },
  methods: {
    loadOjects({ page, itemsPerPage, sortBy }) {
      axios
        .post("http://localhost:3000/api/v2/observables/search", {
          query: {},
          count: itemsPerPage,
          page: page - 1,
        })
        .then((response) => {
          console.log(response);
          this.items = response.data.observables;
          this.total = response.data.total;
        });
    },
  },
};
</script>
