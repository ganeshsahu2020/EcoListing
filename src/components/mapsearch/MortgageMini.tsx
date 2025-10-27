import React from "react";

export default function MortgageMini({
  price,
  taxesMonthly = 0,
  hoaMonthly = 0,
  onPreapprove,
}: {
  price: number | null | undefined;
  taxesMonthly?: number;
  hoaMonthly?: number;
  onPreapprove?: () => void;
}) {
  const [rate, setRate] = React.useState(5.9); // %
  const [down, setDown] = React.useState(20); // %
  const principal = React.useMemo(() => (price ? Math.max(0, price * (1 - down / 100)) : 0), [price, down]);
  const pAndI = React.useMemo(() => {
    if (!principal) return 0;
    const i = rate / 100 / 12;
    const n = 30 * 12;
    if (i === 0) return Math.round(principal / n);
    return Math.round((principal * i * Math.pow(1 + i, n)) / (Math.pow(1 + i, n) - 1));
  }, [principal, rate]);
  const total = pAndI + taxesMonthly + hoaMonthly;

  return (
    <div className="rounded-xl border bg-white/80 p-3 text-sm">
      <div className="font-semibold text-slate-900 mb-2">Monthly estimate</div>
      <div className="flex gap-2">
        <label className="flex-1">
          <span className="block text-xs text-slate-500 mb-1">Rate %</span>
          <input className="w-full h-9 rounded-lg border px-3" type="number" step="0.1" value={rate} onChange={(e) => setRate(Number(e.target.value))} />
        </label>
        <label className="flex-1">
          <span className="block text-xs text-slate-500 mb-1">Down %</span>
          <input className="w-full h-9 rounded-lg border px-3" type="number" step="1" value={down} onChange={(e) => setDown(Number(e.target.value))} />
        </label>
      </div>
      <div className="mt-2 grid grid-cols-3 gap-2 text-[13px]">
        <div className="rounded-lg bg-slate-50 px-2 py-1">
          <div className="text-slate-500">P&I</div>
          <div className="font-semibold">${pAndI.toLocaleString()}</div>
        </div>
        <div className="rounded-lg bg-slate-50 px-2 py-1">
          <div className="text-slate-500">Taxes</div>
          <div className="font-semibold">${taxesMonthly.toLocaleString()}</div>
        </div>
        <div className="rounded-lg bg-slate-50 px-2 py-1">
          <div className="text-slate-500">HOA</div>
          <div className="font-semibold">${hoaMonthly.toLocaleString()}</div>
        </div>
      </div>
      <div className="mt-2 text-[15px]">
        <span className="text-slate-500">Total est.</span>{" "}
        <span className="font-bold text-slate-900">${total.toLocaleString()}/mo</span>
      </div>
      <div className="mt-2">
        <button className="h-9 px-3 rounded-lg border text-sm bg-emerald-600 text-white font-semibold shadow" onClick={onPreapprove}>
          Get pre-approved
        </button>
      </div>
    </div>
  );
}
