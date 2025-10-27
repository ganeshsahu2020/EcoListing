export type MTFeature = {
  place_name: string;
  center: [number, number]; // [lon, lat]
};

export async function maptilerAutocomplete(
  query: string,
  opts: { limit?: number; proximity?: { lon: number; lat: number } } = {}
): Promise<MTFeature[]> {
  const key = import.meta.env.VITE_MAPTILER_KEY as string | undefined;
  if (!key || !query.trim()) return [];

  const params = new URLSearchParams({
    key,
    autocomplete: "true",
    limit: String(opts.limit ?? 8),
    language: "en",
  });

  if (opts.proximity) {
    params.set("proximity", `${opts.proximity.lon},${opts.proximity.lat}`);
  }

  const url = `https://api.maptiler.com/geocoding/${encodeURIComponent(
    query
  )}.json?${params.toString()}`;

  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  return (data.features || []).map((f: any) => ({
    place_name: f.place_name,
    center: f.center, // [lon, lat]
  }));
}
