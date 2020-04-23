<template>
  <div class="columns">
    <div class="column is-two-thirds">
      <div class="panel"></div>
      <nav class="panel">
        <p class="panel-heading">
          <b-taglist attached>
            <b-tag size="is-large" type="is-dark">{{ observable.value }}</b-tag>
            <b-tag size="is-large" type="is-info">{{ observable.type }}</b-tag>
          </b-taglist>
        </p>
        <div class="panel-block">
          <div class="content">{{ observable.description || "No description provided" }}</div>
        </div>
      </nav>
    </div>
    <div class="column is-one-third">
      <nav class="panel">
        <p class="panel-heading">
          Info
        </p>
        <div class="panel-block">
          <table class="table is-fullwidth">
            <tbody v-if="observable['type'] == 'Hostname'">
              <tr>
                <th>Created</th>
                <td>{{ observable["created"] }}</td>
              </tr>
              <tr>
                <th>Domain?</th>
                <td>{{ observable["domain"] }}</td>
              </tr>
              <tr>
                <th>IDNA</th>
                <td>{{ observable["idna"] }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </nav>

      <nav class="panel">
        <p class="panel-heading">
          Tags
        </p>
        <div class="panel-block">
          <b-field>
            <yeti-tag-input v-model="newTags"></yeti-tag-input>
            <p class="control">
              <button class="button is-primary" @click="saveTags">Save</button>
            </p>
          </b-field>
        </div>
      </nav>
    </div>
  </div>
</template>

<script>
import axios from "axios";
import YetiTagInput from "@/components/YetiTagInput";

export default {
  props: ["id"],
  components: {
    YetiTagInput
  },
  data() {
    return {
      observable: {},
      newTags: []
    };
  },
  mounted() {
    this.getObservableDetails();
  },
  methods: {
    getObservableDetails() {
      axios
        .get(`/api/observable/${this.id}`)
        .then(response => {
          this.observable = response.data;
          this.newTags = [...this.observable.tags];
        })
        .catch(error => {
          console.log(error);
        })
        .finally();
    },
    saveTags() {
      var params = {
        strict: true,
        tags: this.newTags.map(tag => tag.name)
      };
      axios
        .post(`/api/observable/${this.id}`, params)
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

<style scoped lang="css"></style>
