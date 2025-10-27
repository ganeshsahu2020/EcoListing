// 13) src/utils/listingsSupabase.ts
import { supabase } from "./supabaseClient";

export type SupaFilters = {
  price?: { min?: number | null; max?: number | null } | [number | null, number | null] | string | null;
  beds?: number | { min?: number | null } | string | null;
  baths?: number | { min?: number | null } | string | null;
  type?: string | string[] | null;
  sort?: "newest" | "price" | "priceAsc" | "priceDesc" | "days";
};

function toNum(v: any): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim()) {
    const n = Number(v.replace(/[^\d.-]/g, ""));
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

// supports "500000-1000000" or {min,max} or [min,max]
function parsePriceRange(price: SupaFilters["price"]): { min?: number; max?: number } {
  if (!price) return {};
  if (typeof price === "string" && price.includes("-")) {
    const [a, b] = price.split("-");
    const [min, max] = [toNum(a), toNum(b)];
    return { ...(min != null ? { min } : {}), ...(max != null ? { max } : {}) };
  }
  if (Array.isArray(price)) {
    const [min, max] = price;
    return { ...(toNum(min) != null ? { min: toNum(min)! } : {}), ...(toNum(max) != null ? { max: toNum(max)! } : {}) };
  }
  const min = toNum((price as any)?.min);
  const max = toNum((price as any)?.max);
  return { ...(min != null ? { min } : {}), ...(max != null ? { max } : {}) };
}

export async function fetchListingsSupabase(
  bbox: [west: number, south: number, east: number, north: number],
  filters: SupaFilters,
  limit = 200
) {
  const [west, south, east, north] = bbox;
  let q = supabase
    .from("listings_repliers_compat")
    .select(
      [
        "id",
        "mls_id",
        "lat",
        "lon",
        "list_price",
        "beds",
        "baths",
        "sqft",
        "address",
        "city",
        "status",
        "property_type",
        "year_built",
        "lot_size_acres",
        "days_on_market",
        "price_per_sqft",
        "created_on",
        "updated_on",
        "list_date",
        "sold_date",
      ].join(","),
      { count: "exact" }
    )
    .gte("lat", south)
    .lte("lat", north)
    .gte("lon", west)
    .lte("lon", east)
    // exclude nulls for lat/lon
    .not("lat", "is", null)
    .not("lon", "is", null)
    .limit(limit);

  // price
  const pr = parsePriceRange(filters?.price ?? null);
  if (pr.min != null) q = q.gte("list_price", pr.min);
  if (pr.max != null) q = q.lte("list_price", pr.max);

  // beds/baths (support "3" or {min:3})
  const minBeds = toNum((filters?.beds as any)?.min ?? (filters?.beds as any));
  const minBaths = toNum((filters?.baths as any)?.min ?? (filters?.baths as any));
  if (minBeds != null) q = q.gte("beds", minBeds);
  if (minBaths != null) q = q.gte("baths", minBaths);

  // type filter (values must match your table’s property_type)
  if (filters?.type) {
    const arr = Array.isArray(filters.type) ? filters.type : [String(filters.type)];
    q = q.in("property_type", arr);
  }

  // sort
  switch (String(filters?.sort || "newest")) {
    case "priceAsc":
      q = q.order("list_price", { ascending: true, nullsFirst: false });
      break;
    case "price":
    case "priceDesc":
      q = q.order("list_price", { ascending: false, nullsFirst: false });
      break;
    case "days":
      q = q.order("days_on_market", { ascending: false, nullsFirst: false });
      break;
    case "newest":
    default:
      q = q.order("created_on", { ascending: false, nullsFirst: false });
      break;
  }

  const { data, error, count } = await q;
  if (error) throw error;

  return {
    rows: (data as any[]) ?? [],
    count: typeof count === "number" ? count : ((data as any[])?.length ?? 0),
  };
}
