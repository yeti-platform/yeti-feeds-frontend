<template>
  <router-view />
  <v-snackbar
    v-model="displaySnackBar"
    :timeout="50000"
    variant="flat"
    :color="snackBarStatus === 'success' ? 'green-lighten-2' : 'red-lighten-2'"
  >
    {{ snackBarMessage }}
    <template v-slot:actions>
      <v-btn
        :color="snackBarStatus === 'success' ? 'green-darken-2' : 'red-darken-2'"
        variant="flat"
        rounded="2"
        @click="displaySnackBar = false"
      >
        OK
      </v-btn>
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
      console.log("message displayed!");
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
