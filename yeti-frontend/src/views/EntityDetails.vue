<template>
  <div>{{ entity }}</div>
</template>

<script lang="ts" setup>
import axios from "axios";

import RelatedObjects from "@/components/RelatedObjects.vue";
import { ENTITY_TYPES } from "@/definitions/entityDefinitions.js";
</script>

<script lang="ts">
export default {
  props: {
    id: {
      type: String,
      required: true
    }
  },
  components: {
    RelatedObjects
  },
  data() {
    return {
      entity: null,
      activeTab: 0,
      entityTypes: ENTITY_TYPES
    };
  },
  methods: {
    getEntityDetails() {
      axios
        .get(`/api/v2/entities/${this.id}`)
        .then(response => {
          let tagNames: string[] = [];
          this.entity = response.data;
          this.activeTab = 0;
        })
        .catch(error => {
          console.log(error);
        })
        .finally();
    }
  },
  computed: {
    getEntityTypeDefintiions() {
      return this.entityTypes.find(typeDef => typeDef.type === this.entity?.type);
    },
    getObservableInfoFields() {
      const hideFields = ["value", "description"];
      return this.getEntityTypeDefintiions?.fields.filter(field => !hideFields.includes(field.field));
    }
  },
  mounted() {
    this.getEntityDetails();
  },
  watch: {
    id() {
      this.getEntityDetails();
    }
  }
};
</script>

<style>
.yeti-card.v-card {
  border-color: #e0e0e0;
}
</style>
