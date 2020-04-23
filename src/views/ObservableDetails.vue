<template>
  <div>
    {{ observable }}
  </div>
</template>

<script>
import axios from "axios";

export default {
  props: ["id"],
  data() {
    return {
      observable: null
    };
  },
  mounted() {
    this.getObservableDetails();
    this.getObservableDetails();
  },
  methods: {
    getObservableDetails() {
      axios
        .get(`/api/observable/${this.id}`)
        .then(response => {
          this.observable = response.data;
        })
        .catch(error => {
          console.log(error);
        })
        .finally();
    }
  }
};
</script>

<style lang="sass"></style>
