import React from "react";

type ListingLite = {
  list_price?: number | null;
  sqft?: number | null;
  list_date?: string | null;
};

export default function InsightsBar({
  listings,
  loading,
}: {
  listings: ListingLite[];
  loading: boolean;
}) {
  const { medPrice, avgPpsf, medDom, priceTrend, newTrend } = React.useMemo(() => {
    if (!listings?.length)
      return { medPrice: null, avgPpsf: null, medDom: null, priceTrend: [] as number[], newTrend: [] as number[] };

    const nums = (arr: (number | null | undefined)[]) =>
      arr.filter((x): x is number => typeof x === "number" && Number.isFinite(x)).sort((a, b) => a - b);
    const median = (arr: number[]) =>
      arr.length
        ? arr.length % 2
          ? arr[(arr.length - 1) / 2]
          : Math.round((arr[arr.length / 2 - 1] + arr[arr.length / 2]) / 2)
        : null;

    const prices = nums(listings.map((l) => l.list_price ?? null));
    const sqft = listings.map((l) => (Number.isFinite(l.sqft ?? NaN) && (l.sqft ?? 0) > 0 ? (l.sqft as number) : null));
    const ppsf = listings
      .map((l, i) =>
        Number.isFinite(l.list_price) && Number.isFinite(sqft[i] ?? NaN)
          ? Math.round((l.list_price as number) / (sqft[i] as number))
          : null
      )
      .filter((n): n is number => typeof n === "number");

    const days = listings
      .map((l) => (l.list_date ? Math.max(0, Math.floor((Date.now() - new Date(l.list_date).getTime()) / 86400000)) : null))
      .filter((n): n is number => typeof n === "number");

    const bucket = (d: Date) => `${d.getFullYear()}-${d.getMonth() + 1}-${Math.floor(d.getDate() / 4)}`;
    const byBucket: Record<string, number[]> = {};
    const byNew: Record<string, number> = {};
    for (const l of listings) {
      const t = l.list_date ? new Date(l.list_date) : null;
      const key = t ? bucket(t) : "na";
      (byBucket[key] ||= []).push(l.list_price ?? 0);
      if (t) byNew[key] = (byNew[key] || 0) + 1;
    }
    const keys = Object.keys(byBucket).filter((k) => k !== "na").sort();
    const priceTrend = keys
      .slice(-8)
      .map((k) => {
        const arr = byBucket[k].filter((n) => Number.isFinite(n)).sort((a, b) => a - b);
        return arr.length ? arr[Math.floor(arr.length / 2)] : null;
      })
      .filter((n): n is number => typeof n === "number");
    const newTrend = keys.slice(-8).map((k) => byNew[k] || 0);

    return {
      medPrice: median(prices),
      avgPpsf: ppsf.length ? Math.round(ppsf.reduce((a, b) => a + b, 0) / ppsf.length) : null,
      medDom: median(days),
      priceTrend,
      newTrend,
    };
  }, [listings]);

  const Spark = ({ data }: { data: number[] }) => {
    if (!data?.length) return null;
    const w = 80,
      h = 24,
      max = Math.max(...data),
      min = Math.min(...data);
    const norm = (v: number) => (max === min ? h / 2 : h - ((v - min) / (max - min)) * h);
    const step = (w - 4) / (data.length - 1);
    const d = data.map((v, i) => `${i === 0 ? "M" : "L"} ${2 + i * step} ${norm(v)}`).join(" ");
    return (
      <svg width={w} height={h} className="opacity-80">
        <path d={d} fill="none" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    );
  };

  const items = [
    { label: "Median Price", value: medPrice ? `$${medPrice.toLocaleString()}` : "—", trend: priceTrend },
    { label: "Avg $/sqft", value: avgPpsf ? `$${avgPpsf.toLocaleString()}` : "—" },
    { label: "Median DOM", value: medDom ?? "—" },
    { label: "New (trend)", value: loading ? "… " : "Last 8 weeks", trend: newTrend },
  ];

  return (
    <div className="mb-2 grid grid-cols-2 md:grid-cols-4 gap-2">
      {items.map((x, i) => (
        <div key={i} className="rounded-xl border bg-white/70 p-3 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500">{x.label}</div>
            <div className="text-sm font-semibold text-slate-900">{x.value}</div>
          </div>
          {"trend" in x && (x as any).trend ? (
            <div className="text-slate-500">
              <Spark data={(x as any).trend} />
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}
