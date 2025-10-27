import React from "react";
import { UIMapFilters } from "./types";
import { fmtMoney0 } from "./utils";

export default function PriceMenu({
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
      aria-label="Price filters"
    >
      <div className="flex gap-2 font-medium">
        <button
          className={`px-3 py-1 rounded-lg ${
            (filters as any).mode === "list" ? "bg-blue-600 text-white" : "border"
          }`}
          onClick={() => setFilters((f) => ({ ...f, mode: "list" } as any))}
        >
          List Price
        </button>
        <button
          className={`px-3 py-1 rounded-lg ${
            (filters as any).mode === "payment" ? "bg-blue-600 text-white" : "border"
          }`}
          onClick={() => setFilters((f) => ({ ...f, mode: "payment" } as any))}
        >
          Monthly Payment
        </button>
      </div>

      {(filters as any).mode === "list" ? (
        <div className="mt-3 grid grid-cols-2 gap-2">
          <select
            className="h-9 rounded-lg border px-2"
            value={String(filters.priceMin ?? "")}
            onChange={(e) =>
              setFilters((f) => ({
                ...f,
                priceMin: e.target.value ? Number(e.target.value) : null,
              }))
            }
          >
            {[
              "",
              "0",
              "50000",
              "100000",
              "150000",
              "200000",
              "300000",
              "400000",
              "500000",
              "750000",
              "1000000",
              "2000000",
            ].map((v) => (
              <option key={v || "min-empty"} value={v}>
                {v ? fmtMoney0(Number(v)) : "No min"}
              </option>
            ))}
          </select>

          <select
            className="h-9 rounded-lg border px-2"
            value={String(filters.priceMax ?? "")}
            onChange={(e) =>
              setFilters((f) => ({
                ...f,
                priceMax: e.target.value ? Number(e.target.value) : null,
              }))
            }
          >
            {[
              "",
              "50000",
              "100000",
              "150000",
              "200000",
              "300000",
              "400000",
              "500000",
              "750000",
              "1000000",
              "2000000",
              "",
            ].map((v, i) => (
              <option key={`max-${i}-${v || "empty"}`} value={v}>
                {v ? fmtMoney0(Number(v)) : "No max"}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <div className="mt-3 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              className="h-9 rounded-lg border px-2"
              placeholder="Monthly min"
              value={filters.monthlyMin ?? ""}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  monthlyMin: e.target.value ? Number(e.target.value) : null,
                }))
              }
            />
            <input
              type="number"
              className="h-9 rounded-lg border px-2"
              placeholder="Monthly max"
              value={filters.monthlyMax ?? ""}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  monthlyMax: e.target.value ? Number(e.target.value) : null,
                }))
              }
            />
          </div>

          <details className="rounded-lg bg-slate-50 p-3 border">
            <summary className="cursor-pointer text-sm font-medium">
              Calculate your BuyAbility
            </summary>
            <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
              <label className="flex items-center gap-2">
                Rate %
                <input
                  type="number"
                  className="h-8 w-full rounded border px-2"
                  value={(filters as any).rate ?? ""}
                  onChange={(e) =>
                    setFilters((f) => ({
                      ...f,
                      rate: Number(e.target.value || 0),
                    }) as any)
                  }
                />
              </label>
              <label className="flex items-center gap-2">
                Term (yrs)
                <input
                  type="number"
                  className="h-8 w-full rounded border px-2"
                  value={(filters as any).termYears ?? ""}
                  onChange={(e) =>
                    setFilters((f) => ({
                      ...f,
                      termYears: Number(e.target.value || 0),
                    }) as any)
                  }
                />
              </label>
              <label className="flex items-center gap-2">
                Down %
                <input
                  type="number"
                  className="h-8 w-full rounded border px-2"
                  value={(filters as any).downPct ?? ""}
                  onChange={(e) =>
                    setFilters((f) => ({
                      ...f,
                      downPct: Number(e.target.value || 0),
                    }) as any)
                  }
                />
              </label>
            </div>
            <div className="mt-2 text-xs text-slate-500">
              We convert your monthly range into an estimated list-price range
              using the inputs above.
            </div>
          </details>
        </div>
      )}

      <div className="mt-3 flex justify-between gap-2">
        <button
          className="px-3 py-1 rounded-lg border"
          onClick={onClear}
          aria-label="Clear price filters"
        >
          Clear
        </button>
        <button
          className="px-3 py-1 rounded-lg bg-emerald-600 text-white"
          onClick={applyAndClose}
          aria-label="Apply price filters"
        >
          Apply
        </button>
      </div>
    </div>
  );
}
