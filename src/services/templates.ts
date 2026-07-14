import http from "@/services/http";
import type { TemplateSearchRequest, TemplateSearchResponse } from "@/services/types";

export async function search(request: TemplateSearchRequest): Promise<TemplateSearchResponse> {
  const { data } = await http.post<TemplateSearchResponse>("/templates/search", request);
  return data;
}

export interface RenderTemplateRequest {
  template_id: string | null;
  observable_ids?: string[];
  search_query?: string;
}

/**
 * Renders a template. The response is a file download, so this returns the raw
 * axios response — callers need the Content-Disposition header for the filename.
 */
export async function render(request: RenderTemplateRequest) {
  return http.post<string>("/templates/render", request);
}
