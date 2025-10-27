import React from "react";
import { UIMapFilters } from "./types";

export default function BedsBathsMenu({
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
      className="absolute left-0 top-[42px] w-[360px] rounded-2xl border bg-white p-4 shadow-2xl z-40 text-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Beds and baths filters"
    >
      <div className="font-semibold text-slate-800 mb-2">Number of Bedrooms</div>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Minimum bedrooms">
        {["Any", "1+", "2+", "3+", "4+", "5+"].map((label, i) => {
          const v = i === 0 ? null : i; // 1..5
          const active = filters.bedsMin === v;
          return (
            <button
              key={label}
              className={`px-3 py-1 rounded-lg border text-sm ${
                active ? "bg-blue-600 text-white border-blue-600" : "bg-white"
              }`}
              onClick={() => setFilters((f) => ({ ...f, bedsMin: v }))}
              aria-pressed={active}
            >
              {label}
            </button>
          );
        })}
      </div>
      <label className="mt-2 flex items-center gap-2 text-xs text-slate-700">
        <input
          type="checkbox"
          checked={!!filters.bedsExact}
          onChange={(e) => setFilters((f) => ({ ...f, bedsExact: e.target.checked }))}
        />
        Use exact match
      </label>

      <div className="mt-4 font-semibold text-slate-800 mb-2">Number of Bathrooms</div>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Minimum bathrooms">
        {["Any", "1+", "1.5+", "2+", "3+", "4+"].map((label) => {
          const n = label === "Any" ? null : Number(label.replace("+", ""));
          const active = filters.bathsMin === n;
          return (
            <button
              key={label}
              className={`px-3 py-1 rounded-lg border text-sm ${
                active ? "bg-blue-600 text-white border-blue-600" : "bg-white"
              }`}
              onClick={() => setFilters((f) => ({ ...f, bathsMin: n }))}
              aria-pressed={active}
            >
              {label}
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex justify-between gap-2">
        <button className="px-3 py-1 rounded-lg border" onClick={onClear} aria-label="Clear beds and baths filters">
          Clear
        </button>
        <button
          className="px-3 py-1 rounded-lg bg-emerald-600 text-white"
          onClick={applyAndClose}
          aria-label="Apply beds and baths filters"
        >
          Apply
        </button>
      </div>
    </div>
  );
}
