import { computed, onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";

import type { ObjectTypeDefinition } from "@/definitions/types";

/**
 * The shared behaviour of the per-type search views (EntitySearch,
 * IndicatorSearch, DFIQSearch). They are the same view over a different set of
 * type definitions: a tab per object type, each tab an ObjectList that reports
 * how many results it found, with the first non-empty tab selected unless the
 * URL hash pins one.
 */
export function useTypeTabs(types: ObjectTypeDefinition[]) {
  const route = useRoute();

  const counts = ref<Record<string, number>>(
    types.reduce<Record<string, number>>((acc, type) => {
      acc[type.type] = 0;
      return acc;
    }, {})
  );

  const activeTab = ref("");
  const autoTab = ref(true);
  const fullScreenEdit = ref(false);
  const editWidth = ref("75%");

  const activeHash = computed(() => route.hash);
  const displayedTypes = computed(() => types.filter(type => counts.value[type.type] > 0));

  function navigateToFirstPopulatedTab() {
    for (const typeDef of types) {
      if (counts.value[typeDef.type] > 0) {
        activeTab.value = typeDef.type;
        break;
      }
    }
  }

  /** Called by each ObjectList when it knows how many results it has. */
  function countObjects(type: string, count: number) {
    counts.value[type] = count;
    if (!route.hash && autoTab.value) {
      navigateToFirstPopulatedTab();
    }
  }

  /** v-data-table headers for the fields this type shows in a list. */
  function getFieldForType(typeName: string) {
    const typeDef = types.find(type => type.type === typeName);
    return (typeDef?.fields ?? [])
      .filter(field => field.displayList)
      .map(field => ({
        title: field.label,
        key: field.field,
        width: field.width,
        maxWidth: field.maxWidth,
        sortable: field.sortable || false
      }));
  }

  /**
   * [alias, fieldType] pairs the backend uses to widen a search.
   *
   * An alias with no matching field is skipped — the previous code did
   * `fields.find(...).type` and would have thrown a TypeError on one.
   */
  function getAliasesForType(typeName: string): Array<[string, string]> {
    const typeDef = types.find(type => type.type === typeName);
    if (!typeDef) {
      return [];
    }
    return (typeDef.filterAliases ?? []).flatMap(alias => {
      const field = typeDef.fields.find(f => f.field === alias);
      return field ? [[alias, field.type] as [string, string]] : [];
    });
  }

  function toggleNewObjectFullscreen(fullscreen: boolean) {
    fullScreenEdit.value = !fullScreenEdit.value;
    editWidth.value = fullscreen ? "100%" : "75%";
  }

  onMounted(() => {
    if (activeHash.value) {
      autoTab.value = false;
      activeTab.value = activeHash.value.replace("#", "");
    }
  });

  watch(activeHash, () => {
    activeTab.value = activeHash.value.replace("#", "");
    if (activeTab.value === "") {
      navigateToFirstPopulatedTab();
    }
  });

  return {
    counts,
    activeTab,
    autoTab,
    fullScreenEdit,
    editWidth,
    activeHash,
    displayedTypes,
    countObjects,
    navigateToFirstPopulatedTab,
    getFieldForType,
    getAliasesForType,
    toggleNewObjectFullscreen
  };
}
