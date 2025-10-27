import type maplibregl from "maplibre-gl";

export const boundsToRepliersMap = (bounds: maplibregl.LngLatBounds): number[][][] => {
  const w = bounds.getWest(), s = bounds.getSouth(), e = bounds.getEast(), n = bounds.getNorth();
  const ring = [[w,n],[e,n],[e,s],[w,s],[w,n]]; // closed [lng,lat] ring
  return [ring];
};

export const roundMap = (mapPoly: number[][][], places = 6): number[][][] => {
  const r = (x: number) => Number(x.toFixed(places));
  return mapPoly.map(ring => ring.map(([lng, lat]) => [r(lng), r(lat)]));
};
