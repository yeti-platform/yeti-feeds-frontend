/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

// The eventbus plugin installs `$eventBus` on every component instance, but it
// was never declared, so `this.$eventBus` was an error in any component whose
// `this` type vue-tsc could actually resolve. Components migrated to
// <script setup> import the emitter from @/plugins/eventbus directly instead.
declare module 'vue' {
  interface ComponentCustomProperties {
    $eventBus: import('mitt').Emitter<import('@/plugins/eventbus').Events>
  }
}

export {}
