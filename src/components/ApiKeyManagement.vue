<template>
  <v-card>
    <v-card-title>API Keys</v-card-title>
    <v-card-text>
      <v-data-table :items="Object.values(apiKeys)" :headers="apiKeyHeaders">
        <template v-slot:item.created="{ item }">
          {{ moment(item.created).format("YYYY-MM-DD HH:mm:ss ZZ") }}
        </template>
        <template v-slot:item.scopes="{ item }">
          <v-chip v-for="scope in item.scopes" density="compact" color="green">{{ scope }}</v-chip>
        </template>
        <template v-slot:item.last_used="{ item }">
          <span v-if="item.last_used">
            {{ moment(item.last_used).format("YYYY-MM-DD HH:mm:ss ZZ") }}
          </span>
          <span v-else>Never</span>
        </template>

        <template v-slot:item.actions="{ item }">
          <v-dialog max-width="420px">
            <template v-slot:activator="{ props }">
              <v-btn v-bind="props" class="ms-2" size="small" variant="outlined" color="error"
                ><v-icon>mdi-delete</v-icon></v-btn
              >
            </template>
            <template v-slot:default="{ isActive }">
              <v-card>
                <v-card-title class="text-h6">Delete API key !'{{ item.name }}'?</v-card-title>
                <v-card-text>This action is irreversible</v-card-text>
                <v-card-actions>
                  <v-spacer></v-spacer>
                  <v-btn color="light" variant="text" @click="isActive.value = false">Cancel</v-btn>
                  <v-btn color="error" variant="flat" @click="deleteApiKey(item)">Delete</v-btn>
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
            @click="toggleApiKey(item)"
          ></v-switch>
        </template>
      </v-data-table>
    </v-card-text>
    <v-card-actions>
      <v-dialog max-width="420px">
        <template v-slot:activator="{ props }">
          <v-btn v-bind="props" class="ms-2" size="small" variant="outlined" prepend-icon="mdi-plus">New API key</v-btn>
        </template>
        <template v-slot:default="{ isActive }">
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
              This is the only time your API key will be accessable. Please copy it to your clipboard now and store it
              in a secure location. You'll need it to access the API and won't be able to retrieve it again later.
              <br />
              <div class="d-flex justify-center">
                <v-btn class="mt-6" @click="copyApiKey(newApiKeyToken, isActive)" prepend-icon="mdi-content-copy"
                  >Copy API key to clipboard</v-btn
                >
              </div>
            </v-card-text>
            <v-card-actions v-if="!newApiKeyToken">
              <v-spacer></v-spacer>
              <v-btn color="light" variant="text" @click="isActive.value = false">Cancel</v-btn>
              <v-btn variant="flat" @click="addApiKey()">Create</v-btn>
              <v-spacer></v-spacer>
            </v-card-actions>
          </v-card>
        </template>
      </v-dialog>
    </v-card-actions>
  </v-card>
</template>

<script lang="ts" setup>
import moment from "moment";
import axios from "axios";
</script>

<script lang="ts">
export default {
  name: "ApiKeyManagement",
  data() {
    return {
      apiKeyHeaders: [
        { title: "Created", value: "created" },
        { title: "Name", value: "name" },
        { title: "Scopes", value: "scopes" },
        { title: "Last used", value: "last_used" },
        { title: "Enabled", value: "enabled" },
        { title: "Actions", value: "actions" }
      ],
      newApiKey: {
        name: "",
        scopes: []
      },
      newApiKeyToken: null
    };
  },
  props: {
    profileId: {
      type: String,
      default: null
    },
    apiKeys: {
      type: Object,
      default: {}
    }
  },
  methods: {
    addApiKey() {
      axios
        .post(`/api/v2/users/new-api-key`, {
          user_id: this.profileId,
          name: this.newApiKey.name,
          scopes: this.newApiKey.scopes
        })
        .then(response => {
          this.newApiKeyToken = response.data.token;
          this.$emit("apiKeyUpdate", response.data.api_keys);
        })
        .catch(error => {
          console.log(error);
        })
        .finally(() => {});
    },
    toggleApiKey(item) {
      axios
        .post(`/api/v2/users/toggle-api-key`, { user_id: this.profileId, name: item.name })
        .then(response => {
          item.enabled = response.data.enabled;
        })
        .catch(error => {
          console.log(error);
        })
        .finally(() => {});
    },
    deleteApiKey(item) {
      axios
        .post(`/api/v2/users/delete-api-key`, { user_id: this.profileId, name: item.name })
        .then(response => {
          this.$emit("apiKeyUpdate", response.data.api_keys);
          this.$eventBus.emit("displayMessage", {
            message: `API key '${item.name}' succesfully deleted.`,
            status: "success"
          });
        })
        .catch(error => {
          console.log(error);
        })
        .finally(() => {});
    },
    copyApiKey(text, isActive) {
      navigator.clipboard.writeText(text);
      this.$eventBus.emit("displayMessage", {
        status: "info",
        message: "API key copied to clipboard!"
      });
      this.newApiKeyToken = null;
      isActive.value = false;
    }
  }
};
</script>

<style scoped>
/* Add custom styles here */
</style>
