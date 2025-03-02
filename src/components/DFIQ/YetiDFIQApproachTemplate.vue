<template>
  <v-sheet>
    <div v-if="approach.description">
      <p class="text-h6">Description</p>
      <div class="yeti-markdown" v-html="markdownifyText(approach.description)"></div>
    </div>
    <div v-else class="text-disabled">No description</div>

    <div v-if="approach.references.length > 0">
      <div class="font-weight-bold mb-2">References:</div>
      <ul class="ml-5">
        <li v-for="ref in approach.references"><span v-html="markdownifyText(ref)"></span></li>
      </ul>
      <ul class="ml-5" v-if="approach.references_internal?.length > 0">
        <li v-for="ref in approach.references_internal">
          <span v-html="markdownifyText(ref)"></span>
        </li>
      </ul>
    </div>
    <div v-else class="text-disabled">No references</div>
  </v-sheet>

  <v-divider class="my-4"></v-divider>

  <v-sheet>
    <p class="text-h6 mb-4">Steps</p>
    <p v-if="approach.steps.length == 0" class="text-disabled">No steps</p>
    <ol>
      <li v-for="step in approach.steps" class="ml-6 mb-4">
        <div>
          {{ step.name }}
          <v-chip label class="ml-2" density="compact" size="small" variant="tonal" color="success" rounded>{{
            step.stage
          }}</v-chip>
          <v-chip label class="ml-2" density="compact" size="small" variant="tonal" color="primary" rounded>{{
            step.type
          }}</v-chip>
        </div>
        <p>{{ step.description }}</p>
        <div class="ma-2 clipboard-copy" @click="copyText(step.value)">
          <v-btn
            variant="text"
            size="small"
            color="grey"
            icon="mdi-content-copy"
            density="compact"
            class="me-2 clipboard-copy-button"
            title="Copy to clipboard"
            ripple
          />
          <code class="text-medium-emphasis text-size">{{ step.value }}</code>
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

  <v-divider class="my-4"></v-divider>

  <p class="text-disabled" v-if="!hasCoverage">No coverage data</p>

  <div class="dfiq-covered mb-2 px-2 py-1 rounded" v-if="approach.notes.covered.length > 0">
    <p class="font-weight-bold">Covered</p>
    <ul>
      <li class="mb-2 ml-5" v-for="ref in approach.notes.covered"><span v-html="markdownifyText(ref)"></span></li>
    </ul>
  </div>

  <div class="dfiq-not-covered mb-2 px-2 py-1 rounded" v-if="approach.notes.not_covered.length > 0">
    <p class="font-weight-bold">Not covered</p>
    <ul>
      <li class="mb-2 ml-5" v-for="ref in approach.notes.not_covered"><span v-html="markdownifyText(ref)"></span></li>
    </ul>
  </div>
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
    },
    copyText(text) {
      navigator.clipboard.writeText(text);
      this.$eventBus.emit("displayMessage", {
        status: "info",
        message: "Query copied to clipboard!"
      });
    }
  },
  computed: {
    hasCoverage() {
      return this.approach.notes.covered.length + this.approach.notes.not_covered.length > 0;
    },
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

.clipboard-copy > .clipboard-copy-button {
  opacity: 0;
}

.clipboard-copy:hover > .clipboard-copy-button {
  opacity: 1;
}

.indicator-preview {
  font-size: 0.8em;
  opacity: 0.6;
}

.clipboard-copy {
  cursor: pointer;
}
</style>
