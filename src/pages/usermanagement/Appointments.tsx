import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../../utils/supabaseClient";
import { CalendarIcon, XMarkIcon, CheckCircleIcon } from "@heroicons/react/24/outline";

type Row = {
  id: string;
  listing_ref: string | null;
  desired_at: string | null;
  status: string | null;
  notes: string | null;
  created_at: string;
};

export default function Appointments() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setErr(null);
    setLoading(true);
    const { data, error } = await supabase
      .from("tour_requests")
      .select("id, listing_ref, desired_at, status, notes, created_at")
      .order("desired_at", { ascending: true });
    if (error) setErr(error.message);
    setRows((data as any) || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function cancel(id: string) {
    const prev = rows;
    setRows((s) => s.map((r) => (r.id === id ? { ...r, status: "cancelled" } : r)));
    const { error } = await supabase.from("tour_requests").update({ status: "cancelled" }).eq("id", id);
    if (error) {
      setRows(prev);
      alert(error.message || "Failed to cancel");
    }
  }

  const groups = useMemo(() => {
    const up: Row[] = [];
    const past: Row[] = [];
    const now = Date.now();
    rows.forEach((r) => {
      const t = r.desired_at ? new Date(r.desired_at).getTime() : 0;
      if (r.status === "cancelled") past.push(r);
      else if (t >= now) up.push(r);
      else past.push(r);
    });
    return { upcoming: up, past };
  }, [rows]);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-emerald-100/60 bg-white/70 backdrop-blur-xl p-4 shadow-lg">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Appointments</h2>
          <button className="text-sm rounded-full border px-3 py-1.5 hover:bg-emerald-50" onClick={load}>
            Refresh
          </button>
        </div>
        <p className="text-slate-600 text-sm mt-1">Review and manage your tour requests.</p>
      </div>

      {err && <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-rose-800">{err}</div>}

      <Section title="Upcoming" rows={groups.upcoming} onCancel={cancel} />
      <Section title="Past / Cancelled" rows={groups.past} onCancel={cancel} />
    </div>
  );
}

function Section({
  title,
  rows,
  onCancel,
}: {
  title: string;
  rows: Row[];
  onCancel: (id: string) => void;
}) {
  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">{title}</h3>
      {rows.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white/70 p-5 text-slate-600">No items.</div>
      ) : (
        <div className="grid gap-3">
          {rows.map((r) => (
            <div
              key={r.id}
              className="rounded-2xl border border-white/40 bg-white/70 backdrop-blur-xl p-4 shadow hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400/60 via-emerald-200/50 to-sky-300/40 border border-white/30 shadow-md">
                  <CalendarIcon className="h-5 w-5 text-emerald-800" />
                </span>
                <div className="flex-1">
                  <div className="font-semibold text-slate-900">
                    {r.listing_ref || "Unspecified listing"}
                  </div>
                  <div className="text-xs text-slate-500">
                    {r.desired_at ? new Date(r.desired_at).toLocaleString() : "TBD"} ·{" "}
                    <span className={r.status === "cancelled" ? "text-rose-600" : "text-emerald-700"}>
                      {r.status || "new"}
                    </span>
                  </div>
                  {r.notes && <div className="text-sm text-slate-700 mt-1 line-clamp-2">{r.notes}</div>}
                </div>
                {r.status !== "cancelled" && (
                  <button
                    onClick={() => onCancel(r.id)}
                    className="inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-sm text-rose-600 hover:bg-rose-50"
                    aria-label="Cancel appointment"
                  >
                    <XMarkIcon className="h-4 w-4" />
                    Cancel
                  </button>
                )}
                {r.status === "cancelled" && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                    <CheckCircleIcon className="h-4 w-4" />
                    Closed
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
