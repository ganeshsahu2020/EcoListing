import React, { useMemo, useState } from "react";
import { MortgageForm } from "./MortgageCalculator";

const fmtMoney = (n?: number | null) =>
  typeof n === "number"
    ? n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })
    : "—";

function calcMonthlyPayment(price: number, downPct: number, ratePct: number, years: number) {
  const principal = Math.max(0, price - (price * (downPct || 0)) / 100);
  const r = (ratePct || 0) / 100 / 12;
  const n = (years || 0) * 12;
  if (!r || !n) return principal / Math.max(1, n || 1);
  return (r * principal * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

export default function EnergyMonthlyCostEstimator({
  mortgage,
  annualTax,
}: {
  mortgage: MortgageForm;
  annualTax?: number | null;
}) {
  const [utilities, setUtilities] = useState({
    electricity: 90,
    gas: 70,
    water: 40,
    internet: 55,
  });

  const pmt = useMemo(
    () => calcMonthlyPayment(mortgage.price || 0, mortgage.downPct || 0, mortgage.rate || 0, mortgage.years || 25),
    [mortgage.price, mortgage.downPct, mortgage.rate, mortgage.years]
  );
  const taxMonthly = (annualTax || 0) / 12;
  const utilMonthly = Object.values(utilities).reduce((a, b) => a + (b || 0), 0);
  const total = pmt + taxMonthly + utilMonthly;

  return (
    <section className="glass-card rounded-3xl border border-slate-200 p-6" aria-labelledby="energy-title">
      <h2 id="energy-title" className="text-xl font-bold text-slate-800 mb-4">
        Energy & Monthly Cost Estimator
      </h2>
      <div className="grid sm:grid-cols-2 gap-6">
        <div className="space-y-3">
          {(["electricity", "gas", "water", "internet"] as const).map((k) => (
            <label key={k} className="flex items-center justify-between gap-3">
              <span className="text-slate-600 capitalize">{k}</span>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                value={utilities[k]}
                aria-label={`${k} monthly cost`}
                className="w-28 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-right shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                onChange={(e) => setUtilities((u) => ({ ...u, [k]: Number(e.target.value || 0) }))}
              />
            </label>
          ))}
        </div>
        <div className="space-y-2">
          <Row label="Mortgage (est.)" value={fmtMoney(Math.round(pmt))} />
          <Row label="Property Tax (monthly)" value={fmtMoney(Math.round(taxMonthly))} />
          <Row label="Utilities" value={fmtMoney(Math.round(utilMonthly))} />
          <div className="mt-2 h-px bg-slate-200" />
          <div className="flex items-center justify-between text-lg">
            <div className="text-slate-700 font-semibold">Estimated Total / mo</div>
            <div className="font-extrabold text-slate-900">{fmtMoney(Math.round(total))}</div>
          </div>
          <p className="text-xs text-slate-500 mt-2">Estimates only. Actual costs vary by usage, provider, and season.</p>
        </div>
      </div>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="text-slate-600">{label}</div>
      <div className="font-semibold">{value}</div>
    </div>
  );
}
