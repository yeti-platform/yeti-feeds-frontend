import http from "@/services/http";
import type { GraphAddRequest, GraphPatchRequest, GraphSearchRequest, GraphSearchResponse } from "@/services/types";

export async function search(request: GraphSearchRequest): Promise<GraphSearchResponse> {
  const { data } = await http.post<GraphSearchResponse>("/graph/search", request);
  return data;
}

export async function add(request: GraphAddRequest): Promise<unknown> {
  const { data } = await http.post("/graph/add", request);
  return data;
}

export async function patch(relationshipId: string, request: GraphPatchRequest): Promise<unknown> {
  const { data } = await http.patch(`/graph/${relationshipId}`, request);
  return data;
}

export async function remove(relationshipId: string): Promise<void> {
  await http.delete(`/graph/${relationshipId}`);
}

/** Swaps the source and target of a relationship. (POST, not PATCH.) */
export async function swap(relationshipId: string): Promise<unknown> {
  const { data } = await http.post(`/graph/${relationshipId}/swap`);
  return data;
}

/** Matches raw observable strings against known objects and indicators. */
export async function match(observables: string[], addUnknown = false): Promise<unknown> {
  const { data } = await http.post("/graph/match", { observables, add_unknown: addUnknown });
  return data;
}
