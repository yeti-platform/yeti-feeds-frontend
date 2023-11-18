<template> Details for {{ observable }}</template>

<script lang="ts" setup>
import axios from "axios";
</script>

<script lang="ts">
export default {
  props: {
    id: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      observable: null,
      newTags: [],
      activeTab: 0
    };
  },
  methods: {
    getObservableDetails() {
      axios
        .get(`/api/v2/observables/${this.id}`)
        .then(response => {
          this.observable = response.data;
          this.newTags = Object.keys(this.observable.tags);
          // Switch back to Context view when reloading the page.
          this.activeTab = 0;
        })
        .catch(error => {
          console.log(error);
        })
        .finally();
    }
  },
  mounted() {
    this.getObservableDetails();
  }
};
</script>
