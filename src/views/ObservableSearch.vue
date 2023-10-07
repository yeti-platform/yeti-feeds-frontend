<template>
  <div class="observable-search">
    <div class="columns">
      <div class="column is-one-third">
        <h1 class="is-size-2">Search & add</h1>
        <div class="content">
          <p><strong>Format</strong>: one observable per line (for both text and file)</p>
          <p>
            Use the checkbox to automatically <strong>add</strong> unknown observables to the database (write operation)
          </p>
        </div>
        <div class="card">
          <div class="card-header info"><p class="card-header-title">Advanced search</p></div>
          <div class="card-content">
            <div class="search">
              <div class="field">
                <form v-on:submit="advancedSearchSubmit">
                  <b-input v-model="searchQuery" type="text" placeholder="Search query + ⏎" icon="search" />
                </form>
              </div>
            </div>
            <br />
            <article class="message tip">
              <div class="message-body content ">
                <p>
                  By default, the query will be matched against the
                  <code>value</code> attribute of the observables. To match against other attributes, use
                  <code>attribute=query</code>.
                </p>

                <p>Examples:</p>
                <ul>
                  <li>
                    <strong>Generic tag query</strong>:
                    <code>tags=lolbas</code>
                  </li>
                  <li><strong>Gate URLs</strong>: <code>tags=cobaltstrike .php$</code></li>
                  <li>
                    <strong>Ransomware C2s</strong>:
                    <code>tags=c2,ransomware</code>
                  </li>
                </ul>
              </div>
            </article>
          </div>
        </div>
      </div>
      <div class="column is-two-thirds ">
        <b-field grouped class="add-tags">
          <b-field>
            <b-checkbox v-model="addMissing" class="add-missing-control">Add and tag missing observables</b-checkbox>
          </b-field>
          <b-field :class="{ hidden: !addMissing }"
            ><b-taginput v-model="addTags" icon="tag" placeholder="e.g. CobaltStrike"></b-taginput
          ></b-field>
          <b-field :class="{ hidden: !addMissing }">
            <b-select v-model="addType" placeholder="Force observable type">
              <option :value="null">Guess type</option>
              <option v-for="type in Object.keys(defaultTypes)" v-bind:key="type" :value="type">
                {{ defaultTypes[type] }}
              </option>
            </b-select>
          </b-field>
        </b-field>

        <b-field label="Search">
          <b-input type="textarea" v-model="textSearch"></b-input>
        </b-field>

        <b-field class="file">
          <b-upload v-model="uploadFile">
            <a class="button is-outlined">
              <span>Upload file</span>
            </a>
          </b-upload>
          <span class="file-name" v-if="uploadFile">
            {{ uploadFile.name }}
          </span>
        </b-field>
        <small>
          Uploaded file will take precedence over text. Format is the same as text, one observable per line.
        </small>
        <br /><br />
        <b-field>
          <b-button icon-left="search" type="is-primary" @click="searchObservables">Launch search</b-button>
        </b-field>
      </div>
    </div>
    <div class="columns" v-if="searching">
      <div class="column is-4 is-offset-4">
        <b-progress size="is-medium" show-value>
          Searching...
        </b-progress>
      </div>
    </div>
    <div class="columns">
      <div class="column" v-if="searchResults">
        <h1 class="is-size-2">Search results</h1>
        <br />
        <search-results :searchResults="searchResults"></search-results>
      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";

import SearchResults from "@/components/SearchResults";

var defaultTypes = {
  Ip: "IP",
  AutonomousSystem: "Autonomous System",
  Url: "URL",
  Hostname: "Hostname",
  Hash: "Hash",
  File: "File",
  Certificate: "Certificate",
  CertificateSubject: "Certificate Subject",
  Email: "Email",
  Text: "Text",
  Bitcoin: "Bitcoin",
  Path: "Path",
  MacAddress: "MAC address"
};

export default {
  name: "ObservableSearch",
  components: {
    SearchResults
  },
  data() {
    return {
      addMissing: false,
      addTags: [],
      defaultTypes: defaultTypes,
      addType: null,
      uploadFile: null,
      textSearch: "",
      searchResults: null,
      searchQuery: null,
      searching: false,
      notFound: false
    };
  },
  methods: {
    searchObservables() {
      this.searching = true;
      this.searchResults = null;
      var params = {
        observables: this.textSearch.split("\n"),
        add_unknown: this.addMissing,
        add_tags: this.addTags
      };
      axios
        .post("/api/v2/graph/match", params)
        .then(response => {
          console.log(response);
          this.searchResults = response.data;
        })
        .catch(error => {
          return console.log(error);
        })
        .finally(() => {
          this.searching = false;
        });
    },
    advancedSearchSubmit(e) {
      this.$router.push({
        name: "ObservableList",
        query: { q: this.searchQuery }
      });
      e.preventDefault();
    }
  }
};
</script>

<style lang="scss">
@import "@/style.scss";

.add-tags label {
  vertical-align: middle;
}

.hidden {
  opacity: 0;
}

.searching.column {
  margin-top: 5em;
}
</style>
