<template>
  <div>
    <div class="columns">
      <div class="column is-6">
        <h1 class="is-size-2">Worker status</h1>
        <b-progress size="is-medium" show-value v-if="infoLoading">
          Pinging Celery workers...
        </b-progress>
        <table class="table is-narrow is-fullwidth" v-if="info">
          <tbody>
            <tr>
              <th>Registered worker</th>
              <th>Process IDs</th>
              <th>Active</th>
              <th>Restart</th>
            </tr>
            <tr v-for="worker in Object.keys(info.registered)" v-bind:key="worker">
              <td>{{ worker }}</td>
              <td>
                <b-taglist>
                  <b-tag v-for="pid in info.registered[worker].processes" v-bind:key="pid">
                    {{ pid }}
                  </b-tag>
                </b-taglist>
              </td>
              <td>{{ info.registered[worker].active ? "Yes" : "No" }}</td>
              <td><b-button @click="restartWorker(worker)">Restart</b-button></td>
            </tr>
          </tbody>
        </table>
        <table class="table is-narrow is-fullwidth" v-if="info">
          <tbody>
            <tr>
              <th>Workers</th>
              <th>Active tasks</th>
            </tr>
            <tr v-for="worker in Object.keys(info.active)" v-bind:key="worker">
              <td>{{ worker }}</td>
              <td>
                <b-taglist>
                  <b-tag v-for="pid in info.active[worker].running" v-bind:key="pid">
                    {{ pid }}
                  </b-tag>
                </b-taglist>
              </td>
            </tr>
          </tbody>
        </table>
        <div class="buttons">
          <b-button type="is-danger" @click="restartWorker('all')">Restart All workers</b-button>
        </div>
      </div>
      <div class="column is-6">
        <h1 class="is-size-2">System config</h1>
        <pre>{{ appConfig }}</pre>
      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";

export default {
  name: "System",
  data() {
    return {
      info: null,
      infoLoading: false
    };
  },
  mounted() {
    this.getWorkerInfo();
  },
  methods: {
    getWorkerInfo() {
      this.infoLoading = true;
      axios
        .get(`/api/system/`)
        .then(response => {
          this.info = response.data;
          this.infoLoading = false;
        })
        .catch(error => {
          console.log(error);
        });
    },
    restartWorker(workerName) {
      axios
        .get(`/api/system/restart/worker/${workerName}`)
        .then(response => {
          this.$buefy.notification.open({
            message: response.data.message,
            type: response.data.status == "success" ? "is-success" : "is-danger"
          });
        })
        .catch(error => {
          console.log(error);
        });
    }
  },
  computed: {
    appConfig() {
      return this.$store.getters.appConfig;
    }
  }
};
</script>

<style></style>
