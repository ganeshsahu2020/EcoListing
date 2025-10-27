import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../utils/supabaseClient";
import { CalendarIcon, ArrowTopRightOnSquareIcon, TrashIcon } from "@heroicons/react/24/outline";

type Row = {
  id: string;
  listing_ref: string;
  title: string | null;
  address: string | null;
  price: number | null;
  thumb_url: string | null;
  created_at: string;
  meta: any;
};

function formatMoney(n?: number | null) {
  if (n == null) return "";
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

export default function SavedHome() {
  const nav = useNavigate();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setErr(null);
    setLoading(true);
    const { data, error } = await supabase
      .from("saved_homes")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) setErr(error.message);
    setRows((data as any) || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function remove(id: string) {
    const prev = rows;
    setRows((s) => s.filter((r) => r.id !== id));
    const { error } = await supabase.from("saved_homes").delete().eq("id", id);
    if (error) {
      setRows(prev);
      alert(error.message || "Failed to remove");
    }
  }

  function gotoProperty(listing_ref: string) {
    // If your listing_ref sometimes looks like "mls:123", adapt here.
    nav(`/property/${encodeURIComponent(listing_ref)}`);
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-emerald-100/60 bg-white/70 backdrop-blur-xl p-4 shadow-lg">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Saved Homes</h2>
          <button
            className="text-sm rounded-full border px-3 py-1.5 hover:bg-emerald-50"
            onClick={load}
            aria-label="Refresh"
          >
            Refresh
          </button>
        </div>
        <p className="text-slate-600 text-sm mt-1">Quickly revisit your favorite properties.</p>
      </div>

      {err && <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-rose-800">{err}</div>}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-48 rounded-2xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white/70 p-6 text-slate-600">
          You haven’t saved any homes yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {rows.map((r) => (
            <article
              key={r.id}
              className="group rounded-2xl overflow-hidden border border-white/40 bg-white/70 backdrop-blur-xl shadow-lg hover:shadow-xl transition-all"
            >
              <div
                className="h-44 bg-slate-100 relative cursor-pointer"
                onClick={() => gotoProperty(r.listing_ref)}
                title="View details"
              >
                {r.thumb_url ? (
                  <img
                    src={r.thumb_url}
                    alt={r.title || r.address || "Saved home"}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="absolute inset-0 grid place-items-center text-slate-400">No image</div>
                )}
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-slate-900 line-clamp-1">
                      {r.title || r.address || r.listing_ref}
                    </h3>
                    <div className="text-sm text-slate-600 line-clamp-2">{r.address}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-emerald-700 font-bold">{formatMoney(r.price)}</div>
                    <div className="text-[11px] text-slate-500">
                      Saved {new Date(r.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2">
                  <button
                    className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-600 via-emerald-500 to-sky-500 text-white px-4 py-2 text-sm font-semibold shadow hover:shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-300"
                    onClick={() => nav(`/tour?ref=${encodeURIComponent(r.listing_ref)}`)}
                  >
                    <CalendarIcon className="h-4 w-4" />
                    Contact Agent
                  </button>
                  <button
                    className="inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm hover:bg-slate-50"
                    onClick={() => gotoProperty(r.listing_ref)}
                  >
                    <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                    View
                  </button>
                  <button
                    aria-label="Remove from saved"
                    className="ml-auto inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm text-rose-600 hover:bg-rose-50"
                    onClick={() => remove(r.id)}
                  >
                    <TrashIcon className="h-4 w-4" />
                    Remove
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
