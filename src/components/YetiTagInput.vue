<template>
  <b-taginput
    label="tags"
    v-model="selectedTags"
    :data="filterTags"
    autocomplete
    icon="tag"
    placeholder="e.g. Zeus"
    field="name"
    @typing="text => (this.tagName = text)"
    @input="updateSelected"
    :maxtags="maxtags"
  >
  </b-taginput>
</template>

<script>
import axios from "axios";

export default {
  name: "YetiTagInput",
  data() {
    return {
      existingTags: [],
      tagName: "",
      selectedTags: this.value
    };
  },
  props: {
    value: Array,
    maxtags: {
      type: Number,
      default: null
    }
  },
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
      this.$emit("input", this.selectedTags);
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
    value: function(newValue) {
      this.selectedTags = newValue;
    }
  }
};
</script>
