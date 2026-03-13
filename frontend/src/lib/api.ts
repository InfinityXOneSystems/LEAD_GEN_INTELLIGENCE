/**
 * frontend/src/lib/api.ts
 *
 * Lightweight typed HTTP client used by runtimeClient.ts and all other
 * frontend services.  Reads VITE_API_URL at build-time (Vite) or falls back
 * to the Railway production URL so the app always has a sensible default.
 *
 * Usage:
 *   import { apiClient } from "@/lib/api";
 *   const { data } = await apiClient.get<MyType>("/v1/some/endpoint");
 *   const { data } = await apiClient.post<Resp>("/v1/cmd", payload);
 */

// ---------------------------------------------------------------------------
// Base URL resolution
// ---------------------------------------------------------------------------

const RAW_BASE =
  // Vite injects VITE_* at build time; import.meta.env is safe to use here.
  (typeof import.meta !== "undefined" &&
    (import.meta as { env?: Record<string, string> }).env?.VITE_API_URL) ||
  "https://xpsintelligencesystem-production.up.railway.app";

/** Backend base URL — strip trailing slash once so callers never need to. */
export const API_BASE_URL = RAW_BASE.replace(/\/$/, "");

// ---------------------------------------------------------------------------
// Response wrapper
// ---------------------------------------------------------------------------

export interface ApiResponse<T = unknown> {
  data: T;
  status: number;
  ok: boolean;
}

// ---------------------------------------------------------------------------
// Error class
// ---------------------------------------------------------------------------

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly body?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// ---------------------------------------------------------------------------
// Core request helper
// ---------------------------------------------------------------------------

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  extraHeaders?: Record<string, string>,
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...extraHeaders,
  };

  const res = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  let data: T;
  const ct = res.headers.get("content-type") ?? "";
  if (ct.includes("application/json")) {
    data = (await res.json()) as T;
  } else {
    data = (await res.text()) as unknown as T;
  }

  if (!res.ok) {
    throw new ApiError(
      res.status,
      `API error ${res.status}: ${res.statusText}`,
      data,
    );
  }

  return { data, status: res.status, ok: res.ok };
}

// ---------------------------------------------------------------------------
// Public client object — mirrors Axios surface used by runtimeClient.ts
// ---------------------------------------------------------------------------

export const apiClient = {
  get<T = unknown>(
    path: string,
    headers?: Record<string, string>,
  ): Promise<ApiResponse<T>> {
    return request<T>("GET", path, undefined, headers);
  },

  post<T = unknown>(
    path: string,
    body?: unknown,
    headers?: Record<string, string>,
  ): Promise<ApiResponse<T>> {
    return request<T>("POST", path, body, headers);
  },

  put<T = unknown>(
    path: string,
    body?: unknown,
    headers?: Record<string, string>,
  ): Promise<ApiResponse<T>> {
    return request<T>("PUT", path, body, headers);
  },

  patch<T = unknown>(
    path: string,
    body?: unknown,
    headers?: Record<string, string>,
  ): Promise<ApiResponse<T>> {
    return request<T>("PATCH", path, body, headers);
  },

  delete<T = unknown>(
    path: string,
    headers?: Record<string, string>,
  ): Promise<ApiResponse<T>> {
    return request<T>("DELETE", path, undefined, headers);
  },
};

export default apiClient;
