import http from "@/services/http";
import type {
  AddContextRequest,
  DeleteContextRequest,
  Indicator,
  IndicatorMultipleGetRequest,
  IndicatorSearchRequest,
  IndicatorSearchResponse,
  IndicatorTagRequest,
  IndicatorTagResponse,
  NewIndicatorRequest,
  PatchIndicatorRequest,
  ReplaceContextRequest
} from "@/services/types";

export async function search(request: IndicatorSearchRequest): Promise<IndicatorSearchResponse> {
  const { data } = await http.post<IndicatorSearchResponse>("/indicators/search", request);
  return data;
}

export async function getMultiple(request: IndicatorMultipleGetRequest): Promise<IndicatorSearchResponse> {
  const { data } = await http.post<IndicatorSearchResponse>("/indicators/get/multiple", request);
  return data;
}

export async function details(id: string): Promise<Indicator> {
  const { data } = await http.get<Indicator>(`/indicators/${id}`);
  return data;
}

export async function create(request: NewIndicatorRequest): Promise<Indicator> {
  const { data } = await http.post<Indicator>("/indicators/", request);
  return data;
}

export async function patch(id: string, request: PatchIndicatorRequest): Promise<Indicator> {
  const { data } = await http.patch<Indicator>(`/indicators/${id}`, request);
  return data;
}

export async function remove(id: string): Promise<void> {
  await http.delete(`/indicators/${id}`);
}

export async function tag(request: IndicatorTagRequest): Promise<IndicatorTagResponse> {
  const { data } = await http.post<IndicatorTagResponse>("/indicators/tag", request);
  return data;
}

/** Bundles the given YARA rules (plus their dependencies) into a single string. */
export async function yaraBundle(request: {
  ids?: string[];
  tags?: string[];
  exclude_tags?: string[];
  overlays?: string[];
}): Promise<{ bundle: string }> {
  const { data } = await http.post<{ bundle: string }>("/indicators/yara/bundle", request);
  return data;
}

export async function addContext(id: string, request: AddContextRequest): Promise<Indicator> {
  const { data } = await http.post<Indicator>(`/indicators/${id}/context`, request);
  return data;
}

export async function replaceContext(id: string, request: ReplaceContextRequest): Promise<Indicator> {
  const { data } = await http.put<Indicator>(`/indicators/${id}/context`, request);
  return data;
}

export async function deleteContext(id: string, request: DeleteContextRequest): Promise<Indicator> {
  const { data } = await http.post<Indicator>(`/indicators/${id}/context/delete`, request);
  return data;
}
