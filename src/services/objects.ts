import http from "@/services/http";
import type { DetailRootType, LooseYetiObject, ObjectDetail, RootType, TaggableRootType } from "@/services/types";

/**
 * Generic access to the object endpoints, for the components that work across
 * object families (ObjectDetails, ObjectList, ...). Prefer the per-domain
 * modules (observables.ts, entities.ts, ...) when the type is known statically.
 */
export const ENDPOINTS: Record<RootType, string> = {
  observable: "observables",
  entity: "entities",
  indicator: "indicators",
  dfiq: "dfiq"
};

export async function details(rootType: DetailRootType, id: string): Promise<ObjectDetail> {
  const { data } = await http.get<ObjectDetail>(`/${ENDPOINTS[rootType]}/${id}`);
  return data;
}

/**
 * Replaces an object's whole context.
 *
 * `path` is the already-built "<endpoint>/<id>" segment (e.g. "observables/123"),
 * because ObjectContext is handed one by whichever details view renders it.
 */
export async function replaceContextAtPath(path: string, context: unknown[]): Promise<LooseYetiObject> {
  const { data } = await http.put<LooseYetiObject>(`/${path}/context`, { context });
  return data;
}

export interface TagObjectsRequest {
  ids: string[];
  tags: string[];
  strict: boolean;
}

/**
 * `rootType` is deliberately TaggableRootType: there is no /dfiq/tag endpoint,
 * so tagging a DFIQ object would 404. (The UI already hides the tag editor for
 * DFIQ; this makes it a type error rather than a runtime one.)
 */
export async function tag(rootType: TaggableRootType, request: TagObjectsRequest): Promise<unknown> {
  const { data } = await http.post(`/${ENDPOINTS[rootType]}/tag`, request);
  return data;
}
