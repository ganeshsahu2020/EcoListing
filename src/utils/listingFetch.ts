// utils/listingFetch.ts
import { supabase } from "../utils/supabaseClient";

const isUUID = (s: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s);

/**
 * Try app_listings first (nicer columns), then fall back to listings (alias lon→lng).
 * idOrProperty can be a number-like string (id) or a UUID (property_id).
 */
export async function fetchListingMeta(idOrProperty: string) {
  const byProperty = isUUID(idOrProperty);

  // Columns that exist on the view
  const VIEW_COLS = "id,mls_id,agent_id,lat,lng,market_key,force_internal_agent,property_id";
  // Columns for base table (alias lon → lng)
  const BASE_COLS = "id,mls_id,agent_id,lat,lng:lon,market_key,force_internal_agent,property_id";

  // 1) app_listings (no type mismatch issues; both id/property_id are text/uuid-friendly in views usually)
  {
    const q = supabase.from("app_listings").select(VIEW_COLS).limit(1);
    const qb = byProperty ? q.eq("property_id", idOrProperty) : q.eq("id", idOrProperty);
    const { data, error } = await qb;
    if (error) throw error;
    if (data && data.length) return data[0];
  }

  // 2) listings (base table; be careful with types)
  {
    const q = supabase.from("listings").select(BASE_COLS).limit(1);
    // Only filter the column that matches the value's type
    const qb = byProperty ? q.eq("property_id", idOrProperty) : q.eq("id", Number(idOrProperty));
    const { data, error } = await qb;
    if (error) throw error;
    return data?.[0] ?? null;
  }
}
