// ─────────────────────────────────────────────────────────
// Direct client-side Repliers client (no Supabase required)
// Requires: VITE_REPLIERS_API_KEY and (optionally) VITE_DIRECT_REPLIERS=1
// ─────────────────────────────────────────────────────────

export type SearchParams = Record<string, any>;

export type RepliersListing = {
  id: string;
  mls_id: string;
  lat: number|null;
  lon: number|null;
  list_price: number|null;
  beds?: number|null;
  baths?: number|null;
  sqft?: number|null;
  price_per_sqft?: number|null;
  address?: string|null;
  city?: string|null;
  status: string;
  property_type?: string|null;
  list_date?: string|null;
  sold_date?: string|null;
  updated_at?: string|null;
  year_built?: number|null;
  lot_sqft?: number|null;
  dom?: number|null;
  image_path?: string|null;
  image_url?: string|null;
};

// Repliers CSR base (CORS-friendly proxy hosted by Repliers)
const CSR_BASE = "https://csr-api.repliers.io";
const UPSTREAM_LIST_PATH = (import.meta.env.VITE_REPLIERS_LIST_PATH as string) || "/listings";

// -------------------- numeric helpers --------------------
const toNum = (v: unknown): number|null => {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim()) {
    const n = Number(v.replace(/[^\d.-]/g, ""));
    return Number.isFinite(n) ? n : null;
  }
  return null;
};
const toInt = (v: unknown): number|null => {
  const n = toNum(v);
  if (n == null) return null;
  return Math.floor(n);
};

// -------------------- case-insensitive pickers --------------------
function getCI(obj: any, key: string) {
  if (!obj || typeof obj !== "object") return undefined;
  const k = Object.keys(obj).find((k) => k.toLowerCase() === key.toLowerCase());
  return k ? (obj as any)[k] : undefined;
}
function pickCI(obj: any, key: string) { return getCI(obj, key); }
function pickPathCI(obj: any, path: string) {
  const parts = path.split(".");
  let cur = obj;
  for (const p of parts) {
    if (!cur || typeof cur !== "object") return undefined;
    cur = pickCI(cur, p);
  }
  return cur;
}
function pickMany(obj: any, paths: string[]) {
  for (const p of paths) {
    const v = pickPathCI(obj, p);
    if (v !== undefined && v !== null && v !== "") return v;
  }
  return undefined;
}

// Robust selectors
const pickMLS = (x: any): string|null => { const v = pickMany(x, ["mls_id","mlsId","mlsNumber","listingId","id"]); return v == null ? null : String(v); };
const pickPrice = (x: any) => toNum(pickMany(x, ["list_price","listPrice","price","details.listPrice"]));
const pickBeds = (x: any) => toInt(pickMany(x, ["beds","bedrooms","numBedrooms","details.numBedrooms","BedroomsTotal"]));
const pickBaths = (x: any) => toInt(pickMany(x, ["baths","bathrooms","numBaths","details.numBathrooms","BathroomsTotal"]));
const pickSqft = (x: any) => toNum(pickMany(x, ["sqft","sqFt","squareFeet","details.sqft","details.finishedSqft","details.totalSqFt","details.sqFt","Building.AreaTotal"]));
const pickAddr = (x: any) => (pickMany(x, ["address.full","address.formatted","Address.Full","address.line1","address.street","address.streetAddress","street_address","full_address","address","location.address","location.street"]) ?? null) as string|null;
const pickCity = (x: any) => (pickMany(x, ["address.city","Address.City","city","municipality","locality","town","area","location.city","location.locality"]) ?? null) as string|null;
const pickType = (x: any) => { const v = pickMany(x, ["property_type","propertyType","details.propertyType","type","Building.Type"]); return v == null ? null : String(v); };
const pickYearBuilt = (x: any): number|null => { const y = toInt(pickMany(x, ["year_built","yearBuilt","details.yearBuilt","Building.YearBuilt"])); if (y == null) return null; if (y < 1800 || y > 3000) return null; return y; };
const pickDOM = (x: any) => toInt(pickMany(x, ["days_on_market","daysOnMarket","dom","DaysOnMarket"]));
const pickListDate = (x: any) => (pickMany(x, ["list_date","listDate","createdOn","ListDate","ListingDate"]) ?? null) as string|null;
const pickSoldDate = (x: any) => (pickMany(x, ["sold_date","soldDate","CloseDate","SoldDate"]) ?? null) as string|null;
const pickStatus = (x: any) => { const s = (pickMany(x, ["status","status_enum","ListingStatus"]) as any)?.toString()?.toLowerCase() ?? null; if (!s) return null; if (["active","for sale","for-sale","for_sale","a"].includes(s)) return "A"; if (["sold","s"].includes(s)) return "S"; return s; };
const pickLat = (x: any) => toNum(pickMany(x, ["lat","latitude","map.latitude","address.latitude","location.latitude","coordinates.latitude","_detail.map.latitude"]));
const pickLon = (x: any) => toNum(pickMany(x, ["lon","lng","longitude","map.longitude","address.longitude","location.longitude","coordinates.longitude","_detail.map.longitude"]));

// -------------------- photos --------------------
function normalizePhotoEntry(v: any): string|null { if (!v) return null; if (typeof v === "string") return v; if (typeof v === "object") { const u = v.url ?? v.href ?? v.path ?? v.src ?? v.source ?? v.MediaURL; return u ? String(u) : null; } return null; }
function looksLikeImagePath(s: string): boolean { return typeof s === "string" && s.trim().length > 4; }
function extractPhotosFromKnownKeys(x: any): string[] {
  const candidates = ["photos","images","media.photos","media.images","media.gallery","property.photos","property.images","property.gallery","details.photos","details.images","gallery","photoGallery","mediaItems","photosUrls","photoUrls","imageUrls","media.Photos","Photos","Media.Photo"];
  for (const key of candidates) {
    const val = pickPathCI(x, key);
    if (Array.isArray(val) && val.length) {
      const out = val.map(normalizePhotoEntry).filter((s: any): s is string => !!s && looksLikeImagePath(s));
      if (out.length) return out;
    }
  }
  return [];
}
function deepScanForPhotos(x: any, maxDepth = 4): string[] {
  const seen = new Set<any>();
  const queue: Array<{node:any; depth:number}> = [{node:x, depth:0}];
  while (queue.length) {
    const {node, depth} = queue.shift()!;
    if (!node || typeof node !== "object" || seen.has(node)) continue;
    seen.add(node);
    if (Array.isArray(node)) {
      const out = node.map(normalizePhotoEntry).filter((s: any): s is string => !!s && looksLikeImagePath(s));
      if (out.length) return out;
      if (depth < maxDepth) for (const v of node) if (v && typeof v === "object") queue.push({node:v, depth:depth+1});
      continue;
    }
    if (depth < maxDepth) {
      for (const k of Object.keys(node)) {
        const v = (node as any)[k];
        if (v && (typeof v === "object" || Array.isArray(v))) queue.push({node:v, depth:depth+1});
      }
    }
  }
  return [];
}
function pickPhotos(x: any): string[] { const via = extractPhotosFromKnownKeys(x); if (via.length) return via; return deepScanForPhotos(x); }
function isPlaceholderUrl(s: string): boolean { return /^https?:\/\/(?:placehold\.co|yourdomain\.com)(?:\/|$)/i.test(s); }
function buildImageUrl(raw?: string|null): {image_path:string|null; image_url:string|null} {
  if (!raw) return {image_path:null, image_url:null};
  const src = String(raw);
  if (/^https?:\/\//i.test(src)) {
    if (isPlaceholderUrl(src)) return {image_path:null, image_url:null};
    const hasClass = /(?:[?&])class=/.test(src);
    const image_url = hasClass ? src : `${src}${src.includes("?") ? "&" : "?"}class=medium`;
    return {image_path:src, image_url};
  }
  const clean = src.replace(/^\/+/, "");
  const image_url = `https://cdn.repliers.io/${clean}?class=medium`;
  return {image_path:clean, image_url};
}

// -------------------- core request helpers --------------------
function encodeParams(obj: Record<string, any>) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null || v === "") continue;
    if (Array.isArray(v)) v.forEach((item) => sp.append(k, String(item)));
    else if (typeof v === "object") sp.set(k, JSON.stringify(v));
    else sp.set(k, String(v));
  }
  return sp.toString();
}
async function repliersDirectFetch(p: Record<string, any>) {
  const key = import.meta.env.VITE_REPLIERS_API_KEY as string|undefined;
  if (!key) throw new Error("Direct mode requires VITE_REPLIERS_API_KEY in ui/.env.local");
  const merged = {...p, repliers_api_key:key};
  const qs = encodeParams(merged);
  const url = `${CSR_BASE}${UPSTREAM_LIST_PATH}${qs ? `?${qs}` : ""}`;
  const r = await fetch(url, {headers:{Accept:"application/json"}});
  const text = await r.text();
  if (!r.ok) throw new Error(`Repliers upstream failed (${r.status} ${r.statusText}): ${text}`);
  try { return JSON.parse(text); } catch { return text as any; }
}
function asArrayPayload(json: any): any[] {
  if (Array.isArray(json)) return json;
  if (Array.isArray(json?.listings)) return json.listings;
  if (Array.isArray(json?.items)) return json.items;
  if (Array.isArray(json?.results)) return json.results;
  if (Array.isArray(json?.detail?.listings)) return json.detail.listings;
  return [];
}

// -------------------- public listing search --------------------
export async function fetchListingsDirect(params: {west:number; south:number; east:number; north:number; status?: "A"|"S"; limit?:number; dropUnmappable?:boolean;}): Promise<RepliersListing[]> {
  const {west, south, east, north, status="A", limit=200, dropUnmappable=true} = params;
  const raw = await repliersDirectFetch({listings:true, status, resultsPerPage:limit, pageNum:1, bbox:`${west},${south},${east},${north}`, sortBy:"updatedOnDesc"});
  const items = asArrayPayload(raw);
  const mapped: RepliersListing[] = items.map((x: any) => {
    const lat = pickLat(x); const lon = pickLon(x); const price = pickPrice(x); const sqft = pickSqft(x); const mls = pickMLS(x) || "";
    const photos = pickPhotos(x); const first = photos?.[0] ?? null; const {image_path, image_url} = buildImageUrl(first);
    const price_per_sqft = price != null && sqft != null && sqft > 0 ? Math.round(price / sqft) : null;
    return {id:String(mls || x?.id || Math.random().toString(36).slice(2)), mls_id:mls, lat:lat ?? null, lon:lon ?? null, list_price:price ?? null, beds:pickBeds(x), baths:pickBaths(x), sqft:sqft, price_per_sqft, address:pickAddr(x), city:pickCity(x), status:pickStatus(x) || "A", property_type:pickType(x), list_date:pickListDate(x), sold_date:pickSoldDate(x), updated_at:(x?.updated_on || x?.updatedAt || x?.updated_at || null) as any, year_built:pickYearBuilt(x), lot_sqft:toNum(pickMany(x, ["lot_sqft","lotSizeSqft","details.lotSize"])), dom:pickDOM(x), image_path, image_url};
  });
  return dropUnmappable ? mapped.filter((l) => typeof l.lat === "number" && Number.isFinite(l.lat) && typeof l.lon === "number" && Number.isFinite(l.lon)) : mapped;
}

export async function repliersProxyFetch(params: SearchParams = {}, _opts?: {method?: "GET"|"POST"; body?: unknown; path?: string}) {
  const flat = {...params};
  if (flat.listings && (flat.pageNum == null || flat.pageNum === "")) flat.pageNum = 1;
  if (flat.listings && (flat.resultsPerPage == null || flat.resultsPerPage === "")) flat.resultsPerPage = 24;
  return repliersDirectFetch(flat);
}
export default repliersProxyFetch;

// ─────────────────────────────────────────────────────────
// Rich detail API (normalize many feeds to a stable shape)
// ─────────────────────────────────────────────────────────

export type RoomVM = {level?:string|null; name?:string|null; dim_imperial?:string|null; dim_metric?:string|null; raw?:any};
export type SaleEventVM = {date?:string|null; status?:string|null; price?:number|null; raw?:any};
export type ListingFull = {
  listing: RepliersListing;
  photos: string[];
  description?: string|null;
  virtualTourUrl?: string|null;
  imageInsights?: any;
  rooms?: RoomVM[];
  measurements?: {square_footage?: number|null; total_finished_area?: number|null};
  building?: {bathrooms_total?: number|null; features?: string[]; heating_type?: string|null; cooling?: string|null; fireplace?: number|null; parking_total?: number|null; building_type?: string|null; title?: string|null; neighbourhood?: string|null; land_size?: string|null; built_in?: number|null; annual_taxes?: number|null; time_on_portal?: string|null;};
  sale_history?: SaleEventVM[];
  land?: {view?: string|null; access?: string|null; zoning_description?: string|null; zoning_type?: string|null; lot_features?: string[];};
};

function toArray(v: any): any[] { if (!v) return []; if (Array.isArray(v)) return v; if (typeof v === "string") return v.split(/[,|;]\s*/).filter(Boolean); return []; }
function pickDesc(x: any): string|null {
  const v = pickMany(x, ["remarks","publicRemarks","PublicRemarks","description","property.description","details.description"]);
  return v == null ? null : String(v);
}
function pickTour(x: any): string|null {
  const fromVideos = Array.isArray(x?.media?.videos) ? x.media.videos.map((v: any) => v?.url || v).filter(Boolean) : [];
  const candidates = [x?.virtualTourUrl,x?.virtualTourURL,x?.VirtualTourURL,x?.VirtualTourUrl,x?.media?.virtualTourUrl,x?.media?.VirtualTourURL,...fromVideos].filter(Boolean);
  const first = candidates[0];
  return typeof first === "string" ? first : null;
}
function pickRooms(x: any): RoomVM[] {
  const arr = (pickMany(x, ["rooms","Rooms","Room","property.rooms","details.rooms"]) as any) || [];
  if (!Array.isArray(arr)) return [];
  return arr.map((r: any) => {
    const level = pickMany(r, ["level","Level","storey","Storey","floor","Floor"]) ?? null;
    const name = pickMany(r, ["name","Name","type","Type","roomType"]) ?? null;
    const dim = pickMany(r, ["dimensions","Dimensions","size","Size","measurement","Measurement"]) ?? null;
    const dimImp = typeof dim === "string" && /ft|inch|in'|\'/i.test(dim) ? String(dim) : null;
    const dimMet = typeof dim === "string" && /m|cm/i.test(dim) ? String(dim) : null;
    return {level,name,dim_imperial:dimImp,dim_metric:dimMet,raw:r};
  });
}
function pickSaleHistory(x: any): SaleEventVM[] {
  const arr = (pickMany(x, ["saleHistory","priceHistory","history","PriceHistory","sales"]) as any) || [];
  if (!Array.isArray(arr)) return [];
  return arr.map((e: any) => ({date:(pickMany(e, ["date","Date","eventDate"]) as any) ?? null, status:(pickMany(e, ["status","Status","eventType"]) as any) ?? null, price: toNum(pickMany(e, ["price","Price","amount","Amount"])) ?? null, raw:e}));
}
function pickAnnualTaxes(x: any): number|null { return toNum(pickMany(x, ["taxes.annual","taxes_annual","AnnualTaxes","Taxes.Annual","property.taxes","TaxAnnualAmount"])); }
function pickParkingTotal(x: any): number|null { return toInt(pickMany(x, ["parking.total","parking.count","Parking.Total","ParkingTotal","TotalParkingSpaces"])); }
function pickBuildingFeatures(x: any): string[] {
  const v = pickMany(x, ["building.features","features","Building.Features","Details.Features","property.features"]);
  return toArray(v);
}
function pickCooling(x: any): string|null { const v = pickMany(x, ["building.cooling","cooling","Cooling","HeatingCooling.Cooling"]); return v == null ? null : String(v); }
function pickHeating(x: any): string|null { const v = pickMany(x, ["building.heating","heating","HeatingType","Heating.Type"]); return v == null ? null : String(v); }
function pickFireplace(x: any): number|null { return toInt(pickMany(x, ["building.fireplace","fireplace","Fireplace","FireplacesTotal","FireplaceTotal"])); }
function pickNeighbourhood(x: any): string|null { const v = pickMany(x, ["neighbourhood","neighborhood","NeighbourhoodName","NeighborhoodName"]); return v == null ? null : String(v); }
function pickLandSizeText(x: any): string|null {
  const size = pickMany(x, ["lot_sqft","lotSizeSqft","details.lotSize","LotSize","Land.Size","Lot.Frontage","LotDepth"]);
  if (size == null) return null;
  const n = toNum(size);
  if (n != null) return `${n.toLocaleString()} sqft`;
  return String(size);
}
function computeTimeOnPortal(listDate?: string|null): string|null {
  if (!listDate) return null;
  const start = new Date(listDate).getTime();
  if (!Number.isFinite(start)) return null;
  const days = Math.max(0, Math.round((Date.now() - start) / (1000*60*60*24)));
  return `${days} day${days===1?"":"s"}`;
}

export async function getListingFullByMls(mls: string): Promise<ListingFull> {
  const raw = await repliersDirectFetch({listings:true, pageNum:1, resultsPerPage:1, mlsNumber:mls, mls_id:mls, images:true, media:true, imageInsights:true, details:true, history:true, roomDetails:true});
  const items = asArrayPayload(raw);
  if (!items.length) throw new Error("Listing not found.");
  const x = items[0];

  const mls_id = pickMLS(x) || mls;
  const price = pickPrice(x);
  const sqft = pickSqft(x);
  const ppsf = price != null && sqft != null && sqft > 0 ? Math.round(price / sqft) : null;
  const photos = pickPhotos(x);
  const {image_path, image_url} = buildImageUrl(photos?.[0]);
  const listing: RepliersListing = {
    id: String(mls_id || x?.id || Math.random().toString(36).slice(2)),
    mls_id: String(mls_id),
    lat: pickLat(x) ?? null,
    lon: pickLon(x) ?? null,
    list_price: price ?? null,
    beds: pickBeds(x),
    baths: pickBaths(x),
    sqft: sqft,
    price_per_sqft: ppsf,
    address: pickAddr(x),
    city: pickCity(x),
    status: pickStatus(x) || "A",
    property_type: pickType(x),
    list_date: pickListDate(x),
    sold_date: pickSoldDate(x),
    updated_at: (x?.updated_on || x?.updatedAt || x?.updated_at || null) as any,
    year_built: pickYearBuilt(x),
    lot_sqft: toNum(pickMany(x, ["lot_sqft","lotSizeSqft","details.lotSize"])),
    dom: pickDOM(x),
    image_path,
    image_url
  };

  const building = {
    bathrooms_total: pickBaths(x),
    features: pickBuildingFeatures(x),
    heating_type: pickHeating(x),
    cooling: pickCooling(x),
    fireplace: pickFireplace(x),
    parking_total: pickParkingTotal(x),
    building_type: pickType(x),
    title: (pickMany(x, ["title","ownership","OwnershipType","Ownership"]) ?? null) as string|null,
    neighbourhood: pickNeighbourhood(x),
    land_size: pickLandSizeText(x),
    built_in: pickYearBuilt(x),
    annual_taxes: pickAnnualTaxes(x),
    time_on_portal: computeTimeOnPortal(listing.list_date)
  };

  const land = {
    view: (pickMany(x, ["land.view","View","views"]) ?? null) as string|null,
    access: (pickMany(x, ["land.access","AccessType","Access"]) ?? null) as string|null,
    zoning_description: (pickMany(x, ["land.zoning_description","ZoningDescription","Zoning"]) ?? null) as string|null,
    zoning_type: (pickMany(x, ["land.zoning_type","ZoningType"]) ?? null) as string|null,
    lot_features: toArray(pickMany(x, ["land.features","LotFeatures"]))
  };

  const measurements = {square_footage: sqft ?? null, total_finished_area: toNum(pickMany(x, ["details.finishedSqft","TotalFinishedArea"])) ?? sqft ?? null};

  return {
    listing,
    photos,
    description: pickDesc(x),
    virtualTourUrl: pickTour(x),
    imageInsights: x?.imageInsights,
    rooms: pickRooms(x),
    measurements,
    building,
    sale_history: pickSaleHistory(x),
    land
  };
}
