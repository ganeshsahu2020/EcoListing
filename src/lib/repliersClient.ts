const API_BASE = (import.meta.env.VITE_API_BASE ?? "http://127.0.0.1:4000/api").replace(/\/+$/, "");

type RepliersOptions = {
  query?: Record<string, string | number | boolean | undefined>;
  mapGeoJSON?: any; // Polygon/MultiPolygon Feature or raw coords array
  method?: "GET" | "POST";
};

export async function repliersProxyFetch<T = any>({ query = {}, mapGeoJSON, method }: RepliersOptions): Promise<T> {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v !== undefined && v !== null) qs.set(k, String(v));
  }
  const url = `${API_BASE}/repliers${qs.toString() ? `?${qs}` : ""}`;

  // If clustering is requested and you *have* a polygon, send it in the POST body.
  const wantsCluster = String(query.cluster) === "true";
  const shouldPost = method === "POST" || (wantsCluster && mapGeoJSON);

  const resp = await fetch(url, {
    method: shouldPost ? "POST" : "GET",
    headers: shouldPost ? { "Content-Type": "application/json" } : undefined,
    body: shouldPost ? JSON.stringify(mapGeoJSON ? { map: mapGeoJSON } : {}) : undefined,
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Repliers proxy failed (${resp.status} ${resp.statusText}): ${text}`);
  }
  return resp.json();
}
