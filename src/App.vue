<template>
  <router-view />
  <v-snackbar v-model="displaySnackBar" :timeout="3000" variant="flat" :color="snackBarStatus">
    {{ snackBarMessage }}
    <template v-slot:actions>
      <v-btn :color="snackBarStatus" variant="flat" rounded="2" @click="displaySnackBar = false"> OK </v-btn>
    </template>
  </v-snackbar>
</template>

<script lang="ts" setup></script>

<script lang="ts">
export default {
  data() {
    return {
      displaySnackBar: false,
      snackBarMessage: "",
      snackBarStatus: ""
    };
  },
  methods: {
    displayMessage(event) {
      this.snackBarMessage = event.message;
      this.snackBarStatus = event.status;
      this.displaySnackBar = true;
    }
  },
  created() {
    this.$eventBus.on("displayMessage", this.displayMessage);
  }
};
</script>

<style>
a {
  color: rgb(var(--v-theme-primary));
  text-decoration: none;
}

.v-snackbar__content {
  font-size: 1rem !important;
}
</style>
