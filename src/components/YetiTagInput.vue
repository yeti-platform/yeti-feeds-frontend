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
      filteredTags: [],
      tablePage: 1
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
      this.$emit("input", this.selectedTags);
    },
    getFilteredTags: _.debounce(function(text) {
      this.tagName = text;
      var params = {
        filter: { name: this.tagName },
        params: {
          regex: true,
          page: this.tablePage
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
