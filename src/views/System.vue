<template>
  <v-container>
    <v-row>
      <v-col>
        <div class="mb-5 text-h4">Celery worker information</div>
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
      info: null,
      infoLoading: true,
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
      axios
        .get(`/api/v2/system/workers`)
        .then(response => {
          this.info = response.data;
          this.infoLoading = false;
        })
        .catch(error => {
          console.log(error);
        });
    },
    restartWorker(workerName) {
      this.restartDisabled = true;
      axios
        .post(`/api/v2/system/restartworker/${workerName}`)
        .then(response => {
          if (response.data.failures.length > 0) {
            this.$eventBus.emit("displayMesasge", {
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
