import React from "react";

const fmtMoney = (n?: number | null) =>
  typeof n === "number"
    ? n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })
    : "—";

type Props = {
  daysOnMarket?: number | null;
  estimatedValue?: number | null;
  lastUpdatedOn?: string | null;
  className?: string;
};

export default function PropertyEstimateCard({
  daysOnMarket,
  estimatedValue,
  lastUpdatedOn,
  className = "",
}: Props) {
  return (
    <section className={`glass-card rounded-3xl border border-slate-200 p-6 ${className}`}>
      <h2 className="text-xl font-bold text-slate-800 mb-4">Property Estimate</h2>
      <div className="grid sm:grid-cols-3 gap-6">
        <div>
          <div className="text-slate-500">Days on Market</div>
          <div className="text-xl font-bold">{typeof daysOnMarket === "number" ? `${daysOnMarket} days` : "—"}</div>
        </div>
        <div>
          <div className="text-slate-500">Estimated Value</div>
          <div className="text-xl font-bold">{fmtMoney(estimatedValue)}</div>
        </div>
        <div>
          <div className="text-slate-500">Last Updated On</div>
          <div className="text-xl font-bold">{lastUpdatedOn ?? "—"}</div>
        </div>
      </div>
    </section>
  );
}
