import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../../utils/supabaseClient";
import { AdjustmentsHorizontalIcon, ArrowPathIcon, ClipboardDocumentListIcon } from "@heroicons/react/24/outline";

/* Small util */
function cx(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(" ");
}

type AgentReport = {
  id: string;
  created_at: string;
  status: string;
  customer_uid: string | null;
  address: string | null;
  estimate: number | null;
  range_low: number | null;
  range_high: number | null;
  confidence: number | null; // 0..1 (lower = better error)
  notes?: string | null;
  // assigned_to?: string | null; // if your schema has it
};

export default function AgentReportQueue() {
  const nav = useNavigate();
  const [rows, setRows] = useState<AgentReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  async function fetchRows() {
    setRefreshing(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from("agent_reports")
        .select(
          "id, created_at, status, customer_uid, address, estimate, range_low, range_high, confidence, notes"
        )
        .eq("status", "requested")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRows((data as AgentReport[]) || []);
    } catch (e: any) {
      setError(e?.message || "Failed to load requests.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    fetchRows();
  }, []);

  /* Realtime: reflect inserts/updates */
  useEffect(() => {
    const ch = supabase
      .channel("rt-agent-reports-queue")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "agent_reports" },
        (payload) => {
          const r = payload.new as AgentReport;
          if (r.status === "requested") {
            setRows((prev) => {
              const exists = prev.some((x) => x.id === r.id);
              if (exists) return prev;
              return [r, ...prev].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
            });
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "agent_reports" },
        (payload) => {
          const r = payload.new as AgentReport;
          setRows((prev) => {
            // If status moved away from "requested", drop it from this view
            if (r.status !== "requested") return prev.filter((x) => x.id !== r.id);
            // Otherwise replace in place
            const idx = prev.findIndex((x) => x.id === r.id);
            if (idx === -1) return prev;
            const next = prev.slice();
            next[idx] = r;
            return next;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ch);
    };
  }, []);

  /* Search filter (address/notes/id) */
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter((r) => {
      const hay = [
        r.address || "",
        r.notes || "",
        r.id,
        r.customer_uid || "",
        r.estimate?.toString() || "",
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(term);
    });
  }, [rows, q]);

  async function claimAndOpen(id: string) {
    try {
      // Try to set assigned_to if you have it, and always bump status to 'draft'
      const updates: Record<string, any> = { status: "draft" };
      const { data: sess } = await supabase.auth.getSession();
      const uid = sess?.session?.user?.id || null;
      if (uid) updates.assigned_to = uid; // harmless if column doesn't exist; we try/catch below

      const { error } = await supabase.from("agent_reports").update(updates).eq("id", id);
      if (error) {
        // Retry with just status in case assigned_to doesn't exist
        await supabase.from("agent_reports").update({ status: "draft" }).eq("id", id);
      }

      nav(`/agent/reports/${encodeURIComponent(id)}`);
    } catch (e: any) {
      alert(e?.message || "Failed to claim.");
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between mb-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">Agent Report Requests</h1>
          <p className="text-slate-600">
            New submissions awaiting an agent. Click <em>Claim &amp; Open</em> to start a draft.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/agent/reports/new"
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-white font-semibold shadow hover:bg-emerald-700 transition"
          >
            <AdjustmentsHorizontalIcon className="h-5 w-5" />
            New Report
          </Link>
          <button
            onClick={fetchRows}
            className={cx(
              "inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm",
              "bg-white hover:bg-slate-50 transition"
            )}
            title="Refresh"
          >
            <ArrowPathIcon className={cx("h-4 w-4", refreshing && "animate-spin")} />
            Refresh
          </button>
        </div>
      </header>

      {/* Controls */}
      <div className="mb-4 flex items-center gap-3">
        <div className="relative flex-1">
          <input
            placeholder="Search by address, notes, id…"
            className="w-full h-11 rounded-lg border border-slate-300 bg-white px-3 focus:border-emerald-500 focus:ring-emerald-500 transition"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className="text-sm text-slate-500">
          {filtered.length} request{filtered.length === 1 ? "" : "s"}
        </div>
      </div>

      {/* Table / list */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading…</div>
        ) : error ? (
          <div className="p-8 text-center text-rose-600">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-slate-500">No requested reports yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="text-left p-3 font-semibold text-slate-600">Created</th>
                  <th className="text-left p-3 font-semibold text-slate-600">Address</th>
                  <th className="text-left p-3 font-semibold text-slate-600">Estimate</th>
                  <th className="text-left p-3 font-semibold text-slate-600">Range</th>
                  <th className="text-left p-3 font-semibold text-slate-600">Conf.</th>
                  <th className="text-left p-3 font-semibold text-slate-600">Customer</th>
                  <th className="text-right p-3 font-semibold text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className="border-b last:border-0 hover:bg-emerald-50/30">
                    <td className="p-3 text-slate-700">
                      {new Date(r.created_at).toLocaleString()}
                    </td>
                    <td className="p-3">
                      <div className="font-medium text-slate-900">{r.address || <em className="text-slate-500">—</em>}</div>
                      {r.notes && (
                        <div className="text-xs text-slate-500 line-clamp-1">{r.notes}</div>
                      )}
                    </td>
                    <td className="p-3 text-slate-800">
                      {typeof r.estimate === "number" ? `$${Math.round(r.estimate).toLocaleString()}` : "—"}
                    </td>
                    <td className="p-3 text-slate-800">
                      {typeof r.range_low === "number" && typeof r.range_high === "number"
                        ? `$${Math.round(r.range_low).toLocaleString()} – $${Math.round(r.range_high).toLocaleString()}`
                        : "—"}
                    </td>
                    <td className="p-3 text-slate-800">
                      {typeof r.confidence === "number"
                        ? `${Math.max(0, Math.round(100 - r.confidence * 100))}%`
                        : "—"}
                    </td>
                    <td className="p-3 text-slate-800">
                      {r.customer_uid ? "Signed-in user" : "Guest"}
                    </td>
                    <td className="p-3 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => claimAndOpen(r.id)}
                          className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-white font-semibold hover:bg-emerald-700 transition"
                          title="Claim & Open (moves to Draft)"
                        >
                          <ClipboardDocumentListIcon className="h-4 w-4" />
                          Claim &amp; Open
                        </button>
                        <Link
                          to={`/agent/reports/${encodeURIComponent(r.id)}`}
                          className="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 hover:bg-slate-50 transition"
                          title="Open"
                        >
                          Open
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-6 text-sm text-slate-500">
        Tip: If your table has an <code className="px-1 rounded bg-slate-100">assigned_to</code> column, the “Claim &amp; Open”
        action will set it to the current agent (best used with RLS to show only your assigned drafts).
      </div>
    </div>
  );
}
