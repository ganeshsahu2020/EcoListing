// ui/src/pages/usermanagement/AgentReports.tsx
import React, { useEffect, useState } from "react";
import { supabase } from "../../utils/supabaseClient";

type Row = {
  id: string;
  created_at: string;
  updated_at: string;
  status: "draft" | "submitted" | "shared";
  agent_uid: string;
  customer_uid: string | null;
  address: string | null;
  estimate: number | null;
  range_low: number | null;
  range_high: number | null;
  confidence: number | null;
  notes_md: string | null;
  comps_md: string | null;
  attachments: { name: string; path: string; size?: number }[] | null;
  submitted_at: string | null;
};

export default function AgentReports() {
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let sub: ReturnType<typeof supabase.channel> | null = null;
    (async () => {
      setError(null);
      const { data: sess } = await supabase.auth.getSession();
      const uid = sess?.session?.user?.id;
      if (!uid) {
        setError("Please sign in to view reports.");
        return;
      }
      const { data, error } = await supabase
        .from("agent_reports")
        .select("*")
        .eq("customer_uid", uid)
        .in("status", ["submitted", "shared"])
        .order("submitted_at", { ascending: false })
        .returns<Row[]>();
      if (!error && data) setRows(data);
      if (error) setError(error.message);

      // Realtime updates
      sub = supabase
        .channel("rt-agent-reports")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "agent_reports", filter: `customer_uid=eq.${uid}` },
          async () => {
            const { data } = await supabase
              .from("agent_reports")
              .select("*")
              .eq("customer_uid", uid)
              .in("status", ["submitted", "shared"])
              .order("submitted_at", { ascending: false })
              .returns<Row[]>();
            if (data) setRows(data);
          }
        )
        .subscribe();
    })();
    return () => {
      if (sub) supabase.removeChannel(sub);
    };
  }, []);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-slate-900">Agent Reports</h2>

      {error && <div className="text-rose-600 text-sm">{error}</div>}

      {!rows.length ? (
        <div className="rounded-xl border border-slate-200 bg-white/80 p-6 text-slate-600">
          No reports yet. When your agent submits one, it will appear here automatically.
        </div>
      ) : (
        <div className="grid gap-3">
          {rows.map((r) => (
            <article
              key={r.id}
              className="rounded-xl border border-slate-200 bg-white/80 p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div className="text-sm text-slate-500">
                  Submitted {r.submitted_at ? new Date(r.submitted_at).toLocaleString() : "—"}
                </div>
                <span
                  className="text-xs font-semibold rounded-full px-2 py-0.5 bg-emerald-100 text-emerald-800"
                  title={r.status}
                >
                  {r.status}
                </span>
              </div>

              <h3 className="mt-1 text-lg font-semibold text-slate-900">{r.address || "Address N/A"}</h3>

              <div className="mt-2 text-slate-700">
                <div className="font-medium">
                  Estimate:{" "}
                  {r.estimate != null
                    ? `$${Math.round(r.estimate).toLocaleString()}`
                    : "—"}
                  {r.range_low != null && r.range_high != null && (
                    <span className="ml-2 text-slate-600">
                      (Range ${Math.round(r.range_low).toLocaleString()} – $
                      {Math.round(r.range_high).toLocaleString()})
                    </span>
                  )}
                </div>
                {r.confidence != null && (
                  <div className="text-sm text-slate-600">
                    Confidence: {Math.round((1 - r.confidence) * 100)}%
                  </div>
                )}
              </div>

              {r.notes_md && (
                <div className="mt-3 text-sm whitespace-pre-wrap text-slate-700">{r.notes_md}</div>
              )}
              {r.comps_md && (
                <details className="mt-2">
                  <summary className="text-sm text-emerald-700 cursor-pointer">Comparables</summary>
                  <div className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{r.comps_md}</div>
                </details>
              )}
              {!!(r.attachments?.length) && (
                <div className="mt-3">
                  <div className="text-sm font-medium text-slate-800">Attachments</div>
                  <ul className="mt-1 text-sm text-slate-700">
                    {r.attachments!.map((a) => (
                      <li key={a.path}>
                        {/* If you allow public access, create a signed URL and use it here */}
                        {a.name}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
