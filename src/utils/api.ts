// ui/src/utils/api.ts

export const API_BASE =
  (import.meta.env.VITE_API_URL?.replace(/\/$/, "") as string) || "";

/**
 * Helper to build URLs safely (no double slashes).
 * Pass paths like '/market-series' or 'market-series'.
 */
export function apiUrl(path: string) {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE}${cleanPath}`;
}

/**
 * If your server exposes endpoints under /api, use this variant.
 * Example: fetch(apiUrlUnderApi("/market-series?months=12"))
 */
export function apiUrlUnderApi(path: string) {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE}/api${cleanPath}`;
}
