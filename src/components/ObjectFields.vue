<template>
  <div v-if="object">
    <div v-for="field in fields">
      <v-text-field
        density="default"
        v-if="field.type === 'text'"
        :label="field.label"
        v-model="object[field.field]"
      ></v-text-field>
      <v-textarea v-if="field.type === 'longtext'" :label="field.label" v-model="object[field.field]"></v-textarea>
      <v-combobox
        v-if="field.type === 'list' && field.field !== 'tags'"
        v-model="object[field.field]"
        :label="field.label"
        chips
        clearable
        multiple
        density="default"
        :delimiters="[',', ' ', ';']"
        prepend-inner-icon="mdi-tag"
      >
        <template v-slot:chip="tag"> <v-chip :text="tag.item.value" label size="large" color="primary" /></template>
      </v-combobox>

      <v-text-field
        density="default"
        v-if="field.type === 'date'"
        v-model="object[field.field]"
        :label="field.label"
      ></v-text-field>

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
        density="default"
        variant="outlined"
      ></v-select>

      <v-combobox
        v-if="field.type === 'option-custom'"
        v-model="object[field.field]"
        :items="field.choices"
        :label="field.label"
        density="default"
        variant="outlined"
      ></v-combobox>

      <v-checkbox
        density="default"
        :indeterminate="object[field.field] === null"
        v-if="field.type === 'bool'"
        :label="field.label"
        v-model="object[field.field]"
      >
      </v-checkbox>
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
