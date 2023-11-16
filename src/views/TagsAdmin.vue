<template>
  <div class="columns">
    <div class="column is-9">
      <b-table
        :data="tags"
        @click="onRowClick"
        :total="tableTotal"
        backend-pagination
        @page-change="onPageChange"
        :loading="loading"
        :perPage="50"
        paginated
        :hoverable="true"
        :narrowed="true"
        :current-page="tablePage"
      >
        <template v-slot:default="tag">
          <b-table-column field="name" label="name">
            <b-tag>{{ tag.row.name }}</b-tag>
          </b-table-column>
          <b-table-column field="default_expiration" label="Default expiration (days)">
            {{ tag.row.default_expiration }}
          </b-table-column>
          <b-table-column field="count" label="Count">{{ tag.row.count }}</b-table-column>
          <b-table-column field="produces" label="Produces">
            <b-taglist>
              <b-tag v-for="tag in tag.row.produces" v-bind:key="tag">
                {{ tag }}
              </b-tag>
            </b-taglist>
          </b-table-column>
          <b-table-column field="replaces" label="Replaces"
            ><b-taglist>
              <b-tag v-for="tag in tag.row.replaces" v-bind:key="tag">
                {{ tag }}
              </b-tag>
            </b-taglist>
          </b-table-column>
          <b-table-column field="created" label="Created (UTC)" width="180"
            ><span :title="'Localtime: ' + formatTimestamp(tag.row.created, true)">{{
              formatTimestamp(tag.row.created)
            }}</span>
          </b-table-column>
        </template>
      </b-table>
    </div>

    <div class="column is-3">
      <b-tabs v-model="activeTab" position="is-centered" :animated="false">
        <b-tab-item label="Edit tag">
          <b-field label="Name">
            <b-input v-model="selectedTag.name" placeholder="Tag name"></b-input>
          </b-field>
          <b-field label="Produced tags" message="These tags will be added to the observable when this tag is added.">
            <b-taginput v-model="selectedTag.produces"></b-taginput>
          </b-field>
          <b-field label="Replaces" message="Tags that will be replaced by this tag.">
            <b-taginput v-model="selectedTag.replaces"></b-taginput>
          </b-field>
          <b-field label="Expiration" message="Expiration delay for tag in days.">
            <b-input v-model="selectedTag.default_expiration"></b-input>
          </b-field>
          <b-field grouped>
            <p class="control" v-if="selectedTag.id">
              <button class="button is-primary" @click="updateTag">Save changes</button>
            </p>
            <p class="control">
              <button class="button is-light" @click="selectedTag = {}">Clear form</button>
            </p>
          </b-field>
        </b-tab-item>
        <b-tab-item label="Merge tag">
          <tag-merge @refresh="searchTags"></tag-merge>
        </b-tab-item>
      </b-tabs>
      <b-tabs position="is-centered">
        <b-tab-item label="Filter tags">
          <b-field label="Name">
            <b-input v-model="tagFilter" @input="searchTagsDebounced"></b-input>
          </b-field>
        </b-tab-item>
      </b-tabs>
    </div>
  </div>
</template>

<script>
import axios from "axios";
import TagMerge from "@/components/TagMerge";
import utils from "@/utils";
import _ from "lodash";

export default {
  name: "TagsAdmin",
  components: {
    TagMerge
  },
  data() {
    return {
      tags: [],
      selectedTag: {},
      activeTab: 0,
      tablePage: 1,
      tableTotal: 500,
      loading: false,
      tagFilter: ""
    };
  },
  mounted() {
    this.searchTags();
  },
  created() {
    this.searchTagsDebounced = _.debounce(this.searchTags, 300);
  },
  methods: {
    searchTags() {
      console.log("searchTags");
      this.loading = true;
      axios
        .post(`/api/v2/tags/search`, { name: this.tagFilter, page: this.tablePage - 1, count: 50 })
        .then(response => {
          this.tags = response.data.tags;
          this.tableTotal = response.data.total;
        })
        .catch(error => {
          return console.log(error);
        })
        .finally(() => {
          this.loading = false;
        });
    },
    onPageChange(tablePage) {
      this.tablePage = tablePage;
      this.searchTags(false);
    },
    onRowClick(row) {
      this.selectedTag = JSON.parse(JSON.stringify(row));
    },
    updateTag() {
      var params = {
        name: this.selectedTag.name,
        produces: this.selectedTag.produces.map(tag => tag.name || tag),
        replaces: this.selectedTag.replaces.map(tag => tag.name || tag),
        default_expiration: this.selectedTag.default_expiration
      };
      axios
        .put(`/api/v2/tags/${this.selectedTag.id}`, params)
        .then(() => {
          // message to user
          this.$buefy.toast.open({
            message: `Tag ${this.selectedTag.name} succesfully updated`,
            type: "is-success"
          });
          this.searchTags();
        })
        .catch(error => {
          console.log(error);
        })
        .finally(() => {});
    },
    formatTimestamp(timestamp, local) {
      return utils.formatTimestamp(timestamp, local);
    }
  }
};
</script>

<style></style>
