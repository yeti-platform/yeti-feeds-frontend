<template>
  <v-sheet>
    <v-chip v-for="tag in approach.tags" class="ml-2" density="comfortable" variant="tonal" color="primary" rounded>{{
      tag
    }}</v-chip>
    <div class="yeti-markdown" v-html="markdownifyText(approach.description)"></div>
    <div class="mt-5" v-if="approach.references.length > 0">
      <div class="font-weight-bold mb-2">References:</div>
      <ul class="ml-5">
        <li class="mb-2" v-for="ref in approach.references"><span v-html="markdownifyText(ref)"></span></li>
      </ul>
      <ul class="ml-5" v-if="approach.references_internal?.length > 0">
        <li class="mb-2" v-for="ref in approach.references_internal">
          <span v-html="markdownifyText(ref)"></span>
        </li>
      </ul>
    </div>
    <div v-else class="mt-5"><em>No references</em></div>
  </v-sheet>

  <v-divider class="my-7" v-if="approach.notes.covered.length + approach.notes.not_covered.length > 0"></v-divider>
  <div class="mt-5" v-else><em>No coverage data</em></div>

  <v-sheet>
    <ol>
      <li v-for="step in approach.steps" class="ml-2 mb-4">
        <!-- {{ step }} -->
        <div>
          {{ step.name }}
          <v-chip class="ml-2" density="compact" variant="tonal" color="primary" rounded>{{ step.type }}</v-chip>
          <v-chip class="ml-2" density="compact" variant="tonal" color="primary" rounded>{{ step.stage }}</v-chip>
        </div>
        <div class="ma-2">
          <code>{{ step.value }}</code>
        </div>
        <!-- <div>
            <v-chip class="ml-3" density="comfortable" variant="tonal" color="primary" rounded>{{ step.type }}</v-chip>
          </div>
          <div class="dfiq-step-value my-4 mx-2 pa-3 rounded">
            <code>{{ step.value }}</code>
          </div> -->
      </li>
    </ol>
  </v-sheet>

  <v-divider class="my-7" v-if="approach.notes.covered.length + approach.notes.not_covered.length > 0"></v-divider>

  <v-card class="dfiq-covered ma-4" v-if="approach.notes.covered.length > 0">
    <v-card-title>Covered</v-card-title>
    <v-card-text>
      <ul>
        <li class="mb-2 ml-5" v-for="ref in approach.notes.covered"><span v-html="markdownifyText(ref)"></span></li>
      </ul>
    </v-card-text>
  </v-card>

  <v-card class="dfiq-not-covered ma-4" v-if="approach.notes.not_covered.length > 0">
    <v-card-title>Not covered</v-card-title>
    <v-card-text>
      <ul>
        <li class="mb-2 ml-5" v-for="ref in approach.notes.not_covered"><span v-html="markdownifyText(ref)"></span></li>
      </ul>
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
    approach: {
      type: Object,
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

.dfiq-step-value {
  border: 1px solid #e0e0e0;
}

.dfiq-covered {
  border: 2px solid rgb(var(--v-theme-success));
  background: rgba(0, 160, 66, 0.05);
  opacity: 0.8;
}

.dfiq-not-covered {
  border: 2px solid rgb(var(--v-theme-error));
  background: rgba(155, 0, 0, 0.05);
  opacity: 0.8;
}
</style>
