import React from "react";

const fmtMoney = (n?: number | null) =>
  typeof n === "number"
    ? n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })
    : "—";

type Sale = { date?: string | null; status?: string | null; price?: number | null };
type Tax = { year?: string | null; amount?: number | null };

type Props = {
  sales?: Sale[];
  taxes?: Tax[];
  className?: string;
};

export default function PropertyHistoryCard({ sales = [], taxes = [], className = "" }: Props) {
  const [tab, setTab] = React.useState<"sales" | "tax">("sales");
  const hasSales = sales && sales.length > 0;
  const hasTax = taxes && taxes.length > 0;
  if (!hasSales && !hasTax) return null;

  return (
    <section className={`glass-card rounded-3xl border border-slate-200 p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-slate-800">Property History</h2>
        <div className="inline-flex rounded-xl overflow-hidden border border-slate-200">
          <button
            className={`px-3 py-1 text-sm ${tab === "sales" ? "bg-slate-900 text-white" : "bg-white text-slate-700"}`}
            onClick={() => setTab("sales")}
            disabled={!hasSales}
            title={!hasSales ? "No sales history" : "Sales history"}
          >
            Sales history
          </button>
          <button
            className={`px-3 py-1 text-sm ${tab === "tax" ? "bg-slate-900 text-white" : "bg-white text-slate-700"}`}
            onClick={() => setTab("tax")}
            disabled={!hasTax}
            title={!hasTax ? "No tax history" : "Tax history"}
          >
            Tax history
          </button>
        </div>
      </div>

      {tab === "sales" && hasSales && (
        <div className="overflow-x-auto">
          <table className="min-w-[420px] w-full text-left">
            <thead>
              <tr className="text-slate-600 text-sm">
                <th className="py-2 pr-4">Date</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Price</th>
              </tr>
            </thead>
            <tbody>
              {sales.map((ev, i) => (
                <tr key={i} className="border-t border-slate-200">
                  <td className="py-2 pr-4">{ev.date || "—"}</td>
                  <td className="py-2 pr-4">{ev.status || "—"}</td>
                  <td className="py-2 pr-4">{fmtMoney(ev.price ?? null)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "tax" && hasTax && (
        <div className="overflow-x-auto">
          <table className="min-w-[320px] w-full text-left">
            <thead>
              <tr className="text-slate-600 text-sm">
                <th className="py-2 pr-4">Year</th>
                <th className="py-2 pr-4">Amount</th>
              </tr>
            </thead>
            <tbody>
              {taxes.map((t, i) => (
                <tr key={i} className="border-t border-slate-200">
                  <td className="py-2 pr-4">{t.year || "—"}</td>
                  <td className="py-2 pr-4">{fmtMoney(t.amount ?? null)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
