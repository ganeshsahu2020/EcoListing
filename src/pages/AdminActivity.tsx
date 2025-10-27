import React, { useEffect, useState } from "react";
import { supabase } from "../utils/supabaseClient";

type Summary = {
  total_events: number; pageviews: number; listing_views: number; favorites: number; contacts: number; unique_visitors: number;
};

export default function AdminActivity() {
  const [from, setFrom] = useState(() => new Date(Date.now() - 7*24*3600*1000).toISOString());
  const [to, setTo] = useState(() => new Date().toISOString());
  const [summary, setSummary] = useState<Summary | null>(null);
  const [series, setSeries] = useState<{ d: string; pageviews: number; listing_views: number; contacts: number }[]>([]);

  async function load() {
    const { data: sum } = await supabase.rpc("activity_summary", { p_from: from, p_to: to });
    setSummary(sum?.[0] ?? null);
    const { data: ts } = await supabase.rpc("activity_timeseries", { p_from: from, p_to: to });
    setSeries(ts ?? []);
  }

  useEffect(() => { load();   }, []);

  return (
    <main className="container-7xl section-pad">
      <h1 className="hf-subheadline font-semibold">Activity Dashboard</h1>

      <div className="mt-4 flex flex-wrap items-end gap-2">
        <label className="grid text-sm">
          <span className="text-slate-600">From</span>
          <input type="datetime-local" value={from.slice(0,16)} onChange={e=>setFrom(new Date(e.target.value).toISOString())}
            className="h-10 rounded-lg border px-3"/>
        </label>
        <label className="grid text-sm">
          <span className="text-slate-600">To</span>
          <input type="datetime-local" value={to.slice(0,16)} onChange={e=>setTo(new Date(e.target.value).toISOString())}
            className="h-10 rounded-lg border px-3"/>
        </label>
        <button className="btn-outline h-10 px-4" onClick={load}>Refresh</button>
      </div>

      {summary && (
        <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            ["Total events", summary.total_events],
            ["Pageviews", summary.pageviews],
            ["Listing views", summary.listing_views],
            ["Favorites", summary.favorites],
            ["Contacts", summary.contacts],
            ["Unique visitors", summary.unique_visitors],
          ].map(([k,v])=>(
            <div key={k as string} className="card p-4">
              <div className="text-slate-500 hf-small">{k}</div>
              <div className="text-2xl font-semibold">{v as number}</div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500">
              <th className="py-2">Date</th>
              <th className="py-2">Pageviews</th>
              <th className="py-2">Listing views</th>
              <th className="py-2">Contacts</th>
            </tr>
          </thead>
          <tbody>
            {series.map(r=>(
              <tr key={r.d} className="border-t">
                <td className="py-2">{new Date(r.d).toLocaleDateString()}</td>
                <td className="py-2">{r.pageviews}</td>
                <td className="py-2">{r.listing_views}</td>
                <td className="py-2">{r.contacts}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
