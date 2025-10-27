/* scripts/seed-simplyrets.ts
 *
 * Pull listings from SimplyRETS and upsert into:
 *   - app_listings
 *   - repliers_listing_photos
 *
 * Assumed columns for app_listings (adjust if yours differ):
 *   id (uuid PK), mls_id (text unique), price (int8), address (text),
 *   city (text), lat (float8), lon (float8), beds (int), baths (int),
 *   sqft (int), status (text), image_url (text)
 *
 * Assumed columns for repliers_listing_photos:
 *   mls_id (text), url (text), sort (int)
 */

import "dotenv/config";
import axios from "axios";
import { createClient } from "@supabase/supabase-js";
import { v5 as uuidv5 } from "uuid";

const {
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  SIMPLYRETS_BASE = "https://api.simplyrets.com/properties",
  SIMPLYRETS_USER = "simplyrets",
  SIMPLYRETS_PASS = "simplyrets",
} = process.env;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Stable UUID namespace (arbitrary, but constant) to derive deterministic IDs from mls_id
const NAMESPACE = "6a1b2a31-8d6a-4f3a-8cbf-b9a0033992e0";

type SRListing = {
  mlsId?: string | number;
  listPrice?: number;
  listDate?: string;
  photos?: string[];
  address?: { full?: string; city?: string; streetNumber?: string | number; streetName?: string };
  geo?: { lat?: number; lng?: number };
  property?: {
    bedrooms?: number;
    bathsFull?: number;
    bathsHalf?: number;
    area?: number;
    yearBuilt?: number;
    type?: string;
    lotSize?: number;
  };
};

function toNum(v: any): number | null {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function firstNonEmpty(...vals: (string | number | null | undefined)[]) {
  for (const v of vals) {
    if (v === 0 || (typeof v === "string" && v.trim() !== "") || (v && v !== undefined)) return String(v);
  }
  return null;
}

function deriveAddress(a: SRListing["address"]): { address: string | null; city: string | null } {
  if (!a) return { address: null, city: null };
  const full = a.full ?? null;
  const street =
    a.streetNumber && a.streetName ? `${a.streetNumber} ${a.streetName}` : a.streetName ?? String(a.streetNumber ?? "");
  return {
    address: full ?? (street || null),
    city: a.city ?? null,
  };
}

function bathsTotal(full?: number, half?: number) {
  const f = toNum(full) ?? 0;
  const h = toNum(half) ?? 0;
  return f + 0.5 * h;
}

function asListingRow(item: SRListing) {
  const mls_id = firstNonEmpty(item.mlsId) ?? null;
  if (!mls_id) return null;

  const id = uuidv5(`mls:${mls_id}`, NAMESPACE); // deterministic UUID from MLS
  const price = toNum(item.listPrice);
  const { address, city } = deriveAddress(item.address);
  const lat = toNum(item.geo?.lat);
  const lon = toNum(item.geo?.lng);
  const beds = toNum(item.property?.bedrooms);
  const sqft = toNum(item.property?.area);
  const baths = bathsTotal(item.property?.bathsFull, item.property?.bathsHalf);
  const status = "for-sale";
  const image_url = item.photos?.[0] ?? null;

  return {
    id,
    mls_id: String(mls_id),
    price,
    address,
    city,
    lat,
    lon,
    beds,
    baths,
    sqft,
    status,
    image_url,
  };
}

async function fetchSimplyRetsPage(limit: number, offset: number): Promise<SRListing[]> {
  const url = `${SIMPLYRETS_BASE}?limit=${limit}&offset=${offset}`;
  const res = await axios.get(url, {
    auth: { username: SIMPLYRETS_USER!, password: SIMPLYRETS_PASS! },
    timeout: 20000,
  });
  if (!Array.isArray(res.data)) return [];
  return res.data as SRListing[];
}

async function upsertListings(listings: ReturnType<typeof asListingRow>[]) {
  const rows = listings.filter(Boolean) as NonNullable<ReturnType<typeof asListingRow>>[];
  if (!rows.length) return;

  // Upsert by mls_id (add a unique index in DB for best results)
  const { error } = await supabase.from("app_listings").upsert(rows, {
    onConflict: "mls_id",
  });
  if (error) throw error;
}

async function replacePhotos(mls_id: string, photos: string[]) {
  // simple approach: clear then insert
  await supabase.from("repliers_listing_photos").delete().eq("mls_id", mls_id);

  if (!photos.length) return;
  const payload = photos.slice(0, 32).map((url, i) => ({ mls_id, url, sort: i + 1 }));
  const { error } = await supabase.from("repliers_listing_photos").insert(payload);
  if (error) throw error;
}

async function run() {
  // Pull 3 pages of 50 = 150 demo listings (tweak as you like)
  const PAGE = 50;
  const PAGES = 3;

  console.log(`Fetching SimplyRETS: ${PAGES} pages x ${PAGE} (basic auth user=${SIMPLYRETS_USER})`);

  let totalListings = 0;
  for (let p = 0; p < PAGES; p++) {
    const offset = p * PAGE;
    const items = await fetchSimplyRetsPage(PAGE, offset);
    if (!items.length) {
      console.log(`Page ${p + 1}: empty`);
      continue;
    }

    const rows = items.map(asListingRow).filter(Boolean) as ReturnType<typeof asListingRow>[];
    await upsertListings(rows);

    // photos per listing
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const mls_id = firstNonEmpty(item.mlsId);
      if (!mls_id) continue;
      const photos = (item.photos || []).filter((u) => !!u);
      try {
        await replacePhotos(String(mls_id), photos);
      } catch (e: any) {
        console.warn(`Photo upsert failed for mls_id=${mls_id}:`, e?.message || e);
      }
    }

    totalListings += rows.length;
    console.log(`Page ${p + 1}: upserted ${rows.length} listings`);
  }

  console.log(`Done. Total listings upserted: ${totalListings}`);
}

run()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  });
