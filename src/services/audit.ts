import http from "@/services/http";
import type { LooseYetiObject } from "@/services/types";

/**
 * The audit trail for one object.
 *
 * The backend route is /audit/timeline/{id:path} — a path parameter that
 * matches slashes — so `extendedId` is the object's extended id
 * ("observables/123"), not a bare id. The response is a [entries, total] pair.
 */
export async function timeline(extendedId: string): Promise<[LooseYetiObject[], number]> {
  const { data } = await http.get<[LooseYetiObject[], number]>(`/audit/timeline/${extendedId}`);
  return data;
}
