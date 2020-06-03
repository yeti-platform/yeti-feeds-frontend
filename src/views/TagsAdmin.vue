<template>
  <div class="columns">
    <div class="column is-9">
      <b-table :data="tags" @click="row => (this.selectedTag = JSON.parse(JSON.stringify(row)))">
        <template v-slot:default="tag">
          <b-table-column field="name" label="name">
            <b-tag>{{ tag.row.name }}</b-tag>
          </b-table-column>
          <b-table-column field="default_expiration" label="Default expiration">
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
          <b-table-column field="created" label="Created">{{ tag.row.created }}</b-table-column>
        </template>
      </b-table>
    </div>

    <div class="column is-3">
      <b-tabs v-model="activeTab" position="is-centered" :animated="false">
        <b-tab-item label="Edit tag">
          <b-field label="Name">
            <b-input v-model="selectedTag.name"></b-input>
          </b-field>
          <b-field label="Produced tags">
            <yeti-tag-input v-model="selectedTag.produces"></yeti-tag-input>
          </b-field>
          <b-field label="Replaces">
            <yeti-tag-input v-model="selectedTag.replaces"></yeti-tag-input>
          </b-field>
          <b-field label="Expiration (seconds)">
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
          <tag-merge></tag-merge>
        </b-tab-item>
      </b-tabs>
    </div>
  </div>
</template>

<script>
import axios from "axios";
import YetiTagInput from "@/components/YetiTagInput";
import TagMerge from "@/components/TagMerge";

export default {
  name: "TagsAdmin",
  components: {
    YetiTagInput,
    TagMerge
  },
  data() {
    return {
      tags: [],
      selectedTag: {},
      activeTab: 0
    };
  },
  mounted() {
    this.getTags();
  },
  methods: {
    getTags() {
      axios
        .get(`/api/tag/`)
        .then(response => {
          this.tags = response.data;
        })
        .catch(error => {
          console.log(error);
        })
        .finally(() => {});
    },
    updateTag() {
      var params = {
        name: this.selectedTag.name,
        produces: this.selectedTag.produces.map(tag => tag.name || tag),
        replaces: this.selectedTag.replaces.map(tag => tag.name || tag),
        default_expiration: this.selectedTag.default_expiration
      };
      axios
        .post(`/api/tag/${this.selectedTag.id}`, params)
        .then(() => {
          this.getTags();
        })
        .catch(error => {
          console.log(error);
        })
        .finally(() => {});
    }
  }
};
</script>

<style></style>
