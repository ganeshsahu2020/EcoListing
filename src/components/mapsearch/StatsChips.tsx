import React from "react";
import { UIMapFilters } from "./types";
import { fmtMoney0, summarizeMarketPill } from "./utils";

export default function StatsChips({
  filters,
  loading,
  totalInView,
  listingsCount,
  medianPrice,
  avgPpsf,
  anyPTActive,
}: {
  filters: UIMapFilters;
  loading: boolean;
  totalInView: number | null;
  listingsCount: number;
  medianPrice: number | null;
  avgPpsf: number | null;
  anyPTActive: boolean;
}) {
  const chip = (text: string) => (
    <span className="rounded-full border px-2 py-[2px] bg-white/70 text-xs">{text}</span>
  );

  const isMarketFiltered =
    (filters.market.mode === "forSale" && filters.market.forSaleDays !== "all") ||
    filters.market.mode === "sold";

  return (
    <div className="flex items-center justify-between px-0 pb-2 text-slate-600">
      <div className="flex-1 overflow-hidden">
        <span className="font-semibold text-lg text-blue-700">
          {loading
            ? "Loading…"
            : totalInView != null
            ? `${totalInView.toLocaleString()} listings`
            : `${listingsCount} properties`}
        </span>
        {medianPrice != null && (
          <span className="ml-3 text-xs text-slate-500">Median: {fmtMoney0(medianPrice)}</span>
        )}
        {avgPpsf != null && (
          <span className="ml-3 text-xs text-slate-500">Avg $/sqft: {fmtMoney0(avgPpsf)}</span>
        )}
        <div className="mt-1 flex gap-2 overflow-x-auto">
          {filters.query && chip(`“${filters.query}”`)}
          {isMarketFiltered && chip(summarizeMarketPill(filters.market))}
          {filters.priceMin != null && chip(`≥ ${fmtMoney0(filters.priceMin)}`)}
          {filters.priceMax != null && chip(`≤ ${fmtMoney0(filters.priceMax)}`)}
          {filters.bedsMin != null && chip(`${filters.bedsExact ? "" : "≥ "}${filters.bedsMin} bd`)}
          {filters.bathsMin != null && chip(`≥ ${filters.bathsMin} ba`)}
          {Object.entries(filters.homeTypes).some(([, v]) => !v) && chip("Type filtered")}
          {anyPTActive && chip("Property type filtered")}
          {filters.more.sqftMin != null && chip(`≥ ${filters.more.sqftMin} sqft`)}
          {filters.more.sqftMax != null && chip(`≤ ${filters.more.sqftMax} sqft`)}
        </div>
      </div>
    </div>
  );
}
