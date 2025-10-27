import React from "react";

export type SaveSearchPayload = {
  name: string;
  frequency: "instant" | "daily" | "weekly";
  priceDropOnly: boolean;
};

export default function SaveSearchDialog({
  open,
  defaultName = "EcoListing Search",
  onSubmit,
  onClose,
}: {
  open: boolean;
  defaultName?: string;
  onSubmit: (p: SaveSearchPayload) => void;
  onClose: () => void;
}) {
  const [name, setName] = React.useState(defaultName);
  const [frequency, setFrequency] = React.useState<SaveSearchPayload["frequency"]>("daily");
  const [priceDropOnly, setPriceDropOnly] = React.useState(false);
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120]">
      <div className="absolute inset-0 bg-slate-900/40" onClick={onClose} />
      <div className="absolute left-1/2 top-1/2 w-[92vw] max-w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-2xl border bg-white p-4 shadow-2xl">
        <div className="flex items-center justify-between mb-2">
          <div className="text-lg font-semibold">Save this search</div>
          <button className="w-8 h-8 rounded-full hover:bg-slate-100" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="space-y-3 text-sm">
          <label className="block">
            <span className="text-xs text-slate-500">Name</span>
            <input className="mt-1 w-full h-9 rounded-lg border px-3" value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label className="block">
            <span className="text-xs text-slate-500">Email frequency</span>
            <select className="mt-1 w-full h-9 rounded-lg border px-3" value={frequency} onChange={(e) => setFrequency(e.target.value as any)}>
              <option value="instant">Instant</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </select>
          </label>
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" checked={priceDropOnly} onChange={(e) => setPriceDropOnly(e.target.checked)} />
            <span>Only notify me about price drops</span>
          </label>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button className="h-9 px-3 rounded-lg border" onClick={onClose}>
            Cancel
          </button>
          <button
            className="h-9 px-3 rounded-lg bg-indigo-600 text-white font-semibold shadow"
            onClick={() => onSubmit({ name, frequency, priceDropOnly })}
          >
            Save & create alert
          </button>
        </div>
      </div>
    </div>
  );
}
