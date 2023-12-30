<template>
  <div v-html="renderedMarkdown" class="yeti-markdown"></div>
</template>

<script lang="ts" setup>
import DOMPurify from "dompurify";
import { marked } from "marked";
</script>

<script lang="ts">
export default {
  props: {
    text: {
      type: String,
      required: true
    }
  },
  computed: {
    renderedMarkdown() {
      const sanitizedHTML = DOMPurify.sanitize(marked(this.text));
      return sanitizedHTML;
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
  font-family:
    Roboto Mono,
    monospace;
  border: 1px solid #e0e0e0;
  margin: 0.5rem 0 0.5rem 0;
  padding: 0.5rem;
  border-radius: 0.5rem;
}

.yeti-markdown p {
  margin-bottom: 0.5rem;
  margin-top: 0.5rem;
}
</style>
