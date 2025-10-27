// ui/src/utils/http.ts
export async function fetchJson(input: RequestInfo, init?: RequestInit) {
  const res = await fetch(input, init);
  let payload: any = null;
  try { payload = await res.json(); } catch {}
  if (!res.ok) {
    const msg = payload?.error || payload?.message || `${res.status} ${res.statusText}`;
    const code = payload?.error_code ? ` (${payload.error_code})` : "";
    throw new Error(`${msg}${code}`);
  }
  return payload;
}
