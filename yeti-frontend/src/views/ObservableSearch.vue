<template>
  <v-data-table-server
    :itemsLength="total"
    :items-per-page="perPage"
    :headers="headers"
    density="compact"
    :items="items"
    @update:options="loadOjects"
  ></v-data-table-server>
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
        { title: "Value", key: "value" },
        { title: "Types", key: "type" }
      ],
      page: 0,
      perPage: 20,
      total: 0
    };
  },
  methods: {
    loadOjects({ page, itemsPerPage, sortBy }) {
      axios
        .post("http://localhost:3000/api/v2/observables/search", {
          query: {},
          count: itemsPerPage,
          page: page - 1
        })
        .then(response => {
          console.log(response);
          this.items = response.data.observables;
          this.total = response.data.total;
        });
    }
  }
};
</script>
