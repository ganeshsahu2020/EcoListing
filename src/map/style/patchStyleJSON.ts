// src/map/style/patchStyleJSON.ts
/* eslint-disable @typescript-eslint/no-explicit-any */

type Style = {
  version: number;
  sources: Record<string, any>;
  sprite?: string;
  glyphs?: string;
  layers: any[];
  [k: string]: any;
};

const NUMERIC_PAINT_KEYS = [
  "circle-radius", "circle-stroke-width", "circle-opacity",
  "line-width", "line-gap-width", "line-opacity",
  "fill-opacity", "raster-opacity",
  "heatmap-intensity", "heatmap-radius", "heatmap-opacity",
  "fill-extrusion-height", "fill-extrusion-base", "fill-extrusion-opacity",
];

const NUMERIC_LAYOUT_KEYS = [
  "text-size", "icon-size", "symbol-sort-key"
];

// ---------- helpers ----------
function deepClone<T>(x: T): T {
  return JSON.parse(JSON.stringify(x));
}

// collect every ["get","prop"] used within an expression
function collectGetProps(expr: any, set = new Set<string>()): Set<string> {
  if (Array.isArray(expr)) {
    if (expr[0] === "get" && typeof expr[1] === "string") set.add(expr[1]);
    for (const e of expr) collectGetProps(e, set);
  }
  return set;
}

// wrap any ["get", ...] found anywhere as a number with fallback 0
function wrapGetsAsNumber(expr: any): any {
  if (!Array.isArray(expr)) return expr;
  if (expr[0] === "get") return ["to-number", expr, 0];

  // Recurse
  return expr.map((e: any, i: number) => (i === 0 ? e : wrapGetsAsNumber(e)));
}

// guard numeric comparisons inside a filter expression
function guardNumericFilter(filter: any): any {
  if (!Array.isArray(filter)) return filter;

  const op = filter[0];
  const NUM_OPS = new Set([">", ">=", "<", "<="]);

  if (NUM_OPS.has(op)) {
    const left  = wrapGetsAsNumber(filter[1]);
    const right = wrapGetsAsNumber(filter[2]);
    const props = Array.from(collectGetProps([filter[1], filter[2]]));

    // has-guards ensure short-circuit when properties are missing/null
    const hasGuards = props.map((p) => ["has", p]);
    return ["all", ...hasGuards, [op, left, right]];
  }

  // Recurse through groups (all/any/has/in/not/etc.)
  return [op, ...filter.slice(1).map(guardNumericFilter)];
}

// coerce a paint/layout numeric value (expression or literal) safely to number
function coerceNumeric(val: any): any {
  if (typeof val === "number") return val; // already a literal
  if (!Array.isArray(val)) return ["to-number", ["coalesce", val, 0]];
  // If expression: ensure it becomes a number with fallback 0
  return ["to-number", ["coalesce", val, 0]];
}

function guardNumericProps(layer: any) {
  for (const k of NUMERIC_LAYOUT_KEYS) {
    if (layer.layout && k in layer.layout) {
      layer.layout[k] = coerceNumeric(layer.layout[k]);
    }
  }
  for (const k of NUMERIC_PAINT_KEYS) {
    if (layer.paint && k in layer.paint) {
      layer.paint[k] = coerceNumeric(layer.paint[k]);
    }
  }
}

// heuristics to detect layers that use clustering
function layerUsesPointCount(layer: any): boolean {
  const hay = JSON.stringify(layer);
  return hay.includes('"point_count"');
}

function guardClusterProps(layer: any) {
  if (!layerUsesPointCount(layer)) return;

  layer.layout = { ...(layer.layout || {}) };
  layer.paint  = { ...(layer.paint  || {}) };

  // Text label for clusters
  if (layer.type === "symbol") {
    layer.layout["text-field"] = ["coalesce", ["to-string", ["get", "point_count"]], ""];
  }

  // Circle size based on point_count
  if (layer.type === "circle") {
    layer.paint["circle-radius"] = [
      "case",
      ["has", "point_count"],
      ["interpolate",
        ["linear"],
        ["to-number", ["get", "point_count"], 1],
        0,   12,
        100, 32
      ],
      8
    ];
  }
}

function guard3DBuildings(layer: any) {
  if (layer.type !== "fill-extrusion") return;

  layer.paint = { ...(layer.paint || {}) };

  // Height / base with safe fallbacks
  layer.paint["fill-extrusion-height"] = [
    "to-number",
    ["coalesce", ["get", "render_height"], ["get", "height"], 0]
  ];

  layer.paint["fill-extrusion-base"] = [
    "to-number",
    ["coalesce", ["get", "render_min_height"], ["get", "min_height"], 0]
  ];

  // Opacity should be numeric too
  if (layer.paint["fill-extrusion-opacity"] != null) {
    layer.paint["fill-extrusion-opacity"] = coerceNumeric(layer.paint["fill-extrusion-opacity"]);
  }
}

// ---------- main patcher ----------
export default function patchStyleJSON<T extends Style>(input: T): T {
  const style = deepClone(input);

  if (!Array.isArray(style.layers)) return style;

  style.layers = style.layers.map((orig) => {
    const layer = { ...orig };
    if (layer.paint == null)  layer.paint  = {};
    if (layer.layout == null) layer.layout = {};

    // 1) Guard clusters (point_count)
    guardClusterProps(layer);

    // 2) Guard 3D buildings
    guard3DBuildings(layer);

    // 3) Guard generic numeric paint/layout values
    guardNumericProps(layer);

    // 4) Guard numeric filters (>=, >, <=, <) against null/missing props
    if (layer.filter) layer.filter = guardNumericFilter(layer.filter);

    return layer;
  });

  return style;
}
