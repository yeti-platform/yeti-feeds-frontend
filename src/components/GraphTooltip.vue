<template>
  <v-container style="border-style: solid; border-radius: 10px; margin: 0px; padding: 0">
    <v-card v-if="model" variant="flat" :title="model.label" :prepend-icon="getIconForType(model?.object_type)">
      <v-divider> </v-divider>
      <v-table>
        <tbody>
          <tr>
            <td>Type</td>
            <td>{{ model.object_type }}</td>
          </tr>
          <template v-for="[key, value] in Object.entries(model)" :key="key">
            <tr v-if="!skippedKeys.includes(key)">
              <td>{{ key }}</td>
              <td>{{ value }}</td>
            </tr>
          </template>
        </tbody>
      </v-table>
    </v-card>
  </v-container>
</template>

<script lang="ts" setup>
import { DFIQ_TYPES } from "@/definitions/dfiqDefinitions";
import { ENTITY_TYPES } from "@/definitions/entityDefinitions";
import { INDICATOR_TYPES } from "@/definitions/indicatorDefinitions";
import { OBSERVABLE_TYPES } from "@/definitions/observableDefinitions";
import type { ObjectTypeDefinition } from "@/definitions/types";
import type { LooseYetiObject } from "@/services/types";

const model = defineModel<LooseYetiObject | null>();

const objectTypes: ObjectTypeDefinition[] = ENTITY_TYPES.concat(INDICATOR_TYPES, DFIQ_TYPES, OBSERVABLE_TYPES);
const skippedKeys = ["object_type", "id", "yeti_object_id", "label", "last_analysis", "aliases", "description"];

function getIconForType(type?: string): string | undefined {
  return objectTypes.find(objectType => objectType.type === type)?.icon;
}
</script>
