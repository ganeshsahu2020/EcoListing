// etl/ingest-app-listings.ts
// Run (PowerShell):
//   $env:SUPABASE_URL="https://YOUR.subabase.co"
//   $env:SUPABASE_SERVICE_ROLE_KEY="YOUR_SERVICE_ROLE_KEY"
//   npx tsx ui/etl/ingest-app-listings.ts
//
// Or via package.json scripts:
//   npm run ingest:dry
//   npm run ingest

import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

/* ───────────────── Supabase client (service role) ───────────────── */
const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars");
  process.exit(1);
}
const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
  global: { headers: { "x-client-info": "etl-ingest/1.0" } },
});

/* ───────────────── Types expected by the RPC ───────────────── */
type IngestRow = {
  mls_id: string | null;
  price: number | null;
  address: string | null;
  city: string | null;
  lat: number | null;
  lon?: number | null; // RPC coalesces lon/lng
  lng?: number | null; // optional, for compatibility
  image_url: string | null;
  status_raw: string | null; // 'for-sale' | 'for lease' | 'sold' | ...
  agent_name: string | null;
  market_key: string | null;
};

/* ───────────────── Helpers ───────────────── */
const num = (v: any): number | null => {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};
const str = (v: any): string | null =>
  v == null ? null : String(v).trim() || null;

/** Map one raw feed record to the ingest payload */
function mapFeedRecordToIngest(raw: any): IngestRow {
  return {
    mls_id: str(raw.mls_id ?? raw.mlsId ?? raw.id ?? null),
    price: num(raw.list_price ?? raw.price ?? null),
    address: str(raw.address ?? raw.full_address ?? null),
    city: str(raw.city ?? null),
    lat: num(raw.latitude ?? raw.lat ?? null),
    // provide either lon or lng (RPC coalesces)
    lon: num(raw.longitude ?? raw.lon ?? raw.lng ?? null),
    image_url: str(raw.cover_image_url ?? raw.image_url ?? null),
    status_raw: str(raw.status ?? raw.status_raw ?? "for-sale"),
    agent_name: str(
      raw.listing_agent_name ??
        raw.agent_name ??
        raw.listAgent?.fullName ??
        null
    ),
    market_key: str(raw.market_key ?? null),
  };
}

/** Chunk an array */
function chunk<T>(arr: T[], size: number) {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

/** Pretty error for PostgREST */
function toHttpError(e: any) {
  const code = e?.code || e?.status || "";
  const msg = e?.message || e?.error_description || e?.hint || String(e);
  return { code, message: msg, raw: e };
}

/** RPC call with retries */
async function ingestBatch(rows: IngestRow[], attempt = 0): Promise<number> {
  const { data, error } = await sb.rpc("ingest_app_listings", { payload: rows });
  if (error) {
    const err = toHttpError(error);
    const retriable = [408, 425, 429, 500, 502, 503, 504].includes(
      Number(err.code)
    );
    if (retriable && attempt < 4) {
      const backoff = 500 * Math.pow(2, attempt);
      console.warn(
        `[ETL] RPC retry ${attempt + 1} in ${backoff}ms:`,
        err.code,
        err.message
      );
      await new Promise((r) => setTimeout(r, backoff));
      return ingestBatch(rows, attempt + 1);
    }
    console.error("[ETL] RPC failed:", err.code, err.message, err.raw);
    throw new Error(err.message);
  }
  return Number(data || 0);
}

/* ───────────────── Replace this with your real feed fetch ───────────────── */
async function fetchFeed(): Promise<any[]> {
  // Example row (shape doesn’t need to match DB; mapFeedRecordToIngest handles it)
  return [
    {
      mls_id: "1005227",
      list_price: 419294,
      address: "65991 North THE PASEO Fwy #S5",
      city: "Oak Ridge",
      latitude: 29.746832,
      longitude: -95.57128,
      cover_image_url:
        "https://d2bd5h5te3s67r.cloudfront.net/trial/home15.jpg",
      status: "for-sale",
      listing_agent_name: "Jane Agent",
      market_key: null,
    },
    // ...more items from your real feed
  ];
}

/* ───────────────── Main ───────────────── */
async function main() {
  const DRY_RUN = process.env.DRY_RUN === "1";

  const raw = await fetchFeed();
  console.log(`[ETL] Fetched ${raw.length} feed rows`);

  // Map + filter out bad rows (must have MLS + lat/lon and positive price)
  const payload = raw
    .map(mapFeedRecordToIngest)
    .filter(
      (r) =>
        r.mls_id &&
        r.lat != null &&
        (r.lon != null || r.lng != null) &&
        (r.price ?? 0) > 0
    );

  console.log(
    `[ETL] Prepared ${payload.length} rows (filtered ${
      raw.length - payload.length
    })`
  );

  if (DRY_RUN || payload.length === 0) {
    console.log("[ETL] DRY_RUN on or nothing to ingest. Exiting.");
    return;
  }

  const BATCH = Number(process.env.BATCH_SIZE || 500);
  let total = 0;
  const t0 = Date.now();

  for (const [i, part] of chunk(payload, BATCH).entries()) {
    const n = await ingestBatch(part);
    total += n;
    console.log(
      `[ETL] Batch ${i + 1} (${part.length} items): ${n} upserted (cumulative ${total})`
    );
  }

  const ms = Date.now() - t0;
  console.log(`[ETL] Done. Upserted ${total} rows in ${ms}ms.`);
}

main().catch((e) => {
  console.error("[ETL] Fatal:", e?.message || e);
  process.exit(1);
});
