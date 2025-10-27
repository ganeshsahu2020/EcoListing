 
import 'dotenv/config';
import axios from 'axios';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const REPLIERS_API_KEY = process.env.VITE_REPLIERS_API_KEY || process.env.REPLIERS_API_KEY || '';

// DRY RUN support: set DRY_RUN=1 to log without writing
const DRY_RUN = !!process.env.DRY_RUN;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY envs.');
}
if (!REPLIERS_API_KEY) {
  throw new Error('Missing VITE_REPLIERS_API_KEY (or REPLIERS_API_KEY).');
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// Minimal Repliers listing type (adapt to your real payload if needed)
type RepliersListing = {
  Id?: string;            // sometimes "Id" or "ListingId" depending on dataset
  ListingId?: string;
  MlsNumber?: string;
  Address?: {
    UnparsedAddress?: string;
    City?: string;
    Province?: string;
    PostalCode?: string;
  };
  ListPrice?: number;
  BedroomsTotal?: number;
  BathroomsTotalInteger?: number;
  Building?: { SizeInterior?: string; YearBuilt?: number; };
  PropertyType?: string;
  PublicRemarks?: string;
  Latitude?: number;
  Longitude?: number;
  Photos?: string[];      // array of urls
  Status?: string;
  LotSizeArea?: number;
};

// Normalize to our table
function toRow(x: RepliersListing) {
  const id = (x.Id || x.ListingId || x.MlsNumber || '').toString();
  if (!id) throw new Error('Listing missing id');

  const sqft = (() => {
    const s = x.Building?.SizeInterior;
    if (!s) return null;
    const m = s.match(/(\d+(?:\.\d+)?)/);
    return m ? Math.round(Number(m[1])) : null;
  })();

  const photos = Array.isArray(x.Photos) ? x.Photos : [];
  const latitude = x.Latitude ?? null;
  const longitude = x.Longitude ?? null;

  return {
    id,
    source: 'REPLIERS',
    mls_number: x.MlsNumber ?? null,
    list_price: x.ListPrice ?? null,
    property_type: x.PropertyType ?? null,
    beds: x.BedroomsTotal ?? null,
    baths: x.BathroomsTotalInteger ?? null,
    sqft,
    lot_size: x.LotSizeArea ?? null,
    year_built: x.Building?.YearBuilt ?? null,
    status: x.Status ?? null,
    description: x.PublicRemarks ?? null,

    address_line1: x.Address?.UnparsedAddress ?? null,
    city: x.Address?.City ?? null,
    province: x.Address?.Province ?? null,
    postal_code: x.Address?.PostalCode ?? null,

    latitude,
    longitude,
    photos,
    thumbnail: photos[0] ?? null,
    raw: x as any
  };
}

async function fetchPage(page = 1, perPage = 50) {
  // Using the Sample key only; the API commonly accepts X-Api-Key
  // and query params like page/per_page. Adjust if your tenant differs.
  const url = `https://api.repliers.io/listings?page=${page}&per_page=${perPage}`;
  const { data } = await axios.get(url, {
    headers: { 'X-Api-Key': REPLIERS_API_KEY }
  });
  // Expected shape: { data: [...], meta: { page, per_page, total_pages, total } } or array
  if (Array.isArray(data)) {
    return { rows: data as RepliersListing[], totalPages: (data.length < perPage ? page : page + 1) };
  }
  const rows = (data?.data ?? data ?? []) as RepliersListing[];
  const totalPages = data?.meta?.total_pages ?? page;
  return { rows, totalPages };
}

async function upsert(rows: ReturnType<typeof toRow>[]) {
  if (!rows.length) return;
  if (DRY_RUN) {
    console.log(`[DRY] Would upsert ${rows.length} rows`);
    return;
    }
  const { error } = await supabase
    .from('app_listings')
    .upsert(rows, { onConflict: 'id' });
  if (error) throw error;
}

async function main() {
  console.log('Starting Repliers ingest (sample key)...');
  let page = 1;
  const perPage = 50;

  while (true) {
    const { rows, totalPages } = await fetchPage(page, perPage);
    if (!rows.length) break;

    const mapped = rows
      .map(r => {
        try { return toRow(r); } catch { return null; }
      })
      .filter(Boolean) as ReturnType<typeof toRow>[];

    await upsert(mapped);
    console.log(`Upserted page ${page} (${mapped.length} rows)`);

    if (page >= totalPages) break;
    page++;
  }

  console.log('Ingest complete.');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
