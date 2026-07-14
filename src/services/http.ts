import axios, { AxiosError } from "axios";

import { eventBus } from "@/plugins/eventbus";

/**
 * The single axios instance every service module goes through.
 *
 * baseURL is "/api/v2" — the vite dev server proxies /api to the backend (see
 * vite.config.ts), and in production the app is served from the same origin as
 * the API, so a relative base works in both.
 */
const http = axios.create({
  baseURL: "/api/v2"
});

/** Requests whose failures the caller handles itself (don't redirect/notify). */
function isAuthRequest(url: string | undefined): boolean {
  return !!url && url.startsWith("/auth/");
}

/** Best-effort extraction of FastAPI's error body: {"detail": "..."} */
function errorMessage(error: AxiosError): string {
  const detail = (error.response?.data as { detail?: unknown } | undefined)?.detail;
  if (typeof detail === "string") {
    return detail;
  }
  // FastAPI validation errors come back as a list of {loc, msg, type}.
  if (Array.isArray(detail)) {
    const messages = detail
      .map(item => (typeof item?.msg === "string" ? item.msg : null))
      .filter(Boolean);
    if (messages.length) {
      return messages.join(", ");
    }
  }
  return error.message || "Unexpected error";
}

http.interceptors.response.use(
  response => response,
  async (error: AxiosError) => {
    const status = error.response?.status;

    // Session expired / not authenticated: send the user back to the login
    // page. The auth endpoints are excluded — a 401 from /auth/token just means
    // "wrong password", and Login.vue reports that itself.
    if (status === 401 && !isAuthRequest(error.config?.url)) {
      // Imported lazily: the router pulls in the views, which pull in these
      // services, so a static import would be a cycle.
      const { default: router } = await import("@/router");
      const next = router.currentRoute.value.fullPath;
      if (router.currentRoute.value.name !== "Login") {
        router.push({ name: "Login", query: { next } });
      }
      return Promise.reject(error);
    }

    // Everything else surfaces in the App.vue snackbar, so call sites no longer
    // need their own catch/console.log.
    eventBus.emit("displayMessage", { message: errorMessage(error), status: "error" });
    return Promise.reject(error);
  }
);

export default http;
