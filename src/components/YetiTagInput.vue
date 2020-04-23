<template>
  <b-taginput
    label="tags"
    v-model="value"
    :data="filterTags"
    autocomplete
    icon="tag"
    placeholder="e.g. Zeus"
    field="name"
  >
  </b-taginput>
</template>

<script>
import axios from "axios";
export default {
  name: "TagSelector",
  data() {
    return {
      existingTags: [],
      tagName: ""
    };
  },
  props: ["value"],
  mounted() {
    this.getExistingTags();
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
      this.$emit("input", this.value);
    }
  },
  computed: {
    filterTags() {
      return this.existingTags.filter(tag => {
        return (
          tag.name
            .toString()
            .toLowerCase()
            .indexOf(this.tagName.toLowerCase()) >= 0
        );
      });
    }
  },
  watch: {
    value: "updateSelected"
  }
};
</script>
