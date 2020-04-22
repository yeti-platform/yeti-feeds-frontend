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
          <div class="card-header is-info"><p class="card-header-title">Advanced search</p></div>
          <div class="card-content">
            <div class="search">
              <div class="field">
                <b-input
                  v-model="searchQuery"
                  type="text"
                  placeholder="Search query + ⏎"
                  icon="search"
                  v-on:keyup.native.enter="searchObservables"
                />
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
                    <code>tags=crimeware</code>
                  </li>
                  <li><strong>Gate URLs</strong>: <code>tags=zeus .php$</code> (regex <code>on</code>)</li>
                  <li>
                    <strong>Ransomware C2s</strong>:
                    <code>tags=c2,ransomware</code>
                  </li>
                  <li>
                    <strong>Context</strong>:
                    <code>context.source=FeodoTracker</code>
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
          <b-field :class="{ hidden: !addMissing }"><yeti-tag-input v-model="addTags"></yeti-tag-input></b-field>
          <b-field :class="{ hidden: !addMissing }">
            <b-select v-model="addType" placeholder="Force observable type">
              <option :value="null">Guess type</option>
              <option v-for="type in defaultTypes" v-bind:key="type">{{ type }}</option>
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

import YetiTagInput from "@/components/YetiTagInput";
import SearchResults from "@/components/SearchResults";

var defaultTypes = {
  Ip: "Ip",
  AutonomousSystem: "AutonomousSystem",
  Url: "Url",
  Hostname: "Hostname",
  Hash: "Hash",
  File: "File",
  Certificate: "Certificate",
  CertificateSubject: "CertificateSubject",
  Email: "Email",
  Text: "Text",
  Bitcoin: "Bitcoin",
  Path: "Path",
  MacAddress: "MacAddress"
};

export default {
  name: "ObservableSearch",
  components: {
    YetiTagInput,
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
        add_unknown: this.addMissing
      };
      axios
        .post("http://localhost:5000/api/analysis/match", params)
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
    }
  }
};
</script>

<style lang="scss">
@import "@/style.scss";

.card-header.is-info {
  background: $info;
}

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
