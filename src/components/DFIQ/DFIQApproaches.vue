<template>
  <v-expansion-panels multiple flat static>
    <v-expansion-panel v-for="(approach, index) in question.approaches">
      <v-expansion-panel-title class="approach-title d-flex justify-end">
        <span class="me-4">{{ approach.name }}</span>
        <v-icon class="me-2" v-if="approach.tags.map(tag => tag.toLowerCase()).includes('windows')"
          >mdi-microsoft-windows-classic</v-icon
        >
        <v-icon class="me-2" v-if="approach.tags.map(tag => tag.toLowerCase()).includes('macos')">mdi-apple </v-icon>
        <v-icon class="me-2" v-if="approach.tags.map(tag => tag.toLowerCase()).includes('linux')">mdi-penguin </v-icon>
        <v-chip
          v-for="tag in approach.tags"
          class="me-2"
          density="comfortable"
          variant="tonal"
          color="primary"
          size="small"
          rounded
          >{{ tag }}</v-chip
        >
        <v-dialog width="75%" :fullscreen="toggleFullscreen">
          <template v-slot:activator="{ props }">
            <v-btn
              variant="text"
              size="small"
              icon="mdi-edit"
              density="compact"
              v-bind="props"
              target="_blank"
              class="me-2 edit-approach-button"
            >
              <v-icon>mdi-pencil</v-icon>
            </v-btn>
          </template>

          <template v-slot:default="{ isActive }">
            <edit-DFIQ-object
              :object="question"
              :is-active="isActive"
              :redirect="false"
              @success="obj => emitDFIQUpdate(obj)"
              @deleteSuccess="obj => emitDFIQUpdate(obj)"
              @toggle-fullscreen="toggleFullscreen"
              :approach="index + 1"
            />
          </template>
        </v-dialog>
      </v-expansion-panel-title>
      <v-expansion-panel-text>
        <yeti-DFIQ-approach-template :approach="approach" />
      </v-expansion-panel-text>
    </v-expansion-panel>
  </v-expansion-panels>
</template>

<script lang="ts">
import YetiDFIQApproachTemplate from "./YetiDFIQApproachTemplate.vue";
import EditDFIQObject from "./EditDFIQObject.vue";

export default {
  props: {
    question: {
      type: Object,
      required: true
    }
  },
  components: {
    YetiDFIQApproachTemplate,
    EditDFIQObject
  },
  methods: {
    emitDFIQUpdate(obj) {
      this.$eventBus.emit("DFIQupdated", obj);
    }
  },
  data() {
    return {
      toggleFullscreen: false
    };
  }
};
</script>

<style>
.approach-title .edit-approach-button {
  display: none;
}

.approach-title:hover .edit-approach-button {
  display: inline;
}
</style>
