// src/services/buildQuery.ts
import type maplibregl from "maplibre-gl";
import { boundsToRepliersMap, roundMap } from "@/utils/repliersGeo";
import { normalizeBounds, bboxString } from "@/utils/bbox";

export type BuildQueryExtras = Record<string, unknown>;

export interface BuiltQuery {
  bbox: string; // backend expects "s,w,n,e"
  map: string;  // stringified polygon
  [k: string]: unknown;
}

const buildQuery = (
  bounds: maplibregl.LngLatBounds,
  extras: BuildQueryExtras = {}
): BuiltQuery => {
  const [w, s, e, n] = normalizeBounds(bounds);
  const shape = roundMap(boundsToRepliersMap(bounds));

  // use your helper; cast to satisfy overload (if it prefers LngLatBounds)
  const bbox = bboxString([w, s, e, n] as unknown as maplibregl.LngLatBounds) as unknown as string;
  // If your bboxString already accepts [w,s,e,n], you can simplify to:
  // const bbox = bboxString([w, s, e, n] as any);

  return {
    bbox,                       // expected "s,w,n,e"
    map: JSON.stringify(shape), // polygon
    ...extras,
  };
};

export default buildQuery;
