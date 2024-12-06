
<template>
  <v-container style="border-style: solid; border-radius: 10px; margin: 0px; padding: 0;">
    <v-card v-if="model" variant="flat" borde="xs"
    :title="model.label"
    :prepend-icon=getIconForType(model?.object_type)
    >
    <v-divider> </v-divider>
    <v-table>      
        <tbody>
          <tr>
            <td>Type</td>
            <td>{{ model.object_type }}</td>
          </tr>
          <tr v-for="[key, value], i of Object.entries(model)">
            <template v-if="!skipped_keys.includes(key)">
              <td>{{ key }}</td>
              <td>{{ value }}</td>
            </template>
          </tr>
        </tbody>
      </v-table>
    </v-card>
  </v-container>
</template>

<script lang="ts" setup>

const model = defineModel()

import { ENTITY_TYPES } from "@/definitions/entityDefinitions.js";
import { INDICATOR_TYPES } from "@/definitions/indicatorDefinitions.js";
import { OBSERVABLE_TYPES } from "@/definitions/observableDefinitions.js";
import { DFIQ_TYPES } from "@/definitions/dfiqDefinitions.js";

</script>

<script lang="ts">

export default {
  name: "GraphTooltip",


  data() {
    return {
      hops: [1, 2],
      graph_layout: "circular",
      skipped_keys: ['object_type', 'id', 'yeti_object_id', 'label', 'last_analysis', 'aliases', 'description'],
      objectTypes: ENTITY_TYPES.concat(INDICATOR_TYPES).concat(DFIQ_TYPES).concat(OBSERVABLE_TYPES),
    };
  },

  mounted() {
    console.log("GraphTooltip mounted");
  },

  methods: {
    getIconForType(type: string) {
      return this.objectTypes.find(objectType => objectType.type === type)?.icon;
    },
  },

  renderKey(key: string)
  {
    return !this.dont_render.includes(key);
  }
};

</script>