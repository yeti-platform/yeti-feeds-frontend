<template>
  <div class="observable-search">
    <div class="columns">
      <div class="column is-one-third">
        <h1>Search & add</h1>
        <div class="content">
          Blah
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
      <div class="column">
        <search-results v-if="searchResults" :searchResults="searchResults"></search-results>
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
      searching: false
    };
  },
  methods: {
    searchObservables() {
      this.searching = true;
      this.searchResults = null;
      var params = {
        "bulk-text": this.textSearch
      };
      axios
        .post("http://localhost:5000/api/observable/search", params)
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

<style>
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
