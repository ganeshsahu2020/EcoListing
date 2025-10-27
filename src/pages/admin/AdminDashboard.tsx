import React, { useEffect, useMemo, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { supabase } from "../../utils/supabaseClient";
import {
  UsersIcon,
  UserGroupIcon,
  ChartBarIcon,
  EnvelopeOpenIcon,
  ArrowRightIcon,
  InboxStackIcon,
  Cog6ToothIcon,
} from "@heroicons/react/24/outline";

function cx(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(" ");
}

function Pill({
  to,
  icon: Icon,
  label,
  count,
}: {
  to: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  label: string;
  count?: number | null;
}) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cx(
          "group flex items-center justify-between rounded-2xl px-4 py-3 transition-all",
          "backdrop-blur-xl border shadow-lg focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200",
          isActive ? "bg-white/80 border-emerald-300/60" : "bg-white/60 hover:bg-white/80 border-white/40"
        )
      }
      aria-label={label}
    >
      <span className="flex items-center gap-3">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400/60 via-emerald-200/50 to-sky-300/40 border border-white/30 shadow-md transition-transform group-hover:scale-110">
          <Icon className="h-5 w-5 text-emerald-800" />
        </span>
        <span className="font-semibold text-slate-800">{label}</span>
      </span>
      <span className="ml-3 inline-flex items-center gap-2">
        {typeof count === "number" && (
          <span className="rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold px-2 py-0.5">
            {count}
          </span>
        )}
        <ArrowRightIcon className="h-4 w-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
      </span>
    </NavLink>
  );
}

/* types for live cards */
type ContactMessage = {
  id: string;
  name: string;
  email: string;
  topic: string;
  subject: string | null;
  message: string;
  created_at: string;
  handled?: boolean | null;
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

type CountState = {
  users: number | null;
  agents: number | null;
  newMsgs: number | null;
  recentEvents: number | null;
  inbox?: number | null;
};

export default function AdminDashboard() {
  const loc = useLocation();
  const [counts, setCounts] = useState<CountState>({
    users: null,
    agents: null,
    newMsgs: null,
    recentEvents: null,
    inbox: null,
  });

  const [latestMsgs, setLatestMsgs] = useState<ContactMessage[]>([]);
  const [latestTours, setLatestTours] = useState<TourRequest[]>([]);

  /* initial load */
  useEffect(() => {
    (async () => {
      try {
        const weekAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();

        const [usersQ, agentsQ, msgsQ, eventsQ, inboxQ, msgsList, toursList] = await Promise.all([
          supabase.from("user_roles").select("auth_uid", { count: "exact", head: true }),
          supabase.from("agents").select("*", { count: "exact", head: true }),
          supabase.from("contact_messages").select("*", { count: "exact", head: true }).eq("handled", false),
          supabase.from("property_activity").select("*", { count: "exact", head: true }).gte("created_at", weekAgo),
          supabase.from("tour_requests").select("*", { count: "exact", head: true }).in("status", ["new", "pending"]),
          supabase.from("contact_messages").select("*").eq("handled", false).order("created_at", { ascending: false }).limit(5),
          supabase.from("tour_requests").select("*").in("status", ["new", "pending"]).order("created_at", { ascending: false }).limit(5),
        ]);

        setCounts({
          users: usersQ.count ?? 0,
          agents: agentsQ.count ?? 0,
          newMsgs: msgsQ.count ?? 0,
          recentEvents: eventsQ.count ?? 0,
          inbox: inboxQ?.count ?? 0,
        });

        setLatestMsgs((msgsList.data as ContactMessage[]) || []);
        setLatestTours((toursList.data as TourRequest[]) || []);
      } catch {}
    })();
  }, []);

  /* realtime: contact_messages & tour_requests */
  useEffect(() => {
    const ch = supabase
      .channel("admin-live")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "contact_messages" }, (p) => {
        setCounts((c) => ({ ...c, newMsgs: (c.newMsgs ?? 0) + 1 }));
        setLatestMsgs((list) => [p.new as ContactMessage, ...list].slice(0, 5));
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "contact_messages" }, (p) => {
        // if marked handled, drop count
        if ((p.new as any)?.handled && !(p.old as any)?.handled) {
          setCounts((c) => ({ ...c, newMsgs: Math.max(0, (c.newMsgs ?? 0) - 1) }));
        }
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "tour_requests" }, (p) => {
        const status = (p.new as any)?.status || "new";
        if (["new", "pending"].includes(status)) {
          setCounts((c) => ({ ...c, inbox: (c.inbox ?? 0) + 1 }));
          setLatestTours((list) => [p.new as TourRequest, ...list].slice(0, 5));
        }
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "tour_requests" }, (p) => {
        const was = (p.old as any)?.status;
        const now = (p.new as any)?.status;
        const wasOpen = ["new", "pending"].includes(was);
        const nowOpen = ["new", "pending"].includes(now);
        if (wasOpen && !nowOpen) setCounts((c) => ({ ...c, inbox: Math.max(0, (c.inbox ?? 0) - 1) }));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(ch);
    };
  }, [loc.key]);

  const headline = useMemo(() => "Admin Dashboard", []);

  return (
    <div className="min-h-[70vh] bg-gradient-to-tl from-blue-50 via-emerald-50 to-white relative overflow-x-hidden">
      {/* decor */}
      <div className="pointer-events-none absolute -top-32 -right-32 h-80 w-80 rounded-full bg-gradient-to-br from-indigo-300/40 to-cyan-300/40 blur-3xl animate-float-slow z-0" />
      <div className="pointer-events-none absolute top-1/3 -left-20 h-56 w-56 rounded-full bg-gradient-to-br from-emerald-300/40 to-teal-300/40 blur-3xl animate-float-slower z-0" />

      {/* header */}
      <div className="border-b bg-gradient-to-b from-blue-50/50 to-white/80 shadow-sm backdrop-blur relative z-10">
        <div className="container-7xl px-4 py-8 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">{headline}</h1>
            <p className="mt-2 text-slate-600">Manage users & roles, agents, messages, and review site activity.</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              to="/admin/users"
              className={cx(
                "inline-flex items-center gap-2 rounded-full px-5 py-2.5 font-semibold text-white focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200",
                "bg-gradient-to-r from-indigo-600 via-blue-500 to-emerald-500 shadow-lg hover:shadow-xl transition-all"
              )}
            >
              <Cog6ToothIcon className="h-5 w-5 text-white" />
              User Management
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
            <Link
              to="/agents"
              className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 shadow-sm transition-all"
            >
              <UserGroupIcon className="h-5 w-5" />
              Agents
            </Link>
          </div>
        </div>
      </div>

      {/* body */}
      <div className="container-7xl px-4 py-8 grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-8 relative z-10">
        {/* Sidebar */}
        <aside className="lg:sticky lg:top-24 h-max space-y-3">
          <Pill to="/admin/users" icon={UsersIcon} label="User Management" count={counts.users ?? undefined} />
          <Pill to="/agents" icon={UserGroupIcon} label="Agents" count={counts.agents ?? undefined} />
          <Pill to="/admin/contact-messages" icon={EnvelopeOpenIcon} label="Contact Messages" count={counts.newMsgs ?? undefined} />
          <Pill to="/admin/activity" icon={ChartBarIcon} label="Activity (7d)" count={counts.recentEvents ?? undefined} />
          <Pill to="/inbox" icon={InboxStackIcon} label="Lead Inbox" count={counts.inbox ?? undefined} />
        </aside>

        {/* Main */}
        <section className="min-h-[50vh] space-y-6">
          {/* Summary cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              ["Total Users", counts.users, "/admin/users", "Manage"],
              ["Agents", counts.agents, "/agents", "Open Agents"],
              ["New Contact Messages", counts.newMsgs, "/admin/contact-messages", "Review inbox"],
              ["Activity (last 7 days)", counts.recentEvents, "/admin/activity", "View activity"],
              ["Lead Inbox (tours)", counts.inbox, "/inbox", "Open lead inbox"],
            ].map(([label, value, href, cta]) => (
              <div key={label as string} className="glass-card-pro p-5">
                <div className="text-slate-500 text-sm">{label as string}</div>
                <div className="mt-1 text-3xl font-bold text-slate-900">{(value as number) ?? "—"}</div>
                <Link to={href as string} className="mt-3 inline-flex items-center gap-1 text-emerald-700 text-sm">
                  {cta as string}
                  <ArrowRightIcon className="h-4 w-4" />
                </Link>
              </div>
            ))}
          </div>

          {/* Live inbox preview */}
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="glass-card-pro p-5">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-900">Latest Contact Messages</h3>
                <Link to="/admin/contact-messages" className="text-sm text-emerald-700">View all →</Link>
              </div>
              <ul className="mt-3 divide-y">
                {latestMsgs.length === 0 ? (
                  <li className="py-4 text-slate-500 text-sm">No new messages.</li>
                ) : (
                  latestMsgs.map((m) => (
                    <li key={m.id} className="py-3">
                      <div className="font-medium">{m.name} <span className="text-slate-500 text-xs">• {m.email}</span></div>
                      <div className="text-sm text-slate-600 line-clamp-2">{m.subject || m.topic} — {m.message}</div>
                    </li>
                  ))
                )}
              </ul>
            </div>

            <div className="glass-card-pro p-5">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-900">Latest Tour Requests</h3>
                <Link to="/inbox" className="text-sm text-emerald-700">Open inbox →</Link>
              </div>
              <ul className="mt-3 divide-y">
                {latestTours.length === 0 ? (
                  <li className="py-4 text-slate-500 text-sm">No new tour requests.</li>
                ) : (
                  latestTours.map((t) => (
                    <li key={t.id} className="py-3">
                      <div className="font-medium">{t.name || "Unknown"} <span className="text-slate-500 text-xs">• {t.email || "—"}</span></div>
                      <div className="text-sm text-slate-600">
                        {t.listing_ref || "No ref"} — {t.desired_at ? new Date(t.desired_at).toLocaleString() : "unspecified"} — <span className="capitalize">{t.status || "new"}</span>
                      </div>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>

          {/* Tip */}
          <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-emerald-900">
            <div className="flex items-center gap-2">
              <Cog6ToothIcon className="h-5 w-5" />
              <span className="font-medium">Pro tip:</span>
              <span className="text-emerald-800">
                Use <span className="font-mono">/admin/activity</span> for pageview & engagement trends via your RPCs.
              </span>
            </div>
          </div>
        </section>
      </div>

      <style>{`
        :root { --glass-bg: rgba(255,255,255,0.55); }
        .glass-card-pro {
          background: var(--glass-bg);
          backdrop-filter: blur(18px) saturate(1.4);
          border-radius: 1.3rem;
          box-shadow: 0 6px 24px 0 rgba(16, 185, 129, 0.10);
        }
        @keyframes float-slow { 0%,100% { transform:translateY(0)} 50% { transform:translateY(16px)} }
        .animate-float-slow { animation: float-slow 12s ease-in-out infinite; }
        .animate-float-slower { animation: float-slow 19s ease-in-out infinite; }
      `}</style>
    </div>
  );
}
