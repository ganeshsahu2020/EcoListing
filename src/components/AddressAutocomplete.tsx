import React, { useEffect, useMemo, useRef, useState } from "react";

type Feature = {
  id: string;
  place_name: string;
  center: [number, number]; // [lon, lat]
};

type Props = {
  value: string;
  onChange: (v: string) => void;
  onPick: (f: Feature) => void;
  placeholder?: string;
};

export default function AddressAutocomplete({ value, onChange, onPick, placeholder }: Props) {
  const key = import.meta.env.VITE_MAPTILER_KEY as string | undefined;
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<Feature[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  const canSearch = key && value.trim().length >= 3;
  const url = useMemo(() => {
    const q = encodeURIComponent(value.trim());
    return `https://api.maptiler.com/geocoding/${q}.json?key=${key}&limit=5`;
  }, [value, key]);

  useEffect(() => {
    if (!canSearch) {
      setItems([]);
      return;
    }
    abortRef.current?.abort();
    const ctl = new AbortController();
    abortRef.current = ctl;

    setLoading(true);
    fetch(url, { signal: ctl.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((j) => {
        const feats: Feature[] = (j?.features || [])
          .filter((f: any) => Array.isArray(f.center) && f.center.length === 2)
          .map((f: any) => ({
            id: f.id,
            place_name: f.place_name || f.place_name_en || f.text,
            center: f.center as [number, number],
          }));
        setItems(feats);
        setOpen(true);
      })
      .catch(() => {
        if (!ctl.signal.aborted) setItems([]);
      })
      .finally(() => setLoading(false));

    return () => ctl.abort();
  }, [url, canSearch]);

  return (
    <div className="relative">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => items.length && setOpen(true)}
        placeholder={placeholder || "Enter property address…"}
        className="h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-[15px] shadow-sm focus:border-[#1E90FF] focus:ring-[#1E90FF] transition"
        aria-autocomplete="list"
        aria-expanded={open}
      />
      {open && (items.length > 0 || loading) && (
        <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
          {loading && <div className="px-3 py-2 text-sm text-slate-500">Searching…</div>}
          {!loading &&
            items.map((it) => (
              <button
                key={it.id}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onPick(it);
                  setOpen(false);
                }}
                className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-50"
              >
                {it.place_name}
              </button>
            ))}
          {!loading && items.length === 0 && (
            <div className="px-3 py-2 text-sm text-slate-500">No matches</div>
          )}
        </div>
      )}
    </div>
  );
}
