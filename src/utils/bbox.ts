// src/utils/bbox.ts
import type maplibregl from "maplibre-gl";

/** Wrap longitude to [-180, 180) */
export const wrapLon = (lon: number) => ((((lon + 180) % 360) + 360) % 360) - 180;

/** Normalize a LngLatBounds to [west, south, east, north] (lon,lat order) */
export const normalizeBounds = (
  b: maplibregl.LngLatBounds
): [number, number, number, number] => {
  const w = wrapLon(b.getWest());
  const s = Math.max(-90, Math.min(90, b.getSouth()));
  const e = wrapLon(b.getEast());
  const n = Math.max(-90, Math.min(90, b.getNorth()));
  return [w, s, e, n];
};

/** Stringify bounds as "w,s,e,n" (lon,lat order) */
export const bboxString = (b: maplibregl.LngLatBounds) => {
  const [w, s, e, n] = normalizeBounds(b);
  return `${w},${s},${e},${n}`;
};
