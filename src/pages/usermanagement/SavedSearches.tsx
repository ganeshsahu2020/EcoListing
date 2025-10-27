import React, { useEffect, useState } from "react";
import { supabase } from "../../utils/supabaseClient";
import { Link } from "react-router-dom";
import { TrashIcon, EnvelopeIcon, PlayCircleIcon } from "@heroicons/react/24/outline";

type Row = {
  id: string;
  name: string | null;
  search_params: any;
  search_url: string | null;
  email_alert: boolean | null;
  created_at: string;
};

export default function SavedSearches() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setErr(null);
    setLoading(true);
    const { data, error } = await supabase
      .from("saved_searches")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) setErr(error.message);
    setRows((data as any) || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function toggleEmailAlert(id: string, next: boolean) {
    const prev = rows;
    setRows((s) => s.map((r) => (r.id === id ? { ...r, email_alert: next } : r)));
    const { error } = await supabase.from("saved_searches").update({ email_alert: next }).eq("id", id);
    if (error) {
      setRows(prev);
      alert(error.message || "Failed to update alert setting");
    }
  }

  async function remove(id: string) {
    const prev = rows;
    setRows((s) => s.filter((r) => r.id !== id));
    const { error } = await supabase.from("saved_searches").delete().eq("id", id);
    if (error) {
      setRows(prev);
      alert(error.message || "Failed to delete");
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-emerald-100/60 bg-white/70 backdrop-blur-xl p-4 shadow-lg">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Saved Searches</h2>
          <button className="text-sm rounded-full border px-3 py-1.5 hover:bg-emerald-50" onClick={load}>
            Refresh
          </button>
        </div>
        <p className="text-slate-600 text-sm mt-1">
          Manage alerts and jump back into your favorite filters.
        </p>
      </div>

      {err && <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-rose-800">{err}</div>}

      {loading ? (
        <div className="grid gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 rounded-2xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white/70 p-6 text-slate-600">
          You haven’t saved any searches yet.
        </div>
      ) : (
        <div className="grid gap-3">
          {rows.map((r) => (
            <div
              key={r.id}
              className="rounded-2xl border border-white/40 bg-white/70 backdrop-blur-xl p-4 shadow hover:shadow-md transition-all"
            >
              <div className="flex flex-wrap items-center gap-3">
                <div className="min-w-[200px]">
                  <div className="font-semibold text-slate-900">{r.name || "Untitled search"}</div>
                  <div className="text-xs text-slate-500">
                    Saved {new Date(r.created_at).toLocaleString()}
                  </div>
                </div>

                <div className="text-sm text-slate-600 flex-1 overflow-hidden">
                  <code className="rounded bg-slate-50 px-2 py-1 text-slate-700">
                    {JSON.stringify(r.search_params ?? {}, null, 0).slice(0, 120)}
                    {JSON.stringify(r.search_params ?? {}, null, 0).length > 120 ? "…" : ""}
                  </code>
                </div>

                <div className="flex items-center gap-2 ml-auto">
                  {r.search_url && (
                    <Link
                      to={r.search_url}
                      className="inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm hover:bg-slate-50"
                    >
                      <PlayCircleIcon className="h-4 w-4" />
                      Run search
                    </Link>
                  )}

                  <button
                    onClick={() => toggleEmailAlert(r.id, !(r.email_alert ?? false))}
                    className={cxToggle(r.email_alert)}
                    aria-pressed={!!r.email_alert}
                    aria-label={(r.email_alert ? "Disable" : "Enable") + " email alerts"}
                  >
                    <EnvelopeIcon className="h-4 w-4" />
                    {r.email_alert ? "Alerts on" : "Alerts off"}
                  </button>

                  <button
                    onClick={() => remove(r.id)}
                    className="inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm text-rose-600 hover:bg-rose-50"
                    aria-label="Delete saved search"
                  >
                    <TrashIcon className="h-4 w-4" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function cxToggle(on?: boolean | null) {
  return [
    "inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm border transition",
    on
      ? "bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700"
      : "border-slate-200 hover:bg-slate-50 text-slate-700",
  ].join(" ");
}
