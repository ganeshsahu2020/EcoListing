import type { LngLatBounds, Listing, UIMapFilters, SoldWithin, ForSaleDays } from "./types";
import { IconHouse, IconCondo, IconTownhouse } from "../AnimatedIcons";

/* Money */
export const fmtMoney0 = (n: number) =>
  new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);

/* Map fallbacks */
export const FALLBACK_RASTER_STYLE: any = {
  version: 8,
  sources: {
    osm: {
      type: "raster",
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: "© OpenStreetMap",
    },
  },
  layers: [{ id: "osm", type: "raster", source: "osm" }],
};

const wrapLon = (lon: number) => ((((lon + 180) % 360) + 360) % 360) - 180;
export const normalizeBounds = (b: LngLatBounds): [number, number, number, number] => {
  const west = wrapLon(b.getWest());
  const south = Math.max(-90, Math.min(90, b.getSouth()));
  const east = wrapLon(b.getEast());
  const north = Math.max(-90, Math.min(90, b.getNorth()));
  return [west, south, east, north];
};

export const hrefFor = (mls?: string | null, id?: string | null) =>
  mls ? `/property/mls:${encodeURIComponent(mls)}` : `/property/${encodeURIComponent(String(id || ""))}`;

/* Address helpers (tolerant of API variants) */
export const pick = <T,>(...vals: (T | null | undefined | "")[]) =>
  (vals.find((v) => v !== null && v !== undefined && v !== "") as T | undefined) ?? null;

export const getAddress = (x: any) =>
  pick<string>(x.address, x.full_address, x.fullAddress, x.street_address, x.streetAddress, x.addr1, x.address1, x.location?.address, x.location?.street);

export const getCity = (x: any) =>
  pick<string>(x.city, x.municipality, x.locality, x.town, x.area, x.location?.city, x.location?.locality);

export const getPostal = (x: any) =>
  pick<string>(x.postal_code, x.zip, x.zipcode, x.postal, x.location?.postalCode);

/* Payment → Price conversion (rough) */
export const monthlyToPrice = (monthly: number, ratePct: number, years: number, downPct: number) => {
  const r = ratePct / 100 / 12;
  const n = years * 12;
  if (!r || !n) return null;
  const loan = (monthly * (1 - Math.pow(1 + r, -n))) / r;
  const price = loan / (1 - downPct / 100);
  return Number.isFinite(price) ? Math.round(price) : null;
};

/* Simple debounce */
export const debounce = <F extends (...args: any[]) => void>(fn: F, ms: number) => {
  let t: number | undefined;
  return (...args: Parameters<F>) => {
    if (t) window.clearTimeout(t);
    t = window.setTimeout(() => fn(...args), ms);
  };
};

/* Subtype matching keywords */
export const SUBTYPE_KEYWORDS: Record<string, string[]> = {
  "Bungalow": ["bungalow"],
  "Bungalow-Raised": ["bungalow-raised", "bungalow raised"],
  "1 1/2 Storey": ["1 1/2 storey", "1.5 storey", "one and a half"],
  "2-Storey": ["2-storey", "2 storey", "two storey", "2 story", "two story"],
  "2 1/2 Storey": ["2 1/2 storey", "2.5 storey"],
  "3-Storey": ["3-storey", "3 storey", "three storey"],
  "Backsplit": ["backsplit"],
  "Sidesplit": ["sidesplit"],
  "Condo Apartment": ["condo apartment", "apartment/condo", "apartment"],
  "Condo Townhouse": ["condo townhouse"],
  "Loft": ["loft"],
  "Others": [],
};

export const ANY_SUBTYPE_LABELS = new Set(Object.keys(SUBTYPE_KEYWORDS));

/* Market helpers */
export const FS_DAYS: { label: string; key: ForSaleDays }[] = [
  { label: "All", key: "all" },
  { label: "Last 24 hours", key: "24h" },
  { label: "Last 3 days", key: "3d" },
  { label: "Last 7 days", key: "7d" },
  { label: "Last 30 days", key: "30d" },
  { label: "Last 60 days", key: "60d" },
  { label: "Last 90 days", key: "90d" },
];

export const SOLD_WITHIN: { label: string; key: SoldWithin }[] = [
  { label: "Last 24 Hours", key: "24h" },
  { label: "Last 3 Days", key: "3d" },
  { label: "Last 7 Days", key: "7d" },
  { label: "Last 30 Days", key: "30d" },
  { label: "Last 90 Days", key: "90d" },
  { label: "Last 180 Days", key: "180d" },
  { label: "Last 365 Days", key: "365d" },
  { label: "2025", key: "year-2025" },
  { label: "2024", key: "year-2024" },
  { label: "2023", key: "year-2023" },
  { label: "2022", key: "year-2022" },
  { label: "2021", key: "year-2021" },
  { label: "2020", key: "year-2020" },
  { label: "2019", key: "year-2019" },
  { label: "2018", key: "year-2018" },
  { label: "2017", key: "year-2017" },
  { label: "2016", key: "year-2016" },
  { label: "2015", key: "year-2015" },
  { label: "2014", key: "year-2014" },
  { label: "2013", key: "year-2013" },
  { label: "2012", key: "year-2012" },
  { label: "2011", key: "year-2011" },
  { label: "2010", key: "year-2010" },
  { label: "2009", key: "year-2009" },
  { label: "2008", key: "year-2008" },
  { label: "2007", key: "year-2007" },
  { label: "2006", key: "year-2006" },
  { label: "2005", key: "year-2005" },
  { label: "2004", key: "year-2004" },
  { label: "2003", key: "year-2003" },
  { label: "2002", key: "year-2002" },
  { label: "2001", key: "year-2001" },
  { label: "Up to 2000", key: "year-2000-or-earlier" },
];

const nowMs = () => Date.now();
const parseDateMs = (s?: string | null) => {
  if (!s) return NaN;
  const ms = Date.parse(s);
  return Number.isFinite(ms) ? ms : NaN;
};
const withinLastNDays = (dateStr: string | null | undefined, days: number) => {
  const ms = parseDateMs(dateStr);
  if (!Number.isFinite(ms)) return false;
  return (nowMs() - ms) <= days * 86400 * 1000;
};
const inYear = (dateStr: string | null | undefined, y: number, orEarlier = false) => {
  const ms = parseDateMs(dateStr);
  if (!Number.isFinite(ms)) return false;
  const d = new Date(ms);
  return orEarlier ? d.getFullYear() <= y : d.getFullYear() === y;
};

export const summarizeMarketPill = (m: UIMapFilters["market"]) => {
  if (m.mode === "forSale") return m.forSaleDays === "all" ? "For sale" : `For sale ${m.forSaleDays}`;
  const short = (k: SoldWithin) =>
    k.startsWith("year-") ? (k === "year-2000-or-earlier" ? "≤2000" : k.replace("year-", "")) : k;
  return `Sold ${short(m.soldWithin)}`;
};

/* Client-side filters (keep identical behaviour) */
export function applyClientFilters(rows: Listing[], f: UIMapFilters): Listing[] {
  let out = [...rows];

  // Market window
  const m = f.market;
  if (m.mode === "forSale") {
    if (m.forSaleDays !== "all") {
      const daysMap: Record<Exclude<ForSaleDays, "all">, number> = {
        "24h": 1, "3d": 3, "7d": 7, "30d": 30, "60d": 60, "90d": 90,
      };
      out = out.filter((r) => withinLastNDays(r.list_date || r.updated_at, daysMap[m.forSaleDays]));
    }
  } else {
    const k = m.soldWithin;
    if (k.endsWith("d") || k === "24h" || k === "3d" || k === "7d") {
      const days = k === "24h" ? 1 : k === "3d" ? 3 : k === "7d" ? 7 : Number(k.replace("d", ""));
      out = out.filter((r) => withinLastNDays(r.updated_at || r.list_date, days));
    } else if (k.startsWith("year-")) {
      out = out.filter((r) =>
        k === "year-2000-or-earlier" ? inYear(r.updated_at || r.list_date, 2000, true)
                                     : inYear(r.updated_at || r.list_date, Number(k.replace("year-", "")))
      );
    }
  }

  // Search query
  if (f.query.trim()) {
    const q = f.query.trim().toLowerCase();
    out = out.filter((r) => [r.address, r.city, r.postal_code].filter(Boolean)
      .some((s) => String(s).toLowerCase().includes(q)));
  }

  // Price / Monthly
  let min = f.priceMin, max = f.priceMax;
  if (f.mode === "payment") {
    if (f.monthlyMin != null) {
      const p = monthlyToPrice(f.monthlyMin, f.rate, f.termYears, f.downPct);
      if (p != null) min = p;
    }
    if (f.monthlyMax != null) {
      const p = monthlyToPrice(f.monthlyMax, f.rate, f.termYears, f.downPct);
      if (p != null) max = p;
    }
  }
  if (min != null) out = out.filter((r) => (r.list_price ?? 0) >= min!);
  if (max != null) out = out.filter((r) => (r.list_price ?? Number.MAX_SAFE_INTEGER) <= max!);

  // Beds & Baths
  if (f.bedsMin != null) out = out.filter((r) => f.bedsExact ? (r.beds ?? 0) === f.bedsMin! : (r.beds ?? 0) >= f.bedsMin!);
  if (f.bathsMin != null) out = out.filter((r) => (r.baths ?? 0) >= f.bathsMin!);

  // Broad home types
  const enabledTypes = Object.entries(f.homeTypes).filter(([, v]) => v).map(([k]) => k);
  if (enabledTypes.length && enabledTypes.length < 7) {
    out = out.filter((r) => {
      const t = (r.property_type || "").toLowerCase();
      return (
        (enabledTypes.includes("house") && t.includes("house")) ||
        (enabledTypes.includes("townhouse") && t.includes("town")) ||
        (enabledTypes.includes("multi") && t.includes("multi")) ||
        (enabledTypes.includes("condo") && (t.includes("condo") || t.includes("co-op"))) ||
        (enabledTypes.includes("land") && (t.includes("lot") || t.includes("land"))) ||
        (enabledTypes.includes("apartment") && t.includes("apartment")) ||
        (enabledTypes.includes("manufactured") && t.includes("manufactured"))
      );
    });
  }

  // Property Type + subtypes
  const pt = f.propertyType;
  const selectedCats = Object.entries(pt.categories).filter(([, v]) => v).map(([k]) => k);
  const selectedSubtypeLabels = Object.entries(pt.subtypes).filter(([, v]) => v).map(([k]) => k)
    .filter((k) => ANY_SUBTYPE_LABELS.has(k));

  if (selectedCats.length > 0 || selectedSubtypeLabels.length > 0) {
    out = out.filter((r) => {
      const t = (r.property_type || "").toLowerCase();

      const isDetached = t.includes("detached") || t.includes("house");
      const isSemi = t.includes("semi") || t.includes("semi-detached") || t.includes("semi detached");
      const isCondo = t.includes("condo") || t.includes("apartment");
      const isTown = t.includes("town") || t.includes("row");
      const isLand = t.includes("land") || t.includes("lot");
      const isOther = !(isDetached || isSemi || isCondo || isTown || isLand);

      const matchesCat = () =>
        (pt.categories.detached && isDetached) ||
        (pt.categories.semiDetached && isSemi) ||
        (pt.categories.condo && isCondo) ||
        (pt.categories.townhouse && isTown) ||
        (pt.categories.land && isLand) ||
        (pt.categories.other && isOther) ||
        selectedCats.length === 0;

      const matchesSubtype = () => {
        if (!selectedSubtypeLabels.length) return true;
        if (selectedSubtypeLabels.includes("Others")) return true;
        return selectedSubtypeLabels.some((label) =>
          (SUBTYPE_KEYWORDS[label] || []).some((kw) => t.includes(kw))
        );
      };

      return matchesCat() && matchesSubtype();
    });
  }

  // More
  const more = f.more || {};
  if (more.sqftMin != null) out = out.filter((r) => (r.sqft ?? 0) >= more.sqftMin!);
  if (more.sqftMax != null) out = out.filter((r) => (r.sqft ?? Number.MAX_SAFE_INTEGER) <= more.sqftMax!);

  const want = (field: string) => (r: any) => r[field] === true || r[field] === "true";
  if (more.has3DTour) out = out.filter(want("has3DTour"));
  if (more.petFriendly) out = out.filter(want("petFriendly"));
  if (more.parking) out = out.filter(want("parking"));
  if (more.pool) out = out.filter(want("pool"));
  if (more.garden) out = out.filter(want("garden"));

  return out;
}

/* Sorting */
export function applyClientSort(rows: Listing[], sort: UIMapFilters["sort"]) {
  const out = [...rows];
  switch (sort) {
    case "priceAsc": out.sort((a, b) => (a.list_price ?? 0) - (b.list_price ?? 0)); break;
    case "price": out.sort((a, b) => (b.list_price ?? 0) - (a.list_price ?? 0)); break;
    case "days": out.sort((a, b) => String(b.updated_at || "").localeCompare(String(a.updated_at || ""))); break;
    case "newest":
    default: out.sort((a, b) => String(b.list_date || "").localeCompare(String(a.list_date || ""))); break;
  }
  return out;
}

/** Render a small pin icon matching the broad property type. */
export function getPinIcon(type?: string | null) {
  switch ((type || "").toLowerCase()) {
    case "condo":
    case "apartment/condo":
      return <IconCondo gradient />;
    case "townhouse":
    case "row house (non-strata)":
      return <IconTownhouse gradient />;
    default:
      return <IconHouse gradient />;
  }
}
