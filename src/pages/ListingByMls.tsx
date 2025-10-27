// src/pages/ListingByMls.tsx
import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "../utils/supabaseClient";

type Row = {
  mls_id: string | null;
  lat: number | null;
  lon: number | null;
  list_price: number | null;
  beds: number | null;
  baths: number | null;
  address: string | null;
  city: string | null;
  status: string | null;
};

// adjust table/columns as needed
type Photo = { url: string | null; sort: number | null };

export default function ListingByMls() {
  const [sp] = useSearchParams();
  const mls = sp.get("mls_id") ?? "";
  const [row, setRow] = useState<Row | null>(null);
  const [cover, setCover] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const go = async () => {
      if (!mls) {
        setErr("Missing mls_id");
        setLoading(false);
        return;
      }

      // fetch listing row
      const { data, error } = await supabase
        .from("listings")
        .select(
          // alias columns that differ in the base table
          "mls_id, lat, lon, list_price, beds, baths, address, city, status:status_enum"
        )
        .eq("mls_id", mls)
        .maybeSingle();

      if (error) {
        setErr(error.message);
        setRow(null);
        setLoading(false);
        return;
      }

      setRow((data as Row) ?? null);

      // fetch first (cover) photo for this MLS id
      const { data: ph, error: phErr } = await supabase
        .from("repliers_listing_photos") // ← adjust to your photo table name if different
        .select("url, sort")
        .eq("mls_id", mls)
        .order("sort", { ascending: true })
        .limit(1);

      if (!phErr) {
        setCover(ph?.[0]?.url ?? null);
      }

      setLoading(false);
    };

    go();
  }, [mls]);

  if (loading)
    return (
      <section className="container-7xl section-pad">
        <div className="card p-6">Loading listing…</div>
      </section>
    );

  if (err || !row)
    return (
      <section className="container-7xl section-pad">
        <div className="card p-6">
          <div className="font-semibold text-red-600">{err ?? "Listing not found"}</div>
          <div className="mt-3">
            <Link className="btn-outline" to="/map">
              Back to Map
            </Link>
          </div>
        </div>
      </section>
    );

  return (
    <main className="bg-white">
      <section className="container-7xl section-pad pb-4">
        <nav className="hf-small text-text-soft">
          <Link to="/" className="hover:text-text-strong">
            Home
          </Link>{" "}
          <span>›</span>{" "}
          <Link to="/map" className="hover:text-text-strong">
            Map
          </Link>{" "}
          <span>›</span>{" "}
          <span className="text-text-strong">{row.mls_id}</span>
        </nav>
      </section>

      <section className="container-7xl">
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <article className="card p-6">
            <div className="hf-headline font-bold text-text-darkest">
              {row.list_price ? `$${row.list_price.toLocaleString()}` : "—"}
            </div>
            <div className="mt-2 text-text-strong">
              {[row.address, row.city].filter(Boolean).join(", ")}
            </div>
            <div className="mt-1 hf-small text-text-soft">
              {[
                row.beds != null ? `${row.beds} bd` : null,
                row.baths != null ? `${row.baths} ba` : null,
              ]
                .filter(Boolean)
                .join(" • ")}
            </div>

            {/* Cover photo */}
            {cover ? (
              <div className="mt-4 overflow-hidden rounded-lg ring-1 ring-slate-200">
                <img
                  src={cover}
                  alt={row.address ?? row.mls_id ?? "Listing photo"}
                  className="w-full h-auto object-cover"
                  onError={(e) => {
                    // graceful fallback if the URL 404s
                    (e.currentTarget as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>
            ) : (
              <div className="mt-4 h-48 rounded-lg bg-surface-100 ring-1 ring-slate-200" />
            )}

            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="card p-4">
                <div className="hf-small text-text-soft">MLS ID</div>
                <div className="mt-1 font-medium">{row.mls_id}</div>
              </div>
              <div className="card p-4">
                <div className="hf-small text-text-soft">Status</div>
                <div className="mt-1 font-medium">{(row.status ?? "").toUpperCase()}</div>
              </div>
            </div>

            <div className="mt-6">
              <Link to="/map" className="btn-outline">
                Back to Map
              </Link>
            </div>
          </article>

          <aside className="card p-6">
            <div className="font-semibold text-text-darkest mb-2">Location</div>
            <div className="hf-small text-text-soft mb-3">
              {row.lat != null && row.lon != null
                ? `(${row.lat.toFixed(5)}, ${row.lon.toFixed(5)})`
                : "No coordinates"}
            </div>
            <a
              className="btn-primary w-full text-center"
              href={`https://www.google.com/maps?q=${row.lat},${row.lon}`}
              target="_blank"
              rel="noreferrer"
            >
              Open in Google Maps
            </a>
          </aside>
        </div>
      </section>
    </main>
  );
}
