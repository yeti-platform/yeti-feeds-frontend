// Utilities
import { defineStore } from "pinia";
import axios from "axios";

export const useAppStore = defineStore("app", {
  state: () => ({
    systemConfig: null
  }),
  getters: {
    RBACEnabled: state => {
      if (!state.systemConfig) {
        state.fetchSystemConfig();
      }
      return state.systemConfig?.rbac_enabled;
    }
  },
  actions: {
    async fetchSystemConfig() {
      const response = await axios.get("/api/v2/system/config");
      this.systemConfig = await response.data;
    }
  }
});
