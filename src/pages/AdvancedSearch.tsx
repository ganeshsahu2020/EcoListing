// src/pages/AdvancedSearch.tsx
import React, { useEffect, useMemo, useState } from "react";
import { repliersProxyFetch } from "../utils/repliersClient";
import ListingCard from "../components/ListingCard";
import ListingsSkeleton from "../components/ListingsSkeleton";

/* Heroicons (mapped to the names we use in this file) */
import {
  HomeModernIcon as Home,
  Squares2X2Icon as BedDouble,
  BeakerIcon as Bath,
  TruckIcon as Car,
  Square2StackIcon as ParkingSquare,
  BuildingOffice2Icon as Building2,
  BuildingOfficeIcon as Building,
  GlobeAltIcon as Trees,
  ChevronLeftIcon as ChevronLeft,
  ChevronRightIcon as ChevronRight,
  AdjustmentsHorizontalIcon as SlidersHorizontal,
} from "@heroicons/react/24/outline";

/* Repliers CDN helpers */
const CDN = "https://cdn.repliers.io";
const toCdn = (
  path?: string | null,
  klass: "small" | "medium" | "large" = "medium"
) => (path ? (/^https?:\/\//i.test(path) ? path : `${CDN}/${path}?class=${klass}`) : null);

/* ---------- Types ---------- */
type StatusTab = "active" | "sold" | "all";

type Filters = {
  status: StatusTab;
  beds: string;            // 'Any' | 'Studio' | '1+' | ...
  baths: string;           // 'Any' | '1+' | ...
  propertyType: {
    residential: boolean;
    condo: boolean;
    multifamily: boolean;
    land: boolean;
  };
  garage: string;          // 'Any' | '1+' | ...
  parking: string;         // 'Any' | '1+' | ...
  priceMin: number;
  priceMax: number;
  dwellingType: string[];
  dwellingStyle: string[];
  daysOnMarketMax: number; // 0-365
  soldWithinMax: number;   // 0-365
  yearBuiltMin: number;
  yearBuiltMax: number;
};

const DEFAULT_FILTERS: Filters = {
  status: "active",
  beds: "Any",
  baths: "Any",
  propertyType: { residential: false, condo: false, multifamily: false, land: false },
  garage: "Any",
  parking: "Any",
  priceMin: 0,
  priceMax: 3_900_000,
  dwellingType: [],
  dwellingStyle: [],
  daysOnMarketMax: 365,
  soldWithinMax: 365,
  yearBuiltMin: 1800,
  yearBuiltMax: new Date().getFullYear(),
};

/* ---------- Helpers ---------- */
const num = (v: any): number | undefined => {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim()) {
    const n = Number(v.replace(/[^\d.-]/g, ""));
    if (Number.isFinite(n)) return n;
  }
  return undefined;
};

const firstDefined = <T,>(...vals: T[]): T | undefined =>
  vals.find(v => v !== undefined && v !== null && v !== "");

/* Robust field mappers */
const pickMLS = (x: any): string | null =>
  (x?.mlsNumber && String(x.mlsNumber)) ||
  (x?.mlsId && String(x.mlsId)) ||
  (x?.mls_id && String(x.mls_id)) || null;

const pickPrice = (x: any): number | null =>
  num(x?.price) ?? num(x?.listPrice) ?? num(x?.list_price) ?? null;

const pickBeds = (x: any): number | null =>
  num(x?.beds) ?? num(x?.details?.numBedrooms) ?? num(x?.BedroomsTotal) ?? null;

const pickBaths = (x: any): number | null =>
  num(x?.baths) ?? num(x?.details?.numBathrooms) ?? num(x?.BathroomsTotal) ?? null;

const pickSqft = (x: any): number | null =>
  num(x?.sqFt) ?? num(x?.sqft) ?? num(x?.details?.totalSqFt) ?? num(x?.details?.sqFt) ?? null;

const pickAddress = (x: any) => {
  const city = firstDefined(x?.address?.city, x?.city, x?.address?.municipality, x?.Address?.City) as
    | string
    | undefined;
  const line = firstDefined(
    x?.address?.formatted,
    x?.address?.full,
    x?.Address?.Full,
    [x?.address?.streetNumber, x?.address?.streetName, city].filter(Boolean).join(" ")
  ) as string | undefined;
  return { line, city };
};

const unwrapListings = (raw: any): any[] =>
  Array.isArray(raw?.listings)
    ? raw.listings
    : Array.isArray(raw)
    ? raw
    : Array.isArray(raw?.results)
    ? raw.results
    : Array.isArray(raw?.items)
    ? raw.items
    : Array.isArray(raw?.detail?.listings)
    ? raw.detail.listings
    : [];

/* ---------- UI atoms ---------- */
function Chip({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-md px-3 py-2 text-sm transition
        ${active ? "bg-blue-100 text-blue-700 border border-blue-300"
                 : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
    >
      {children}
    </button>
  );
}

function SectionTitle({ icon, children }: { icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
      {icon}
      {children}
    </div>
  );
}

/* ---------- Page ---------- */
export default function AdvancedSearch() {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const pageSize = 24;

  // Build API params from UI filters
const apiParams = useMemo(() => {
  const p: Record<string, any> = {
    listings: true,
    images: true,
    pageNum: 1,
    resultsPerPage: 200,
  };

  // ✅ status mapping for Repliers
  if (filters.status === "active") {
    p.status = "A";                       // NOT "active"
  } else if (filters.status === "sold") {
    p.status = "U";                       // off-market bucket
    // If you want recent solds, include a window:
    p.soldWithinDays = Math.max(1, Math.min(365, filters.soldWithinMax || 365));
  }
  // if filters.status === "all" -> omit p.status entirely

  // beds / baths
  const bedMap: Record<string, number | undefined> = { Any: undefined, Studio: 0, "1+": 1, "2+": 2, "3+": 3, "4+": 4, "5+": 5 };
  const bathMap: Record<string, number | undefined> = { Any: undefined, "1+": 1, "2+": 2, "3+": 3, "4+": 4, "5+": 5 };
  const minBedrooms = bedMap[filters.beds];
  const minBathrooms = bathMap[filters.baths];
  if (minBedrooms != null) p.minBedrooms = minBedrooms;
  if (minBathrooms != null) p.minBathrooms = minBathrooms;

  // price
  if (filters.priceMin > 0) p.minPrice = filters.priceMin;
  if (filters.priceMax > 0) p.maxPrice = filters.priceMax;

  // year built
  if (filters.yearBuiltMin) p.minYearBuilt = filters.yearBuiltMin;
  if (filters.yearBuiltMax) p.maxYearBuilt = filters.yearBuiltMax;

  // days on market (only for actives)
  if (filters.status === "active" && filters.daysOnMarketMax < 365) {
    p.maxDaysOnMarket = filters.daysOnMarketMax;
  }

  // property types
  const types: string[] = [];
  if (filters.propertyType.residential) types.push("residential");
  if (filters.propertyType.condo) types.push("condo");
  if (filters.propertyType.multifamily) types.push("multifamily");
  if (filters.propertyType.land) types.push("land");
  if (types.length) p.propertyType = types;

  // dwelling metadata (best-effort; upstream may ignore)
  if (filters.dwellingType.length) p.dwellingType = filters.dwellingType;
  if (filters.dwellingStyle.length) p.dwellingStyle = filters.dwellingStyle;

  return p;
}, [filters]);

  /* Fetch */
  useEffect(() => {
    let cancel = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await repliersProxyFetch(apiParams);
        const list = unwrapListings(data);

        const mapped = list.map((x: any, i: number) => {
          const mls = pickMLS(x);
          const { line, city } = pickAddress(x);
          const price = pickPrice(x) ?? 0;
          const beds = pickBeds(x);
          const baths = pickBaths(x);
          const sqft = pickSqft(x);

          // prefer Repliers "images[]" CDN paths, else various photo fields
          const images = Array.isArray(x?.images) ? x.images : [];
          const firstCdn = images.length ? toCdn(images[0], "medium") : null;
          const fallback =
            x?.image_url ||
            x?.primaryPhoto?.url ||
            x?.media?.photos?.[0]?.url ||
            x?.media?.Photos?.[0]?.url ||
            x?.Photos?.[0]?.url ||
            x?.Media?.Photo?.[0]?.MediaURL ||
            null;
          const image_url = firstCdn || toCdn(fallback as any, "medium") || "/placeholder-house.jpg";

          const statusRaw = String(x?.statusText ?? x?.status ?? x?.ListingStatus ?? "").toLowerCase();
          const status =
            statusRaw.includes("sold")
              ? "sold"
              : statusRaw.includes("lease")
              ? "for-lease"
              : statusRaw.includes("sale") || statusRaw === "active"
              ? "for-sale"
              : "unknown";

          return {
            id: mls ? `mls:${mls}` : `row-${i}`,
            mls_id: mls,
            price,
            beds,
            baths,
            sqft,
            address: line ?? "—",
            city: city ?? "",
            image_url,
            images,
            status,
          };
        });

        if (!cancel) {
          setRows(mapped);
          setPage(1);
        }
      } catch (e: any) {
        if (!cancel) setError(e?.message || String(e));
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => {
      cancel = true;
    };
     
  }, [apiParams]);

  /* Pagination (client) */
  const numPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const pageSafe = Math.max(1, Math.min(page, numPages));
  const pageRows = useMemo(() => {
    const start = (pageSafe - 1) * pageSize;
    return rows.slice(start, start + pageSize);
  }, [rows, pageSafe]);

  /* UI helpers */
  const bedsOptions = ["Any", "Studio", "1+", "2+", "3+", "4+", "5+"];
  const bathsOptions = ["Any", "1+", "2+", "3+", "4+", "5+"];
  const countOptions = ["Any", "1+", "2+", "3+", "4+", "5+"];
  const dwellingTypes = ["2 storey +", "Bungalow", "Double", "Semi Detached", "Stacked"];
  const dwellingStyles = ["Apartment", "Detached", "Townhome"];

  const fmtMoney = (v: number) =>
    v >= 1_000_000 ? `$${(v / 1_000_000).toFixed(1)}M` : v >= 1_000 ? `$${(v / 1_000).toFixed(0)}k` : `$${v}`;

  const statusTab = (s: StatusTab, label: string) => (
    <button
      onClick={() => setFilters(prev => ({ ...prev, status: s }))}
      className={`px-6 py-2 text-sm font-medium rounded-full transition
        ${filters.status === s ? "bg-rose-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
    >
      {label}
    </button>
  );

  const badgeText = (s: string | undefined) =>
    s === "for-sale" ? "Active" : s === "for-lease" ? "Lease" : s === "sold" ? "Sold" : "Unknown";

  return (
    <div className="container-7xl px-4 py-6">
      {/* Header */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-5 w-5 text-slate-600" />
          <h1 className="text-2xl font-semibold">Advanced property search</h1>
        </div>
        <div className="flex gap-2">
          {statusTab("active", "Active")}
          {statusTab("sold", "Sold")}
          {statusTab("all", "All")}
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          {/* Beds & Baths */}
          <div className="space-y-4">
            <div>
              <SectionTitle icon={<BedDouble className="h-4 w-4 text-slate-500" />}>Beds</SectionTitle>
              <div className="flex flex-wrap gap-2">
                {bedsOptions.map(o => (
                  <Chip key={o} active={filters.beds === o} onClick={() => setFilters(p => ({ ...p, beds: o }))}>
                    {o}
                  </Chip>
                ))}
              </div>
            </div>
            <div>
              <SectionTitle icon={<Bath className="h-4 w-4 text-slate-500" />}>Baths</SectionTitle>
              <div className="flex flex-wrap gap-2">
                {bathsOptions.map(o => (
                  <Chip key={o} active={filters.baths === o} onClick={() => setFilters(p => ({ ...p, baths: o }))}>
                    {o}
                  </Chip>
                ))}
              </div>
            </div>
          </div>

          {/* Property Type */}
          <div>
            <SectionTitle icon={<Home className="h-4 w-4 text-slate-500" />}>Property Type</SectionTitle>
            <div className="grid grid-cols-2 gap-2">
              {[
                { key: "residential" as const, label: "Residential", Icon: Home },
                { key: "condo" as const, label: "Condo", Icon: Building2 },
                { key: "multifamily" as const, label: "Multifamily", Icon: Building },
                { key: "land" as const, label: "Land", Icon: Trees },
              ].map(({ key, label, Icon }) => (
                <button
                  key={key}
                  onClick={() =>
                    setFilters(prev => ({
                      ...prev,
                      propertyType: { ...prev.propertyType, [key]: !prev.propertyType[key] },
                    }))
                  }
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm
                    ${filters.propertyType[key] ? "border-blue-300 bg-blue-50 text-blue-700" : "border-slate-200 hover:bg-slate-50"}`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Garage & Parking */}
          <div className="space-y-4">
            <div>
              <SectionTitle icon={<Car className="h-4 w-4 text-slate-500" />}>Garage</SectionTitle>
              <div className="flex flex-wrap gap-2">
                {countOptions.map(o => (
                  <Chip key={o} active={filters.garage === o} onClick={() => setFilters(p => ({ ...p, garage: o }))}>
                    {o}
                  </Chip>
                ))}
              </div>
            </div>
            <div>
              <SectionTitle icon={<ParkingSquare className="h-4 w-4 text-slate-500" />}>Parking</SectionTitle>
              <div className="flex flex-wrap gap-2">
                {countOptions.map(o => (
                  <Chip key={o} active={filters.parking === o} onClick={() => setFilters(p => ({ ...p, parking: o }))}>
                    {o}
                  </Chip>
                ))}
              </div>
            </div>
          </div>

          {/* Price */}
          <div>
            <SectionTitle>Price</SectionTitle>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={0}
                  max={3_900_000}
                  step={10_000}
                  value={filters.priceMin}
                  onChange={(e) =>
                    setFilters(p => ({ ...p, priceMin: Math.min(Number(e.target.value), p.priceMax) }))
                  }
                  className="w-full"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={0}
                  max={3_900_000}
                  step={10_000}
                  value={filters.priceMax}
                  onChange={(e) =>
                    setFilters(p => ({ ...p, priceMax: Math.max(Number(e.target.value), p.priceMin) }))
                  }
                  className="w-full"
                />
              </div>
              <div className="text-center text-sm font-medium text-slate-700">
                {fmtMoney(filters.priceMin)} – {fmtMoney(filters.priceMax)}
              </div>
            </div>
          </div>
        </div>

        {/* Additional filters */}
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div>
            <SectionTitle>Type of Dwelling</SectionTitle>
            <div className="space-y-2">
              {["2 storey +", "Bungalow", "Double", "Semi Detached", "Stacked"].map((t) => (
                <label key={t} className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={filters.dwellingType.includes(t)}
                    onChange={() =>
                      setFilters(prev => ({
                        ...prev,
                        dwellingType: prev.dwellingType.includes(t)
                          ? prev.dwellingType.filter((x) => x !== t)
                          : [...prev.dwellingType, t],
                      }))
                    }
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-slate-700">{t}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <SectionTitle>Style of Dwelling</SectionTitle>
            <div className="space-y-2">
              {["Apartment", "Detached", "Townhome"].map((s) => (
                <label key={s} className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={filters.dwellingStyle.includes(s)}
                    onChange={() =>
                      setFilters(prev => ({
                        ...prev,
                        dwellingStyle: prev.dwellingStyle.includes(s)
                          ? prev.dwellingStyle.filter((x) => x !== s)
                          : [...prev.dwellingStyle, s],
                      }))
                    }
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-slate-700">{s}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-5">
            <div>
              <SectionTitle>Days on Market (max)</SectionTitle>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={0}
                  max={365}
                  value={filters.daysOnMarketMax}
                  onChange={(e) => setFilters(p => ({ ...p, daysOnMarketMax: Number(e.target.value) }))}
                  className="w-full"
                />
                <span className="w-12 text-right text-sm text-slate-700">{filters.daysOnMarketMax}</span>
              </div>
            </div>
            <div>
              <SectionTitle>Sold Within (days)</SectionTitle>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={0}
                  max={365}
                  value={filters.soldWithinMax}
                  onChange={(e) => setFilters(p => ({ ...p, soldWithinMax: Number(e.target.value) }))}
                  className="w-full"
                />
                <span className="w-12 text-right text-sm text-slate-700">{filters.soldWithinMax}</span>
              </div>
            </div>
            <div>
              <SectionTitle>Year Built</SectionTitle>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={1800}
                  max={new Date().getFullYear()}
                  value={filters.yearBuiltMin}
                  onChange={(e) =>
                    setFilters(p => ({ ...p, yearBuiltMin: Math.min(Number(e.target.value), p.yearBuiltMax) }))
                  }
                  className="w-full"
                />
                <input
                  type="range"
                  min={1800}
                  max={new Date().getFullYear()}
                  value={filters.yearBuiltMax}
                  onChange={(e) =>
                    setFilters(p => ({ ...p, yearBuiltMax: Math.max(Number(e.target.value), p.yearBuiltMin) }))
                  }
                  className="w-full"
                />
              </div>
              <div className="mt-1 text-right text-sm text-slate-700">
                {filters.yearBuiltMin} – {filters.yearBuiltMax}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex flex-col items-stretch justify-between gap-3 border-t border-slate-200 pt-4 sm:flex-row">
          <button
            onClick={() => setFilters(DEFAULT_FILTERS)}
            className="rounded-md bg-slate-100 px-6 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
          >
            Reset filters
          </button>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-600">{rows.length} homes</span>
            <button
              onClick={() => setFilters(f => ({ ...f }))} // re-trigger fetch
              className="rounded-md bg-rose-600 px-6 py-2 text-sm font-medium text-white hover:bg-rose-700"
            >
              Search
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="mt-6">
        {loading ? (
          <ListingsSkeleton />
        ) : error ? (
          <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-rose-700">{error}</div>
        ) : rows.length === 0 ? (
          <div className="text-slate-500">No results.</div>
        ) : (
          <>
            <div className="mb-3 text-sm text-slate-600">
              Page <strong>{pageSafe}</strong> of <strong>{numPages}</strong> — total{" "}
              <strong>{rows.length}</strong>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {pageRows.map((r) => {
                const price = typeof r.price === "number" ? `$${r.price.toLocaleString()}` : "$—";
                const sqft = typeof r.sqft === "number" ? String(r.sqft) : "—";
                const href = r.mls_id
                  ? `/property/mls:${encodeURIComponent(r.mls_id)}`
                  : `/property/${encodeURIComponent(r.id)}`;

                return (
                  <ListingCard
                    key={r.id}
                    id={r.mls_id ?? r.id}
                    href={href}
                    image={r.image_url}
                    price={price}
                    beds={r.beds || 0}
                    baths={r.baths || 0}
                    sqft={sqft}
                    address={r.address || "—"}
                    hood={r.city || ""}
                    status={badgeText(r.status)}
                    agent=""
                    saved={false}
                    canSave={false}
                  />
                );
              })}
            </div>

            {/* Pager */}
            <div className="mt-8 flex items-center justify-center gap-3">
              <button
                className="rounded-lg border border-slate-300 px-3 py-2 disabled:opacity-50"
                disabled={pageSafe <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <span className="inline-flex items-center gap-1">
                  <ChevronLeft className="h-4 w-4" /> Prev
                </span>
              </button>
              <span className="text-sm text-slate-600">
                Page {pageSafe} / {numPages}
              </span>
              <button
                className="rounded-lg border border-slate-300 px-3 py-2 disabled:opacity-50"
                disabled={pageSafe >= numPages}
                onClick={() => setPage((p) => p + 1)}
              >
                <span className="inline-flex items-center gap-1">
                  Next <ChevronRight className="h-4 w-4" />
                </span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
