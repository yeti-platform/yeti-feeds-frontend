import mitt from "mitt";
import type { App } from "vue";

/**
 * Message shown in the App.vue snackbar.
 */
export interface DisplayMessage {
  message: string;
  status: "success" | "error" | "warning" | "info";
}

export type Events = {
  displayMessage: DisplayMessage;
  [key: string]: unknown;
};

/**
 * The shared emitter. Components can keep using `this.$eventBus`; non-component
 * modules (e.g. the axios interceptors in services/http.ts) import this
 * directly — previously the instance was created inside install() and was
 * therefore unreachable outside of components.
 */
export const eventBus = mitt<Events>();

export default {
  install: (app: App) => {
    app.config.globalProperties.$eventBus = eventBus;
  }
};
