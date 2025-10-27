export type StyleKey =
  | "standard"
  | "minimal"
  | "satellite"
  | "safe"
  | "globe"
  | "local"
  | "local-satellite"
  | "pmtiles-local";

type StyleAlias = StyleKey | "streets" | "street" | "sat";

function resolveKey(key: StyleAlias): StyleKey {
  const k = String(key).toLowerCase() as StyleAlias;
  if (k === "streets" || k === "street") return "standard";
  if (k === "sat") return "satellite";
  if (k === "local") return "local";
  const whitelist = [
    "standard",
    "minimal",
    "satellite",
    "safe",
    "globe",
    "local",
    "local-satellite",
    "pmtiles-local",
  ] as const;
  return (whitelist as readonly string[]).includes(k) ? (k as StyleKey) : "standard";
}

export function getMapStyle(key: StyleAlias): any {
  const env = (import.meta as any)?.env ?? {};
  const MT = env.VITE_MAPTILER_KEY && String(env.VITE_MAPTILER_KEY).trim();
  const usingMT = !!MT && MT !== "your_maptiler_key_here";
  const resolved = resolveKey(key);

  if (resolved === "safe") {
    return {
      version: 8,
      sources: {
        osm: {
          type: "raster",
          tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
          tileSize: 256,
          attribution: "© OpenStreetMap",
        },
      },
      layers: [{ id: "osm", type: "raster", source: "osm" }],
    };
  }

  // --- THIS IS THE LINE TO UPDATE ---
  if (resolved === "local") return "/mapstyles/osm-raster.json";

  if (resolved === "local-satellite") return "/mapstyles/satellite-esri.json";
  if (resolved === "pmtiles-local") return "/mapstyles/pmtiles-raster.json";
  if (resolved === "globe") return "https://demotiles.maplibre.org/globe.json";

  const styles = {
    standard: usingMT
      ? `https://api.maptiler.com/maps/streets-v2/style.json?key=${MT}`
      : "https://tiles.openfreemap.org/styles/liberty",
    minimal: usingMT
      ? `https://api.maptiler.com/maps/dataviz-light/style.json?key=${MT}`
      : "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
  } as const;

  if (resolved === "satellite") {
    return usingMT
      ? `https://api.maptiler.com/maps/hybrid/style.json?key=${MT}`
      : {
          version: 8,
          sources: {
            esri: {
              type: "raster",
              tiles: [
                "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
              ],
              tileSize: 256,
              attribution: "Tiles © Esri, Earthstar Geographics",
            },
          },
          layers: [{ id: "esri", type: "raster", source: "esri" }],
        };
  }

  return styles[resolved as "standard" | "minimal"] ?? styles.standard;
}

export default getMapStyle;