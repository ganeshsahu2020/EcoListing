import React from "react";
import type maplibregl from "maplibre-gl";
import { GlassButton } from "../GlassUI"; // path: src/components/GlassUI

export type CommuteState = {
  address: string;
  minutes: [number, number, number]; // 15/30/45
  center: [number, number] | null; // [lon, lat]
};

export default function CommuteMenu({
  open,
  state,
  setState,
  onApply,
  onClear,
  onClose, // optional (kept for consistent API)
}: {
  open: boolean;
  state: CommuteState;
  setState: (s: CommuteState | ((s: CommuteState) => CommuteState)) => void;
  onApply: (payload: { center: [number, number]; minutes: [number, number, number] }) => void;
  onClear: () => void;
  onClose?: () => void; // made optional to match other menus
}) {
  if (!open) return null;

  const setMin = (i: 0 | 1 | 2, v: number) =>
    setState((s) => ({
      ...s,
      minutes:
        i === 0
          ? [v, s.minutes[1], s.minutes[2]]
          : i === 1
          ? [s.minutes[0], v, s.minutes[2]]
          : [s.minutes[0], s.minutes[1], v],
    }) as CommuteState);

  const applyAndClose = () => {
    if (!state.center) {
      // No center selected; just close if parent provided a closer.
      onClose?.();
      return;
    }
    onApply({ center: state.center, minutes: state.minutes });
    onClose?.();
  };

  const clearAndClose = () => {
    onClear();
    onClose?.();
  };

  return (
    <div
      className="absolute left-0 top-[42px] w-[340px] rounded-2xl border bg-white p-4 shadow-2xl z-40 text-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Commute filter"
    >
      <div className="space-y-3">
        <input
          className="w-full h-9 rounded-xl border px-3"
          placeholder="Work address or drop a pin"
          value={state.address}
          onChange={(e) => setState({ ...state, address: e.target.value })}
          aria-label="Work address"
        />

        <div className="flex items-center gap-2 text-xs">
          <span>Rings:</span>
          {[15, 30, 45].map((m, i) => (
            <button
              key={m}
              className={`px-2 py-1 rounded-full border ${
                state.minutes[i as 0 | 1 | 2] === m
                  ? "bg-emerald-50 border-emerald-300"
                  : "bg-white"
              }`}
              onClick={() => setMin(i as 0 | 1 | 2, m)}
              aria-pressed={state.minutes[i as 0 | 1 | 2] === m}
              aria-label={`${m} minute ring`}
            >
              {m}m
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <GlassButton onClick={applyAndClose}>Apply</GlassButton>
          <button className="text-sm underline" onClick={clearAndClose}>
            Clear
          </button>
        </div>

        <div className="text-[11px] text-slate-500">Tip: right-click map to set center.</div>
      </div>
    </div>
  );
}

/* ── Map helpers (no external deps) ─────────────────────── */

export function ensureCommuteLayers(map: maplibregl.Map) {
  if (map.getSource("commute")) return;
  map.addSource("commute", { type: "geojson", data: { type: "FeatureCollection", features: [] } as any });
  map.addLayer({
    id: "commute-fill",
    type: "fill",
    source: "commute",
    paint: { "fill-color": "#10B981", "fill-opacity": 0.12 },
  });
  map.addLayer({
    id: "commute-line",
    type: "line",
    source: "commute",
    paint: { "line-color": "#10B981", "line-width": 2, "line-opacity": 0.8 },
  });
}

export function circlePolygon([lon, lat]: [number, number], km: number, steps = 64) {
  const coords: [number, number][] = [];
  const R = 6371; // km
  const d = km / R;
  const toRad = (n: number) => (n * Math.PI) / 180;
  const toDeg = (n: number) => (n * 180) / Math.PI;
  const φ1 = toRad(lat);
  const λ1 = toRad(lon);

  for (let i = 0; i <= steps; i++) {
    const brng = (2 * Math.PI * i) / steps;
    const φ2 = Math.asin(Math.sin(φ1) * Math.cos(d) + Math.cos(φ1) * Math.sin(d) * Math.cos(brng));
    const λ2 =
      λ1 +
      Math.atan2(
        Math.sin(brng) * Math.sin(d) * Math.cos(φ1),
        Math.cos(d) - Math.sin(φ1) * Math.sin(φ2)
      );
    coords.push([toDeg(λ2), toDeg(φ2)]);
  }

  return { type: "Polygon", coordinates: [coords] } as const;
}

export function setCommuteRings(
  map: maplibregl.Map,
  center: [number, number],
  minutes: [number, number, number]
) {
  ensureCommuteLayers(map);
  // Approximate 40km/h travel: km = minutes * 40/60 = minutes * 2/3
  const features = minutes.map((mins) => ({
    type: "Feature",
    properties: { mins },
    geometry: circlePolygon(center, mins * (40 / 60)),
  }));
  (map.getSource("commute") as maplibregl.GeoJSONSource).setData({
    type: "FeatureCollection",
    features,
  } as any);
}
