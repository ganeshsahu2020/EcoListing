// ui/src/pages/agent/Appointments.tsx
import React, { useEffect, useState } from "react";
import { supabase } from "../../utils/supabaseClient";

type TourRequest = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  listing_ref: string | null;
  desired_at: string | null;
  status: string | null;
  created_at: string;
};

export default function Appointments() {
  const [rows, setRows] = useState<TourRequest[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const nowIso = new Date().toISOString();
    const { data } = await supabase
      .from("tour_requests")
      .select("*")
      .or("status.eq.scheduled,status.eq.confirmed,status.eq.accepted,status.eq.approved")
      .gte("desired_at", nowIso)
      .order("desired_at", { ascending: true });
    setRows((data as TourRequest[]) || []);
    setLoading(false);
  }

  useEffect(() => {
    (async () => {
      await load();
    })();
  }, []);

  useEffect(() => {
    let unsub: (() => void) | undefined;

    (async () => {
      const ch = supabase
        .channel("rt-agent-appts")
        .on("postgres_changes", { event: "*", schema: "public", table: "tour_requests" }, () => load())
        .subscribe();

      unsub = () => supabase.removeChannel(ch);
    })();

    return () => {
      try { unsub?.(); } catch {}
    };
  }, []);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">Appointments</h1>
      {loading ? (
        <div className="mt-6 text-slate-500">Loading…</div>
      ) : rows.length === 0 ? (
        <div className="mt-6 text-slate-500">No upcoming appointments.</div>
      ) : (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white shadow overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="text-left p-3 font-semibold text-slate-600">When</th>
                <th className="text-left p-3 font-semibold text-slate-600">Client</th>
                <th className="text-left p-3 font-semibold text-slate-600">Listing</th>
                <th className="text-left p-3 font-semibold text-slate-600">Status</th>
                <th className="text-left p-3 font-semibold text-slate-600">Contact</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b last:border-0">
                  <td className="p-3">{r.desired_at ? new Date(r.desired_at).toLocaleString() : "—"}</td>
                  <td className="p-3">{r.name || "Unknown"}</td>
                  <td className="p-3">{r.listing_ref || "—"}</td>
                  <td className="p-3 capitalize">{r.status || "—"}</td>
                  <td className="p-3">{r.phone || r.email || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
