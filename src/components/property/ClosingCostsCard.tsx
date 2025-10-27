import React, { useMemo } from "react";
import { z } from "zod";

export const ClosingSchema = z.object({
  open: z.boolean().optional(),
  downAmt: z.number().min(0),
  legal: z.number().min(0),
  titleIns: z.number().min(0),
  provLtt: z.number().min(0),
  muniLtt: z.number().min(0),
  rebate: z.number().min(0),
  other: z.number().min(0),
});
export type ClosingForm = z.infer<typeof ClosingSchema>;

type Props = {
  form: ClosingForm;
  onChange: (next: ClosingForm) => void;
  onTotalChange?: (total: number) => void;
  className?: string;
};

export default function ClosingCostsCard({ form, onChange, onTotalChange, className = "" }: Props) {
  const parsed = ClosingSchema.safeParse(form);
  const f = parsed.success ? parsed.data : { ...form };

  const total = useMemo(() => Math.max(f.downAmt + f.legal + f.titleIns + f.provLtt + f.muniLtt - f.rebate + f.other, 0), [f]);
  React.useEffect(() => { onTotalChange?.(total); }, [total, onTotalChange]);

  const $ = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD" });

  const set = (patch: Partial<ClosingForm>) => {
    const next = { ...f, ...patch };
    const valid = ClosingSchema.safeParse(next);
    if (valid.success) onChange(valid.data);
  };

  return (
    <section className={`glass-card rounded-3xl border border-slate-200 p-6 ${className}`}>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">Estimated Budget</h2>
        <button onClick={() => set({ open: !f.open })} className="text-emerald-700 font-semibold underline decoration-dotted">
          {f.open ? "Hide Closing Cost" : "Closing Cost"}
        </button>
      </div>

      {f.open && (
        <div className="mt-6 rounded-2xl border border-slate-200 p-4">
          <h3 className="font-semibold text-slate-800 mb-3">Total Closing Costs</h3>
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-slate-600">Down Payment ($)</label>
              <input type="number" className="w-full h-11 rounded-xl border border-slate-300 px-3" value={f.downAmt} onChange={(e) => set({ downAmt: Number(e.target.value || 0) })} />
            </div>
            <div>
              <label className="block text-sm text-slate-600">Legal Fees & Title Insurance</label>
              <div className="grid grid-cols-2 gap-3">
                <input type="number" className="h-11 rounded-xl border border-slate-300 px-3" value={f.legal} onChange={(e) => set({ legal: Number(e.target.value || 0) })} placeholder="Legal fees" />
                <input type="number" className="h-11 rounded-xl border border-slate-300 px-3" value={f.titleIns} onChange={(e) => set({ titleIns: Number(e.target.value || 0) })} placeholder="Title insurance" />
              </div>
            </div>
            <div>
              <label className="block text-sm text-slate-600">Land Transfer Tax</label>
              <div className="grid grid-cols-3 gap-3">
                <input type="number" className="h-11 rounded-xl border border-slate-300 px-3" value={f.provLtt} onChange={(e) => set({ provLtt: Number(e.target.value || 0) })} placeholder="Provincial" />
                <input type="number" className="h-11 rounded-xl border border-slate-300 px-3" value={f.muniLtt} onChange={(e) => set({ muniLtt: Number(e.target.value || 0) })} placeholder="Municipal" />
                <input type="number" className="h-11 rounded-xl border border-slate-300 px-3" value={f.rebate} onChange={(e) => set({ rebate: Number(e.target.value || 0) })} placeholder="Rebate" />
              </div>
            </div>
            <div>
              <label className="block text-sm text-slate-600">Other Cash Considerations</label>
              <input type="number" className="w-full h-11 rounded-xl border border-slate-300 px-3" value={f.other} onChange={(e) => set({ other: Number(e.target.value || 0) })} placeholder="Inspection, appraisal, etc." />
            </div>
          </div>
          <div className="border-t mt-3 pt-3 flex justify-between text-lg font-bold">
            <span>Total Closing Cost</span>
            <span>{$((total))}</span>
          </div>
        </div>
      )}
    </section>
  );
}
