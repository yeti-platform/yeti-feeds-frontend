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
              <th>Host</th>
              <th>Active workers</th>
            </tr>
          </tbody>
          <tr v-for="entry in Object.keys(info.registered)" v-bind:key="entry">
            <td>{{ entry }}</td>
            <td>{{ info.registered[entry] }}</td>
          </tr>
        </table>

        <table class="table is-narrow is-fullwidth" v-if="info">
          <tbody>
            <tr>
              <th>Task name</th>
              <th>Params</th>
            </tr>
            <tr v-for="workerData in info.active" v-bind:key="workerData[0]">
              <td>{{ workerData[0] }}</td>
              <td>{{ workerData[1] }}</td>
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
      infoLoading: true
    };
  },
  mounted() {
    this.getWorkerInfo();
  },
  methods: {
    getWorkerInfo() {
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
      axios
        .post(`/api/v2/system/restartworker/${workerName}`)
        .then(response => {
          if (response.data.failures.length > 0) {
            this.$buefy.notification.alert({
              title: "Some workers could not be restarted",
              message: response.data.failures.join("\n"),
              type: "is-danger"
            });
          } else {
            this.$buefy.notification.open({
              message: "Workers succesfully restarted!",
              type: "is-success"
            });
          }
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
