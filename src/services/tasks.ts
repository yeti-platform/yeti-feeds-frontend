import http from "@/services/http";
import type { ExportTask, ExportTaskInput, TaskSearchRequest, TaskSearchResponse } from "@/services/types";

export async function search(request: Partial<TaskSearchRequest> = {}): Promise<TaskSearchResponse> {
  const { data } = await http.post<TaskSearchResponse>("/tasks/search", request);
  return data;
}

export async function toggle(name: string): Promise<unknown> {
  const { data } = await http.post(`/tasks/${name}/toggle`);
  return data;
}

export async function run(name: string, params: Record<string, unknown> = {}): Promise<unknown> {
  const { data } = await http.post(`/tasks/${name}/run`, params);
  return data;
}

/**
 * The export payloads are Partial: every field the UI omits (enabled, status,
 * fresh_tags, ...) has a server-side default, but openapi-typescript marks
 * defaulted fields as required.
 */
export async function newExport(exportTask: Partial<ExportTaskInput>): Promise<ExportTask> {
  const { data } = await http.post<ExportTask>("/tasks/export/new", { export: exportTask });
  return data;
}

export async function updateExport(name: string, exportTask: Partial<ExportTaskInput>): Promise<ExportTask> {
  const { data } = await http.patch<ExportTask>(`/tasks/export/${name}`, { export: exportTask });
  return data;
}

export async function deleteExport(name: string): Promise<void> {
  await http.delete(`/tasks/export/${name}`);
}

/** The rendered export file. Returned raw so callers can build a Blob. */
export async function exportContent(id: string) {
  return http.get<string>(`/tasks/export/${id}/content`);
}
