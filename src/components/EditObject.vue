<template>
  <v-card>
    <v-card-title>{{ object.name || object.value }}</v-card-title>
    <v-card-subtitle>Editing {{ typeDefinition?.name }}</v-card-subtitle>
    <v-card-text>
      <object-fields :fields="editableFields" :object="localObject" />
    </v-card-text>

    <v-card-actions>
      <v-btn text="Toggle full screen" color="primary" @click="toggleFullScreen"></v-btn>
      <v-spacer></v-spacer>
      <v-btn
        text="Delete object"
        color="cancel"
        variant="tonal"
        @click="dialogDelete = true"
        v-if="hasOwnerPerms"
      ></v-btn>
      <v-btn text="Cancel" color="cancel" @click="isActive.value = false"></v-btn>
      <v-btn text="Save" color="primary" @click="saveObject" variant="tonal"></v-btn>
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
    <v-dialog v-model="dialogDelete" max-width="420px">
      <v-card>
        <v-card-title class="text-h6">Are you sure you want to delete this item?</v-card-title>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="light" variant="text" @click="dialogDelete = false">Cancel</v-btn>
          <v-btn color="error" variant="flat" @click="deleteObject">Delete</v-btn>
          <v-spacer></v-spacer>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script lang="ts" setup>
import { AxiosError } from "axios";
import { computed, ref } from "vue";
import { useRouter } from "vue-router";

import ObjectFields from "@/components/ObjectFields.vue";
import { DFIQ_TYPES } from "@/definitions/dfiqDefinitions";
import { ENTITY_TYPES } from "@/definitions/entityDefinitions";
import { INDICATOR_TYPES } from "@/definitions/indicatorDefinitions";
import { OBSERVABLE_TYPES } from "@/definitions/observableDefinitions";
import type { FieldDefinition, ObjectTypeDefinition } from "@/definitions/types";
import { eventBus } from "@/plugins/eventbus";
import * as objectsApi from "@/services/objects";
import type { LooseYetiObject, RootType } from "@/services/types";
import { useUserStore } from "@/store/user";

const props = withDefaults(
  defineProps<{
    object?: LooseYetiObject;
    /** Vuetify's dialog activator ref; set .value = false to close. */
    isActive?: { value: boolean };
  }>(),
  {
    object: () => ({}),
    isActive: () => ({ value: false })
  }
);

const emit = defineEmits<{
  success: [object: LooseYetiObject];
  "toggle-fullscreen": [fullScreen: boolean];
}>();

const router = useRouter();
const userStore = useUserStore();

interface FieldError {
  field: string;
  message: string;
}

/** FastAPI 422 body: {detail: [{loc, msg, type}, ...]}. */
interface ValidationErrorDetail {
  loc: (string | number)[];
  msg: string;
}

const localObject = ref<LooseYetiObject>({ ...props.object });
const errors = ref<FieldError[]>([]);
const fullScreen = ref(false);
const dialogDelete = ref(false);

const typeDefinition = computed<ObjectTypeDefinition | undefined>(
  () =>
    ENTITY_TYPES.find(t => t.type === props.object.type) ||
    INDICATOR_TYPES.find(t => t.type === props.object.type) ||
    OBSERVABLE_TYPES.find(t => t.type === props.object.type) ||
    DFIQ_TYPES.find(t => t.type === props.object.type)
);

const editableFields = computed<FieldDefinition[]>(() => typeDefinition.value?.fields.filter(f => f.editable) ?? []);

const hasOwnerPerms = computed(() => userStore.hasOwnerPerms(props.object));

function applyError(error: unknown) {
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

async function saveObject() {
  const rootType = props.object.root_type as RootType;
  const patchRequest: LooseYetiObject = { type: props.object.type, id: props.object.id };
  editableFields.value.forEach(field => {
    patchRequest[field.field] = localObject.value[field.field];
  });

  errors.value = [];
  try {
    const saved = await objectsApi.patch(rootType, props.object.id, patchRequest);
    eventBus.emit("displayMessage", {
      message: `${props.object.name || "Observable"} succesfully updated`,
      status: "success"
    });
    emit("success", saved);
    props.isActive.value = false;
  } catch (error) {
    applyError(error);
  }
}

async function deleteObject() {
  const rootType = props.object.root_type as RootType;
  try {
    await objectsApi.remove(rootType, props.object.id);
    eventBus.emit("displayMessage", {
      message: `${props.object.name || "Observable"} succesfully deleted`,
      status: "success"
    });
    emit("success", props.object);
    props.isActive.value = false;
    router.replace({ path: `/${objectsApi.ENDPOINTS[rootType]}` });
  } catch (error) {
    applyError(error);
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
