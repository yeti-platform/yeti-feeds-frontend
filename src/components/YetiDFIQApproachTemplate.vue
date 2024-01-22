<template>
  <v-sheet>
    <div class="text-h6">{{ description.summary }}</div>
    {{ description.details }}
    <div class="mt-5">
      <div class="font-weight-bold mb-2">References:</div>
      <ul class="ml-5">
        <li class="mb-2" v-for="ref in description.references"><span v-html="markdownifyText(ref)"></span></li>
      </ul>
      <ul class="ml-5" v-if="description.references_internal.length > 0">
        <li class="mb-2" v-for="ref in description.references_internal">
          <span v-html="markdownifyText(ref)"></span>
        </li>
      </ul>
    </div>
  </v-sheet>

  <v-divider class="my-7"></v-divider>

  <v-card class="dfiq-covered ma-4">
    <v-card-title>Covered</v-card-title>
    <v-card-text>
      <ul>
        <li class="mb-2 ml-5" v-for="ref in view.notes.covered"><span v-html="markdownifyText(ref)"></span></li>
      </ul>
    </v-card-text>
  </v-card>

  <v-card class="dfiq-not-covered ma-4">
    <v-card-title>Not covered</v-card-title>
    <v-card-text>
      <ul>
        <li class="mb-2 ml-5" v-for="ref in view.notes.not_covered"><span v-html="markdownifyText(ref)"></span></li>
      </ul>
    </v-card-text>
  </v-card>

  <v-divider class="my-7"></v-divider>

  <v-sheet>
    <div class="text-h6">Data</div>
    <v-table class="mt-3">
      <tbody>
        <tr v-for="ref in view.data">
          <td>
            <v-chip class="mr-2" density="comfortable" variant="tonal" color="primary" rounded>{{ ref.type }}</v-chip>
          </td>
          <td>{{ ref.value }}</td>
        </tr>
      </tbody>
    </v-table>
  </v-sheet>

  <v-divider class="my-7"></v-divider>

  <v-card>
    <v-tabs v-model="dfiqTab">
      <v-tab v-for="proc in view.processors" :value="proc.name">{{ proc.name }}</v-tab>
    </v-tabs>

    <v-card-text>
      <v-window v-model="dfiqTab">
        <v-window-item v-for="proc in view.processors" :value="proc.name">
          <div class="text pb-4">
            Recommended CLI options:
            <code class="dfiq-option bg-red-lighten-5 pa-1 ms-2" v-for="option in proc.options"
              >--{{ option.type }} {{ option.value }}</code
            >
          </div>
          <div class="text-h6 mb-2">Analysis options</div>
          <v-expansion-panels multiple>
            <v-expansion-panel v-for="opt in proc.analysis" :title="opt.name">
              <v-expansion-panel-text>
                <ol class="dfiq-step-list">
                  <li v-for="step in opt.steps" class="ml-2">
                    <div class="dfiq-step-description d-flex align-center">
                      <div>{{ step.description }}</div>
                      <div>
                        <v-chip class="ml-3" density="comfortable" variant="tonal" color="primary" rounded>{{
                          step.type
                        }}</v-chip>
                      </div>
                    </div>
                    <div class="dfiq-step-value my-4 mx-2 pa-3 rounded">
                      <code>{{ step.value }}</code>
                    </div>
                  </li>
                </ol>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
        </v-window-item>
      </v-window>
    </v-card-text>
  </v-card>
</template>

<script lang="ts" setup>
import DOMPurify from "dompurify";
import { marked } from "marked";
</script>

<script lang="ts">
export default {
  props: {
    description: {
      type: Object,
      required: true
    },
    view: {
      type: Object,
      required: true
    },
    dfiqType: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      dfiqTab: "one"
    };
  },
  methods: {
    markdownifyText(text) {
      return DOMPurify.sanitize(marked(text));
    }
  },
  computed: {
    viewCoverageMarkdown() {
      let text = `### Notes \n\n`;
      if (this.view.notes.covered.length > 0) {
        text += "\n\n**Covered**\n\n";
        this.view.notes.covered.forEach(ref => {
          text += `- ${ref}\n`;
        });
      }

      if (this.view.notes.not_covered.length > 0) {
        text += "\n\n**Not Covered**\n\n";
        this.view.notes.not_covered.forEach(ref => {
          text += `- ${ref}\n`;
        });
      }

      return DOMPurify.sanitize(marked(text));
    },
    viewDataMarkdown() {
      let text = `### Data \n\n`;
      if (this.view.data.length > 0) {
        text += "\n\n**Data**\n\n";
        this.view.data.forEach(ref => {
          text += `- ${ref.type} : ${ref.value}\n`;
        });
      }

      return DOMPurify.sanitize(marked(text));
    }
  }
};
</script>

<style>
.yeti-markdown h1,
.yeti-markdown h2,
.yeti-markdown h3 {
  margin-bottom: 1.5rem;
  margin-top: 1rem;
}

.yeti-markdown p {
  margin-bottom: 0.5rem;
  margin-top: 0.5rem;
}

.yeti-markdown li {
  margin-left: 2rem;
  margin-bottom: 0.5rem;
}

.yeti-markdown pre {
  font-family: Roboto Mono, monospace;
  border: 1px solid #e0e0e0;
  margin: 0.5rem 0 0.5rem 0;
  padding: 0.5rem;
  border-radius: 0.5rem;
}

.yeti-markdown p {
  margin-bottom: 0.5rem;
  margin-top: 0.5rem;
}

.dfiq-option {
  /* border: 1px solid red; */
}

.dfiq-step-value {
  border: 1px solid #e0e0e0;
  /* color: red; */
}

.dfiq-step-description {
  /* margin-left: 1rem;
  color: blue; */
}

.dfiq-covered {
  border: 2px solid rgb(var(--v-theme-success));
  background: rgba(0, 160, 66, 0.1);
}

.dfiq-not-covered {
  border: 2px solid rgb(var(--v-theme-error));
  background: rgba(155, 0, 0, 0.1);
}
</style>
