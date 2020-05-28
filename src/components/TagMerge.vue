<template>
  <div>
    <b-field label="Merge">
      <yeti-tag-input v-model="merge"></yeti-tag-input>
    </b-field>
    <b-field label="Merge into">
      <yeti-tag-input v-model="mergeInto" :maxtags="1"></yeti-tag-input>
    </b-field>
    <b-field>
      <b-checkbox v-model="permanent">Make merge permanent</b-checkbox>
    </b-field>
    <p class="control">
      <button class="button is-primary" @click="mergeTags">Merge</button>
    </p>
  </div>
</template>

<script>
import YetiTagInput from "@/components/YetiTagInput";
import axios from "axios";

export default {
  name: "TagsMerge",
  components: {
    YetiTagInput
  },
  data() {
    return {
      merge: null,
      mergeInto: null,
      permanent: false
    };
  },
  methods: {
    mergeTags() {
      if (!this.merge || !this.mergeInto) {
        return;
      }
      var params = {
        make_dict: this.permanent,
        merge_into: this.mergeInto[0].name,
        merge: this.merge.map(tag => tag.name)
      };
      this.clearForm();

      axios
        .post(`/api/tag/merge`, params)
        .then(() => {
          this.$buefy.notification.open({
            message: "Changes succesfully changed.",
            type: "is-success"
          });
        })
        .catch(error => {
          console.log(error);
        })
        .finally(() => {
          this.clearForm();
        });
    },
    clearForm() {
      this.mergeInto = [];
      this.merge = [];
    }
  }
};
</script>

<style></style>
