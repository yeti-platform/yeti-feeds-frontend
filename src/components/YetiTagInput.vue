<template>
  <b-taginput
    label="tags"
    v-model="selectedTags"
    :data="filteredTags"
    autocomplete
    icon="tag"
    placeholder="e.g. Zeus"
    field="name"
    @typing="getFilteredTags"
    @input="updateSelected"
    :maxtags="maxtags"
    :allow-new="true"
  >
  </b-taginput>
</template>

<script>
import axios from "axios";
import _ from "lodash";

export default {
  name: "YetiTagInput",
  data() {
    return {
      tagName: "",
      selectedTags: this.value,
      filteredTags: []
    };
  },
  props: {
    value: Array,
    maxtags: {
      type: Number,
      default: null
    }
  },
  methods: {
    getExistingTags() {
      axios
        .get("/api/tag/")
        .then(response => {
          return (this.existingTags = response.data);
        })
        .catch(error => {
          return console.log(error);
        });
    },
    updateSelected() {
      // we always want tags in the form {'name': 'tagname'}
      this.selectedTags = this.selectedTags.map(tag => {
        if (typeof tag === "string") {
          return { name: tag };
        } else {
          return tag;
        }
      });

      this.$emit("input", this.selectedTags);
    },
    getFilteredTags: _.debounce(function(text) {
      this.tagName = text;
      var params = {
        filter: { name: this.tagName },
        params: {
          regex: true,
          page: 1
        }
      };
      axios
        .post(`/api/tagsearch/`, params)
        .then(response => {
          return (this.filteredTags = response.data);
        })
        .catch(error => {
          return console.log(error);
        });
    }, 300)
  },
  watch: {
    value: function(newValue) {
      this.selectedTags = newValue;
    }
  }
};
</script>
