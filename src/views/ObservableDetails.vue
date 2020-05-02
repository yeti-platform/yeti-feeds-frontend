<template>
  <div>
    <div class="tile is-ancestor" v-if="observable">
      <div class="tile is-vertical is-8 is-parent">
        <nav class="tile panel is-child">
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
        <div class="tile is-child">
          <b-tabs v-model="activeTab" position="is-left" :animated="false">
            <b-tab-item>
              <template slot="header">
                <b-icon icon="info"></b-icon>
                <span>
                  Context
                  <b-tag rounded>{{ observable.context.length }}</b-tag>
                </span>
              </template>
              <nav class="panel" v-for="(context, index) in observable.context" v-bind:key="index">
                <p class="panel-heading">{{ context.source }}</p>
                <div class="panel-block">
                  <table class="table">
                    <tbody>
                      <tr v-for="key in Object.keys(context).filter(k => k !== 'source')" v-bind:key="key">
                        <th>{{ key }}</th>
                        <td>{{ context[key] }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </nav>
            </b-tab-item>
            <b-tab-item>
              <template slot="header">
                <b-icon icon="sitemap"></b-icon>
                <span>
                  Related observables
                  <b-tag rounded>0</b-tag>
                </span>
              </template>
              <related-observables :id="id"></related-observables>
            </b-tab-item>
          </b-tabs>
        </div>
      </div>
      <div class="tile is-vertical is-parent">
        <nav class="tile panel is-child">
          <p class="panel-heading">Info</p>
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
        <nav class="tile panel is-child">
          <p class="panel-heading">Tags</p>
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
  </div>
</template>

<script>
import axios from "axios";
import YetiTagInput from "@/components/YetiTagInput";
import RelatedObservables from "@/components/RelatedObservables";

export default {
  props: ["id"],
  components: {
    YetiTagInput,
    RelatedObservables
  },
  data() {
    return {
      observable: null,
      newTags: [],
      activeTab: null
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
  },
  watch: {
    id: "getObservableDetails"
  }
};
</script>

<style scoped lang="css"></style>
