import { DFIQ_TYPES } from "@/definitions/dfiqDefinitions";
import { ENTITY_TYPES } from "@/definitions/entityDefinitions";
import { INDICATOR_TYPES } from "@/definitions/indicatorDefinitions";
import { OBSERVABLE_TYPES } from "@/definitions/observableDefinitions";

const ALL_TYPES = [...ENTITY_TYPES, ...INDICATOR_TYPES, ...OBSERVABLE_TYPES, ...DFIQ_TYPES];

/**
 * The mdi icon for an object type, or undefined for a type the backend knows
 * but the frontend definitions don't.
 *
 * Several components each had their own copy of this as a chain of
 * `A.find(...) || B.find(...) || C.find(...)` followed by `.icon` — with no
 * guard, so an unknown type threw a TypeError.
 */
export function getIconForType(type: string): string | undefined {
  return ALL_TYPES.find(typeDef => typeDef.type === type)?.icon;
}
