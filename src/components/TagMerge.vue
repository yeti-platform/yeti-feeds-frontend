<template>
  <div>
    <b-field label="Merge">
      <b-taginput v-model="merge" autocomplete :data="filteredTags" @typing="getFilteredTags"></b-taginput>
    </b-field>
    <b-field label="Merge into">
      <b-taginput
        v-model="mergeInto"
        maxtags="1"
        autocomplete
        :data="filteredTags"
        @typing="getFilteredTags($event, 'mergeInto')"
      ></b-taginput>
    </b-field>
    <b-field>
      <b-checkbox v-model="permanent">Make merge permanent</b-checkbox>
    </b-field>
    <p class="control">
      <button class="button is-primary" @click="mergeTags" :disabled="!isValid()">Merge</button>
    </p>
  </div>
</template>

<script>
import axios from "axios";

export default {
  name: "TagsMerge",
  data() {
    return {
      merge: [],
      mergeInto: [],
      permanent: false,
      filteredTags: []
    };
  },
  methods: {
    mergeTags() {
      var mergeinto = this.mergeInto[0];
      // remove mergeinto from merge
      this.merge = this.merge.filter(tag => tag !== mergeinto);
      var params = {
        permanent: this.permanent,
        merge_into: mergeinto,
        merge: this.merge
      };

      axios
        .post(`/api/v2/tags/merge`, params)
        .then(() => {
          this.$buefy.notification.open({
            message: "Changes succesfully changed.",
            type: "is-success"
          });
          this.clearForm();
          this.$emit("refresh");
        })
        .catch(error => {
          console.log(error);
        });
    },
    isValid() {
      var length = this.mergeInto.length === 1 && this.merge.length > 0;
      var mergetags = new Set(this.merge);
      return length && !mergetags.has(this.mergeInto[0]);
    },
    clearForm() {
      this.mergeInto = [];
      this.merge = [];
    },
    getFilteredTags(text, which) {
      axios
        .post(`/api/v2/tags/search`, { name: text, page: 0, count: 10 })
        .then(response => {
          var mergetags = new Set();
          if (which === "mergeInto") {
            mergetags = new Set(this.merge);
          }
          this.filteredTags = response.data.tags.map(tag => tag.name).filter(tag => !mergetags.has(tag));
        })
        .catch(error => {
          return console.log(error);
        });
    }
  }
};
</script>

<style></style>
