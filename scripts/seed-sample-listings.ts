// scripts/seed-simplyrets.ts
 
import axios from "axios";
import { createClient } from "@supabase/supabase-js";

// --- Env (loaded by: tsx -r dotenv/config scripts/seed-simplyrets.ts)
const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const SIMPLYRETS_BASE = process.env.SIMPLYRETS_BASE || "https://api.simplyrets.com/properties";
const SIMPLYRETS_USER = process.env.SIMPLYRETS_USER || "simplyrets";
const SIMPLYRETS_PASS = process.env.SIMPLYRETS_PASS || "simplyrets";

// --- Basic checks
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// Small helper: sanitize number-like values (str, 1, "1,234.5")
const toNum = (v: any): number | null => {
  if (v == null) return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  const n = Number(String(v).replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? n : null;
};

// Shape a SimplyRETS record into our app_listings + photos
function mapListing(p: any) {
  // baths can be fractional; your DB now allows numeric(4,1)
  const bathsCombined =
    toNum(p?.property?.bathrooms) ??
    ((toNum(p?.property?.bathsFull) || 0) + 0.5 * (toNum(p?.property?.bathsHalf) || 0));

  const row = {
    mls_id: String(p?.listingId ?? p?.mlsId ?? p?.mls?.id ?? ""), // unique key for upsert
    price: toNum(p?.listPrice) ?? null,
    address: p?.address?.full ?? null,
    city: p?.address?.city ?? null,
    lat: toNum(p?.geo?.lat),
    lon: toNum(p?.geo?.lng),
    image_url: Array.isArray(p?.photos) && p.photos[0] ? p.photos[0] : null,
    status: p?.mls?.status ?? "Active",
    beds: toNum(p?.property?.bedrooms) ?? null,
    baths: bathsCombined ?? null, // numeric(4,1)
    sqft: ((): number | null => {
      const a = toNum(p?.property?.area);
      if (a == null) return null;
      const r = Math.round(a);
      return Number.isFinite(r) ? r : null;
    })(),
  };

  const photos = (Array.isArray(p?.photos) ? p.photos : [])
    .filter((u: any) => typeof u === "string" && u.trim().length > 0)
    .map((url: string, i: number) => ({
      mls_id: row.mls_id,
      url,
      sort: i,
    }));

  return { row, photos };
}

async function fetchSimplyRetsPage(offset: number, limit: number) {
  try {
    const res = await axios.get(SIMPLYRETS_BASE, {
      params: { limit, offset },
      timeout: 20000,
      auth: { username: SIMPLYRETS_USER, password: SIMPLYRETS_PASS },
    });
    const arr = Array.isArray(res.data) ? res.data : [];
    return { items: arr, total: Number(res.headers["x-total-count"]) || null };
  } catch (err: any) {
    const status = err?.response?.status;
    const msg = err?.response?.data?.message || err?.message || "Unknown error";
    // Gracefully stop if we paged too far
    if (status === 400 && /offset too high/i.test(msg)) {
      return { items: [], total: null };
    }
    throw err;
  }
}

async function run() {
  const limit = 50;
  let offset = 0;
  let totalSeen = 0;
  let page = 1;

  console.log(`Fetching SimplyRETS: auto-pagination with limit=${limit} (basic auth user=${SIMPLYRETS_USER})`);

  while (true) {
    const { items, total } = await fetchSimplyRetsPage(offset, limit);

    if (!items.length) {
      // nothing else to pull
      break;
    }

    // Map
    const mapped = items.map(mapListing);
    const rows = mapped.map((m) => m.row);
    const photos = mapped.flatMap((m) => m.photos);

    // Upsert listings (conflict on mls_id)
    const { error: upErr } = await supabase.from("app_listings").upsert(rows, { onConflict: "mls_id" });
    if (upErr) {
      console.error("Upsert error:", upErr);
      throw upErr;
    }

    // Insert photos (ignore duplicates by constraint or do a best-effort insert)
    if (photos.length) {
      // If you added UNIQUE(mls_id,url), use "onConflict: 'mls_id,url'"
      const { error: pErr } = await supabase.from("repliers_listing_photos").upsert(photos as any, {
        onConflict: "mls_id,url",
        ignoreDuplicates: true as any, // Supabase js v2 uses onConflict w/ ignore duplicates behavior when identical
      });
      if (pErr) {
        // Some projects might not have the unique constraint; fall back to insertMany best-effort
        console.warn("Photo upsert warning (continuing):", pErr.message || pErr);
      }
    }

    console.log(`Page ${page}: upserted ${rows.length} listings, ${photos.length} photos`);
    totalSeen += rows.length;
    page += 1;
    offset += limit;

    // Stop early if we didn’t get a full page
    if (rows.length < limit) break;

    // (Optional) Stop if we know the total and have it all
    if (total && totalSeen >= total) break;
  }

  console.log(`Done. Seeded/updated ~${totalSeen} listings.`);
}

run().catch((e) => {
  // Clean, human-friendly error
  const friendly = e?.response?.data?.message || e?.message || String(e);
  console.error("Seed failed:", friendly);
  process.exit(1);
});
