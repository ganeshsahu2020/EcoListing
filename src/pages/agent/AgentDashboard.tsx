// ui/src/pages/agent/AgentDashboard.tsx
import React, { useEffect, useMemo, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../../utils/supabaseClient";
import {
  ChatBubbleLeftRightIcon,
  CalendarIcon,
  Cog6ToothIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";
import { ChatBubbleLeftEllipsisIcon } from "@heroicons/react/24/solid";

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

type Counts = {
  leads: number | null;
  appts: number | null;
  msgs: number | null;
};

export default function AgentDashboard() {
  const nav = useNavigate();
  const loc = useLocation();

  const [counts, setCounts] = useState<Counts>({ leads: null, appts: null, msgs: null });
  const [firstName, setFirstName] = useState("there");

  // initial load
  useEffect(() => {
    (async () => {
      // greet
      const { data: sess } = await supabase.auth.getSession();
      const u = sess?.session?.user;
      const meta = (u as any)?.user_metadata || {};
      const src = meta?.display_name || meta?.full_name || (u?.email ? u.email.split("@")[0] : "");
      setFirstName((String(src || "").trim().split(/\s+/)[0] || "there").replace(/[^A-Za-z0-9_-]/g, ""));

      const nowIso = new Date().toISOString();

      // conversations
      const convosQ = supabase.from("chat_conversations").select("*", { count: "exact", head: true });

      // upcoming appointments
      const apptsQ = supabase
        .from("tour_requests")
        .select("*", { count: "exact", head: true })
        .or("status.eq.scheduled,status.eq.confirmed,status.eq.accepted,status.eq.approved")
        .gte("desired_at", nowIso);

      // open lead sources
      const leadToursQ = supabase
        .from("tour_requests")
        .select("*", { count: "exact", head: true })
        .in("status", ["new", "pending"]);

      const leadContactsQ = supabase.from("contact_messages").select("*", { count: "exact", head: true });

      try {
        const [convos, appts, lt, lc] = await Promise.all([convosQ, apptsQ, leadToursQ, leadContactsQ]);
        const leadsTotal = (lt.count ?? 0) + (lc.count ?? 0);
        setCounts({
          msgs: convos.count ?? 0,
          appts: appts.count ?? 0,
          leads: leadsTotal,
        });
      } catch {
        setCounts((c) => ({ ...c, msgs: c.msgs ?? 0, appts: c.appts ?? 0, leads: c.leads ?? 0 }));
      }
    })();
  }, []);

  // realtime: reflect lead + appt changes (wrapped with sync cleanup)
  useEffect(() => {
    let unsub: (() => void) | undefined;

    (async () => {
      const ch = supabase
        .channel("rt-agent-dashboard")
        // contact_messages -> leads +1 on insert
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "contact_messages" }, () => {
          setCounts((s) => ({ ...s, leads: typeof s.leads === "number" ? s.leads + 1 : s.leads }));
        })
        // tour_requests insert/update
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "tour_requests" }, (p) => {
          const r: any = p.new;
          if (["new", "pending"].includes(r?.status)) {
            setCounts((s) => ({ ...s, leads: typeof s.leads === "number" ? s.leads + 1 : s.leads }));
          }
          const isUpcoming =
            r?.desired_at && new Date(r.desired_at).getTime() >= Date.now() &&
            ["scheduled", "confirmed", "accepted", "approved"].includes(r?.status);
          if (isUpcoming) {
            setCounts((s) => ({ ...s, appts: typeof s.appts === "number" ? s.appts + 1 : s.appts }));
          }
        })
        .on("postgres_changes", { event: "UPDATE", schema: "public", table: "tour_requests" }, (p) => {
          const was: any = p.old;
          const now: any = p.new;

          const wasLead = ["new", "pending"].includes(was?.status);
          const nowLead = ["new", "pending"].includes(now?.status);
          if (wasLead !== nowLead) {
            setCounts((s) => ({
              ...s,
              leads:
                typeof s.leads === "number"
                  ? Math.max(0, s.leads + (nowLead ? +1 : -1))
                  : s.leads,
            }));
          }

          const wasUpcoming =
            was?.desired_at && new Date(was.desired_at).getTime() >= Date.now() &&
            ["scheduled", "confirmed", "accepted", "approved"].includes(was?.status);
          const nowUpcoming =
            now?.desired_at && new Date(now.desired_at).getTime() >= Date.now() &&
            ["scheduled", "confirmed", "accepted", "approved"].includes(now?.status);

          if (wasUpcoming !== nowUpcoming) {
            setCounts((s) => ({
              ...s,
              appts:
                typeof s.appts === "number"
                  ? Math.max(0, s.appts + (nowUpcoming ? +1 : -1))
                  : s.appts,
            }));
          }
        })
        // optional: message nudge
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages" }, () => {
          setCounts((s) => ({ ...s, msgs: typeof s.msgs === "number" ? s.msgs : s.msgs }));
        })
        .subscribe();

      unsub = () => supabase.removeChannel(ch);
    })();

    return () => {
      try {
        unsub?.();
      } catch {}
    };
  }, [loc.key]);

  const subhead = useMemo(
    () => "Manage leads, client conversations, appointments, and your profile — all in one place.",
    []
  );

  return (
    <div className="min-h-[70vh] bg-gradient-to-tl from-blue-50 via-emerald-50 to-white relative overflow-x-hidden">
      {/* decor */}
      <div className="pointer-events-none absolute -top-32 -right-32 h-80 w-80 rounded-full bg-gradient-to-br from-indigo-300/40 to-cyan-300/40 blur-3xl animate-float-slow z-0" />
      <div className="pointer-events-none absolute top-1/3 -left-20 h-56 w-56 rounded-full bg-gradient-to-br from-emerald-300/40 to-teal-300/40 blur-3xl animate-float-slower z-0" />

      {/* header */}
      <div className="border-b bg-gradient-to-b from-blue-50/50 to-white/80 shadow-sm backdrop-blur relative z-10">
        <div className="container-7xl px-4 py-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="max-w-3xl">
            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">Agent Dashboard</h1>
            <p className="mt-2 text-slate-700">
              Welcome <span className="font-semibold capitalize">{firstName}</span>! {subhead}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/agent/leads"
              className={cx(
                "inline-flex items-center gap-2 rounded-full px-5 py-2.5 font-semibold text-white focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200",
                "bg-gradient-to-r from-indigo-600 via-blue-500 to-emerald-500 shadow-lg hover:shadow-xl transition-all animate-bounce-cta"
              )}
              aria-label="Open Lead Inbox"
            >
              <span className="relative flex items-center gap-2">
                <span className="relative flex h-5 w-5 items-center justify-center">
                  <ChatBubbleLeftEllipsisIcon className="h-5 w-5 text-white animate-bounce-short" />
                  <span className="absolute -bottom-1 -right-1 h-2 w-2 rounded-full bg-emerald-400 border-2 border-white animate-pulse" />
                </span>
                Open Inbox
                <ArrowRightIcon className="h-4 w-4 ml-0.5" />
              </span>
            </Link>

            <button
              type="button"
              onClick={() => nav("/agent/messages")}
              className="h-11 w-11 rounded-full shadow-lg bg-gradient-to-r from-indigo-600 to-emerald-500 grid place-items-center focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200"
              aria-label="Open messages"
            >
              <ChatBubbleLeftEllipsisIcon className="h-6 w-6 text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* layout */}
      <div className="container-7xl px-4 py-8 grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-8 relative z-10">
        {/* aside */}
        <aside className="lg:sticky lg:top-24 h-max space-y-3">
          <Pill to="/agent/leads" icon={ChatBubbleLeftRightIcon} label="Lead Inbox" count={counts.leads ?? undefined} />
          <Pill to="/agent/appointments" icon={CalendarIcon} label="Appointments" count={counts.appts ?? undefined} />
          <Pill to="/agent/messages" icon={ChatBubbleLeftRightIcon} label="Messages" count={counts.msgs ?? undefined} />
          <Pill to="/agent/profile" icon={Cog6ToothIcon} label="Profile / Settings" />
        </aside>

        {/* main */}
        <section className="min-h-[50vh]">
          <div className="rounded-2xl border border-emerald-100/60 bg-white/70 backdrop-blur-xl p-5 shadow-lg">
            <h2 className="text-xl font-semibold text-slate-900">Quick Actions</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Link to="/agent/leads" className="rounded-xl border border-white/50 bg-white/70 p-4 shadow hover:shadow-md transition">
                <div className="font-semibold">Review new leads</div>
                <div className="text-sm text-slate-600 mt-1">Tour requests & contact messages.</div>
              </Link>
              <Link to="/agent/appointments" className="rounded-xl border border-white/50 bg-white/70 p-4 shadow hover:shadow-md transition">
                <div className="font-semibold">Today's appointments</div>
                <div className="text-sm text-slate-600 mt-1">Upcoming scheduled/confirmed tours.</div>
              </Link>
              <Link to="/agent/reports/new" className="rounded-xl border border-white/50 bg-white/70 p-4 shadow hover:shadow-md transition">
                <div className="font-semibold">Prepare Agent Report</div>
                <div className="text-sm text-slate-600 mt-1">Create and share a valuation.</div>
              </Link>
              <Link to="/agent/reports" className="rounded-xl border border-white/50 bg-white/70 p-4 shadow hover:shadow-md transition">
                <div className="font-semibold">View Report Requests</div>
                <div className="text-sm text-slate-600 mt-1">See new “requested” items.</div>
              </Link>
            </div>
          </div>
        </section>
      </div>

      {/* styles */}
      <style>{`
        :root { --glass-bg: rgba(255,255,255,0.55); }
        @keyframes float-slow { 0%,100% { transform:translateY(0)} 50% { transform:translateY(16px)} }
        .animate-float-slow { animation: float-slow 12s ease-in-out infinite; }
        .animate-float-slower { animation: float-slow 19s ease-in-out infinite; }
        @keyframes bounce-short { 0%,100% { transform: translateY(0);} 50% { transform: translateY(-4px);} }
        .animate-bounce-short { animation: bounce-short 1s infinite; }
        @keyframes bounce-cta { 0%,100% { transform: translateY(0);} 20% { transform: translateY(-4px);} 50% { transform: translateY(0);} }
        .animate-bounce-cta { animation: bounce-cta 2.5s cubic-bezier(.39,.58,.57,1) infinite; }
      `}</style>
    </div>
  );
}
