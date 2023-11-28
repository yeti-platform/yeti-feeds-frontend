<template>
  <v-main class="d-flex justify-center">
    <router-view @displayMessage="displayMessage($event)" />
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
  </v-main>
</template>

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
  }
};
</script>
