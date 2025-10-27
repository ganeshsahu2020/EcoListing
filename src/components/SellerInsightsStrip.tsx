import React from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  XMarkIcon,
  ArrowRightIcon,
  BuildingOfficeIcon,
  BanknotesIcon,
  MapPinIcon,
  ChartBarIcon,
  SparklesIcon,
  UserGroupIcon,
  StarIcon,
  ArrowTrendingUpIcon,
  ShieldCheckIcon,
  CalendarDaysIcon,
  HomeModernIcon,
  BoltIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";

/** ---------- Types ---------- */
export type SellerMetrics = {
  estHomeValue?: string;
  priceRange?: string;
  buyersNearby?: number;
  medianDays?: number;
  listToSalePct?: number;
  pricePerSqft?: string;
  newListings30d?: number;
  sales30d?: number;
  demandIndex?: string;
  premiumBuyers?: number;
  topAgentETA?: string;
  marketTrend?: string;
};

type Props = {
  height?: number;
  floating?: boolean;
  storageKey?: string;           // persists collapsed/expanded
  onCtaClick?: () => void;
  metrics?: SellerMetrics;
  loading?: boolean;
  bgClassName?: string;
  /** Make the left badge a link */
  badgeTo?: string;
  /** Make the CTA chip a link */
  ctaTo?: string;
  /** When collapsed, primary button target (defaults to badgeTo or /seller-insights) */
  collapsedTo?: string;
};

/** ---------- Defaults ---------- */
const defaultMetrics: SellerMetrics = {
  estHomeValue: "$2.35M",
  priceRange: "$2.20M – $2.50M",
  buyersNearby: 138,
  medianDays: 17,
  listToSalePct: 101.2,
  pricePerSqft: "$915/sqft",
  newListings30d: 23,
  sales30d: 52,
  demandIndex: "High",
  premiumBuyers: 130,
  topAgentETA: "< 5 min",
  marketTrend: "+5.2% QoQ",
};

/** ---------- Helpers ---------- */
function cx(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(" ");
}

const VARIANTS = {
  emerald: { chip: "border-emerald-400/25 bg-emerald-500/15", label: "text-emerald-200" },
  sky: { chip: "border-sky-400/25 bg-sky-500/15", label: "text-sky-200" },
  cyan: { chip: "border-cyan-400/25 bg-cyan-500/15", label: "text-cyan-200" },
  blue: { chip: "border-blue-400/25 bg-blue-500/15", label: "text-blue-200" },
  indigo: { chip: "border-indigo-400/25 bg-indigo-500/15", label: "text-indigo-200" },
  violet: { chip: "border-violet-400/25 bg-violet-500/15", label: "text-violet-200" },
  amber: { chip: "border-amber-400/25 bg-amber-500/15", label: "text-amber-200" },
  rose: { chip: "border-rose-400/25 bg-rose-500/15", label: "text-rose-200" },
  slate: { chip: "border-slate-400/25 bg-slate-500/15", label: "text-slate-200" },
} as const;
type VariantKey = keyof typeof VARIANTS;

/** ---------- tiny persistence hook ---------- */
function usePersistentToggle(key: string, defaultValue = false) {
  const [val, setVal] = React.useState<boolean>(() => {
    try {
      const v = localStorage.getItem(key);
      return v === "1" ? true : v === "0" ? false : defaultValue;
    } catch {
      return defaultValue;
    }
  });
  const set = React.useCallback((next: boolean) => {
    setVal(next);
    try {
      localStorage.setItem(key, next ? "1" : "0");
    } catch {}
  }, [key]);
  return [val, set] as const;
}

/** ---------- Metric Chip ---------- */
function Chip({
  icon,
  label,
  value,
  title,
  variant = "emerald",
  skeleton = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number | undefined;
  title?: string;
  variant?: VariantKey;
  skeleton?: boolean;
}) {
  const v = VARIANTS[variant];
  return (
    <div
      className={cx(
        "metric-item group cursor-default rounded-xl px-3 py-2 min-w-[180px] flex items-center gap-3",
        "border backdrop-blur-sm transition-all duration-300",
        v.chip,
        skeleton && "animate-pulse"
      )}
      title={title || (value != null ? `${label}: ${value}` : label)}
      aria-label={value != null ? `${label}: ${value}` : label}
      role="note"
    >
      <div className="w-8 h-8 shrink-0 rounded-lg bg-white/5 ring-1 ring-white/10 grid place-items-center">
        {icon}
      </div>
      <div className="flex flex-col leading-tight">
        <span className={cx("text-[11px] font-semibold uppercase tracking-wider", v.label)}>{label}</span>
        <span className="text-white font-bold text-sm">{skeleton ? "—" : value}</span>
      </div>
    </div>
  );
}

/** ---------- CTA Chip ---------- */
function CTAChip({ href, onClick }: { href?: string; onClick?: () => void }) {
  const cls = cx(
    "metric-item rounded-xl px-4 py-2 min-w-[220px] flex items-center gap-3",
    "bg-gradient-to-r from-emerald-600 to-cyan-600 text-white",
    "shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]",
    "focus:outline-none focus:ring-2 focus:ring-emerald-300"
  );
  return href ? (
    <Link to={href} className={cls} aria-label="Get your pricing report" title="Get your pricing report">
      <BoltIcon className="h-5 w-5" />
      <div className="flex flex-col text-left">
        <span className="text-xs font-semibold uppercase tracking-wider text-white/90">Free CMA</span>
        <span className="text-sm font-bold">Get your pricing report</span>
      </div>
      <ArrowRightIcon className="h-5 w-5 ml-1" />
    </Link>
  ) : (
    <button type="button" onClick={onClick} className={cls} aria-label="Get your pricing report" title="Get your pricing report">
      <BoltIcon className="h-5 w-5" />
      <div className="flex flex-col text-left">
        <span className="text-xs font-semibold uppercase tracking-wider text-white/90">Free CMA</span>
        <span className="text-sm font-bold">Get your pricing report</span>
      </div>
      <ArrowRightIcon className="h-5 w-5 ml-1" />
    </button>
  );
}

/** ---------- Collapsed (reopen) ---------- */
function CollapsedBar({
  onExpand,
  to,
  floating,
}: {
  onExpand: () => void;
  to: string;
  floating: boolean;
}) {
  const nav = useNavigate();
  return (
    <div
      className={cx(
        "relative z-40 w-full border-b border-white/10 shadow-[0_8px_22px_rgba(0,0,0,0.25)]",
        "backdrop-blur-xl text-white font-sans",
        "bg-gradient-to-r from-[#0B1020] via-[#0A1A2B] to-[#0B1020]",
        floating && "-mb-2"
      )}
      style={{ height: 40 }}
      role="region"
      aria-label="Seller insights (collapsed)"
    >
      <div className="h-full flex items-center justify-between px-3 md:px-4 lg:px-6 xl:max-w-screen-2xl xl:mx-auto xl:px-8 gap-2">
        <button
          type="button"
          onClick={() => nav(to)}
          className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold border border-white/15 bg-white/5 hover:bg-white/10 transition"
          title="Open Seller Insights page"
          aria-label="SellerInsights"
        >
          <SparklesIcon className="h-4 w-4 text-cyan-200" />
          Seller Insights
          <ArrowRightIcon className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={onExpand}
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] border border-white/15 bg-white/5 hover:bg-white/10 transition"
          title="Show insights ticker"
          aria-label="Expand insights"
        >
          <ChevronDownIcon className="h-4 w-4 rotate-180" />
          Show
        </button>
      </div>
    </div>
  );
}

/** ---------- Main Component ---------- */
export default function SellerInsightsStrip({
  height = 64,
  floating = false,
  storageKey = "seller-insights:hidden",
  onCtaClick,
  metrics = defaultMetrics,
  loading = false,
  bgClassName = "bg-gradient-to-r from-[#0B1020] via-[#0A1A2B] to-[#0B1020]",
  badgeTo,
  ctaTo,
  collapsedTo,
}: Props) {
  const [collapsed, setCollapsed] = usePersistentToggle(storageKey, false);
  const [paused, setPaused] = React.useState(false);

  // ↓ default to /seller-insights (fallback chain remains)
  const toWhenCollapsed = collapsedTo || badgeTo || "/seller-insights";

  if (collapsed) {
    // Collapsed “reopen” strip that also navigates when pressing SellerInsights
    return <CollapsedBar onExpand={() => setCollapsed(false)} to={toWhenCollapsed} floating={floating} />;
  }

  return (
    <div
      className={cx(
        "relative z-40 w-full border-b border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.35)]",
        "backdrop-blur-xl text-white font-sans antialiased",
        bgClassName,
        floating && "-mb-4 md:-mb-6"
      )}
      style={{ height }}
      role="region"
      aria-label="Selling insights"
      data-paused={paused ? "true" : "false"}
    >
      {/* Left badge (link when badgeTo provided) */}
      <div className="absolute left-6 top-1/2 -translate-y-1/2">
        {badgeTo ? (
          <Link
            to={badgeTo}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-500 px-3 py-1.5 rounded-full border border-white/10 shadow-lg"
            title="Selling Insights"
          >
            <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
            <span className="text-[11px] font-semibold tracking-wide uppercase">Selling Insights</span>
          </Link>
        ) : (
          <div className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-500 px-3 py-1.5 rounded-full border border-white/10 shadow-lg">
            <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
            <span className="text-[11px] font-semibold tracking-wide uppercase">Selling Insights</span>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="absolute right-12 top-1/2 -translate-y-1/2 flex items-center gap-2">
        <button
          type="button"
          aria-label={paused ? "Resume ticker" : "Pause ticker"}
          className="rounded-lg p-2 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-300"
          onClick={() => setPaused((p) => !p)}
          title={paused ? "Resume" : "Pause"}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" className="text-blue-200">
            {paused ? <path fill="currentColor" d="M8 5v14l11-7z" /> : <path fill="currentColor" d="M6 5h4v14H6zm8 0h4v14h-4z" />}
          </svg>
        </button>
        <button
          type="button"
          aria-label="Hide insights"
          className="rounded-lg p-2 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-300"
          onClick={() => setCollapsed(true)}
          title="Dismiss"
        >
          <XMarkIcon className="h-5 w-5 text-blue-200" />
        </button>
      </div>

      {/* Track (marquee) */}
      <div className="h-full overflow-x-hidden ml-36 mr-24">
        <div className="flex items-center h-full">
          <Track metrics={metrics} loading={loading} ctaTo={ctaTo} onCtaClick={onCtaClick} />
          <Track metrics={metrics} loading={loading} ariaHidden ctaTo={ctaTo} onCtaClick={onCtaClick} />
        </div>
      </div>

      {/* Styles */}
      <style>{`
        @keyframes seller-marquee {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .seller-track {
          min-width: 200%;
          animation: seller-marquee 28s linear infinite;
          will-change: transform;
        }
        [data-paused="true"] .seller-track { animation-play-state: paused; }
        .metric-item { transition: transform .35s cubic-bezier(.2,.6,.2,1), box-shadow .35s; }
        .metric-item:hover { transform: translateY(-2px) scale(1.03); box-shadow: 0 10px 24px rgba(0,0,0,.25); }
        @media (prefers-reduced-motion: reduce) {
          .seller-track { animation: none; transform: none; }
        }
      `}</style>
    </div>
  );
}

/** ---------- Repeated Track ---------- */
function Track({
  metrics,
  loading,
  ariaHidden = false,
  ctaTo,
  onCtaClick,
}: {
  metrics: SellerMetrics;
  loading?: boolean;
  ariaHidden?: boolean;
  ctaTo?: string;
  onCtaClick?: () => void;
}) {
  const m = { ...defaultMetrics, ...metrics };
  return (
    <div className="seller-track whitespace-nowrap flex items-center gap-8 px-8" aria-hidden={ariaHidden || undefined}>
      <Chip icon={<BanknotesIcon className="h-5 w-5 text-emerald-200" />} label="Est. Home Value" value={m.estHomeValue} variant="emerald" skeleton={loading} />
      <Chip icon={<ChartBarIcon className="h-5 w-5 text-cyan-200" />} label="Recommended List Range" value={m.priceRange} variant="cyan" skeleton={loading} />
      <Chip icon={<UserGroupIcon className="h-5 w-5 text-amber-200" />} label="Buyers Looking Nearby" value={`${m.buyersNearby?.toLocaleString()}+`} variant="amber" skeleton={loading} />
      <Chip icon={<SparklesIcon className="h-5 w-5 text-indigo-200" />} label="Demand Index" value={m.demandIndex} variant="indigo" skeleton={loading} />
      <Chip icon={<CalendarDaysIcon className="h-5 w-5 text-sky-200" />} label="Median Days to Sell" value={`${m.medianDays} days`} variant="sky" skeleton={loading} />
      <Chip icon={<StarIcon className="h-5 w-5 text-yellow-200" />} label="List-to-Sale" value={`${m.listToSalePct}%`} variant="rose" skeleton={loading} />
      <Chip icon={<MapPinIcon className="h-5 w-5 text-slate-200" />} label="Sales (30d)" value={`${m.sales30d}`} variant="slate" skeleton={loading} />
      <Chip icon={<BuildingOfficeIcon className="h-5 w-5 text-blue-200" />} label="New Listings (30d)" value={`${m.newListings30d}`} variant="blue" skeleton={loading} />
      <Chip icon={<HomeModernIcon className="h-5 w-5 text-violet-200" />} label="Price per SqFt" value={m.pricePerSqft} variant="violet" skeleton={loading} />
      <Chip icon={<ShieldCheckIcon className="h-5 w-5 text-emerald-200" />} label="Verified & Insured" value="100%" variant="emerald" skeleton={loading} />
      <Chip icon={<ArrowTrendingUpIcon className="h-5 w-5 text-green-200" />} label="Market Trend" value={m.marketTrend} variant="emerald" skeleton={loading} />
      <Chip icon={<BoltIcon className="h-5 w-5 text-cyan-200" />} label="Top Agent Response" value={m.topAgentETA} variant="cyan" skeleton={loading} />
      <CTAChip href={ctaTo || "/find-comparable"} onClick={onCtaClick} />
    </div>
  );
}
