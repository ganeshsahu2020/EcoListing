import React from "react";
import { UIMapFilters } from "./types";
import { FS_DAYS, SOLD_WITHIN } from "./utils";

export default function MarketMenu({
  open,
  filters,
  setFilters,
  onApply,
  onClear,
  onClose, // NEW (optional)
}: {
  open: boolean;
  filters: UIMapFilters;
  setFilters: React.Dispatch<React.SetStateAction<UIMapFilters>>;
  onApply: () => void;
  onClear: () => void;
  onClose?: () => void; // NEW (optional)
}) {
  if (!open) return null;

  const applyAndClose = () => {
    onApply();
    onClose?.();
  };

  return (
    <div
      className="absolute left-0 top-[42px] w-[320px] sm:w-[360px] rounded-2xl border bg-white p-3 shadow-2xl z-50 text-sm"
      style={{ maxHeight: "70vh", overflowY: "auto" }}
      role="dialog"
      aria-modal="true"
      aria-label="Market filters"
    >
      <div className="flex items-center gap-2 mb-3">
        <button
          className={`px-3 py-1 rounded-full border font-medium ${
            filters.market.mode === "forSale"
              ? "bg-rose-50 text-rose-600 border-rose-300"
              : "bg-white text-slate-700"
          }`}
          onClick={() =>
            setFilters((f) => ({ ...f, market: { ...f.market, mode: "forSale" } }))
          }
        >
          For sale
        </button>
        <button
          className={`px-3 py-1 rounded-full border font-medium ${
            filters.market.mode === "sold"
              ? "bg-rose-50 text-rose-600 border-rose-300"
              : "bg-white text-slate-700"
          }`}
          onClick={() =>
            setFilters((f) => ({ ...f, market: { ...f.market, mode: "sold" } }))
          }
        >
          Sold
        </button>
      </div>

      {filters.market.mode === "forSale" ? (
        <>
          <div className="font-semibold text-slate-800 mb-2">Days on market</div>
          <div className="rounded-lg border overflow-hidden">
            {FS_DAYS.map((opt, i) => {
              const active = filters.market.forSaleDays === opt.key;
              return (
                <button
                  key={opt.key}
                  className={`w-full text-left px-3 py-2 flex items-center justify-between ${
                    i !== FS_DAYS.length - 1 ? "border-b" : ""
                  } ${active ? "bg-blue-50" : "bg-white"}`}
                  onClick={() =>
                    setFilters((f) => ({
                      ...f,
                      market: { ...f.market, forSaleDays: opt.key },
                    }))
                  }
                >
                  <span>{opt.label}</span>
                  {active && <span>✓</span>}
                </button>
              );
            })}
          </div>
        </>
      ) : (
        <>
          <div className="font-semibold text-slate-800 mb-2">Sold within</div>
          <div className="rounded-lg border overflow-hidden">
            {SOLD_WITHIN.map((opt, i) => {
              const active = filters.market.soldWithin === opt.key;
              return (
                <button
                  key={opt.key}
                  className={`w-full text-left px-3 py-2 flex items-center justify-between ${
                    i !== SOLD_WITHIN.length - 1 ? "border-b" : ""
                  } ${active ? "bg-blue-50" : "bg-white"}`}
                  onClick={() =>
                    setFilters((f) => ({
                      ...f,
                      market: { ...f.market, soldWithin: opt.key },
                    }))
                  }
                >
                  <span>{opt.label}</span>
                  {active && <span>✓</span>}
                </button>
              );
            })}
          </div>
        </>
      )}

      <div className="mt-3 flex justify-between gap-2">
        <button
          className="px-3 py-1 rounded-lg border"
          onClick={onClear}
          aria-label="Clear market filters"
        >
          Clear
        </button>
        <button
          className="px-3 py-1 rounded-lg bg-emerald-600 text-white"
          onClick={applyAndClose}
          aria-label="Apply market filters"
        >
          Apply
        </button>
      </div>
    </div>
  );
}
