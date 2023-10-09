<template>
  <div class="modal-card" v-if="localObject">
    <header class="modal-card-head">
      <p v-if="localObject.id" class="modal-card-title">
        Editing {{ objectType.name.toLowerCase() }} <strong>{{ localObject.name }}</strong>
      </p>
      <p v-else class="modal-card-title">New {{ objectType.name }}</p>
    </header>
    <section class="modal-card-body">
      <b-field :label="field.label" v-for="field in objectType.fields" :key="field.field">
        <b-input v-model="localObject[field.field]" v-if="field.type === 'text'" />
        <b-input v-model="localObject[field.field]" v-if="field.type === 'code'" custom-class="longcode" />
        <b-input type="textarea" v-model="localObject[field.field]" v-if="field.type === 'longtext'" />
        <b-input
          type="textarea"
          custom-class="longcode"
          v-model="localObject[field.field]"
          v-if="field.type === 'longcode'"
        />
        <b-select v-if="field.type === 'option'" v-model="localObject[field.field]">
          <option v-for="option in field.choices" :value="option" :key="option"> {{ option }}</option>
        </b-select>
        <b-taginput
          label="Tags"
          v-model="localObject[field.field]"
          v-if="field.type === 'list'"
          icon="tag"
        ></b-taginput>
      </b-field>
      <div class="buttons">
        <b-button type="is-primary" @click="saveObject">
          Save
        </b-button>
        <b-button @click="$parent.close()">
          Cancel
        </b-button>
      </div>
    </section>
  </div>
</template>

<script>
import axios from "axios";
import { INDICATOR_TYPES } from "@/definitions/indicatorDefinitions.js";
import { ENTITY_TYPES } from "@/definitions/entityDefinitions.js";

export default {
  components: {},
  props: {
    object: {
      type: Object,
      default: () => {}
    },
    objectTypeName: {
      type: String,
      default: "",
      required: true
    },
    endpoint: {
      type: String,
      default: "",
      required: true
    }
  },
  data() {
    return {
      objectTypes: ENTITY_TYPES.concat(INDICATOR_TYPES),
      localObject: { ...this.object } // shallow copy of the object
    };
  },
  mounted() {},
  methods: {
    saveObject() {
      axios
        .patch(`/api/v2/${this.endpoint}/${this.object.id}`, { [this.localObject.root_type]: this.localObject })
        .then(response => {
          this.$parent.close();
          this.$buefy.toast.open({
            message: "Update succesful!",
            type: "is-success"
          });
          this.$emit("refresh", response.data);
        })
        .catch(error => {
          this.$buefy.toast.open({
            message: "Error saving object: " + error,
            type: "is-danger"
          });
        })
        .finally();
    }
  },
  computed: {
    objectType() {
      return this.objectTypes.find(type => type.type === this.objectTypeName);
    }
  }
};
</script>
