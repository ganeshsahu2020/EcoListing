import React from "react";
import { UIMapFilters } from "./types";

export default function MoreMenu({
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

  const clearAndClose = () => {
    onClear();
    onClose?.();
  };

  return (
    <div
      className="absolute left-0 top-[42px] w-[340px] rounded-2xl border bg-white p-4 shadow-2xl z-40 text-sm"
      role="dialog"
      aria-modal="true"
      aria-label="More filters"
    >
      <div className="grid grid-cols-2 gap-3">
        {([
          ["has3DTour", "3D Tour"],
          ["petFriendly", "Pet Friendly"],
          ["parking", "Parking"],
          ["pool", "Pool"],
          ["garden", "Garden"],
        ] as const).map(([key, label]) => (
          <label key={key} className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={!!(filters.more as any)[key]}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  more: { ...f.more, [key]: e.target.checked } as any,
                }))
              }
              aria-label={label}
            />
            {label}
          </label>
        ))}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <input
          type="number"
          className="h-9 rounded-lg border px-2"
          placeholder="Min sqft"
          value={filters.more.sqftMin ?? ""}
          onChange={(e) =>
            setFilters((f) => ({
              ...f,
              more: {
                ...f.more,
                sqftMin: e.target.value ? Number(e.target.value) : null,
              },
            }))
          }
          aria-label="Minimum square feet"
        />
        <input
          type="number"
          className="h-9 rounded-lg border px-2"
          placeholder="Max sqft"
          value={filters.more.sqftMax ?? ""}
          onChange={(e) =>
            setFilters((f) => ({
              ...f,
              more: {
                ...f.more,
                sqftMax: e.target.value ? Number(e.target.value) : null,
              },
            }))
          }
          aria-label="Maximum square feet"
        />
      </div>

      <div className="mt-3 flex justify-between gap-2">
        <button className="px-3 py-1 rounded-lg border" onClick={clearAndClose}>
          Clear
        </button>
        <button
          className="px-3 py-1 rounded-lg bg-emerald-600 text-white"
          onClick={applyAndClose}
        >
          Apply
        </button>
      </div>
    </div>
  );
}
