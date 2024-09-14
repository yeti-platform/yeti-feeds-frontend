<template>
  <v-container fluid>
    <v-data-table-server
      :items="tags"
      :items-length="totalTags"
      :headers="tagHeaders"
      :items-per-page="perPage"
      :page="page"
      density="compact"
      :search="tagFilterDebounced"
      @update:options="searchTags"
      :loading="loading"
      loading-text="Loading tags..."
    >
      <template v-slot:item.name="{ item }">
        <v-chip color="primary" @click="selectTag(item)" density="compact">{{ item.name }}</v-chip>
      </template>
      <template v-slot:item.default_expiration="{ item }">
        {{ moment.duration(item.default_expiration).asDays() }}
      </template>
      <template v-slot:item.produces="{ item }">
        <v-chip class="me-2" density="compact" v-for="tag in item.produces">{{ tag }}</v-chip>
      </template>
      <template v-slot:item.replaces="{ item }">
        <v-chip class="me-2" density="compact" v-for="tag in item.replaces">{{ tag }}</v-chip>
      </template>
      <template v-slot:item.created="{ item }">
        {{ moment(item.created).format("YYYY-MM-DD HH:mm:ss") }}
      </template>
    </v-data-table-server>

    <v-navigation-drawer permament location="right" width="400" ref="drawer">
      <v-list-item class="mt-5">
        <v-text-field v-model="tagFilter" prepend-inner-icon="mdi-magnify" label="Filter tags" density="compact" />
      </v-list-item>
      <v-divider class="mb-5" />
      <v-form>
        <v-list-item>
          <v-list-item-title class="text-h5 pb-2">Edit tag</v-list-item-title>
          <v-list-item-subtitle v-if="!selectedTag">Click on a tag's name to edit it.</v-list-item-subtitle>
        </v-list-item>
        <v-list-item v-if="selectedTag">
          <v-text-field v-model="selectedTag.name" label="Name" density="compact" class="pt-2" />
          <v-text-field v-model="selectedTagDefaultExpiration" label="Default expiration (days)" density="compact" />
          <v-combobox
            v-model="selectedTag.produces"
            item-text="name"
            item-value="name"
            label="Produces"
            :hint="`Extra tags that will be added to objects tagged with ${selectedTag.name}`"
            :delimiters="[',', ' ', ';']"
            density="compact"
            multiple
            chips
          />
          <v-combobox
            v-model="selectedTag.replaces"
            item-text="name"
            item-value="name"
            label="Replaces"
            :hint="`Objects tagged with these will be replaced by ${selectedTag.name}`"
            :delimiters="[',', ' ', ';']"
            density="compact"
            multiple
            chips
          />
          <v-btn variant="tonal" color="primary" class="me-2" @click="updateTag" :disabled="!selectedTag.name"
            >Update</v-btn
          >
          <v-btn variant="text" color="cancel" @click="selectedTag = null">Cancel</v-btn>
        </v-list-item>
      </v-form>
      <v-divider class="my-5" />
      <v-form>
        <v-list-item>
          <v-list-item-title class="text-h5 pb-2 mb-3">Merge tags</v-list-item-title>
          <v-combobox
            v-model="mergeSource"
            label="Sources"
            :delimiters="[',', ' ', ';']"
            density="compact"
            chips
            multiple
            :items="tags.map(tag => tag.name)"
          />
          <v-combobox
            v-model="mergeTarget"
            label="Merge target"
            :delimiters="[',', ' ', ';']"
            density="compact"
            chips
            :items="tags.map(tag => tag.name).filter(tag => !mergeSource.includes(tag))"
          />
          <div class="d-flex">
            <v-checkbox-btn label="Make merge permanent" v-model="permanentMerge"></v-checkbox-btn>
            <v-btn variant="tonal" class="me-2" @click="mergeTags" :disabled="!mergeTarget || !mergeSource.length"
              >Merge</v-btn
            >
          </div>
          <v-list-item-subtitle class="mt-5">
            Merge tags into another tag. All objects tagged with the source tags will be tagged with the target tag.
            <br /><br />
            If merge is permanent, the source tags will be deleted and any further tagging with source tags will be
            replaced with the target tag.
          </v-list-item-subtitle>
        </v-list-item>
      </v-form>
    </v-navigation-drawer>
  </v-container>
</template>

<script setup lang="ts">
import axios from "axios";
import _ from "lodash";
import moment from "moment";
</script>

<script lang="ts">
export default {
  name: "TagsAdmin",
  data() {
    return {
      tags: [],
      totalTags: 0,
      tagHeaders: [
        { title: "Name", key: "name" },
        { title: "Default expiration (days)", key: "default_expiration" },
        { title: "Produces", key: "produces" },
        { title: "Replaces", key: "replaces" },
        { title: "Created (UTC)", key: "created" }
      ],
      selectedTag: null,
      selectedTagDefaultExpiration: null,
      perPage: 50,
      page: 1,
      loading: false,
      tagFilter: "",
      tagFilterDebounced: "",
      mergeSource: [],
      mergeTarget: null,
      permanentMerge: false
    };
  },
  methods: {
    searchTags({ page, itemsPerPage, sortBy }) {
      this.loading = true;
      axios
        .post(`/api/v2/tags/search`, { name: this.tagFilter, page: page - 1, count: itemsPerPage })
        .then(response => {
          this.tags = response.data.tags;
          this.totalTags = response.data.total;
        })
        .catch(error => {
          return console.log(error);
        })
        .finally(() => {
          this.loading = false;
        });
    },
    selectTag(selectedTag) {
      this.selectedTag = selectedTag;
      this.selectedTagDefaultExpiration = moment.duration(selectedTag.default_expiration).asDays();
    },
    updateTag() {
      const params = {
        name: this.selectedTag.name,
        produces: this.selectedTag.produces.map(tag => tag.name || tag),
        replaces: this.selectedTag.replaces.map(tag => tag.name || tag),
        default_expiration: moment.duration(this.selectedTagDefaultExpiration, "days")
      };
      axios
        .put(`/api/v2/tags/${this.selectedTag.id}`, params)
        .then(() => {
          this.$eventBus.emit("displayMessage", {
            message: `Tag ${this.selectedTag.name} succesfully updated`,
            status: "success"
          });
          this.searchTags(this.page, this.perPage);
        })
        .catch(error => {
          console.log(error);
        })
        .finally(() => {});
    },
    mergeTags() {
      const params = {
        permanent: this.permanentMerge,
        merge_into: this.mergeTarget,
        merge: this.mergeSource
      };
      axios
        .post(`/api/v2/tags/merge`, params)
        .then(() => {
          this.$eventBus.emit("displayMessage", {
            message: "Changes succesfully changed.",
            status: "success"
          });
          this.searchTags();
        })
        .catch(error => {
          console.log(error);
        });
    }
  },
  watch: {
    tagFilter: _.debounce(function () {
      this.tagFilterDebounced = this.tagFilter;
    }, 200)
  }
};
</script>

<style></style>
