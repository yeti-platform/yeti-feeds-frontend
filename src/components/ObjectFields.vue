<template>
  <div v-if="object">
    <div v-for="field in fields">
      <v-text-field v-if="field.type === 'text'" :label="field.label" v-model="object[field.field]"></v-text-field>
      <v-textarea v-if="field.type === 'longtext'" :label="field.label" v-model="object[field.field]"></v-textarea>
      <v-combobox
        v-if="field.type === 'list' && field.field !== 'tags'"
        v-model="object[field.field]"
        :label="field.label"
        chips
        clearable
        multiple
        density="compact"
        :delimiters="[',', ' ', ';']"
        prepend-inner-icon="mdi-tag"
      >
        <template v-slot:chip="tag"> <v-chip :text="tag.item.value" label size="large" color="primary"/></template>
      </v-combobox>

      <v-text-field v-if="field.type === 'date'" v-model="object[field.field]" :label="field.label"></v-text-field>

      <v-textarea
        v-if="field.type === 'code'"
        :label="field.label"
        v-model="object[field.field]"
        class="yeti-code"
      ></v-textarea>

      <v-select
        v-if="field.type === 'option'"
        v-model="object[field.field]"
        :items="field.choices"
        :label="field.label"
        variant="outlined"
      ></v-select>
    </div>
  </div>
</template>

<script lang="ts">
export default {
  components: {},
  props: {
    fields: {
      type: Object,
      default: () => {}
    },
    object: {
      type: Object,
      default: () => {}
    }
  }
};
</script>

<style>
.yeti-code textarea {
  font-family: monospace;
}
</style>
