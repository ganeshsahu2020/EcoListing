// ui/src/pages/FindComparable.tsx
import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ChevronDownIcon,
  Squares2X2Icon,
  ListBulletIcon,
  PhoneIcon,
  ArrowRightCircleIcon,
} from "@heroicons/react/24/outline";

import AddressAutocomplete from "../components/AddressAutocomplete";
import { fetchListingsDirect } from "../utils/repliersClient";

/* ─────────────────────────────────────────────────────────
   Types
   ──────────────────────────────────────────────────────── */
type PType = "Detached" | "Semi-Detached" | "Townhouse" | "Condo" | "";
type Bedrooms = "1" | "2" | "3" | "4" | "5" | "5+";
type Baths = "1" | "1.5" | "2" | "2.5" | "3" | "4+";

type FormState = {
  address: string;
  priceEstimate?: string;
  ptype: PType;
  beds?: Bedrooms | "";
  baths?: Baths | "";
  sqft?: string;
  lot?: string;
  year?: string;
  keyGarage: boolean;
  keyBasement: boolean;
  keyPool: boolean;
  keyFireplace: boolean;
};

type Comparable = {
  id: string;
  image: string | null;
  address: string;
  city: string;
  soldDate?: string | null;
  price: number | null;
  beds: number | null;
  baths: number | null;
  sqft: number | null;
  acres: number | null;
  kmAway: number | null;
  ptype: string | null;
  matchPct: number; // 0..100
  lat?: number | null;
  lon?: number | null;
};

/* ─────────────────────────────────────────────────────────
   Utils
   ──────────────────────────────────────────────────────── */
const CDN = "https://cdn.repliers.io";
const toCdn = (path?: string | null, klass: "small" | "medium" | "large" = "medium") =>
  path ? (/^https?:\/\//i.test(path) ? path : `${CDN}/${path}?class=${klass}`) : null;

const fmtMoney = (n?: number | null) =>
  typeof n === "number"
    ? n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })
    : "—";

const badgeMatchTone = (pct: number) =>
  pct >= 95
    ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
    : pct >= 85
    ? "bg-amber-50 text-amber-700 ring-amber-200"
    : "bg-slate-50 text-slate-700 ring-slate-200";

/* Address helpers (formats & fallbacks) */
function fmtAddress(addr: any): string {
  if (!addr) return "";
  if (typeof addr === "string") return addr;
  const unit = addr.unitNumber || addr.UnitNumber;
  const bits = [
    addr.streetNumber || addr.StreetNumber,
    addr.streetDirectionPrefix || addr.streetDirection || addr.StreetDirection,
    addr.streetName || addr.StreetName,
    addr.streetSuffix || addr.StreetSuffix,
  ]
    .filter(Boolean)
    .join(" ");
  const city = addr.city || addr.City;
  return [unit && `#${unit}`, bits, city].filter(Boolean).join(", ");
}

/* CMA scoring heuristic (client-side) */
function scoreMatch(row: Partial<Comparable>, form: FormState): number {
  let score = 100;

  const est = Number((form.priceEstimate || "").toString().replace(/[^\d.]/g, ""));
  if (est && row.price) {
    const pct = Math.abs(row.price - est) / est;
    score -= Math.min(50, Math.round(pct * 100));
  }

  const wantBeds = form.beds && (form.beds === "5+" ? 5 : Number(form.beds));
  const wantBaths = form.baths && (form.baths === "4+" ? 4 : Number(form.baths));
  if (wantBeds && typeof row.beds === "number") score -= Math.min(10, Math.abs(row.beds - wantBeds) * 4);
  if (wantBaths && typeof row.baths === "number") score -= Math.min(10, Math.abs(row.baths - wantBaths) * 4);

  const wantSqft = Number((form.sqft || "").toString().replace(/[^\d.]/g, ""));
  if (wantSqft && typeof row.sqft === "number" && wantSqft > 0) {
    const pct = Math.abs(row.sqft - wantSqft) / wantSqft;
    score -= Math.min(20, Math.round(pct * 80));
  }

  if (form.ptype && row.ptype) {
    if (String(row.ptype).toLowerCase().includes(form.ptype.toLowerCase())) score += 4;
    else score -= 6;
  }

  return Math.max(50, Math.min(100, score));
}

/* Simple 2km box around a lon/lat point (used for comps query focus) */
function boxFromPoint({ lon, lat }: { lon: number; lat: number }, km = 2) {
  const d = km / 111; // ~1 deg lat ~111km
  return { west: lon - d, south: lat - d, east: lon + d, north: lat + d };
}

/* ─────────────────────────────────────────────────────────
   Fetch layer (Repliers)
   ──────────────────────────────────────────────────────── */
const TORONTO_BOUNDS = { west: -79.9, south: 43.45, east: -79.0, north: 43.9 };

async function fetchComps(
  form: FormState,
  bounds?: { west: number; south: number; east: number; north: number }
): Promise<Comparable[]> {
  const bbox = bounds ?? TORONTO_BOUNDS;

  // 1) Try SOLDs first (your original intent)
  let raw: any[] = [];
  try {
    raw = await fetchListingsDirect({
      ...bbox,
      status: "S",
      limit: 250,
      dropUnmappable: true,
    } as any);
  } catch {
    raw = [];
  }

  // 2) If no solds (common in sample dataset), try a slightly larger SOLD box…
  if (!raw || raw.length === 0) {
    const pad = 0.3;
    const bigger = {
      west: bbox.west - pad,
      south: bbox.south - pad,
      east: bbox.east + pad,
      north: bbox.north + pad,
    };
    try {
      raw = await fetchListingsDirect({
        ...bigger,
        status: "S",
        limit: 250,
        dropUnmappable: true,
      } as any);
    } catch {
      raw = [];
    }
  }

  // 3) Still nothing? Fall back to ACTIVES like PropertyDetails does.
  //    This keeps the page functional with /sample/listings.
  let fellBackToActive = false;
  if (!raw || raw.length === 0) {
    fellBackToActive = true;
    try {
      raw = await fetchListingsDirect({
        ...bbox,
        status: "A",
        limit: 300,
        dropUnmappable: true,
      } as any);
    } catch {
      raw = [];
    }
  }

  const list: Comparable[] = (raw || []).map((s: any): Comparable => {
    const acres =
      typeof s.lot_acres === "number"
        ? s.lot_acres
        : typeof s.lot_size_acres === "number"
        ? s.lot_size_acres
        : s.lot_sqft
        ? Number(s.lot_sqft) / 43560
        : null;

    const addr = fmtAddress(s.address) || s.full_address || s.street_address || "";
    const city = s.city || (s.address && (s.address.city || s.address.City)) || "";

    // Prefer server-built URL, otherwise build from image_path
    const image =
      s.image_url ||
      s.photo_url ||
      toCdn(s.image_path, "medium") ||
      null;

    // If we fell back to actives, we won’t have a real soldDate/sold_price
    const soldDate = fellBackToActive ? null : (s.sold_date || s.close_date || s.status_date || null);
    const price = fellBackToActive
      ? (typeof s.list_price === "number" ? s.list_price : null)
      : (typeof s.sold_price === "number" ? s.sold_price : (typeof s.list_price === "number" ? s.list_price : null));

    return {
      id: s.id || s.mls_id || crypto.randomUUID?.() || String(Math.random()),
      image,
      address: addr,
      city,
      soldDate,
      price,
      beds: typeof s.beds === "number" ? s.beds : null,
      baths: typeof s.baths === "number" ? s.baths : null,
      sqft:
        typeof s.sqft === "number"
          ? s.sqft
          : typeof s.above_grade_sqft === "number"
          ? s.above_grade_sqft
          : null,
      acres,
      kmAway: typeof s.distance_km === "number" ? s.distance_km : null,
      ptype: s.property_type || s.building_type || null,
      lat: typeof s.lat === "number" ? s.lat : null,
      lon: typeof s.lon === "number" ? s.lon : null,
      matchPct: 0,
    };
  });

  const filtered = list.filter((r) => {
    if (form.ptype && r.ptype && !String(r.ptype).toLowerCase().includes(form.ptype.toLowerCase())) {
      return false;
    }
    if (form.beds) {
      const want = form.beds === "5+" ? 5 : Number(form.beds);
      if (r.beds != null && r.beds < want) return false;
    }
    if (form.baths) {
      const want = form.baths === "4+" ? 4 : Number(form.baths);
      if (r.baths != null && r.baths < want) return false;
    }
    return true;
  });

  for (const r of filtered) r.matchPct = scoreMatch(r, form);
  filtered.sort(
    (a, b) =>
      b.matchPct - a.matchPct ||
      (a.soldDate && b.soldDate
        ? new Date(b.soldDate).getTime() - new Date(a.soldDate).getTime()
        : 0),
  );

  return filtered.slice(0, 100);
}

/* ─────────────────────────────────────────────────────────
   Component
   ──────────────────────────────────────────────────────── */
export default function FindComparable() {
  const nav = useNavigate();

  const [openManual, setOpenManual] = useState(false);
  const [view, setView] = useState<"cards" | "table">("table");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // NEW: address + coords captured by AddressAutocomplete
  const [address, setAddress] = useState("");
  const [coords, setCoords] = useState<{ lon: number; lat: number } | null>(null);

  const [form, setForm] = useState<FormState>({
    address: "",
    priceEstimate: "",
    ptype: "",
    beds: "",
    baths: "",
    sqft: "",
    lot: "",
    year: "",
    keyGarage: false,
    keyBasement: false,
    keyPool: false,
    keyFireplace: false,
  });

  const [results, setResults] = useState<Comparable[]>([]);
  const compsFound = results.length;

  async function handleFind() {
    setErr(null);
    setLoading(true);
    try {
      const bounds = coords ? boxFromPoint(coords, 2) : undefined;
      const comps = await fetchComps({ ...form, address }, bounds);
      setResults(comps);
    } catch (e: any) {
      console.error(e);
      setErr("We couldn’t fetch comparables right now.");
    } finally {
      setLoading(false);
    }
  }

  const queryForReport = useMemo(() => {
    const params = new URLSearchParams();
    if (address) params.set("address", address);
    const est = Number((form.priceEstimate || "").toString().replace(/[^\d.]/g, ""));
    if (est) params.set("est", String(Math.round(est)));
    return params.toString();
  }, [address, form.priceEstimate]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Hero / Step header */}
      <h1 className="sr-only">Find Comparable (CMA)</h1>

      {/* ───────── Search header ───────── */}
      <div className="flex flex-col items-stretch gap-4 pt-2">
        {/* Address Autocomplete (MapTiler / MapLibre) */}
        <AddressAutocomplete
          value={address}
          onChange={(v) => {
            setAddress(v);
            if (coords) setCoords(null);
            setForm((s) => ({ ...s, address: v }));
          }}
          onPick={(feat) => {
            setAddress(feat.place_name);
            setCoords({ lon: feat.center[0], lat: feat.center[1] });
            setForm((s) => ({ ...s, address: feat.place_name }));
          }}
        />

        {/* Tagline */}
        <p className="text-center text-slate-600">
          Find recently sold homes that match your property
        </p>

        {/* Primary CTA + helper */}
        <div className="flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={handleFind}
            disabled={loading || (!coords && !address?.trim())}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 font-semibold text-white shadow hover:bg-emerald-700 disabled:opacity-60"
          >
            {loading ? "Finding…" : "Find Comparables"}
            <ArrowRightCircleIcon className="h-5 w-5" />
          </button>

          {!coords && address.trim().length > 0 && (
            <div className="text-xs text-slate-500">
              Tip: pick a suggestion from the dropdown to search nearby this address.
            </div>
          )}
        </div>

        <div className="flex items-center justify-center">
          <button
            type="button"
            onClick={() => setOpenManual((o) => !o)}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium shadow-sm hover:bg-slate-50"
            aria-expanded={openManual}
          >
            Manually Enter Property Details
            <ChevronDownIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {openManual && (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-lg">
          <p className="mb-6 text-center text-slate-600">
            Find recently sold homes that match your property
          </p>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {/* Price */}
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Price Estimate (Optional)
              </label>
              <input
                value={form.priceEstimate}
                onChange={(e) => setForm((s) => ({ ...s, priceEstimate: e.target.value }))}
                placeholder="e.g., $750,000"
                className="mt-1 h-11 w-full rounded-lg border border-slate-300 px-3 focus:border-[#1E90FF] focus:ring-[#1E90FF]"
              />
            </div>

            {/* Property Type */}
            <div>
              <label className="block text-sm font-medium text-slate-700">Property Type</label>
              <select
                value={form.ptype}
                onChange={(e) => setForm((s) => ({ ...s, ptype: e.target.value as PType }))}
                className="mt-1 h-11 w-full rounded-lg border border-slate-300 px-3 focus:border-[#1E90FF] focus:ring-[#1E90FF]"
              >
                <option value="">Select type</option>
                <option>Detached</option>
                <option>Semi-Detached</option>
                <option>Townhouse</option>
                <option>Condo</option>
              </select>
            </div>

            {/* Bedrooms */}
            <div>
              <label className="block text-sm font-medium text-slate-700">Bedrooms</label>
              <select
                value={form.beds}
                onChange={(e) => setForm((s) => ({ ...s, beds: e.target.value as Bedrooms }))}
                className="mt-1 h-11 w-full rounded-lg border border-slate-300 px-3 focus:border-[#1E90FF] focus:ring-[#1E90FF]"
              >
                <option value="">Beds</option>
                {["1", "2", "3", "4", "5", "5+"].map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            {/* Bathrooms */}
            <div>
              <label className="block text-sm font-medium text-slate-700">Bathrooms</label>
              <select
                value={form.baths}
                onChange={(e) => setForm((s) => ({ ...s, baths: e.target.value as Baths }))}
                className="mt-1 h-11 w-full rounded-lg border border-slate-300 px-3 focus:border-[#1E90FF] focus:ring-[#1E90FF]"
              >
                <option value="">Baths</option>
                {["1", "1.5", "2", "2.5", "3", "4+"].map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            {/* Square Footage */}
            <div>
              <label className="block text-sm font-medium text-slate-700">Square Footage</label>
              <input
                value={form.sqft ?? ""}
                onChange={(e) => setForm((s) => ({ ...s, sqft: e.target.value }))}
                placeholder="e.g., 1600"
                className="mt-1 h-11 w-full rounded-lg border border-slate-300 px-3 focus:border-[#1E90FF] focus:ring-[#1E90FF]"
              />
            </div>

            {/* Lot Size */}
            <div>
              <label className="block text-sm font-medium text-slate-700">Lot Size</label>
              <input
                value={form.lot ?? ""}
                onChange={(e) => setForm((s) => ({ ...s, lot: e.target.value }))}
                placeholder="e.g., 0.15 acres"
                className="mt-1 h-11 w-full rounded-lg border border-slate-300 px-3 focus:border-[#1E90FF] focus:ring-[#1E90FF]"
              />
            </div>

            {/* Year Built */}
            <div>
              <label className="block text-sm font-medium text-slate-700">Year Built</label>
              <input
                value={form.year ?? ""}
                onChange={(e) => setForm((s) => ({ ...s, year: e.target.value }))}
                placeholder="e.g., 2018"
                className="mt-1 h-11 w-full rounded-lg border border-slate-300 px-3 focus:border-[#1E90FF] focus:ring-[#1E90FF]"
              />
            </div>
          </div>

          {/* Key Features */}
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-slate-800">Key Features</h3>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.keyGarage}
                  onChange={(e) => setForm((s) => ({ ...s, keyGarage: e.target.checked }))}
                  className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-600"
                />
                Garage
              </label>
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.keyBasement}
                  onChange={(e) => setForm((s) => ({ ...s, keyBasement: e.target.checked }))}
                  className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-600"
                />
                Basement
              </label>
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.keyPool}
                  onChange={(e) => setForm((s) => ({ ...s, keyPool: e.target.checked }))}
                  className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-600"
                />
                Pool
              </label>
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.keyFireplace}
                  onChange={(e) => setForm((s) => ({ ...s, keyFireplace: e.target.checked }))}
                  className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-600"
                />
                Fireplace
              </label>
            </div>
          </div>

          {/* Secondary CTA inside panel (kept) */}
          <div className="mt-6 flex items-center justify-center">
            <button
              onClick={handleFind}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 font-semibold text-white shadow hover:bg-emerald-700 disabled:opacity-60"
            >
              {loading ? "Finding…" : "Find Comparables"}
              <ArrowRightCircleIcon className="h-5 w-5" />
            </button>
          </div>

          {err && <div className="mt-4 text-sm text-rose-600">{err}</div>}
        </div>
      )}

      {/* Results */}
      {!!results.length && (
        <div className="mt-10">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Comparable Properties</h2>
              <p className="text-sm text-slate-600 mt-1">{compsFound} recently sold properties found</p>
            </div>

            {/* View toggle */}
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white p-1 shadow-sm">
              <button
                onClick={() => setView("cards")}
                className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm ${
                  view === "cards" ? "bg-[#1E90FF] text-white" : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <Squares2X2Icon className="h-4 w-4" />
                Cards
              </button>
              <button
                onClick={() => setView("table")}
                className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm ${
                  view === "table" ? "bg-[#1E90FF] text-white" : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <ListBulletIcon className="h-4 w-4" />
                Table
              </button>
            </div>
          </div>

          {view === "cards" ? (
            <div className="space-y-5">
              {results.map((r) => (
                <div key={r.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex gap-4">
                    <img
                      src={
                        r.image ||
                        "https://images.unsplash.com/photo-1560185127-6ed189bf02f4?w=640&q=60"
                      }
                      alt=""
                      className="h-28 w-36 rounded-xl object-cover"
                      loading="lazy"
                    />
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="text-[15px] font-semibold text-slate-900">
                            {r.address}
                            {r.city ? `, ${r.city}` : ""}
                          </div>
                          <div className="mt-1 text-sm text-slate-600">
                            {r.soldDate ? `Sold ${new Date(r.soldDate).toLocaleDateString()}` : "—"} •{" "}
                            <span className="font-medium">{fmtMoney(r.price)}</span>
                          </div>
                          <div className="mt-1 text-sm text-slate-700">
                            {(r.beds ?? "—")} beds · {(r.baths ?? "—")} baths ·{" "}
                            {(typeof r.sqft === "number" ? r.sqft.toLocaleString() : "—")} sqft ·{" "}
                            {(typeof r.acres === "number" ? r.acres.toFixed(2) : "—")} acres
                            {r.kmAway != null ? ` · ${r.kmAway.toFixed(1)} km away` : ""}
                          </div>
                          <div className="mt-1 text-sm text-slate-500">{r.ptype || ""}</div>
                        </div>

                        <span className={`inline-flex h-7 items-center rounded-full px-3 text-sm ring-1 ${badgeMatchTone(r.matchPct)}`}>
                          {r.matchPct}% Match
                        </span>
                      </div>

                      <div className="mt-3 flex items-center justify-between">
                        <Link
                          to={`/agent/report-request?${queryForReport}`}
                          className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-700"
                        >
                          Get Detailed Report
                        </Link>

                        <Link
                          to={`/tour?address=${encodeURIComponent(`${r.address}${r.city ? ", " + r.city : ""}`)}`}
                          className="inline-flex items-center gap-2 rounded-full border border-emerald-300 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50"
                          title="Talk to an Agent About Selling"
                        >
                          <PhoneIcon className="h-4 w-4" />
                          Talk to an Agent About Selling
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr className="text-left text-sm text-slate-600">
                      <th className="px-4 py-3 font-semibold">Property</th>
                      <th className="px-4 py-3 font-semibold">Sold Date + Price</th>
                      <th className="px-4 py-3 font-semibold">Beds/Baths/Sqft</th>
                      <th className="px-4 py-3 font-semibold">Lot Size</th>
                      <th className="px-4 py-3 font-semibold">Distance</th>
                      <th className="px-4 py-3 font-semibold">Similarity Score</th>
                      <th className="px-4 py-3 font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {results.map((r) => (
                      <tr key={r.id} className="text-sm">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <img
                              src={
                                r.image ||
                                "https://images.unsplash.com/photo-1560185127-6ed189bf02f4?w=640&q=60"
                              }
                              alt=""
                              className="h-10 w-14 rounded-md object-cover"
                              loading="lazy"
                            />
                            <div>
                              <div className="font-medium text-slate-900">
                                {r.address}
                                {r.city ? `, ${r.city}` : ""}
                              </div>
                              <div className="text-slate-500">{r.ptype || ""}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium">{fmtMoney(r.price)}</div>
                          <div className="text-slate-500">
                            {r.soldDate ? new Date(r.soldDate).toLocaleDateString() : "—"}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {(r.beds ?? "—")} / {(r.baths ?? "—")} / {(typeof r.sqft === "number" ? r.sqft.toLocaleString() : "—")}
                        </td>
                        <td className="px-4 py-3">
                          {typeof r.acres === "number" ? `${r.acres.toFixed(2)} acres` : "—"}
                        </td>
                        <td className="px-4 py-3">
                          {r.kmAway != null ? `${r.kmAway.toFixed(1)} km` : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex h-7 items-center rounded-full px-3 ring-1 ${badgeMatchTone(r.matchPct)}`}>
                            {r.matchPct}%
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Link
                              to={`/tour?address=${encodeURIComponent(`${r.address}${r.city ? ", " + r.city : ""}`)}`}
                              className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300 px-3 py-1.5 font-medium text-emerald-700 hover:bg-emerald-50"
                            >
                              <PhoneIcon className="h-4 w-4" />
                              Talk to Agent
                            </Link>
                            <Link
                              to={`/agent/report-request?${queryForReport}`}
                              className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-3 py-1.5 font-medium text-white hover:bg-emerald-700"
                            >
                              Report
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty/Loading states */}
      {loading && (
        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-8 text-slate-700 shadow-sm">
          Searching recently sold properties…
        </div>
      )}
      {!loading && !results.length && !err && (
        <div className="mt-8 text-slate-500">
          Enter an address or manual details and click “Find Comparables”.
        </div>
      )}
    </div>
  );
}
