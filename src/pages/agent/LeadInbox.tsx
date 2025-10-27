// ui/src/pages/agent/LeadInbox.tsx
import React, { useEffect, useState } from "react";
import { supabase } from "../../utils/supabaseClient";
import { Link } from "react-router-dom";

type ContactMessage = {
  id: string;
  name: string;
  email: string;
  topic: string;
  subject: string | null;
  message: string;
  created_at: string;
};

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

export default function LeadInbox() {
  const [msgs, setMsgs] = useState<ContactMessage[]>([]);
  const [tours, setTours] = useState<TourRequest[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const [m, t] = await Promise.all([
        supabase.from("contact_messages").select("*").order("created_at", { ascending: false }).limit(50),
        supabase.from("tour_requests").select("*").in("status", ["new", "pending"]).order("created_at", { ascending: false }).limit(50),
      ]);
      setMsgs((m.data as ContactMessage[]) || []);
      setTours((t.data as TourRequest[]) || []);
    } finally {
      setLoading(false);
    }
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
        .channel("rt-lead-inbox")
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "contact_messages" }, (p) => {
          setMsgs((cur) => [p.new as ContactMessage, ...cur].slice(0, 50));
        })
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "tour_requests" }, (p) => {
          const r = p.new as TourRequest;
          if (["new", "pending"].includes(r.status || "")) {
            setTours((cur) => [r, ...cur].slice(0, 50));
          }
        })
        .on("postgres_changes", { event: "UPDATE", schema: "public", table: "tour_requests" }, (p) => {
          const r = p.new as TourRequest;
          const was = p.old as TourRequest;
          const wasOpen = ["new", "pending"].includes(was?.status || "");
          const nowOpen = ["new", "pending"].includes(r?.status || "");
          if (wasOpen && !nowOpen) setTours((cur) => cur.filter((x) => x.id !== r.id));
          if (!wasOpen && nowOpen) setTours((cur) => [r, ...cur]);
        })
        .subscribe();

      unsub = () => supabase.removeChannel(ch);
    })();

    return () => {
      try { unsub?.(); } catch {}
    };
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">Lead Inbox</h1>
      {loading ? (
        <div className="mt-6 text-slate-500">Loading…</div>
      ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-slate-200 bg-white shadow">
            <header className="flex items-center justify-between p-4 border-b">
              <h2 className="font-semibold">Open Tour Requests</h2>
              <Link to="/agent/appointments" className="text-sm text-emerald-700">View calendar →</Link>
            </header>
            <ul className="divide-y">
              {tours.length === 0 ? (
                <li className="p-4 text-sm text-slate-500">No open tour requests.</li>
              ) : (
                tours.map((t) => (
                  <li key={t.id} className="p-4">
                    <div className="font-medium">
                      {t.name || "Unknown"}{" "}
                      <span className="text-xs text-slate-500">• {t.email || "—"}</span>
                    </div>
                    <div className="text-sm text-slate-700">
                      {t.listing_ref || "No listing"} — {t.desired_at ? new Date(t.desired_at).toLocaleString() : "unspecified"} —{" "}
                      <span className="capitalize">{t.status}</span>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white shadow">
            <header className="flex items-center justify-between p-4 border-b">
              <h2 className="font-semibold">Latest Contact Messages</h2>
              <Link to="/admin/contact-messages" className="text-sm text-emerald-700">Admin view →</Link>
            </header>
            <ul className="divide-y">
              {msgs.length === 0 ? (
                <li className="p-4 text-sm text-slate-500">No recent messages.</li>
              ) : (
                msgs.map((m) => (
                  <li key={m.id} className="p-4">
                    <div className="font-medium">
                      {m.name} <span className="text-xs text-slate-500">• {m.email}</span>
                    </div>
                    <div className="text-xs text-slate-500">{new Date(m.created_at).toLocaleString()}</div>
                    <div className="text-sm text-slate-700 mt-1">{m.subject || m.topic}</div>
                    <div className="text-sm text-slate-600 line-clamp-2">{m.message}</div>
                  </li>
                ))
              )}
            </ul>
          </section>
        </div>
      )}
    </div>
  );
}
