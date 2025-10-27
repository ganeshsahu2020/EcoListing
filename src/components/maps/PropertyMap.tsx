// ui/src/components/maps/PropertyMap.tsx
import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
} from "react";
import maplibregl, { type StyleSpecification } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import MapLibreWorker from "maplibre-gl/dist/maplibre-gl-csp-worker?worker";
import { Protocol } from "pmtiles";

// Worker setup
(maplibregl as any).setWorkerClass?.(MapLibreWorker);
(maplibregl as any).workerClass = MapLibreWorker;

// PMTiles protocol (idempotent + SSR-safe)
declare global {
  interface Window {
    __pmtiles_protocol_added?: boolean;
  }
}
if (typeof window !== "undefined" && !window.__pmtiles_protocol_added) {
  const proto = new Protocol();
  (maplibregl as any).addProtocol?.("pmtiles", proto.tile);
  window.__pmtiles_protocol_added = true;
}

/* ─────────────────────────────────────────────────────────
   Types
   ──────────────────────────────────────────────────────── */
export type Mini = {
  id?: string | null;
  lat?: number | null | string;
  lon?: number | null | string;
  price?: number | null;
  image_url?: string | null; // optional: helps show a thumb in popup
  [k: string]: any;
};

export type PropertyMapHandle = {
  centerOn: (mini: Mini, opts?: { openCard?: boolean; zoom?: number }) => void;
  setPoints: (pts: Mini[]) => void;
  fitToPoints: () => void;
};

type Props = {
  lat?: number | null | string;
  lon?: number | null | string;
  similar?: Mini[];
  heightClass?: string;
  defaultStyle?:
    | "standard"
    | "satellite"
    | "minimal"
    | "safe"
    | "local"
    | "local-satellite"
    | "pmtiles-local";
  className?: string;

  /** Called when "View details" is pressed inside the popup card */
  onViewDetails?: (mini: Mini) => void;
  /** Called when a single marker is clicked */
  onMarkerClick?: (mini: Mini) => void;
};

/* ─────────────────────────────────────────────────────────
   Small helpers
   ──────────────────────────────────────────────────────── */
const isFiniteNum = (v: any): v is number =>
  typeof v === "number" && Number.isFinite(v);
const toNum = (v: any): number | null => {
  if (isFiniteNum(v)) return v;
  if (typeof v === "string" && v.trim()) {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
};

const OSM_RASTER_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: "raster",
      tiles: [
        "https://a.tile.openstreetmap.org/{z}/{x}/{y}.png",
        "https://b.tile.openstreetmap.org/{z}/{x}/{y}.png",
        "https://c.tile.openstreetmap.org/{z}/{x}/{y}.png",
      ],
      tileSize: 256,
      attribution: "© OpenStreetMap contributors",
    },
  },
  layers: [{ id: "osm", type: "raster", source: "osm" }],
};

const SATELLITE_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    esri: {
      type: "raster",
      tiles: [
        // 👇 fixed: regular double quotes (no stray backtick)
        "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      ],
      tileSize: 256,
      attribution: "Tiles © Esri, Earthstar Geographics",
    },
  },
  layers: [{ id: "esri", type: "raster", source: "esri" }],
};

const popupRef: { current: maplibregl.Popup | null } = { current: null };
const pointsRef: { current: Mini[] } = { current: [] };

function makeCardHTML(m: Mini, img?: string | null) {
  const price =
    typeof m.price === "number" ? `$${m.price.toLocaleString()}` : "$—";
  const thumb = img
    ? `<img src="${img}" alt="" style="width:100%;height:140px;object-fit:cover;border-radius:12px"/>`
    : "";
  return `
    <div style="width:260px;max-width:86vw">
      ${thumb}
      <div style="padding:10px 2px 0">
        <div style="font-weight:800;font-size:16px;color:#0f172a">${price}</div>
        <button data-action="view" style="
          margin-top:8px;display:inline-block;padding:8px 12px;border-radius:999px;
          background:linear-gradient(90deg,#2563eb,#10b981);color:white;font-weight:700;border:none;cursor:pointer">
          View details
        </button>
      </div>
    </div>
  `;
}

/* ─────────────────────────────────────────────────────────
   Component
   ──────────────────────────────────────────────────────── */
const PropertyMap = forwardRef<PropertyMapHandle, Props>(function PropertyMap(
  {
    lat,
    lon,
    similar = [],
    heightClass = "h-[320px]",
    defaultStyle = "standard",
    className = "",
    onViewDetails,
    onMarkerClick,
  }: Props,
  ref
) {
  const [styleKey, setStyleKey] = useState<"streets" | "satellite">(
    defaultStyle === "satellite" ? "satellite" : "streets"
  );
  const [err, setErr] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  const mapRef = useRef<maplibregl.Map | null>(null);
  const elRef = useRef<HTMLDivElement | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);

  // Keep unsubscribe cleanup
  const unsubRef = useRef<(() => void) | null>(null);

  const center = useMemo<[number, number] | null>(() => {
    const la = toNum(lat);
    const lo = toNum(lon);
    return la != null && lo != null ? [lo, la] : null;
  }, [lat, lon]);

  // Keep a copy of points for imperative actions
  useEffect(() => {
    pointsRef.current = similar ?? [];
  }, [similar]);

  function openPopupAt(
    map: maplibregl.Map,
    mini: Mini,
    coord: [number, number]
  ) {
    const html = makeCardHTML(mini, mini.image_url ?? null);
    popupRef.current?.remove();
    popupRef.current = new maplibregl.Popup({ closeButton: true, offset: 12 })
      .setLngLat(coord)
      .setHTML(html)
      .addTo(map);

    // Bind the "View details" inside the popup; make sure the map doesn't eat the click
    const el = popupRef.current.getElement();
    const onPopupClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const btn = target?.closest?.("[data-action='view']") as
        | HTMLElement
        | null;
      if (btn) {
        e.preventDefault();
        e.stopPropagation();
        onViewDetails?.(mini);
      }
    };
    el.addEventListener("click", onPopupClick, { once: true });
  }

  // Imperative API
  useImperativeHandle(ref, () => ([
    "centerOn",
    "setPoints",
    "fitToPoints",
  ].reduce((api, _k) => api, {
    centerOn(mini: Mini, opts?: { openCard?: boolean; zoom?: number }) {
      const map = mapRef.current;
      const la = toNum(mini.lat),
        lo = toNum(mini.lon);
      if (!map || la == null || lo == null) return;
      const c: [number, number] = [lo, la];
      const z = Math.max(map.getZoom(), opts?.zoom ?? 14);
      map.easeTo({ center: c, zoom: z, duration: 500 });
      if (opts?.openCard) openPopupAt(map, mini, c);
    },
    setPoints(pts: Mini[]) {
      pointsRef.current = pts ?? [];
      const map = mapRef.current;
      if (map && map.getSource("sim")) {
        const features = (pts ?? [])
          .map((p) => {
            const la = toNum(p.lat),
              lo = toNum(p.lon);
            return la != null && lo != null
              ? {
                  type: "Feature" as const,
                  geometry: { type: "Point" as const, coordinates: [lo, la] },
                  properties: { ...p },
                }
              : null;
          })
          .filter(Boolean) as any[];
        (map.getSource("sim") as maplibregl.GeoJSONSource).setData({
          type: "FeatureCollection",
          features,
        } as any);
      }
    },
    fitToPoints() {
      const map = mapRef.current;
      if (!map || !pointsRef.current.length) return;
      const bb = new maplibregl.LngLatBounds();
      pointsRef.current.forEach((p) => {
        const la = toNum(p.lat),
          lo = toNum(p.lon);
        if (la != null && lo != null) bb.extend([lo, la]);
      });
      if (!bb.isEmpty()) map.fitBounds(bb, { padding: 60, duration: 500 });
    },
  } as PropertyMapHandle)));

  /* Map initialization */
  useEffect(() => {
    if (!elRef.current || mapRef.current) return;
    const initialStyle =
      styleKey === "satellite" ? SATELLITE_STYLE : OSM_RASTER_STYLE;

    const map = new maplibregl.Map({
      container: elRef.current,
      style: initialStyle,
      attributionControl: { compact: true },
      preserveDrawingBuffer: false,
    });
    map.addControl(
      new maplibregl.NavigationControl({ visualizePitch: true }),
      "top-right"
    );

    const ro = new ResizeObserver(() => map.resize());
    ro.observe(elRef.current);
    requestAnimationFrame(() => map.resize());
    setTimeout(() => map.resize(), 300);

    const onWinResize = () => map.resize();
    window.addEventListener("resize", onWinResize);

    if (center) map.jumpTo({ center, zoom: 14 });

    map.on("load", () => {
      setLoaded(true);
      setErr(null);
    });
    map.on("styledata", () => {
      requestAnimationFrame(() => map.resize());
    });
    map.on("error", () => {
      setErr("Map style failed.");
    });

    mapRef.current = map;

    // Cleanup stored in ref
    unsubRef.current = () => {
      window.removeEventListener("resize", onWinResize);
      ro.disconnect();
      popupRef.current?.remove();
      markerRef.current?.remove();
      map.remove();
      mapRef.current = null;
    };

    return () => {
      unsubRef.current?.();
      unsubRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center?.[0], center?.[1]]);

  /* Style switching */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    setLoaded(false);
    setErr(null);
    if (styleKey === "satellite") {
      map.setStyle(SATELLITE_STYLE);
    } else {
      map.setStyle(OSM_RASTER_STYLE);
    }
    map.once("idle", () => setLoaded(true));
  }, [styleKey]);

  /* Layers & marker */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loaded) return;

    const pts = (similar || [])
      .map((s) => {
        const la = toNum(s.lat),
          lo = toNum(s.lon);
        return la != null && lo != null
          ? {
              type: "Feature" as const,
              geometry: { type: "Point" as const, coordinates: [lo, la] },
              properties: { ...s },
            }
          : null;
      })
      .filter(Boolean) as any[];

    const fc = { type: "FeatureCollection", features: pts } as any;

    if (!map.getSource("sim")) {
      map.addSource("sim", {
        type: "geojson",
        data: fc,
        cluster: true,
        clusterMaxZoom: 13,
        clusterRadius: 45,
      });

      map.addLayer({
        id: "sim-clusters",
        type: "circle",
        source: "sim",
        filter: ["has", "point_count"],
        paint: {
          "circle-color": "#2563eb",
          "circle-opacity": 0.2,
          "circle-stroke-color": "#2563eb",
          "circle-stroke-width": 1.5,
          "circle-radius": [
            "step",
            ["get", "point_count"],
            16,
            15,
            20,
            50,
            26,
            120,
            32,
          ],
        },
      });

      map.addLayer({
        id: "sim-unclustered",
        type: "circle",
        source: "sim",
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-color": "#10b981",
          "circle-opacity": 0.7,
          "circle-radius": 5,
          "circle-stroke-color": "#047857",
          "circle-stroke-width": 1,
        },
      });

      map.on("click", "sim-clusters", (e) => {
        const features = map.queryRenderedFeatures(e.point, {
          layers: ["sim-clusters"],
        });
        const clusterId = (features[0]?.properties as any)?.cluster_id;
        const src = map.getSource("sim") as maplibregl.GeoJSONSource & {
          getClusterExpansionZoom: any;
        };
        if (clusterId != null && src?.getClusterExpansionZoom) {
          src.getClusterExpansionZoom(clusterId, (err2: any, zoom: number) => {
            if (!err2 && features[0]?.geometry?.type === "Point") {
              const coords = (features[0].geometry as any)
                .coordinates as [number, number];
              map.easeTo({ center: coords, zoom });
            }
          });
        }
      });

      // Single point: notify parent & open lightweight popup
      map.on("click", "sim-unclustered", (e) => {
        const f = e.features?.[0];
        if (!f) return;
        const p = (f.properties || {}) as any as Mini;
        const coord = (f.geometry as any).coordinates as [number, number];

        onMarkerClick?.(p);         // opens your in-panel preview
        openPopupAt(map, p, coord); // and shows popup with "View details"
      });

      map.on("mouseenter", "sim-unclustered", () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", "sim-unclustered", () => {
        map.getCanvas().style.cursor = "";
      });
    } else {
      (map.getSource("sim") as maplibregl.GeoJSONSource).setData(fc);
    }

    // Subject (red) marker for lat/lon props
    markerRef.current?.remove();
    if (center) {
      const el = document.createElement("div");
      el.style.width = "18px";
      el.style.height = "18px";
      el.style.borderRadius = "50%";
      el.style.background = "#ef4444";
      el.style.border = "2px solid white";
      el.style.boxShadow = "0 1px 4px rgba(0,0,0,.35)";
      markerRef.current = new maplibregl.Marker({
        element: el,
        anchor: "bottom",
      })
        .setLngLat(center)
        .addTo(map);
    }

    // Auto-fit around the subject if provided
    if (center) {
      const pad = 0.12;
      safeFit(
        map,
        [center[0] - pad, center[1] - pad, center[0] + pad, center[1] + pad],
        center
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, center?.[0], center?.[1], JSON.stringify(similar)]);

  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xl font-semibold text-slate-800">Property Map</h3>
        <div className="flex items-center gap-2">
          <a
            className="text-sm underline decoration-dotted text-slate-600 hover:text-slate-900"
            href={
              center
                ? `https://www.google.com/maps/dir/?api=1&destination=${center[1]},${center[0]}`
                : "#"
            }
            target="_blank"
            rel="noreferrer"
          >
            Directions
          </a>
          <span className="text-slate-400">·</span>
          <a
            className="text-sm underline decoration-dotted text-slate-600 hover:text-slate-900"
            href={
              center
                ? `https://maps.google.com/?q=${center[1]},${center[0]}&layer=c`
                : "#"
            }
            target="_blank"
            rel="noreferrer"
          >
            Street View
          </a>
          <span className="text-slate-400">·</span>
          <div className="inline-flex rounded-xl overflow-hidden border border-slate-200">
            <button
              className={`px-3 py-1 text-sm ${
                styleKey === "streets"
                  ? "bg-slate-900 text-white"
                  : "bg-white text-slate-700"
              }`}
              onClick={() => setStyleKey("streets")}
            >
              Streets
            </button>
            <button
              className={`px-3 py-1 text-sm ${
                styleKey === "satellite"
                  ? "bg-slate-900 text-white"
                  : "bg-white text-slate-700"
              }`}
              onClick={() => setStyleKey("satellite")}
            >
              Satellite
            </button>
          </div>
        </div>
      </div>
      <div
        ref={elRef}
        className={`${heightClass} w-full rounded-2xl border border-slate-200 shadow-sm relative`}
      />
      {err && <div className="mt-2 text-xs text-rose-600">{err}</div>}
      <p className="mt-2 text-xs text-slate-500">
        Nearby active listings are clustered—zoom in to reveal individual pins.
      </p>
    </div>
  );
});

export default PropertyMap;

/* ─────────────────────────────────────────────────────────
   Fit helper
   ──────────────────────────────────────────────────────── */
function safeFit(
  map: maplibregl.Map,
  bbox?: [number, number, number, number],
  center?: [number, number]
) {
  try {
    if (
      bbox &&
      bbox[0] < bbox[2] &&
      bbox[1] < bbox[3] &&
      [bbox[0], bbox[1], bbox[2], bbox[3]].every(Number.isFinite)
    ) {
      map.fitBounds(
        [
          [bbox[0], bbox[1]],
          [bbox[2], bbox[3]],
        ],
        { padding: 48, duration: 300, maxZoom: 16 }
      );
      return;
    }
  } catch {}
  if (center) map.jumpTo({ center, zoom: 14 });
}
