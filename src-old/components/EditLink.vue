<template>
  <div class="modal-card" v-if="localEdge">
    <header class="modal-card-head">
      <p class="modal-card-title">
        Editing link <strong>{{ vertices[edge.source].name }}</strong> →
        <strong>{{ vertices[edge.target].name }}</strong>
      </p>
    </header>
    <section class="modal-card-body">
      <b-field horizontal label="Type"> <b-input v-model="localEdge.type" /> </b-field>
      <b-field horizontal label="Description"> <b-input type="textarea" v-model="localEdge.description" /> </b-field>
      <div class="buttons">
        <b-button type="is-primary" @click="saveLink">
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

export default {
  components: {},
  props: {
    vertices: {
      type: Object,
      default: () => {}
    },
    edge: {
      type: Object,
      default: () => {}
    }
  },
  data() {
    return {
      localEdge: { ...this.edge }
    };
  },
  mounted() {},
  methods: {
    saveLink() {
      axios
        .patch(`/api/v2/graph/${this.edge.id}`, {
          description: this.localEdge.description,
          link_type: this.localEdge.type
        })
        .then(response => {
          this.$parent.close();
          this.$buefy.toast.open({
            message: "Update successful!",
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
