<template>
  <v-card class="ma-2">
    <v-expansion-panels :readonly="this.context.length === 0" flat static>
      <v-expansion-panel>
        <v-expansion-panel-title class="edit-ctx-title break-title">
          <p class="text-subtitle-1 me-2">Context entries</p>
          <v-chip
            label
            color="green"
            v-for="source in new Set(context.map(c => c.source))"
            v-bind:key="source"
            size="small"
            density="comfortable"
            class="me-2"
          >
            {{ source }}
          </v-chip>

          <v-dialog height="90%">
            <template v-slot:activator="{ props }">
              <v-btn v-bind="props" class="ms-2 edit-ctx-btn" size="small" variant="text" density="comfortable"
                ><v-icon class="me-2">mdi-pencil</v-icon>{{ this.context.length === 0 ? "add" : "edit" }}</v-btn
              >
            </template>
            <template v-slot:default="{ isActive }">
              <v-card max-height="100%">
                <v-card-title class="text-h6">Edit context</v-card-title>
                <v-card-text>
                  <v-textarea class="yeti-code" v-model="jsonContext" v-on:input="checkJson" rows="1" auto-grow />
                  <v-alert type="error" v-if="jsonError !== ''">Invalid JSON: {{ jsonError }}</v-alert>
                </v-card-text>
                <v-card-actions>
                  <v-btn color="cancel" variant="tonal" @click="isActive.value = false">Cancel</v-btn>
                  <v-btn color="primary" variant="tonal" @click="updateContext(isActive)">Save</v-btn>
                </v-card-actions>
              </v-card>
            </template>
          </v-dialog>
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <v-treeview
            :items="ContextTreeView()"
            item-value="id"
            activatable
            open-on-click
            slim
            density="compact"
            max-height="300"
            width="100%"
            v-if="showCtxDetails"
          >
          </v-treeview>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
  </v-card>
</template>

<script>
import axios from "axios";
import { VTreeview } from "vuetify/labs/VTreeview";

export default {
  components: { VTreeview },
  props: {
    context: {
      type: Object,
      required: true
    },
    updateEndpoint: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      jsonContext: JSON.stringify(this.context, null, 2),
      jsonError: "",
      showCtxDetails: true
    };
  },
  // watch: {
  //   context: {
  //     handler(newContext) {
  //       this.jsonContext = JSON.stringify(newContext, null, 2);
  //     },
  //     deep: true
  //   }
  // },
  methods: {
    checkJson() {
      try {
        JSON.parse(this.jsonContext);
        this.jsonError = "";
      } catch (e) {
        this.jsonError = e.message;
      }
      return this.jsonError;
    },
    updateContext(isActive) {
      let contextPayload;
      try {
        contextPayload = JSON.parse(this.jsonContext);
      } catch (e) {
        return;
      }
      axios
        .put(`/api/v2/${this.updateEndpoint}/context`, { context: contextPayload })
        .then(response => {
          this.$emit("update:context", response.data.context);
          isActive.value = false;
        })
        .catch(error => {
          console.log(error);
        });
    },
    ContextTreeView() {
      var items = [];
      var id = 0;

      function treeify(root, data) {
        if (Array.isArray(data)) {
          var count = 0;
          for (const item of data) {
            var element = { id: id++, title: count.toString(), children: [] };
            root.push(element);
            count++;
            treeify(element.children, item);
          }
        } else if (typeof data === "object") {
          for (const [key, value] of Object.entries(data)) {
            if (key === "source") {
              continue;
            }
            if (value === null) {
              var title = key + ": N/A";
              var element = { id: id++, title: title };
              root.push(element);
            } else if (Array.isArray(value) || typeof value === "object") {
              element = { id: id++, title: key, children: [] };
              root.push(element);
              treeify(element.children, value);
            } else {
              var title = key + ": " + value;
              var element = { id: id++, title: title };
              root.push(element);
            }
          }
        }
      }
      for (const ctx of this.context) {
        var element = { id: id++, title: ctx.source, children: [], color: "warning" };
        items.push(element);
        treeify(element.children, ctx);
      }
      return items;
    }
  }
};
</script>

<style>
.yeti-code-container {
  max-height: 100%;
  overflow: auto;
}

.yeti-code textarea,
.yeti-code input {
  font-family: monospace;
}

.edit-ctx-title .edit-ctx-btn {
  display: none;
}

.edit-ctx-title:hover .edit-ctx-btn {
  display: inline;
}
</style>
