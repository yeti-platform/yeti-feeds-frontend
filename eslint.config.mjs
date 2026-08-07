import { withVueTs, vueTsConfigs } from '@vue/eslint-config-typescript'
import eslint from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'

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
  vueTsConfigs.recommended,
  {
    name: 'yeti/rules',
    rules: {
      'vue/multi-word-component-names': 'off',
    },
  },
)
