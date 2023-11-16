<template>
  <v-data-table-server
    :itemsLength="total"
    :items-per-page="perPage"
    :headers="headers"
    density="compact"
    :items="items"
    @update:options="loadOjects"
    :search="search"
    class="mx-6"
  >
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
        v-model="search"
        prepend-inner-icon="mdi-magnify"
        label="Search observables"
        variant="outlined"
        density="compact"
        class="mt-2"
      />
    </v-list-item>
    <!-- separator -->
    <v-divider></v-divider>
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
        { title: "Value", key: "value" },
        { title: "Tags", key: "tags" },
        { title: "Type", key: "type" }
      ],
      page: 0,
      perPage: 20,
      total: 0,
      search: ""
    };
  },
  methods: {
    loadOjects({ page, itemsPerPage, sortBy }) {
      axios
        .post("http://localhost:3000/api/v2/observables/search", {
          query: { value: this.search },
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
