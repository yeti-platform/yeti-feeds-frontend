<template>
  <v-data-table-server
    v-model:page="page"
    :itemsLength="total"
    :items-per-page="perPage"
    :headers="headers"
    density="compact"
    :items="items"
    @update:options="loadOjects"
    :search="search"
    :show-select="showSelect"
    :item-value="item => item.id"
    v-model="selectedObservables"
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
    <v-divider></v-divider>
    <v-expansion-panels>
      <v-expansion-panel title="Bulk actions" @group:selected="showSelect = $event.value">
        <v-expansion-panel-text>
          <v-card title="Bulk tag" class="pb-4" rounded="0" variant="flat">
            <v-combobox v-model="bulkTags" chips clearable multiple variant="outlined" density="compact">
              <template v-slot:chip="tag"> <v-chip :text="tag.item.value" label/></template>
            </v-combobox>
            <v-btn density="compact" variant="tonal" color="primary" class="me-2" @click="changeTags">Apply</v-btn>
            <small>Will apply {{ bulkTags.length }} tags to {{ selectedObservables.length }} observables</small>
          </v-card>
          <v-card title="Export observables" class="pb-4" rounded="0" variant="flat">
            <v-autocomplete
              label="Select template"
              variant="outlined"
              density="compact"
              :items="exportTemplates"
              item-title="name"
              v-model="selectedExportTemplate"
            ></v-autocomplete>
            <!-- <v-btn density="compact" variant="tonal" class="me-2" @click="selectedExportTemplate = null">Clear</v-btn> -->
            <v-btn density="compact" variant="tonal" color="primary" class="me-2">Export</v-btn>
            <small>Will export {{ selectedObservables.length || total }} observables</small>
          </v-card>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
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
      page: 1,
      perPage: 20,
      total: 0,
      search: "",
      showSelect: false,
      selectedObservables: [],
      bulkTags: [],
      exportTemplates: [],
      selectedExportTemplate: null
    };
  },
  methods: {
    loadOjects({ page, itemsPerPage, sortBy }: { page: number; itemsPerPage: number; sortBy: string }) {
      axios
        .post("http://localhost:3000/api/v2/observables/search", {
          query: { value: this.search },
          count: itemsPerPage,
          page: page - 1
        })
        .then(response => {
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
    }
  },
  mounted() {
    this.loadExportTemplates();
  }
};
</script>
