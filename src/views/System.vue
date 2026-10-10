<template>
  <v-container>
    <v-row>
      <v-col>
        <div class="mb-5 text-h4">Celery worker information</div>
        <v-alert v-if="workerError" type="warning" variant="tonal" class="mb-4">{{ workerError }}</v-alert>
        <v-card variant="flat" :loading="infoLoading">
          <v-card-title>Worker status</v-card-title>
          <v-card-subtitle v-if="infoLoading">Loading...</v-card-subtitle>
          <v-card-text>
            <v-table v-if="info">
              <tr>
                <th>Host</th>
                <th>Registered tasks</th>
              </tr>
              <tr v-for="key in Object.keys(info.registered)" v-bind:key="key">
                <td>{{ key }}</td>
                <td>{{ info.registered[key] }}</td>
              </tr>
            </v-table>
          </v-card-text>
        </v-card>
        <v-divider class="my-6"></v-divider>
        <v-card variant="flat" :loading="infoLoading">
          <v-card-title>Active tasks</v-card-title>
          <v-card-subtitle v-if="infoLoading">Loading...</v-card-subtitle>
          <v-card-text>
            <v-table v-if="info">
              <tr>
                <th>Task name</th>
                <th>Params</th>
              </tr>
              <tr v-for="workerData in info.active" v-bind:key="workerData[0]">
                <td>{{ workerData[0] }}</td>
                <td>{{ workerData[1] }}</td>
              </tr>
            </v-table>
          </v-card-text>
        </v-card>
        <v-divider class="my-6"></v-divider>
        <v-btn variant="flat" @click="restartWorker('all')" :disabled="restartDisabled"> Restart All workers </v-btn>
      </v-col>
      <v-col>
        <p class="mb-5 text-h4">System config</p>
        <pre>{{ appStore.systemConfig }}</pre>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import axios from "axios";
import { useAppStore } from "@/store/app";
</script>

<script lang="ts">
export default {
  name: "System",
  data() {
    return {
      // /system/workers returns a free-form {registered, active, ...} blob.
      info: null as Record<string, any> | null,
      infoLoading: true,
      // Set when /system/workers fails, so the page says so instead of loading forever.
      workerError: "" as string,
      appStore: useAppStore(),
      restartDisabled: false
    };
  },
  mounted() {
    this.appStore.fetchSystemConfig();
    setTimeout(() => {
      this.getWorkerInfo();
    }, 200);
  },
  methods: {
    getWorkerInfo() {
      this.infoLoading = true;
      this.workerError = "";
      axios
        .get(`/api/v2/system/workers`)
        .then(response => {
          this.info = response.data;
        })
        .catch(error => {
          const reason = error.response?.data?.detail || error.message;
          this.workerError = `Could not load worker information (${reason}). Is a Celery worker running?`;
        })
        .finally(() => {
          this.infoLoading = false;
        });
    },
    restartWorker(workerName: string) {
      this.restartDisabled = true;
      axios
        .post(`/api/v2/system/restartworker/${workerName}`)
        .then(response => {
          if (response.data.failures.length > 0) {
            this.$eventBus.emit("displayMessage", {
              message: "Some workers could not be restarted:\n" + response.data.failures.join("\n"),
              status: "error"
            });
          } else {
            this.$eventBus.emit("displayMessage", {
              message: "Workers succesfully restarted!",
              status: "success"
            });
          }
        })
        .catch(error => {
          console.log(error);
        })
        .finally(() => {
          this.restartDisabled = false;
        });
    }
  }
};
</script>

<style>
.v-card-text .v-table {
  font-size: 1rem;
}
</style>
