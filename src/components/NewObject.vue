<template>
  <v-card>
    <v-card-title>New {{ typeDefinition?.name }}</v-card-title>
    <v-card-text>
      <object-fields :fields="editableFields" :object="newObject" />
    </v-card-text>

    <v-card-actions>
      <v-btn text="Toggle full screen" color="primary" @click="toggleFullScreen"></v-btn>
      <v-spacer></v-spacer>
      <v-btn text="Cancel" color="cancel" @click="emit('close')"></v-btn>
      <v-btn text="Save" @click="saveObject" variant="tonal"></v-btn>
    </v-card-actions>
    <v-alert v-if="errors.length > 0" type="error">
      Error saving {{ typeDefinition?.name }}:
      <ul>
        <li v-for="error in errors">
          <strong>{{ error.field }}</strong
          >: {{ error.message }}
        </li>
      </ul>
    </v-alert>
  </v-card>
</template>

<script lang="ts" setup>
import { AxiosError } from "axios";
import { computed, ref } from "vue";
import { useRouter } from "vue-router";

import ObjectFields from "@/components/ObjectFields.vue";
import { ENTITY_TYPES } from "@/definitions/entityDefinitions";
import { INDICATOR_TYPES } from "@/definitions/indicatorDefinitions";
import { OBSERVABLE_TYPES } from "@/definitions/observableDefinitions";
import type { FieldDefinition, ObjectTypeDefinition } from "@/definitions/types";
import { eventBus } from "@/plugins/eventbus";
import * as objectsApi from "@/services/objects";
import type { CreatableRootType, LooseYetiObject } from "@/services/types";

const props = withDefaults(defineProps<{ objectType?: string; redirect?: boolean }>(), {
  objectType: "",
  redirect: true
});

const emit = defineEmits<{
  close: [];
  success: [object: LooseYetiObject];
  "toggle-fullscreen": [fullScreen: boolean];
}>();

const router = useRouter();

interface FieldError {
  field: string;
  message: string;
}

/** FastAPI 422 body: {detail: [{loc, msg, type}, ...]}. */
interface ValidationErrorDetail {
  loc: (string | number)[];
  msg: string;
}

const newObject = ref<LooseYetiObject>({});
const errors = ref<FieldError[]>([]);
const fullScreen = ref(false);

const typeDefinition = computed<ObjectTypeDefinition | undefined>(
  () =>
    ENTITY_TYPES.find(t => t.type === props.objectType) ||
    INDICATOR_TYPES.find(t => t.type === props.objectType) ||
    OBSERVABLE_TYPES.find(t => t.type === props.objectType)
);

const editableFields = computed<FieldDefinition[]>(() => typeDefinition.value?.fields.filter(f => f.editable) ?? []);

/** The family this object belongs to, used for the create endpoint + redirect. */
const objectRootType = computed<CreatableRootType | "unknown">(() => {
  if (ENTITY_TYPES.find(t => t.type === props.objectType)) {
    return "entity";
  } else if (INDICATOR_TYPES.find(t => t.type === props.objectType)) {
    return "indicator";
  } else if (OBSERVABLE_TYPES.find(t => t.type === props.objectType)) {
    return "observable";
  }
  return "unknown";
});

newObject.value = { type: props.objectType, root_type: objectRootType.value };

async function saveObject() {
  const rootType = objectRootType.value;
  if (rootType === "unknown") {
    return;
  }

  const request: LooseYetiObject = { type: props.objectType };
  editableFields.value.forEach(field => {
    request[field.field] = newObject.value[field.field];
  });

  errors.value = [];
  try {
    const saved = await objectsApi.create(rootType, request);
    eventBus.emit("displayMessage", { message: `New ${props.objectType} created`, status: "success" });
    if (props.redirect) {
      router.push({ path: `/${objectsApi.ENDPOINTS[rootType]}/${saved.id}` });
    } else {
      emit("close");
    }
    emit("success", saved);
  } catch (error) {
    if (!(error instanceof AxiosError) || !error.response) {
      throw error;
    }
    if (error.response.status === 422) {
      const details = error.response.data.detail as ValidationErrorDetail[];
      errors.value = details.map(detail => ({ field: String(detail.loc[3]), message: detail.msg }));
    } else {
      errors.value = [{ field: "details", message: String(error.response.data.detail) }];
    }
  }
}

function toggleFullScreen() {
  fullScreen.value = !fullScreen.value;
  emit("toggle-fullscreen", fullScreen.value);
}
</script>

<style>
.yeti-code textarea {
  font-family: monospace;
}
</style>
