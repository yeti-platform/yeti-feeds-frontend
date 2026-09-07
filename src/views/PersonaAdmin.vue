<template>
  <!--
    eslint-disable vue/valid-v-slot --
    Vuetify's data table names its cell slots "item.<column>". The rule reads
    the dot as a modifier, which v-slot has none of, so every column template
    trips it. Same false positive as in the other admin views.
  -->
  <v-container fluid>
    <v-data-table-server
      :items="personas"
      :items-length="totalPersonas"
      :headers="personaHeaders"
      :items-per-page="perPage"
      :page="page"
      density="compact"
      :search="personaFilterDebounced"
      @update:options="searchPersonas"
      :loading="loading"
      loading-text="Loading personas..."
    >
      <template v-slot:item.name="{ item }">
        <v-chip color="primary" @click="selectPersona(item)" density="compact">{{ item.name }}</v-chip>
      </template>
      <template v-slot:item.instruction="{ item }">
        <span class="text-medium-emphasis">{{ summarize(item.instruction) }}</span>
      </template>
      <template v-slot:item.tools="{ item }">
        <span v-if="!item.tools.length" class="text-medium-emphasis">all</span>
        <v-chip class="me-2" density="compact" v-for="tool in item.tools" :key="tool">{{ tool }}</v-chip>
      </template>
      <template v-slot:item.model="{ item }">
        <span v-if="!item.model" class="text-medium-emphasis">default</span>
        <span v-else>{{ item.model }}</span>
      </template>
      <template v-slot:item.default="{ item }">
        <v-icon v-if="item.default" color="primary" icon="mdi-check" />
      </template>
      <template v-slot:item.enabled="{ item }">
        <v-icon v-if="item.enabled" color="success" icon="mdi-check" />
        <v-icon v-else color="medium-emphasis" icon="mdi-minus" />
      </template>
    </v-data-table-server>

    <v-navigation-drawer permanent location="right" width="450">
      <v-list-item class="mt-5">
        <v-text-field
          v-model="personaFilter"
          prepend-inner-icon="mdi-magnify"
          label="Filter personas"
          density="compact"
        />
      </v-list-item>
      <v-list-item>
        <v-btn variant="tonal" color="primary" prepend-icon="mdi-plus" @click="newPersona" block>New persona</v-btn>
      </v-list-item>
      <v-divider class="my-5" />
      <v-form>
        <v-list-item>
          <v-list-item-title class="text-h5 pb-2">{{ editing?.id ? "Edit persona" : "New persona" }}</v-list-item-title>
          <v-list-item-subtitle v-if="!editing">Click on a persona's name to edit it.</v-list-item-subtitle>
        </v-list-item>
        <v-list-item v-if="editing">
          <v-text-field v-model="editing.name" label="Name" density="compact" class="pt-2" />
          <v-text-field v-model="editing.description" label="Description" density="compact" />
          <v-textarea
            v-model="editing.instruction"
            label="Instruction"
            :hint="`What the agent is told before every message. At least ${MIN_INSTRUCTION_LENGTH} characters.`"
            persistent-hint
            rows="10"
            auto-grow
            density="compact"
            class="mb-3"
          />
          <!-- A combobox rather than a select: the agent service may be
               unreachable, and a persona must stay editable when nothing can
               be offered to pick from. -->
          <v-combobox
            v-model="editing.tools"
            :items="availableTools"
            item-title="name"
            item-value="name"
            :return-object="false"
            label="Tools"
            hint="Leave empty for every tool. Names the agent does not implement are ignored."
            persistent-hint
            :delimiters="[',', ' ', ';']"
            density="compact"
            class="mb-3"
            multiple
            chips
          >
            <!-- Keyed off the slot props rather than the slot's `item`, whose
                 runtime shape (a wrapper carrying `raw`) and declared type
                 disagree. The title is the tool name; item-title says so. -->
            <template v-slot:item="{ props: itemProps }">
              <v-list-item
                v-bind="itemProps"
                :subtitle="toolDescriptions[String(itemProps.title)]"
                class="tool-option"
              />
            </template>
          </v-combobox>
          <v-select
            v-model="editing.model"
            :items="modelOptions"
            item-title="title"
            item-value="value"
            label="Model"
            hint="A model picked in the chat still wins over this."
            persistent-hint
            density="compact"
            class="mb-3"
          />
          <v-switch v-model="editing.enabled" label="Enabled" color="primary" density="compact" hide-details />
          <v-switch
            v-model="editing.default"
            label="Default"
            color="primary"
            density="compact"
            :hint="editing.default ? 'Used when a chat names no persona. Any other default is cleared.' : ''"
            persistent-hint
            class="mb-3"
          />
          <div class="mt-3">
            <v-btn variant="tonal" color="primary" class="me-2" @click="savePersona" :disabled="!canSave">
              {{ editing.id ? "Update" : "Create" }}
            </v-btn>
            <v-btn
              v-if="editing.id"
              variant="text"
              color="error"
              class="me-2"
              @click="deletePersona"
              :disabled="editing.default"
              :title="editing.default ? 'The default persona cannot be deleted.' : ''"
            >
              Delete
            </v-btn>
            <v-btn variant="text" color="cancel" @click="editing = null">Cancel</v-btn>
          </div>
        </v-list-item>
      </v-form>
    </v-navigation-drawer>
  </v-container>
</template>

<script setup lang="ts">
import _ from "lodash";
import { computed, onMounted, ref, watch } from "vue";

import { eventBus } from "@/plugins/eventbus";
import * as agentsApi from "@/services/agents";
import * as personasApi from "@/services/personas";
import type { AgentPersona, AgentPersonaDraft, ToolInfo } from "@/services/types";
import http from "@/services/http";

/** Vuetify's v-data-table-server hands its state to @update:options. */
interface DataTableOptions {
  page: number;
  itemsPerPage: number;
}

// Mirrors MIN_INSTRUCTION_LENGTH in core/schemas/agent_persona.py, which
// rejects anything shorter. Checked here so the field explains itself rather
// than the save failing.
const MIN_INSTRUCTION_LENGTH = 20;

const personaHeaders = [
  { title: "Name", key: "name" },
  { title: "Description", key: "description" },
  { title: "Instruction", key: "instruction", sortable: false },
  { title: "Tools", key: "tools", sortable: false },
  { title: "Model", key: "model" },
  { title: "Default", key: "default" },
  { title: "Enabled", key: "enabled" }
];

const personas = ref<AgentPersona[]>([]);
const totalPersonas = ref(0);
const perPage = ref(50);
const page = ref(1);
const loading = ref(false);
const personaFilter = ref("");
const personaFilterDebounced = ref("");
const availableModels = ref<string[]>([]);
const availableTools = ref<ToolInfo[]>([]);

// An editable copy, so the table row stays as it was until the save lands.
const editing = ref<AgentPersonaDraft | null>(null);

/** null is a real choice — it means "whatever the service defaults to". */
const modelOptions = computed(() => [
  { title: "Service default", value: null },
  ...availableModels.value.map(model => ({ title: model, value: model }))
]);

const toolDescriptions = computed<Record<string, string>>(() =>
  Object.fromEntries(availableTools.value.map(tool => [tool.name, tool.description]))
);

const canSave = computed(
  () => !!editing.value?.name && (editing.value?.instruction?.trim().length ?? 0) >= MIN_INSTRUCTION_LENGTH
);

function summarize(instruction: string): string {
  const firstLine = instruction.trim().split("\n")[0];
  return firstLine.length > 80 ? `${firstLine.slice(0, 80)}…` : firstLine;
}

async function searchPersonas(options: DataTableOptions) {
  page.value = options.page;
  perPage.value = options.itemsPerPage;
  loading.value = true;
  try {
    const response = await personasApi.search({
      name: personaFilter.value,
      count: options.itemsPerPage,
      page: options.page - 1
    });
    personas.value = response.personas;
    totalPersonas.value = response.total;
  } finally {
    loading.value = false;
  }
}

function refresh() {
  searchPersonas({ page: page.value, itemsPerPage: perPage.value });
}

function selectPersona(persona: AgentPersona) {
  editing.value = { ...persona, tools: [...persona.tools] };
}

function newPersona() {
  editing.value = {
    name: "",
    description: "",
    instruction: "",
    tools: [],
    model: null,
    enabled: true,
    default: false
  };
}

async function savePersona() {
  if (!editing.value) {
    return;
  }
  const persona = editing.value;
  if (persona.id) {
    await personasApi.update(persona.id, persona);
  } else {
    await personasApi.create(persona);
  }
  eventBus.emit("displayMessage", {
    message: `Persona ${persona.name} successfully saved`,
    status: "success"
  });
  editing.value = null;
  refresh();
}

async function deletePersona() {
  if (!editing.value?.id) {
    return;
  }
  const name = editing.value.name;
  await personasApi.remove(editing.value.id);
  eventBus.emit("displayMessage", { message: `Persona ${name} deleted`, status: "success" });
  editing.value = null;
  refresh();
}

onMounted(async () => {
  try {
    const { data } = await http.get<{ models: string[] }>("/agents/models");
    availableModels.value = data.models || [];
  } catch {
    // The agent service being unreachable must not stop personas being edited;
    // the model field just falls back to the service default.
    availableModels.value = [];
  }
  try {
    availableTools.value = (await agentsApi.listTools()).tools;
  } catch {
    // Same: the tools field stays a free-text combobox, which is what it was
    // before the agent service could be asked what it implements.
    availableTools.value = [];
  }
});

watch(
  personaFilter,
  _.debounce(() => {
    personaFilterDebounced.value = personaFilter.value;
  }, 200)
);
</script>

<style scoped>
/* Tool descriptions run to a few sentences; Vuetify truncates a subtitle to a
   single line by default, which would cut every one of them off mid-sentence. */
.tool-option :deep(.v-list-item-subtitle) {
  white-space: normal;
  opacity: 0.75;
}

.tool-option {
  max-width: 40rem;
}
</style>
