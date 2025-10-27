import React, { useMemo } from "react";
import { z } from "zod";

export type Freq = "Monthly" | "Bi-Weekly" | "Accelerated Bi-Weekly";

export const MortgageSchema = z.object({
  price: z.number().min(0),
  downPct: z.number().min(0).max(100),
  rate: z.number().min(0).max(25),
  years: z.number().int().min(1).max(40),
  freq: z.enum(["Monthly", "Bi-Weekly", "Accelerated Bi-Weekly"]),
  annualTax: z.number().min(0).nullable().optional(),
  open: z.boolean().optional(),
});
export type MortgageForm = z.infer<typeof MortgageSchema>;

type Props = {
  form: MortgageForm;
  onChange: (next: MortgageForm) => void;
  onMonthlyChange?: (monthlyCost: number) => void;
  className?: string;
};

export default function MortgageCalculator({ form, onChange, onMonthlyChange, className = "" }: Props) {
  const parsed = MortgageSchema.safeParse(form);
  const f = parsed.success ? parsed.data : { ...form, annualTax: form.annualTax ?? null };

  const downAmt = Math.round((f.downPct / 100) * f.price);
  const principal = Math.max(f.price - downAmt, 0);
  const periodsPerYear = f.freq === "Monthly" ? 12 : 26;
  const i = f.rate / 100 / periodsPerYear;
  const n = f.years * periodsPerYear;
  const periodic = i === 0 ? (n ? principal / n : 0) : (principal * i) / (1 - Math.pow(1 + i, -n));
  const monthlyPI = f.freq === "Monthly" ? periodic : (periodic * periodsPerYear) / 12;
  const monthlyTax = (f.annualTax ?? 781.6) / 12;
  const monthlyCost = (monthlyPI || 0) + (monthlyTax || 0);

  React.useEffect(() => { onMonthlyChange?.(monthlyCost); }, [monthlyCost, onMonthlyChange]);

  const $ = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD" });

  const set = (patch: Partial<MortgageForm>) => {
    const next = { ...f, ...patch };
    const valid = MortgageSchema.safeParse(next);
    if (valid.success) onChange(valid.data);
  };

  return (
    <section className={`glass-card rounded-3xl border border-slate-200 p-6 ${className}`}>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">Monthly Cost</h2>
        <button onClick={() => set({ open: !f.open })} className="text-emerald-700 font-semibold underline decoration-dotted">
          {f.open ? "Close Calculator" : "Open Calculator"}
        </button>
      </div>

      <div className="mt-2 grid sm:grid-cols-2 gap-6">
        <div>
          <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500" /><span className="text-slate-600">Monthly Mortgage</span></div>
          <div className="text-2xl font-bold">{$(monthlyPI)}</div>
        </div>
        <div>
          <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-rose-500" /><span className="text-slate-600">Tax Amount (annual)</span></div>
          <div className="text-2xl font-bold">{$((monthlyTax) * 12)}</div>
        </div>
      </div>

      {f.open && (
        <div className="mt-6 grid lg:grid-cols-2 gap-4">
          <div className="space-y-3">
            <label className="block text-sm text-slate-600">Selling price</label>
            <input type="number" value={f.price} onChange={(e) => set({ price: Number(e.target.value || 0) })} className="w-full h-11 rounded-xl border border-slate-300 px-3" />

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-slate-600">Down payment ($)</label>
                <input type="number" value={downAmt} onChange={(e) => {
                  const amt = Number(e.target.value || 0);
                  const pct = f.price > 0 ? (amt / f.price) * 100 : 0;
                  set({ downPct: Math.min(Math.max(pct, 0), 100) });
                }} className="w-full h-11 rounded-xl border border-slate-300 px-3" />
              </div>
              <div>
                <label className="block text-sm text-slate-600">Down payment (%)</label>
                <input type="number" value={f.downPct} onChange={(e) => set({ downPct: Number(e.target.value || 0) })} className="w-full h-11 rounded-xl border border-slate-300 px-3" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-slate-600">Rate (%)</label>
                <input type="number" value={f.rate} onChange={(e) => set({ rate: Number(e.target.value || 0) })} className="w-full h-11 rounded-xl border border-slate-300 px-3" />
              </div>
              <div>
                <label className="block text-sm text-slate-600">Amortization period (years)</label>
                <select value={f.years} onChange={(e) => set({ years: Number(e.target.value) })} className="w-full h-11 rounded-xl border border-slate-300 px-3">
                  {[5, 10, 15, 20, 25, 30].map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm text-slate-600">Payment Frequency</label>
              <select value={f.freq} onChange={(e) => set({ freq: e.target.value as any })} className="w-full h-11 rounded-xl border border-slate-300 px-3">
                {["Monthly", "Bi-Weekly", "Accelerated Bi-Weekly"].map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 p-4 bg-emerald-50/40">
            <div className="flex justify-between"><span>Mortgage amount</span><span>{$((principal))}</span></div>
            <div className="flex justify-between"><span>Principal & interest</span><span>{$((monthlyPI))}</span></div>
            <div className="flex justify-between"><span>Property taxes (est.)</span><span>{$((monthlyTax))}</span></div>
            <div className="border-t pt-2 mt-2 flex justify-between font-bold"><span>Monthly Cost</span><span>{$((monthlyCost))}</span></div>
          </div>
        </div>
      )}
    </section>
  );
}
