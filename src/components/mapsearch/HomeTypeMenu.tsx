import React from "react";
import { UIMapFilters } from "./types";

export default function HomeTypeMenu({
  open, filters, setFilters, onApply,
}: {
  open: boolean;
  filters: UIMapFilters;
  setFilters: React.Dispatch<React.SetStateAction<UIMapFilters>>;
  onApply: () => void;
}) {
  if (!open) return null;
  return (
    <div className="absolute left-0 top-[42px] w-[300px] rounded-2xl border bg-white p-4 shadow-2xl z-40 text-sm">
      <div className="font-semibold mb-2">Home Type</div>
      <button
        className="text-blue-600 underline text-xs"
        onClick={() =>
          setFilters((f) => ({
            ...f,
            homeTypes: Object.fromEntries(Object.keys(f.homeTypes).map((k) => [k, false])) as UIMapFilters["homeTypes"],
          }))
        }
      >
        Deselect All
      </button>
      <div className="mt-2 space-y-2">
        {Object.entries(filters.homeTypes).map(([k, v]) => (
          <label key={k} className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={v}
              onChange={(e) =>
                setFilters((f) => ({ ...f, homeTypes: { ...f.homeTypes, [k]: e.target.checked } }))
              }
            />
            {k[0].toUpperCase() + k.slice(1)}
          </label>
        ))}
      </div>
      <div className="mt-3 flex justify-end gap-2">
        <button className="px-3 py-1 rounded-lg bg-emerald-600 text-white" onClick={onApply}>Apply</button>
      </div>
    </div>
  );
}
