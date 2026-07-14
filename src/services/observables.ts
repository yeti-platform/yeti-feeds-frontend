import http from "@/services/http";
import type {
  AddContextRequest,
  BulkObservableAddResponse,
  DeleteContextRequest,
  NewBulkObservableAddRequest,
  NewExtendedObservableRequest,
  NewObservableRequest,
  Observable,
  ObservableSearchRequest,
  ObservableSearchResponse,
  ObservableTagRequest,
  ObservableTagResponse,
  PatchObservableRequest,
  ReplaceContextRequest
} from "@/services/types";

export async function search(request: ObservableSearchRequest): Promise<ObservableSearchResponse> {
  const { data } = await http.post<ObservableSearchResponse>("/observables/search", request);
  return data;
}

export async function details(id: string): Promise<Observable> {
  const { data } = await http.get<Observable>(`/observables/${id}`);
  return data;
}

export async function create(request: NewObservableRequest): Promise<Observable> {
  const { data } = await http.post<Observable>("/observables/", request);
  return data;
}

export async function createExtended(request: NewExtendedObservableRequest): Promise<Observable> {
  const { data } = await http.post<Observable>("/observables/extended", request);
  return data;
}

export async function patch(id: string, request: PatchObservableRequest): Promise<Observable> {
  const { data } = await http.patch<Observable>(`/observables/${id}`, request);
  return data;
}

export async function remove(id: string): Promise<void> {
  await http.delete(`/observables/${id}`);
}

export async function bulkAdd(request: NewBulkObservableAddRequest): Promise<BulkObservableAddResponse> {
  const { data } = await http.post<BulkObservableAddResponse>("/observables/bulk", request);
  return data;
}

export async function tag(request: ObservableTagRequest): Promise<ObservableTagResponse> {
  const { data } = await http.post<ObservableTagResponse>("/observables/tag", request);
  return data;
}

export async function importText(text: string, tags: string[] = []): Promise<BulkObservableAddResponse> {
  const { data } = await http.post<BulkObservableAddResponse>("/observables/import/text", { text, tags });
  return data;
}

export async function importUrl(url: string, tags: string[] = []): Promise<BulkObservableAddResponse> {
  const { data } = await http.post<BulkObservableAddResponse>("/observables/import/url", { url, tags });
  return data;
}

export async function importFile(file: File, tags: string[] = []): Promise<BulkObservableAddResponse> {
  const form = new FormData();
  form.append("file", file);
  for (const t of tags) {
    form.append("tags", t);
  }
  const { data } = await http.post<BulkObservableAddResponse>("/observables/import/file", form);
  return data;
}

export async function addContext(id: string, request: AddContextRequest): Promise<Observable> {
  const { data } = await http.post<Observable>(`/observables/${id}/context`, request);
  return data;
}

export async function replaceContext(id: string, request: ReplaceContextRequest): Promise<Observable> {
  const { data } = await http.put<Observable>(`/observables/${id}/context`, request);
  return data;
}

export async function deleteContext(id: string, request: DeleteContextRequest): Promise<Observable> {
  const { data } = await http.post<Observable>(`/observables/${id}/context/delete`, request);
  return data;
}
