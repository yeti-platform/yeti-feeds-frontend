// Utilities
import { defineStore } from "pinia";
import axios from "axios";

interface SystemTypeEntry {
  type: string;
  label: string;
}

interface SystemTypes {
  observables: SystemTypeEntry[];
  entities: SystemTypeEntry[];
  indicators: SystemTypeEntry[];
  dfiq: SystemTypeEntry[];
}

export const useAppStore = defineStore("app", {
  state: () => ({
    systemConfig: null as any,
    systemTypes: null as SystemTypes | null
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
    },
    observableTypes(): Array<{ type: string; name: string }> {
      const store = useAppStore();
      if (!store.systemTypes) {
        store.fetchSystemTypes();
      }
      return (store.systemTypes?.observables ?? []).map(t => ({
        type: t.type,
        name: t.label
      }));
    },
    entityTypes(): Array<{ type: string; name: string }> {
      const store = useAppStore();
      if (!store.systemTypes) {
        store.fetchSystemTypes();
      }
      return (store.systemTypes?.entities ?? []).map(t => ({
        type: t.type,
        name: t.label
      }));
    },
    indicatorTypes(): Array<{ type: string; name: string }> {
      const store = useAppStore();
      if (!store.systemTypes) {
        store.fetchSystemTypes();
      }
      return (store.systemTypes?.indicators ?? []).map(t => ({
        type: t.type,
        name: t.label
      }));
    },
    dfiqTypes(): Array<{ type: string; name: string }> {
      const store = useAppStore();
      if (!store.systemTypes) {
        store.fetchSystemTypes();
      }
      return (store.systemTypes?.dfiq ?? []).map(t => ({
        type: t.type,
        name: t.label
      }));
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
    }, 
    async fetchSystemTypes() {
      const response = await axios.get("/api/v2/system/types");
      this.systemTypes = await response.data;
    }
  }
});
