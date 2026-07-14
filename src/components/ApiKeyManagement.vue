<template>
  <v-card>
    <v-card-title>API Keys</v-card-title>
    <v-card-text>
      <v-data-table :items="Object.values(apiKeys)" :headers="apiKeyHeaders">
        <template v-slot:item.created="{ item }">
          {{ formatDate(item.created) }}
        </template>
        <template v-slot:item.scopes="{ item }">
          <v-chip v-for="scope in item.scopes" :key="scope" density="compact" color="green">{{ scope }}</v-chip>
        </template>
        <template v-slot:item.last_used="{ item }">
          <span v-if="item.last_used">{{ formatDate(item.last_used) }}</span>
          <span v-else>Never</span>
        </template>

        <template v-slot:item.actions="{ item }">
          <v-dialog max-width="420px">
            <template v-slot:activator="{ props }">
              <v-btn v-bind="props" class="ms-2" size="small" variant="outlined" color="error">
                <v-icon>mdi-delete</v-icon>
              </v-btn>
            </template>
            <template v-slot:default="{ isActive }">
              <v-card>
                <v-card-title class="text-h6">Delete API key '{{ item.name }}'?</v-card-title>
                <v-card-text>This action is irreversible</v-card-text>
                <v-card-actions>
                  <v-spacer></v-spacer>
                  <v-btn color="light" variant="text" @click="isActive.value = false">Cancel</v-btn>
                  <v-btn color="error" variant="flat" @click="removeApiKey(item, isActive)">Delete</v-btn>
                  <v-spacer></v-spacer>
                </v-card-actions>
              </v-card>
            </template>
          </v-dialog>
        </template>

        <template v-slot:item.enabled="{ item }">
          <v-switch
            density="compact"
            v-model="item.enabled"
            color="green"
            hide-details
            @click="flipApiKey(item)"
          ></v-switch>
        </template>
      </v-data-table>
    </v-card-text>
    <v-card-actions>
      <v-dialog max-width="420px" v-model="newKeyDialog">
        <template v-slot:activator="{ props }">
          <v-btn v-bind="props" class="ms-2" size="small" variant="outlined" prepend-icon="mdi-plus">New API key</v-btn>
        </template>
        <v-card>
          <v-card-title class="text-h6">New API key</v-card-title>
          <v-card-text v-if="!newApiKeyToken">
            <v-text-field density="compact" label="Key name" v-model="newApiKey.name"></v-text-field>
            <v-combobox
              v-model="newApiKey.scopes"
              label="Scopes"
              :items="['all']"
              clearable
              multiple
              density="compact"
              :delimiters="[',', ' ', ';']"
            />
          </v-card-text>
          <v-card-text v-else>
            This is the only time your API key will be accessible. Please copy it to your clipboard now and store it in
            a secure location. You'll need it to access the API and won't be able to retrieve it again later.
            <v-text-field
              class="mt-3"
              v-model="newApiKeyToken"
              append-inner-icon="mdi-content-copy"
              @click="copyApiKey(newApiKeyToken)"
              hint="Click the textfield to copy the key to your clipboard"
              persistent-hint
            ></v-text-field>
          </v-card-text>
          <v-card-actions v-if="!newApiKeyToken">
            <v-spacer></v-spacer>
            <v-btn color="light" variant="text" @click="newKeyDialog = false">Cancel</v-btn>
            <v-btn variant="flat" @click="addApiKey">Create</v-btn>
            <v-spacer></v-spacer>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-card-actions>
  </v-card>
</template>

<script setup lang="ts">
import moment from "moment";
import { reactive, ref, watch } from "vue";

import { eventBus } from "@/plugins/eventbus";
import type { RegisteredApiKey } from "@/services/types";
import * as usersApi from "@/services/users";

const props = withDefaults(
  defineProps<{
    profileId: string;
    /** Keyed by key name — this is how the backend serializes User.api_keys. */
    apiKeys?: Record<string, RegisteredApiKey>;
  }>(),
  { apiKeys: () => ({}) }
);

const emit = defineEmits<{
  apiKeyUpdate: [apiKeys: Record<string, RegisteredApiKey>];
}>();

const apiKeyHeaders = [
  { title: "Created", value: "created" },
  { title: "Name", value: "name" },
  { title: "Scopes", value: "scopes" },
  { title: "Last used", value: "last_used" },
  { title: "Enabled", value: "enabled" },
  { title: "Actions", value: "actions" }
];

const newKeyDialog = ref(false);
const newApiKey = reactive<{ name: string; scopes: string[] }>({ name: "", scopes: [] });
const newApiKeyToken = ref<string | null>(null);

/**
 * The token is only ever shown once, right after creation. Reset the form when
 * the dialog closes, otherwise reopening it shows the previous key's token and
 * no way back to the creation form.
 */
watch(newKeyDialog, open => {
  if (!open) {
    newApiKeyToken.value = null;
    newApiKey.name = "";
    newApiKey.scopes = [];
  }
});

function formatDate(date: string | null | undefined): string {
  return date ? moment(date).format("YYYY-MM-DD HH:mm:ss ZZ") : "";
}

async function addApiKey() {
  const response = await usersApi.newApiKey({
    user_id: props.profileId,
    name: newApiKey.name,
    scopes: newApiKey.scopes
  });
  newApiKeyToken.value = response.token;
  emit("apiKeyUpdate", response.api_keys);
}

async function flipApiKey(item: RegisteredApiKey) {
  const key = await usersApi.toggleApiKey({ user_id: props.profileId, name: item.name });
  item.enabled = key.enabled;
}

async function removeApiKey(item: RegisteredApiKey, isActive: { value: boolean }) {
  const response = await usersApi.deleteApiKey({ user_id: props.profileId, name: item.name });
  isActive.value = false;
  emit("apiKeyUpdate", response.api_keys);
  eventBus.emit("displayMessage", {
    message: `API key '${item.name}' succesfully deleted.`,
    status: "success"
  });
}

function copyApiKey(token: string | null) {
  if (!token) {
    return;
  }
  navigator.clipboard.writeText(token);
  eventBus.emit("displayMessage", { status: "info", message: "API key copied to clipboard!" });
}
</script>
