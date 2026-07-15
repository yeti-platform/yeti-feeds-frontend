// Utilities
import { defineStore } from "pinia";
import axios from "axios";

export const useAppStore = defineStore("app", {
  state: () => ({
    systemConfig: null as any
  }),
  getters: {
    // These lazily kick off the config fetch if nothing has loaded it yet.
    // Pinia doesn't type actions onto a getter's `this`, so reach the action
    // through the store singleton (already instantiated by the time a getter
    // runs).
    RBACEnabled(): boolean {
      const store = useAppStore();
      if (!store.systemConfig) {
        store.fetchSystemConfig();
      }
      return store.systemConfig?.rbac_enabled;
    },
    agentsEnabled(): boolean {
      const store = useAppStore();
      if (!store.systemConfig) {
        store.fetchSystemConfig();
      }
      return store.systemConfig?.agents_enabled;
    }
  },
  actions: {
    async fetchSystemConfig() {
      const response = await axios.get("/api/v2/system/config");
      this.systemConfig = await response.data;
    },
    async setPageTitleFromObject(object: any) {
      let baseTitle = `${object.root_type}:${object.type} - Yeti`;

      if (["entity", "indicator", "dfiq"].includes(object.root_type)) {
        baseTitle = `${object.name} - ${baseTitle}`;
      } else if (object.root_type === "observable") {
        baseTitle = `${object.value} - ${baseTitle}`;
      }

      document.title = baseTitle;
    }
  }
});
