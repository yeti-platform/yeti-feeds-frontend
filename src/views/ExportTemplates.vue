<template>
  <v-sheet class="ma-5" width="98%">
    <div v-if="selectedTemplate != null" class="ma-5">
      <div v-if="mode == 'new'" class="mb-5 text-h5">New template</div>
      <div v-if="mode == 'edit'" class="mb-5 text-h5">Editing template "{{ selectedTemplate.name }}"</div>
      <v-text-field
        density="compact"
        label="Template name"
        v-model="selectedTemplate.name"
        :disabled="mode === 'edit'"
      ></v-text-field>
      <v-textarea
        density="compact"
        class="yeti-code"
        label="Template content"
        v-model="selectedTemplate.template"
        auto-grow
        required
      />
      <div class="d-flex justify-space-between">
        <v-btn-group rounded="1" density="compact">
          <v-btn color="primary" @click="saveTemplate">Save</v-btn>
          <v-btn color="light" @click="selectedTemplate = null">Cancel</v-btn>
        </v-btn-group>
        <v-btn-group rounded="1" density="compact">
          <v-btn color="error" @click="dialogDelete = true">Delete</v-btn>
        </v-btn-group>
      </div>
    </div>
    <div v-else class="ma-5">
      <em class="">Select a template on the right to edit it, or click "New template" to create a new one.</em>
    </div>
  </v-sheet>

  <v-navigation-drawer permament location="right" width="500" ref="drawer">
    <v-sheet class="ma-4">
      <v-data-table :items="templates" :headers="headers" density="compact">
        <template v-slot:item.name="{ item }">
          <v-btn variant="plain" density="compact" @click="editTemplate(item)">{{ item.name }}</v-btn>
        </template>

        <template v-slot:item.actions="{ item }">
          <v-icon size="small" class="me-2" @click="editTemplate(item)"> mdi-pencil </v-icon>
          <v-icon size="small" @click="deleteTemplate(item)"> mdi-delete </v-icon>
        </template>
      </v-data-table>
      <v-btn-group rounded="1" density="compact">
        <v-btn color="primary" @click="newTemplate">New template</v-btn>
      </v-btn-group>
    </v-sheet>
  </v-navigation-drawer>
  <v-dialog v-model="dialogDelete" max-width="420px">
    <v-card>
      <v-card-title class="text-h6">Are you sure you want to delete this item?</v-card-title>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="light" variant="text" @click="dialogDelete = false">Cancel</v-btn>
        <v-btn color="error" variant="flat" @click="deleteTemplate">Delete</v-btn>
        <v-spacer></v-spacer>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
import axios from "axios";
</script>

<script lang="ts">
export default {
  name: "ExportTemplates",
  data() {
    return {
      templates: [],
      defaultTemplate: {
        name: "",
        template: ""
      },
      selectedTemplate: null,
      headers: [
        { title: "Name", key: "name" },
        { title: "ID", key: "id" }
      ],
      mode: null as string | null,
      dialogDelete: false
    };
  },
  mounted() {
    this.fetchTemplates();
  },
  methods: {
    fetchTemplates() {
      axios
        .post("/api/v2/templates/search", { query: { name: "" } })
        .then(response => {
          this.templates = response.data.templates;
        })
        .catch(error => {
          console.log(error);
        })
        .finally(() => {});
    },
    deleteTemplate() {
      axios
        .delete(`/api/v2/templates/${this.selectedTemplate.id}`)
        .then(() => {
          this.fetchTemplates();
          this.dialogDelete = false;
          this.$eventBus.emit("displayMessage", {
            status: "success",
            message: `Template ${this.selectedTemplate.name} succesfully deleted`
          });
          this.selectedTemplate = null;
        })
        .catch(error => {
          console.log(error);
        })
        .finally(() => {});
    },
    saveTemplate() {
      if (this.mode === "new") {
        axios
          .post(`/api/v2/templates/`, { template: this.selectedTemplate })
          .then(() => {
            this.fetchTemplates();
            this.$eventBus.emit("displayMessage", {
              status: "success",
              message: `Template ${this.selectedTemplate.name} succesfully created`
            });
            this.selectedTemplate = null;
          })
          .catch(error => {
            console.log(error);
          })
          .finally(() => {});
      } else if (this.mode === "edit") {
        axios
          .patch(`/api/v2/templates/${this.selectedTemplate.id}`, { template: this.selectedTemplate })
          .then(() => {
            this.fetchTemplates();
            this.$eventBus.emit("displayMessage", {
              status: "success",
              message: `Template ${this.selectedTemplate.name} succesfully updated`
            });
            this.selectedTemplate = null;
          })
          .catch(error => {
            console.log(error);
          })
          .finally(() => {});
      }
    },
    newTemplate() {
      this.selectedTemplate = this.defaultTemplate;
      this.mode = "new";
    },
    editTemplate(item) {
      this.selectedTemplate = { ...item };
      this.mode = "edit";
    }
  }
};
</script>

<style>
.yeti-code textarea {
  font-family: monospace;
}
</style>
