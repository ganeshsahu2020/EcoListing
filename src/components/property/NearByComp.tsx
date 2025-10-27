import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import PropertyMap from "./PropertyMap";

type Comp = {
  id?: string | null;
  mls_id?: string | null;
  price?: number | null;
  beds?: number | null;
  baths?: number | null;
  sqft?: number | null;
  address?: any;
  city?: string | null;
  price_per_sqft?: number | null;
  lat?: number | null;
  lon?: number | null;
  image_url?: string | null;
};

function fmtMoney(n?: number | null) {
  return typeof n === "number"
    ? n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })
    : "—";
}
function fmtAddress(addr: any): string | undefined {
  if (!addr) return undefined;
  if (typeof addr === "string") return addr;
  const unit = addr.unitNumber || addr.UnitNumber || "";
  const bits = [
    addr.streetNumber || addr.StreetNumber,
    addr.streetDirectionPrefix || addr.streetDirection || addr.StreetDirection || "",
    addr.streetName || addr.StreetName,
    addr.streetSuffix || addr.StreetSuffix || "",
  ].filter(Boolean).join(" ");
  const city = addr.city || addr.City;
  return [unit && `#${unit}`, bits, city].filter(Boolean).join(", ") || addr.addressKey || undefined;
}
function toCdn(path?: string | null, klass: "small" | "medium" | "large" = "small") {
  const CDN = "https://cdn.repliers.io";
  return path ? (/^https?:\/\//i.test(path) ? path : `${CDN}/${path}?class=${klass}`) : null;
}
function haversineKm(aLat: number, aLon: number, bLat: number, bLon: number) {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(bLat - aLat);
  const dLon = toRad(bLon - aLon);
  const lat1 = toRad(aLat);
  const lat2 = toRad(bLat);
  const sinDLat = Math.sin(dLat / 2);
  const sinDLon = Math.sin(dLon / 2);
  const h = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon;
  return 2 * R * Math.asin(Math.sqrt(h));
}
function toSparkPath(values: number[], w = 120, h = 28, pad = 2) {
  if (!values.length) return "";
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = Math.max(1e-9, max - min);
  const innerW = w - pad * 2;
  const innerH = h - pad * 2;
  const step = values.length === 1 ? innerW : innerW / (values.length - 1);
  return values
    .map((v, i) => {
      const x = pad + i * step;
      const y = pad + innerH - ((v - min) / span) * innerH;
      return `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
}
function Sparkline({ values, width = 120, height = 28 }: { values: number[]; width?: number; height?: number }) {
  const d = useMemo(() => toSparkPath(values, width, height, 2), [values, width, height]);
  if (!values.length) return <div className="text-xs text-slate-500">No trend</div>;
  return <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}><path d={d} fill="none" stroke="currentColor" strokeWidth={2}/></svg>;
}

export default function NearByComp({
  subject,
  comps,
  initialRadiusKm = 3,
}: {
  subject: { lat?: number | null; lon?: number | null };
  comps: Comp[];
  initialRadiusKm?: number;
}) {
  const [filters, setFilters] = useState({ beds: 0, baths: 0, sqft: 0, radiusKm: initialRadiusKm });

  const filtered = useMemo(() => {
    if (typeof subject.lat !== "number" || typeof subject.lon !== "number") return [];
    return (comps || [])
      .map((c) => {
        const d = typeof c.lat === "number" && typeof c.lon === "number" ? haversineKm(subject.lat!, subject.lon!, c.lat, c.lon) : Infinity;
        return { ...c, _distance_km: d as number };
      })
      .filter(
        (c: any) =>
          c._distance_km <= filters.radiusKm &&
          (filters.beds ? (c.beds || 0) >= filters.beds : true) &&
          (filters.baths ? (c.baths || 0) >= filters.baths : true) &&
          (filters.sqft ? (c.sqft || 0) >= filters.sqft : true)
      )
      .sort((a: any, b: any) => a._distance_km - b._distance_km);
  }, [subject.lat, subject.lon, comps, filters]);

  const ppsfTrend = useMemo(() => {
    const arr = filtered
      .map((c) => (typeof c.price_per_sqft === "number" ? c.price_per_sqft : c.price && c.sqft ? c.price / c.sqft : null))
      .filter((n): n is number => typeof n === "number" && Number.isFinite(n))
      .sort((a, b) => a - b)
      .slice(-24);
    return arr;
  }, [filtered]);

  return (
    <section className="glass-card rounded-3xl border border-slate-200 p-6" aria-labelledby="comps-title">
      <div className="flex items-center gap-3 mb-3">
        <h2 id="comps-title" className="text-xl font-bold text-slate-800">Nearby Comps</h2>
        <div className="ml-auto text-sm text-slate-600">Within {filters.radiusKm} km</div>
      </div>

      <div className="flex flex-wrap items-end gap-3 mb-4">
        <LabeledInput label="Beds (min)">
          <input type="number" min={0} value={filters.beds} onChange={(e) => setFilters((f) => ({ ...f, beds: Number(e.target.value || 0) }))} className="h-9 w-28 rounded-xl border border-slate-300 bg-white px-3 py-1 text-sm shadow-sm focus-visible:ring-2 focus-visible:ring-emerald-400" />
        </LabeledInput>
        <LabeledInput label="Baths (min)">
          <input type="number" min={0} step={0.5} value={filters.baths} onChange={(e) => setFilters((f) => ({ ...f, baths: Number(e.target.value || 0) }))} className="h-9 w-28 rounded-xl border border-slate-300 bg-white px-3 py-1 text-sm shadow-sm focus-visible:ring-2 focus-visible:ring-emerald-400" />
        </LabeledInput>
        <LabeledInput label="Sqft (min)">
          <input type="number" min={0} value={filters.sqft} onChange={(e) => setFilters((f) => ({ ...f, sqft: Number(e.target.value || 0) }))} className="h-9 w-32 rounded-xl border border-slate-300 bg-white px-3 py-1 text-sm shadow-sm focus-visible:ring-2 focus-visible:ring-emerald-400" />
        </LabeledInput>
        <LabeledInput label={`Radius (${filters.radiusKm} km)`}>
          <input type="range" min={1} max={10} step={1} value={filters.radiusKm} onChange={(e) => setFilters((f) => ({ ...f, radiusKm: Number(e.target.value) }))} className="w-40 accent-emerald-600" aria-valuemin={1} aria-valuemax={10} aria-valuenow={filters.radiusKm} />
        </LabeledInput>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-slate-500">$/sqft trend</span>
          <div className="text-emerald-700"><Sparkline values={ppsfTrend} /></div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-slate-200 overflow-hidden">
          <PropertyMap lat={subject.lat ?? undefined} lon={subject.lon ?? undefined} similar={filtered} heightClass="h-[280px]" defaultStyle="pmtiles-local" />
        </div>

        <div className="overflow-auto rounded-2xl border border-slate-200 bg-white">
          <table className="min-w-[520px] w-full">
            <thead className="bg-slate-50 text-slate-600 text-xs">
              <tr>
                <th className="text-left font-semibold px-3 py-2">Property</th>
                <th className="text-right font-semibold px-3 py-2">Price</th>
                <th className="text-center font-semibold px-3 py-2">Bd</th>
                <th className="text-center font-semibold px-3 py-2">Ba</th>
                <th className="text-right font-semibold px-3 py-2">Sqft</th>
                <th className="text-right font-semibold px-3 py-2">Dist</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {filtered.slice(0, 50).map((c: any, i) => (
                <tr key={c.mls_id || c.id || i} className="border-t border-slate-200 hover:bg-slate-50">
                  <td className="px-3 py-2">
                    <Link to={`/property/${encodeURIComponent(`mls:${c.mls_id || c.id || ""}`)}`} className="flex items-center gap-3 focus-visible:ring-2 focus-visible:ring-emerald-400 rounded-lg">
                      <img src={toCdn(c.image_url, "small") || "/placeholder-house.jpg"} alt="" className="w-14 h-10 object-cover rounded-md border border-slate-200" loading="lazy" />
                      <div>
                        <div className="font-medium text-slate-800">{fmtAddress(c.address) || "—"}</div>
                        <div className="text-xs text-slate-500">{c.city || ""}</div>
                      </div>
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-right">{fmtMoney(c.price ?? null)}</td>
                  <td className="px-3 py-2 text-center">{c.beds ?? "—"}</td>
                  <td className="px-3 py-2 text-center">{c.baths ?? "—"}</td>
                  <td className="px-3 py-2 text-right">{typeof c.sqft === "number" ? c.sqft.toLocaleString() : c.sqft ?? "—"}</td>
                  <td className="px-3 py-2 text-right">{Number.isFinite(c._distance_km) ? `${c._distance_km.toFixed(1)} km` : "—"}</td>
                </tr>
              ))}
              {!filtered.length && (
                <tr><td colSpan={6} className="px-3 py-6 text-center text-slate-500">No comps match your filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function LabeledInput({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col">
      <span className="text-xs text-slate-500">{label}</span>
      {children}
    </label>
  );
}
