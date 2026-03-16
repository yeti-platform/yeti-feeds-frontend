// Utilities
import { defineStore } from "pinia";
import axios from "axios";

export const useAppStore = defineStore("app", {
  state: () => ({
    systemConfig: null as any
  }),
  getters: {
    RBACEnabled: state => {
      if (!state.systemConfig) {
        state.fetchSystemConfig();
      }
      return state.systemConfig?.rbac_enabled;
    },
    agentsEnabled: state => {
      if (!state.systemConfig) {
        state.fetchSystemConfig();
      }
      return state.systemConfig?.agents_enabled;
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
