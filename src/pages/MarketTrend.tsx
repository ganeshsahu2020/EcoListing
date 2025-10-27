// ui/src/pages/MarketTrend.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChartBarIcon,
  ChartPieIcon,
  MagnifyingGlassIcon,
  ArrowRightIcon,
  MapPinIcon,
  BuildingOffice2Icon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  HomeIcon,
  DocumentArrowDownIcon,
  CalendarIcon,
} from "@heroicons/react/24/outline";

// SAFE stand-in for a "line chart" icon; avoids "@/..." alias and extra packages
const ChartLineIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <ChartBarIcon {...props} />
);

/* ─────────────────────────────────────────────────────────
   Types
   ──────────────────────────────────────────────────────── */
type Region =
  | "Toronto, ON"
  | "Vancouver, BC"
  | "Montreal, QC"
  | "Calgary, AB"
  | "Enter Postal Code";

type PropertyType = "Single Family" | "Condo" | "Townhouse" | "Commercial";
type TimeRange = "1M" | "3M" | "6M" | "1Y" | "2Y" | "5Y" | "Custom";

interface MonthlyDatum {
  date: string; // yyyy-MM
  avgPrice: number;
  daysOnMarket: number;
  activeListings: number;
  newListings: number;
  pricePerSqft: number;
}

interface MarketState {
  region: Region;
  propertyType: PropertyType;
  range: TimeRange;
  postal?: string; // when "Enter Postal Code"
  customFrom?: string; // yyyy-MM
  customTo?: string; // yyyy-MM
}

/* ─────────────────────────────────────────────────────────
   Utilities / Fake Data
   ──────────────────────────────────────────────────────── */
const REGIONS: Region[] = [
  "Toronto, ON",
  "Vancouver, BC",
  "Montreal, QC",
  "Calgary, AB",
  "Enter Postal Code",
];
const TYPES: PropertyType[] = ["Single Family", "Condo", "Townhouse", "Commercial"];
const RANGES: TimeRange[] = ["1M", "3M", "6M", "1Y", "2Y", "5Y", "Custom"];

const monthsBackMap: Record<Exclude<TimeRange, "Custom">, number> = {
  "1M": 1,
  "3M": 3,
  "6M": 6,
  "1Y": 12,
  "2Y": 24,
  "5Y": 60,
};

function fmtMoney(n: number) {
  return n.toLocaleString(undefined, {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  });
}
function fmtInt(n: number) {
  return n.toLocaleString(undefined, { maximumFractionDigits: 0 });
}
function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function monthsBetweenInclusive(fromYYYYMM: string, toYYYYMM: string) {
  const [fy, fm] = fromYYYYMM.split("-").map(Number);
  const [ty, tm] = toYYYYMM.split("-").map(Number);
  return (ty - fy) * 12 + (tm - fm) + 1;
}

/** Local generator used as a graceful fallback when no API responds */
function generateSeries({
  region,
  propertyType,
  months,
}: {
  region: Region;
  propertyType: PropertyType;
  months: number;
}): MonthlyDatum[] {
  const cityAdj: Record<Region, number> = {
    "Toronto, ON": 1.05,
    "Vancouver, BC": 1.15,
    "Montreal, QC": 0.82,
    "Calgary, AB": 0.78,
    "Enter Postal Code": 0.95,
  };
  const baseMap: Record<PropertyType, number> = {
    "Single Family": 1_300_000,
    Condo: 720_000,
    Townhouse: 950_000,
    Commercial: 2_000_000,
  };

  const base = baseMap[propertyType] * cityAdj[region];
  const today = new Date();
  const out: MonthlyDatum[] = [];

  const drift = (Math.random() - 0.5) * 0.03;
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const key = monthKey(d);

    const season = 1 + 0.03 * Math.sin((2 * Math.PI * (d.getMonth() + 1)) / 12);
    const noise = 1 + (Math.random() - 0.5) * 0.04;
    const price = base * Math.pow(1 + drift, months - i) * season * noise;

    const dom = Math.max(7, Math.round(26 * (2 - season) + Math.random() * 10));
    const active = Math.max(120, Math.round((price / 10000) * (0.6 + Math.random())));
    const fresh = Math.max(60, Math.round(active * (0.3 + Math.random() * 0.2)));
    const ppsf = Math.round((price / (1200 + (Math.random() - 0.5) * 500)) / 10) * 10;

    out.push({
      date: key,
      avgPrice: Math.round(price),
      daysOnMarket: dom,
      activeListings: active,
      newListings: fresh,
      pricePerSqft: ppsf,
    });
  }
  return out;
}

/* ─────────────────────────────────────────────────────────
   API Hook (wired to /api/market-series + kill switch)
   ──────────────────────────────────────────────────────── */
async function fetchMarketSeriesOrFallback(
  state: MarketState,
  months: number,
  signal?: AbortSignal
): Promise<MonthlyDatum[]> {
  // Kill-switch allows you to render instantly with local data
  const DISABLE = import.meta.env.VITE_DISABLE_MARKET_SERIES === "1";
  if (DISABLE) {
    return generateSeries({ region: state.region, propertyType: state.propertyType, months });
  }

  // Use the relative /api path so Vite proxies to http://localhost:4000/api/...
  const ENDPOINT = "/api/market-series";

  const canCall =
    (state.region === "Enter Postal Code" && !!state.postal?.trim()) ||
    state.region !== "Enter Postal Code";

  if (canCall) {
    try {
      const qs = new URLSearchParams({
        region: state.region,
        postal: state.postal || "",
        type: state.propertyType,
        months: String(months),
        from: state.customFrom || "",
        to: state.customTo || "",
      });
      const url = `${ENDPOINT}?${qs.toString()}`;
      const res = await fetch(url, { headers: { Accept: "application/json" }, signal });
      if (res.ok) {
        const json = await res.json();
        const rows: any[] = Array.isArray(json) ? json : json?.rows;
        if (Array.isArray(rows) && rows.length) {
          const mapped: MonthlyDatum[] = rows.map((r) => ({
            date: r.date ?? r.month ?? "",
            avgPrice: Number(r.avgPrice ?? r.avg_price ?? 0),
            daysOnMarket: Number(r.daysOnMarket ?? r.dom ?? 0),
            activeListings: Number(r.activeListings ?? r.active ?? 0),
            newListings: Number(r.newListings ?? r.new ?? 0),
            pricePerSqft: Number(r.pricePerSqft ?? r.ppsf ?? 0),
          }));
          if (mapped.some((m) => m.date)) return mapped;
        }
      } else {
        // fall through to local generator if 404/500 etc.
      }
    } catch {
      // swallow network error and fall back
    }
  }

  return generateSeries({ region: state.region, propertyType: state.propertyType, months });
}

/* ─────────────────────────────────────────────────────────
   Reusable bits
   ──────────────────────────────────────────────────────── */
function GIcon({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <span
      className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl
                 bg-gradient-to-br from-indigo-500 via-blue-500 to-emerald-500 text-white
                 shadow-lg ring-1 ring-white/20 transition-transform duration-300 ease-in-out
                 hover:scale-105"
      aria-hidden
      role="img"
      title={title}
    >
      {children}
      <span className="sr-only">{title}</span>
    </span>
  );
}

/* ─────────────────────────────────────────────────────────
   Filters
   ──────────────────────────────────────────────────────── */
function Filters({
  state,
  setState,
  onAutoSave,
  busy,
  setBusy,
  announce,
}: {
  state: MarketState;
  setState: React.Dispatch<React.SetStateAction<MarketState>>;
  onAutoSave: () => void;
  busy: boolean;
  setBusy: (b: boolean) => void;
  announce: (msg: string) => void;
}) {
  const [changeCount, setChangeCount] = useState(0);

  function change<K extends keyof MarketState>(key: K, value: MarketState[K]) {
    setBusy(true);
    setState((s) => ({ ...s, [key]: value }));
    setChangeCount((c) => c + 1);
    setTimeout(() => setBusy(false), 450);
  }

  useEffect(() => {
    if (changeCount >= 2) {
      onAutoSave();
      announce("Market View saved");
      setChangeCount(0);
    }
  }, [changeCount, onAutoSave, announce]);

  const showPostal = state.region === "Enter Postal Code";
  const showCustom = state.range === "Custom";

  return (
    <div
      className="glass p-4 md:p-6 rounded-2xl border border-white/20 shadow-xl
                 grid grid-cols-1 lg:grid-cols-12 gap-3 md:gap-4"
      role="region"
      aria-label="Market filters"
    >
      {/* Region */}
      <label className="flex flex-col gap-2 lg:col-span-4">
        <span className="text-sm font-semibold text-slate-800 flex items-center gap-2">
          <GIcon title="Region">
            <MapPinIcon className="h-5 w-5" />
          </GIcon>
          Region
        </span>
        <select
          aria-label="Select region"
          className="input"
          value={state.region}
          onChange={(e) => change("region", e.target.value as Region)}
        >
          {REGIONS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </label>

      {/* Postal code (conditional) */}
      {showPostal && (
        <label className="flex flex-col gap-2 lg:col-span-3">
          <span className="text-sm font-semibold text-slate-800 flex items-center gap-2">
            <GIcon title="Postal Code">
              <MagnifyingGlassIcon className="h-5 w-5" />
            </GIcon>
            Postal Code
          </span>
          <input
            className="input"
            placeholder="e.g., M5V 2T6"
            value={state.postal ?? ""}
            onChange={(e) => change("postal", e.target.value.toUpperCase())}
          />
          <span className="text-xs text-slate-500">Enter a Canadian postal code for hyper-local trends.</span>
        </label>
      )}

      {/* Type */}
      <label className={`flex flex-col gap-2 ${showPostal ? "lg:col-span-3" : "lg:col-span-4"}`}>
        <span className="text-sm font-semibold text-slate-800 flex items-center gap-2">
          <GIcon title="Property Type">
            <BuildingOffice2Icon className="h-5 w-5" />
          </GIcon>
          Property Type
        </span>
        <select
          aria-label="Select property type"
          className="input"
          value={state.propertyType}
          onChange={(e) => change("propertyType", e.target.value as PropertyType)}
        >
          {TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </label>

      {/* Time Range */}
      <fieldset className={`flex flex-col gap-2 ${showPostal ? "lg:col-span-12" : "lg:col-span-4"}`}>
        <legend className="text-sm font-semibold text-slate-800 flex items-center gap-2">
          <GIcon title="Time Range">
            <ChartPieIcon className="h-5 w-5" />
          </GIcon>
          Time Range
        </legend>
        <div role="radiogroup" aria-label="Select time range" className="flex flex-wrap gap-2">
          {RANGES.map((r) => {
            const active = state.range === r;
            return (
              <button
                key={r}
                type="button"
                role="radio"
                aria-checked={active}
                className={[
                  "rounded-full px-3 py-1.5 text-sm outline-none transition-all duration-300 focus-visible:ring-2 focus-visible:ring-emerald-400",
                  active
                    ? "bg-gradient-to-r from-indigo-600 to-emerald-500 text-white shadow"
                    : "bg-white/70 text-slate-700 hover:bg-white focus:bg-white border border-slate-200",
                ].join(" ")}
                onClick={() => change("range", r)}
              >
                {r}
              </button>
            );
          })}
        </div>

        {/* Custom month range */}
        {showCustom && (
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-sm text-slate-700">
                <CalendarIcon className="h-4 w-4" /> From
              </span>
              <input
                type="month"
                className="input flex-1"
                value={state.customFrom ?? ""}
                onChange={(e) => change("customFrom", e.target.value)}
              />
            </label>
            <label className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-sm text-slate-700">
                <CalendarIcon className="h-4 w-4" /> To
              </span>
              <input
                type="month"
                className="input flex-1"
                value={state.customTo ?? ""}
                onChange={(e) => change("customTo", e.target.value)}
              />
            </label>
          </div>
        )}
      </fieldset>

      {busy && (
        <div className="col-span-full text-sm text-slate-600 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          Updating market view…
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   KPI Card
   ──────────────────────────────────────────────────────── */
function KpiCard({
  title,
  value,
  delta,
  positiveIsUp = true,
  icon,
  srHint,
}: {
  title: string;
  value: string;
  delta: number;
  positiveIsUp?: boolean;
  icon: React.ReactNode;
  srHint?: string;
}) {
  const up = delta >= 0;
  const good = positiveIsUp ? up : !up;
  const Arrow = up ? ArrowTrendingUpIcon : ArrowTrendingDownIcon;

  return (
    <div className="glass p-4 rounded-2xl border border-white/20 shadow-lg flex items-center gap-4 animate-fade-in" role="group" aria-label={`${title} KPI`}>
      <GIcon title={title}>{icon}</GIcon>
      <div className="flex-1 min-w-0">
        <div className="text-[11px] uppercase tracking-wide text-slate-600">{title}</div>
        <div className="mt-0.5 text-2xl md:text-[28px] font-extrabold text-slate-900 leading-tight break-words">
          {value}
        </div>
        <div
          className={["mt-1 inline-flex items-center gap-1 text-xs font-semibold", good ? "text-emerald-600" : "text-rose-600"].join(" ")}
          aria-label={`${Math.abs(delta)} percent ${up ? "increase" : "decrease"}`}
        >
          <Arrow className="h-4 w-4" />
          {`${up ? "+" : "−"}${Math.abs(delta).toFixed(1)}%`}
          {srHint ? <span className="sr-only"> {srHint}</span> : null}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Charts (SVG)
   ──────────────────────────────────────────────────────── */
function useHoverTooltip() {
  const [hover, setHover] = useState<{ x: number; y: number; label: string } | null>(null);
  const onLeave = () => setHover(null);
  return { hover, setHover, onLeave };
}

function LineChartSvg({
  data,
  width = 720,
  height = 220,
  ariaLabel,
}: {
  data: { x: string; y: number }[];
  width?: number;
  height?: number;
  ariaLabel: string;
}) {
  const pad = 28;
  const ys = data.map((d) => d.y);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const xStep = (width - 2 * pad) / Math.max(1, data.length - 1);
  const mapX = (i: number) => pad + i * xStep;
  const mapY = (v: number) => height - pad - ((v - minY) / (maxY - minY || 1)) * (height - 2 * pad);

  const path = data.map((d, i) => `${i === 0 ? "M" : "L"} ${mapX(i)},${mapY(d.y)}`).join(" ");
  const { hover, setHover, onLeave } = useHoverTooltip();

  function onMove(e: React.MouseEvent<SVGSVGElement>) {
    const rect = (e.currentTarget as SVGElement).getBoundingClientRect();
    const px = e.clientX - rect.left;
    const i = Math.max(0, Math.min(data.length - 1, Math.round((px - pad) / xStep)));
    setHover({ x: mapX(i), y: mapY(data[i].y), label: `${data[i].x}: ${fmtMoney(data[i].y)}` });
  }

  return (
    <div className="relative" role="img" aria-label={ariaLabel}>
      <svg width="100%" viewBox={`0 0 ${width} ${height}`} className="rounded-xl ring-1 ring-white/30 bg-gradient-to-br from-white/30 to-white/10 backdrop-blur-lg" onMouseMove={onMove} onMouseLeave={onLeave}>
        <title>{ariaLabel}</title>
        <desc>Interactive line chart with hover tooltips.</desc>
        <line x1={pad} y1={height - pad} x2={width - pad} y2={height - pad} stroke="rgba(15,23,42,0.25)" />
        <line x1={pad} y1={pad} x2={pad} y2={height - pad} stroke="rgba(15,23,42,0.25)" />
        <defs>
          <linearGradient id="lg1" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#6366F1" />
            <stop offset="50%" stopColor="#06B6D4" />
            <stop offset="100%" stopColor="#10B981" />
          </linearGradient>
        </defs>
        <path d={path} fill="none" stroke="url(#lg1)" strokeWidth={3} />
        {data.map((d, i) => <circle key={i} cx={mapX(i)} cy={mapY(d.y)} r={3} fill="#0ea5e9" />)}
        {hover && <>
          <line x1={hover.x} y1={pad} x2={hover.x} y2={height - pad} stroke="rgba(15,23,42,0.15)" />
          <circle cx={hover.x} cy={hover.y} r={5} fill="#10B981" stroke="#fff" strokeWidth={2} />
        </>}
      </svg>
      {hover && (
        <div className="pointer-events-none absolute -translate-x-1/2 -translate-y-3 rounded-xl bg-slate-900/90 text-white text-xs px-3 py-2 shadow-lg" style={{ left: hover.x, top: hover.y }} role="tooltip">
          {hover.label}
        </div>
      )}
    </div>
  );
}

function BarChartSvg({
  data,
  width = 720,
  height = 220,
  ariaLabel,
}: {
  data: { x: string; a: number; b: number }[];
  width?: number;
  height?: number;
  ariaLabel: string;
}) {
  const pad = 32;
  const maxV = Math.max(...data.map((d) => Math.max(d.a, d.b)));
  const innerW = width - 2 * pad;
  const barW = innerW / data.length;
  const mapY = (v: number) => height - pad - (v / (maxV || 1)) * (height - 2 * pad);

  const { hover, setHover } = useHoverTooltip();

  function onMove(e: React.MouseEvent<SVGSVGElement>) {
    const rect = (e.currentTarget as SVGElement).getBoundingClientRect();
    const px = e.clientX - rect.left - pad;
    const i = Math.max(0, Math.min(data.length - 1, Math.floor(px / barW)));
    const d = data[i];
    setHover({ x: pad + i * barW + barW / 2, y: mapY(Math.max(d.a, d.b)) - 10, label: `${d.x}\nActive: ${fmtInt(d.a)}\nNew: ${fmtInt(d.b)}` });
  }

  return (
    <div className="relative" role="img" aria-label={ariaLabel}>
      <svg width="100%" viewBox={`0 0 ${width} ${height}`} className="rounded-xl ring-1 ring-white/30 bg-gradient-to-br from-white/30 to-white/10 backdrop-blur-lg" onMouseMove={onMove} onMouseLeave={() => setHover(null)}>
        <title>{ariaLabel}</title>
        <desc>Interactive bar chart with hover tooltips.</desc>
        <line x1={pad} y1={height - pad} x2={width - pad} y2={height - pad} stroke="rgba(15,23,42,0.25)" />
        <defs>
          <linearGradient id="bgA" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0ea5e9" />
            <stop offset="100%" stopColor="#22c55e" />
          </linearGradient>
          <linearGradient id="bgB" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366F1" />
            <stop offset="100%" stopColor="#06B6D4" />
          </linearGradient>
        </defs>
        {data.map((d, i) => {
          const x = pad + i * barW + barW * 0.1;
          const w = barW * 0.35;
          const x2 = x + w + barW * 0.1;
          const hA = height - pad - mapY(d.a);
          const hB = height - pad - mapY(d.b);
          return (
            <g key={i}>
              <rect x={x} y={mapY(d.a)} width={w} height={hA} fill="url(#bgA)" rx={6} />
              <rect x={x2} y={mapY(d.b)} width={w} height={hB} fill="url(#bgB)" rx={6} />
            </g>
          );
        })}
        {hover && <line x1={hover.x} y1={pad} x2={hover.x} y2={height - pad} stroke="rgba(15,23,42,0.15)" />}
      </svg>
      {hover && (
        <div className="pointer-events-none whitespace-pre absolute -translate-x-1/2 -translate-y-3 rounded-xl bg-slate-900/90 text-white text-xs px-3 py-2 shadow-lg" style={{ left: hover.x, top: hover.y }} role="tooltip">
          {hover.label}
        </div>
      )}
    </div>
  );
}

/* Histogram */
function HistogramSvg({
  values,
  bins = 10,
  width = 720,
  height = 220,
  ariaLabel,
}: {
  values: number[];
  bins?: number;
  width?: number;
  height?: number;
  ariaLabel: string;
}) {
  const pad = 32;

  const [hover, setHover] = React.useState<{
    x: number;
    y: number;
    label: string;
  } | null>(null);

  if (!values || values.length === 0) {
    return (
      <div className="glass rounded-xl p-6 text-slate-600 text-sm">
        No data available for this selection.
      </div>
    );
  }

  let min = Math.min(...values);
  let max = Math.max(...values);

  if (min === max) {
    const epsilon = Math.max(1, Math.round(min * 0.02)) || 1;
    min -= epsilon;
    max += epsilon;
  }

  const step = (max - min) / bins;
  const counts = new Array(bins).fill(0) as number[];

  values.forEach((v) => {
    const idx = Math.min(bins - 1, Math.max(0, Math.floor((v - min) / step)));
    counts[idx] += 1;
  });

  const innerW = width - 2 * pad;
  const barW = innerW / bins;
  const maxC = Math.max(...counts);
  const mapY = (c: number) => height - pad - (c / (maxC || 1)) * (height - 2 * pad);

  function onMove(e: React.MouseEvent<SVGSVGElement>) {
    const rect = (e.currentTarget as SVGElement).getBoundingClientRect();
    const px = e.clientX - rect.left - pad;
    const i = Math.max(0, Math.min(bins - 1, Math.floor(px / barW)));
    const c = counts[i];
    const binStart = min + i * step;
    const binEnd = binStart + step;
    setHover({
      x: pad + i * barW + barW / 2,
      y: mapY(c) - 10,
      label: `${fmtMoney(Math.round(binStart))} – ${fmtMoney(Math.round(binEnd))}\nCount: ${c}`,
    });
  }

  return (
    <div className="relative" role="img" aria-label={ariaLabel}>
      <svg
        width="100%"
        viewBox={`0 0 ${width} ${height}`}
        className="rounded-xl ring-1 ring-white/30 bg-gradient-to-br from-white/30 to-white/10 backdrop-blur-lg"
        onMouseMove={onMove}
        onMouseLeave={() => setHover(null)}
      >
        <title>{ariaLabel}</title>
        <desc>Histogram of price per square foot values with hover tooltips.</desc>
        <line x1={pad} y1={height - pad} x2={width - pad} y2={height - pad} stroke="rgba(15,23,42,0.25)" />
        <defs>
          <linearGradient id="hist" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10B981" />
            <stop offset="100%" stopColor="#06B6D4" />
          </linearGradient>
        </defs>
        {counts.map((c, i) => {
          const x = pad + i * barW + barW * 0.1;
          const w = barW * 0.8;
          const y = mapY(c);
          const h = Math.max(2, height - pad - y);
          return <rect key={i} x={x} y={y} width={w} height={h} fill="url(#hist)" rx={6} />;
        })}
        {hover && <line x1={hover.x} y1={pad} x2={hover.x} y2={height - pad} stroke="rgba(15,23,42,0.15)" />}
      </svg>
      {hover && (
        <div
          className="pointer-events-none whitespace-pre absolute -translate-x-1/2 -translate-y-3 rounded-xl bg-slate-900/90 text-white text-xs px-3 py-2 shadow-lg"
          style={{ left: hover.x, top: hover.y }}
          role="tooltip"
        >
          {hover.label}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Page
   ──────────────────────────────────────────────────────── */
export default function MarketTrend() {
  const navigate = useNavigate();

  const [state, setState] = useState<MarketState>({
    region: "Toronto, ON",
    propertyType: "Single Family",
    range: "1Y",
  });

  const [loading, setLoading] = useState(false);
  const [savedOnce, setSavedOnce] = useState(false);
  const [announceMsg, setAnnounceMsg] = useState("");

  const [series, setSeries] = useState<MonthlyDatum[]>([]);
  const [fetchErr, setFetchErr] = useState<string | null>(null);

  useEffect(() => {
    if (!announceMsg) return;
    const t = setTimeout(() => setAnnounceMsg(""), 2000);
    return () => clearTimeout(t);
  }, [announceMsg]);
  const announce = (msg: string) => setAnnounceMsg(msg);

  const monthsForRange = useMemo(() => {
    if (state.range !== "Custom") return monthsBackMap[state.range];
    if (state.customFrom && state.customTo) {
      const n = monthsBetweenInclusive(state.customFrom, state.customTo);
      return Math.max(1, Math.min(120, n));
    }
    return 12;
  }, [state.range, state.customFrom, state.customTo]);

  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);
    setFetchErr(null);

    fetchMarketSeriesOrFallback(state, monthsForRange, ctrl.signal)
      .then(setSeries)
      .catch(() => setFetchErr("Unable to fetch market data. Showing sample estimates."))
      .finally(() => setLoading(false));

    return () => ctrl.abort();
  }, [state.region, state.propertyType, state.range, state.postal, state.customFrom, state.customTo, monthsForRange]);

  const kpis = useMemo(() => {
    if (series.length < 2) return null;
    const latest = series[series.length - 1];
    const prev = series[Math.max(0, series.length - 2)];
    const avgPriceDelta = ((latest.avgPrice - prev.avgPrice) / Math.max(1, prev.avgPrice)) * 100;
    const domDelta = ((latest.daysOnMarket - prev.daysOnMarket) / Math.max(1, prev.daysOnMarket)) * 100;
    const activeDelta = ((latest.activeListings - prev.activeListings) / Math.max(1, prev.activeListings)) * 100;
    const ppsfDelta = ((latest.pricePerSqft - prev.pricePerSqft) / Math.max(1, prev.pricePerSqft)) * 100;
    return {
      avgPrice: { value: fmtMoney(latest.avgPrice), delta: avgPriceDelta },
      dom: { value: `${latest.daysOnMarket} days`, delta: domDelta },
      active: { value: fmtInt(latest.activeListings), delta: activeDelta },
      ppsf: { value: fmtMoney(latest.pricePerSqft), delta: ppsfDelta },
    };
  }, [series]);

  const onAutoSave = () => {
    try {
      localStorage.setItem("market_view_v2", JSON.stringify(state));
      setSavedOnce(true);
    } catch {}
  };

  useEffect(() => {
    try {
      const raw = localStorage.getItem("market_view_v2");
      if (raw) setState(JSON.parse(raw) as MarketState);
    } catch {}
  }, []);

  const priceSeries = useMemo(() => series.map((d) => ({ x: d.date, y: d.avgPrice })), [series]);
  const invSeries = useMemo(() => series.map((d) => ({ x: d.date, a: d.activeListings, b: d.newListings })), [series]);
  const ppsfValues = useMemo(() => series.map((d) => d.pricePerSqft).filter((v) => Number.isFinite(v)), [series]);

  return (
    <div className="relative min-h-screen text-slate-900 bg-gradient-to-br from-slate-50 via-sky-50 to-emerald-50 -mt-6 sm:-mt-10 md:-mt-12 lg:-mt-14 xl:-mt-16" style={{ scrollBehavior: "smooth" }}>
      {/* background accents */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-gradient-to-br from-indigo-300/40 to-cyan-300/40 blur-3xl animate-float-slow" />
        <div className="absolute top-1/3 -left-20 h-56 w-56 rounded-full bg-gradient-to-br from-emerald-300/40 to-teal-300/40 blur-3xl animate-float-slower" />
      </div>

      <div aria-live="polite" className="sr-only">{announceMsg}</div>

      <div className="container-7xl mx-auto px-4 py-6">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <GIcon title="Market">
              <ChartLineIcon className="h-5 w-5" aria-hidden />
            </GIcon>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Market Trends &amp; Insights</h1>
              <p className="text-slate-600">Stay informed with real-time market data, pricing trends, and insights to make smarter real estate decisions.</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2">
            <div className="text-xs text-slate-500">{savedOnce ? "Market View saved" : "Customize and your view auto-saves."}</div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <section className="lg:col-span-8 space-y-6">
            <Filters state={state} setState={setState} onAutoSave={onAutoSave} busy={loading} setBusy={setLoading} announce={announce} />

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4" role="region" aria-label="Key market indicators">
              <KpiCard title="Average Price" value={kpis?.avgPrice.value ?? (loading ? "Loading…" : "—")} delta={kpis?.avgPrice.delta ?? 0} positiveIsUp icon={<ChartLineIcon className="h-5 w-5" />} srHint="Average sale price change" />
              <KpiCard title="Days on Market" value={kpis?.dom.value ?? (loading ? "Loading…" : "—")} delta={kpis?.dom.delta ?? 0} positiveIsUp={false} icon={<MagnifyingGlassIcon className="h-5 w-5" />} srHint="Days on market change" />
              <KpiCard title="Active Listings" value={kpis?.active.value ?? (loading ? "Loading…" : "—")} delta={kpis?.active.delta ?? 0} icon={<ChartBarIcon className="h-5 w-5" />} srHint="Active listings trend" />
              <KpiCard title="Price per Sqft" value={kpis?.ppsf.value ?? (loading ? "Loading…" : "—")} delta={kpis?.ppsf.delta ?? 0} icon={<ChartPieIcon className="h-5 w-5" />} srHint="Price per square foot change" />
            </div>

            <div className="grid grid-cols-1 gap-6">
              <div className="glass p-4 md:p-6 rounded-2xl border border-white/20 shadow-xl space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                  <GIcon title="Line chart"><ChartLineIcon className="h-5 w-5" /></GIcon>
                  Price Trends
                </div>
                <LineChartSvg data={priceSeries} ariaLabel="Average price trend over time" />
              </div>

              <div className="glass p-4 md:p-6 rounded-2xl border border-white/20 shadow-xl space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                  <GIcon title="Bar chart"><ChartBarIcon className="h-5 w-5" /></GIcon>
                  Inventory & New Listings
                </div>
                <BarChartSvg data={invSeries} ariaLabel="Active and new inventory over time" />
              </div>

              <div className="glass p-4 md:p-6 rounded-2xl border border-white/20 shadow-xl space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                  <GIcon title="Histogram"><ChartPieIcon className="h-5 w-5" /></GIcon>
                  Price per Square Foot Distribution
                </div>
                <HistogramSvg values={ppsfValues} ariaLabel="Distribution of price per square foot" />
              </div>

              <DataTable rows={series} />
              {fetchErr && <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">{fetchErr}</div>}
            </div>

            <div className="mt-4 flex flex-col items-center gap-5">
              <button className="inline-flex items-center gap-2 rounded-full border border-emerald-500 text-emerald-700 px-5 py-2.5 font-semibold bg-white hover:bg-emerald-50" onClick={() => navigate("/find-comparable")}>
                <HomeIcon className="h-5 w-5" />
                Find Comparable Homes Like Yours
              </button>

              <div className="w-full rounded-2xl border bg-purple-50/50 p-5 text-center">
                <div className="font-extrabold text-slate-900 text-lg">Want the Complete Market Analysis?</div>
                <p className="text-slate-700 mt-1">Get a comprehensive PDF report with detailed trends, forecasts, and neighborhood comparisons.</p>
                <button className="mt-3 inline-flex items-center gap-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold px-5 py-2.5" onClick={() => navigate("/agent/report-request?src=markettrend_pdf")}>
                  <DocumentArrowDownIcon className="h-5 w-5" />
                  Get Full Market Report (PDF)
                </button>
              </div>
            </div>
          </section>

          <aside className="lg:col-span-4 lg:sticky lg:top-28 space-y-6 h-fit">
            <div className="glass p-6 rounded-2xl border border-white/20 shadow-2xl">
              <div className="flex items-center gap-3">
                <GIcon title="CMA"><ArrowTrendingUpIcon className="h-5 w-5" /></GIcon>
                <div>
                  <div className="text-lg font-extrabold">Request Your Local CMA</div>
                  <div className="text-sm text-slate-600">Hyper-local pricing from our luxury experts.</div>
                </div>
              </div>
              <button className="mt-4 w-full rounded-xl bg-emerald-500 text-white font-bold px-5 py-3 shadow-lg ring-1 ring-white/20 hover:bg-emerald-600 focus-visible:ring-2 focus-visible:ring-emerald-300 transition-all duration-300 inline-flex items-center justify-center gap-2 hover:animate-bounce-subtle" onClick={() => navigate("/tour?src=markettrend_cma")}>
                Request Your Local CMA
                <ArrowRightIcon className="h-5 w-5" />
              </button>
              <p className="mt-3 text-xs text-slate-600">
                Curious what this means for your home?{" "}
                <button className="text-emerald-700 font-semibold underline underline-offset-2 hover:text-emerald-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 rounded" onClick={() => navigate("/tour?src=markettrend_link")}>
                  Request a free CMA.
                </button>
              </p>
            </div>

            <div className="glass p-6 rounded-2xl border border-white/20 shadow-xl">
              <div className="text-sm font-semibold text-slate-800 mb-2">Why this matters</div>
              <ul className="text-sm text-slate-700 space-y-2">
                <li>• Understand pricing momentum across sub-markets.</li>
                <li>• Compare inventory pressure vs. demand trends.</li>
                <li>• Align listing timing with seasonal patterns.</li>
              </ul>
            </div>
          </aside>
        </div>
      </div>

      <style>{`
        :root { --glass-bg: rgba(255,255,255,0.55); }
        .glass { background: var(--glass-bg); backdrop-filter: blur(18px) saturate(1.4); }
        .input {
          appearance: none; background: rgba(255,255,255,0.8); backdrop-filter: blur(8px);
          border: 1px solid rgba(148,163,184,0.35); border-radius: 0.75rem; padding: 0.6rem 0.8rem;
          outline: none; transition: box-shadow .2s, border-color .2s, background .2s;
        }
        .input:focus-visible { border-color: rgba(16,185,129,0.8); box-shadow: 0 0 0 4px rgba(16,185,129,0.25); background: rgba(255,255,255,0.95); }
        @keyframes float-slow { 0%{transform:translateY(0)}50%{transform:translateY(12px)}100%{transform:translateY(0)} }
        .animate-float-slow { animation: float-slow 10s ease-in-out infinite; }
        .animate-float-slower { animation: float-slow 14s ease-in-out infinite; }
        @keyframes bounce-subtle { 0%,100%{ transform: translateY(0);} 50%{ transform: translateY(-2px);} }
        .hover\\:animate-bounce-subtle:hover { animation: bounce-subtle .7s ease-in-out infinite; }
      `}</style>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Sortable Table
   ──────────────────────────────────────────────────────── */
type SortKey = keyof MonthlyDatum;
type SortDir = "asc" | "desc";

function DataTable({ rows }: { rows: MonthlyDatum[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [dir, setDir] = useState<SortDir>("desc");

  function toggle(k: SortKey) {
    if (k === sortKey) setDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(k); setDir("desc"); }
  }

  const sorted = useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) => {
      const va = a[sortKey] as any, vb = b[sortKey] as any;
      if (va === vb) return 0;
      const comp = va > vb ? 1 : -1;
      return dir === "asc" ? comp : -comp;
    });
    return copy;
  }, [rows, sortKey, dir]);

  function Th({ k, label, aria }: { k: SortKey; label: string; aria: string }) {
    const active = sortKey === k;
    return (
      <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
        <button
          type="button"
          className={["inline-flex items-center gap-1 rounded px-2 py-1 focus-visible:ring-2 focus-visible:ring-emerald-400", "hover:bg-white/60 transition-colors", active ? "bg-white/70" : "bg-transparent"].join(" ")}
          aria-label={`${aria}, ${active ? `sorted ${dir}` : "not sorted"}`}
          onClick={() => toggle(k)}
        >
          {label}
          <ArrowRightIcon className={["h-4 w-4 text-slate-500 transition-transform", active ? (dir === "asc" ? "rotate-90" : "-rotate-90") : "opacity-40"].join(" ")} />
        </button>
      </th>
    );
  }

  return (
    <div className="glass rounded-2xl border border-white/20 shadow-xl overflow-hidden">
      <div className="px-4 pt-4 text-sm font-semibold text-slate-800 flex items-center gap-2">
        <GIcon title="Table"><ChartBarIcon className="h-5 w-5" /></GIcon>
        Monthly Detail
      </div>
      <div className="overflow-x-auto mt-2">
        <table className="min-w-full text-sm" role="table" aria-label="Monthly market changes">
          <thead className="bg-white/50">
            <tr>
              <Th k="date" label="Month" aria="Sort by month" />
              <Th k="avgPrice" label="Avg Price" aria="Sort by average price" />
              <Th k="pricePerSqft" label="$/Sqft" aria="Sort by price per square foot" />
              <Th k="daysOnMarket" label="DOM" aria="Sort by days on market" />
              <Th k="activeListings" label="Active" aria="Sort by active listings" />
              <Th k="newListings" label="New" aria="Sort by new listings" />
            </tr>
          </thead>
          <tbody className="divide-y divide-white/40">
            {sorted.map((r) => (
              <tr key={r.date} className="hover:bg-white/40 focus-within:bg-white/40 transition-colors">
                <th scope="row" className="px-4 py-2 font-semibold text-slate-800">{r.date}</th>
                <td className="px-4 py-2">{fmtMoney(r.avgPrice)}</td>
                <td className="px-4 py-2">{fmtMoney(r.pricePerSqft)}</td>
                <td className="px-4 py-2">{r.daysOnMarket} days</td>
                <td className="px-4 py-2">{fmtInt(r.activeListings)}</td>
                <td className="px-4 py-2">{fmtInt(r.newListings)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
