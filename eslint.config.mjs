import { withVueTs, vueTsConfigs } from '@vue/eslint-config-typescript'
import eslint from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import pluginVueA11y from 'eslint-plugin-vuejs-accessibility'

export default withVueTs(
  {
    name: 'yeti/ignores',
    ignores: [
      'dist/**',
      'node_modules/**',
      'playwright-report/**',
      'test-results/**',
      'tsconfig.tsbuildinfo',
    ],
  },
  eslint.configs.recommended,
  pluginVue.configs['flat/essential'],
  pluginVueA11y.configs['flat/recommended'],
  vueTsConfigs.recommended,
  {
    name: 'yeti/rules',
    rules: {
      'vue/multi-word-component-names': 'off',
      // Both fire on the clickable rows of DFIQTree.vue and
      // YetiDFIQApproachTemplate.vue. Warnings until those rows get keyboard
      // handling, so the error ratchet stays honest.
      'vuejs-accessibility/click-events-have-key-events': 'warn',
      'vuejs-accessibility/no-static-element-interactions': 'warn',
    },
  },
)
