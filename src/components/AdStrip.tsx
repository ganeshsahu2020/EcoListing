import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { MegaphoneIcon, XMarkIcon, ArrowRightIcon, ChevronDownIcon } from "@heroicons/react/24/outline";

/**
 * Lightweight promo/announcement strip with the same hide/unhide pattern
 * as SellerInsightsStrip. Use for cross-site promos, releases, etc.
 */

type Props = {
  title?: string;
  message?: string;
  to?: string;                 // CTA link target
  ctaLabel?: string;
  height?: number;
  floating?: boolean;
  storageKey?: string;         // persists collapsed/expanded
  bgClassName?: string;
};

function cx(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(" ");
}

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

function CollapsedBar({ onExpand, to }: { onExpand: () => void; to: string }) {
  const nav = useNavigate();
  return (
    <div
      className={cx(
        "relative z-30 w-full border-b border-white/10 shadow-[0_8px_22px_rgba(0,0,0,0.2)]",
        "backdrop-blur-xl text-white font-sans",
        "bg-gradient-to-r from-[#0B1020] via-[#0A1A2B] to-[#0B1020]"
      )}
      style={{ height: 36 }}
      role="region"
      aria-label="Announcement (collapsed)"
    >
      <div className="h-full flex items-center justify-between px-3 md:px-4 lg:px-6 xl:max-w-screen-2xl xl:mx-auto xl:px-8 gap-2">
        <button
          type="button"
          onClick={() => nav(to)}
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold border border-white/15 bg-white/5 hover:bg-white/10 transition"
          aria-label="Open announcement"
          title="Open"
        >
          <MegaphoneIcon className="h-4 w-4 text-amber-200" />
          Promo
          <ArrowRightIcon className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onExpand}
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] border border-white/15 bg-white/5 hover:bg-white/10 transition"
          title="Show announcement"
          aria-label="Expand"
        >
          <ChevronDownIcon className="h-4 w-4 rotate-180" />
          Show
        </button>
      </div>
    </div>
  );
}

export default function AdStrip({
  title = "Limited-time Seller Insights",
  message = "See how your home stacks up against nearby sales and demand.",
  to = "/find-comparable",
  ctaLabel = "Explore Insights",
  height = 44,
  floating = false,
  storageKey = "ad-strip:hidden",
  bgClassName = "bg-gradient-to-r from-[#0B1020] via-[#0A1A2B] to-[#0B1020]",
}: Props) {
  const [collapsed, setCollapsed] = usePersistentToggle(storageKey, false);

  if (collapsed) {
    return <CollapsedBar onExpand={() => setCollapsed(false)} to={to} />;
  }

  return (
    <div
      className={cx(
        "relative z-30 w-full border-b border-white/10 shadow-[0_8px_22px_rgba(0,0,0,0.2)]",
        "backdrop-blur-xl text-white font-sans antialiased",
        bgClassName,
        floating && "-mb-2"
      )}
      style={{ height }}
      role="region"
      aria-label="Announcement"
    >
      <div className="h-full flex items-center justify-between px-3 md:px-4 lg:px-6 xl:max-w-screen-2xl xl:mx-auto xl:px-8 gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="inline-grid place-items-center h-7 w-7 rounded-lg bg-white/5 ring-1 ring-white/10">
            <MegaphoneIcon className="h-4.5 w-4.5 text-amber-200" />
          </span>
          <div className="min-w-0">
            <div className="text-xs font-semibold tracking-wide">{title}</div>
            <div className="text-[11px] text-white/85 truncate">{message}</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to={to}
            className="inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-semibold border border-white/15 bg-white/5 hover:bg-white/10 transition"
          >
            {ctaLabel}
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
          <button
            type="button"
            onClick={() => setCollapsed(true)}
            className="rounded-lg p-1.5 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-amber-300"
            title="Hide"
            aria-label="Hide announcement"
          >
            <XMarkIcon className="h-5 w-5 text-white/80" />
          </button>
        </div>
      </div>
    </div>
  );
}
