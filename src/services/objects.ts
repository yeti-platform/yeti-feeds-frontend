import http from "@/services/http";
import type {
  CreatableRootType,
  DetailRootType,
  LooseYetiObject,
  ObjectDetail,
  RootType,
  TaggableRootType
} from "@/services/types";

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
 * Create-endpoint segment per family. Observables go through /extended (which
 * accepts the full observable body + tags), unlike entities/indicators.
 */
const CREATE_ENDPOINTS: Record<CreatableRootType, string> = {
  entity: "entities/",
  observable: "observables/extended",
  indicator: "indicators/"
};

/**
 * Creates an object from the generic NewObject form. The body is built
 * dynamically from the type's field definitions, so it's a LooseYetiObject
 * rather than one of the per-family union request types. The backend wraps it
 * under the root_type key (`{entity: {...}}`, `{observable: {...}}`, ...).
 */
export async function create(rootType: CreatableRootType, body: LooseYetiObject): Promise<LooseYetiObject> {
  const { data } = await http.post<LooseYetiObject>(`/${CREATE_ENDPOINTS[rootType]}`, { [rootType]: body });
  return data;
}

/**
 * Patches an object from the generic EditObject form. Like create(), the body
 * is built dynamically from field definitions (LooseYetiObject) and wrapped
 * under the root_type key.
 */
export async function patch(rootType: RootType, id: string, body: LooseYetiObject): Promise<LooseYetiObject> {
  const { data } = await http.patch<LooseYetiObject>(`/${ENDPOINTS[rootType]}/${id}`, { [rootType]: body });
  return data;
}

export async function remove(rootType: RootType, id: string): Promise<void> {
  await http.delete(`/${ENDPOINTS[rootType]}/${id}`);
}

/**
 * Searches one object family by its endpoint segment ("entities", "indicators",
 * "dfiq", ...), for the generic ObjectList.
 *
 * Each family returns its results under its own key (entities / indicators /
 * dfiq / observables), so this normalises them to {items, total}.
 */
export async function searchByEndpoint(
  endpoint: string,
  request: Record<string, unknown>
): Promise<{ items: LooseYetiObject[]; total: number }> {
  const { data } = await http.post<Record<string, any>>(`/${endpoint}/search`, request);
  return { items: data[endpoint] ?? [], total: data.total ?? 0 };
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
