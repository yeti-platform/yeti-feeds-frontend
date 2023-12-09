<template>
  <v-card>
    <template v-slot:title>
      Edit: {{ vertices[edge.source].value }}
      <v-icon>mdi-arrow-right</v-icon>
      {{ vertices[edge.target].value }}</template
    >
    <v-card-text>
      <v-text-field label="Type" v-model="localEdge.type"></v-text-field>
      <v-textarea label="Description" v-model="localEdge.description"></v-textarea>
    </v-card-text>

    <v-card-actions>
      <v-spacer></v-spacer>
      <v-btn text="Cancel" color="grey-darken-1" @click="isActive.value = false"></v-btn>
      <v-btn text="Save" color="primary" @click="saveLink"></v-btn>
    </v-card-actions>
    <v-alert v-if="error" type="error">Error updating link: {{ error }}</v-alert>
  </v-card>
</template>

<script lang="ts" setup>
import axios from "axios";
</script>

<script lang="ts">
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
    },
    isActive: {
      type: Object,
      default: () => {}
    }
  },
  data() {
    return {
      localEdge: { ...this.edge },
      error: null
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
          this.$emit("success", response.data);
          this.isActive.value = false;
        })
        .catch(error => {
          this.error = error;
          console.log(error);
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
