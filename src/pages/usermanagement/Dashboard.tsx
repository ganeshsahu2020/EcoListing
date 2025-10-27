// ui/src/pages/usermanagement/Dashboard.tsx
import React, { useEffect, useMemo, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../utils/supabaseClient";
import {
  HeartIcon,
  MagnifyingGlassCircleIcon,
  CalendarIcon,
  ChatBubbleLeftRightIcon,
  Cog6ToothIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";
import { ChatBubbleLeftEllipsisIcon } from "@heroicons/react/24/solid";
import Chat from "../Chat"; // Floating FAB + Panel

// Utility for classNames
function cx(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(" ");
}

// Glass pill navigation item
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
          isActive
            ? "bg-white/80 border-emerald-300/60"
            : "bg-white/60 hover:bg-white/80 border-white/40"
        )
      }
      aria-label={label}
    >
      <span className="flex items-center gap-3">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400/60 via-emerald-200/50 to-sky-300/40 border border-white/30 shadow-md transition-transform group-hover:scale-110">
          <Icon className="h-5 w-5 text-emerald-800 group-hover:animate-gradientspin" />
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

type CountState = {
  homes: number | null;
  searches: number | null;
  appts: number | null;
  convos: number | null;
};

export default function Dashboard() {
  const { user } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [counts, setCounts] = useState<CountState>({
    homes: null,
    searches: null,
    appts: null,
    convos: null,
  });

  // Derive user's first name for greeting
  const firstName = useMemo(() => {
    const meta = (user as any)?.user_metadata || {};
    const fromMeta =
      meta?.display_name || meta?.full_name || (user?.email ? user.email.split("@")[0] : "");
    const first = String(fromMeta || "").trim().split(/\s+/)[0];
    return first || "there";
  }, [user]);

  // Query counts for pills
  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ count: homesCount }, { count: searchesCount }, { count: apptCount }, { count: convoCount }] =
        await Promise.all([
          supabase.from("saved_homes").select("*", { count: "exact", head: true }),
          supabase.from("saved_searches").select("*", { count: "exact", head: true }),
          supabase.from("tour_requests").select("*", { count: "exact", head: true }).neq("status", "cancelled"),
          supabase.from("chat_conversations").select("*", { count: "exact", head: true }),
        ]);
      setCounts({
        homes: homesCount ?? 0,
        searches: searchesCount ?? 0,
        appts: apptCount ?? 0,
        convos: convoCount ?? 0,
      });
    })();
  }, [user?.id]);

  // Redirect /dashboard to /dashboard/saved-homes by default
  const isRoot = useMemo(() => loc.pathname === "/dashboard", [loc.pathname]);
  useEffect(() => {
    if (isRoot) nav("/dashboard/saved-homes", { replace: true });
  }, [isRoot, nav]);

  return (
    <div className="min-h-[70vh] bg-gradient-to-tl from-blue-50 via-emerald-50 to-white relative overflow-x-hidden">
      {/* Floating glass decor */}
      <div className="pointer-events-none absolute -top-32 -right-32 h-80 w-80 rounded-full bg-gradient-to-br from-indigo-300/40 to-cyan-300/40 blur-3xl animate-float-slow z-0" />
      <div className="pointer-events-none absolute top-1/3 -left-20 h-56 w-56 rounded-full bg-gradient-to-br from-emerald-300/40 to-teal-300/40 blur-3xl animate-float-slower z-0" />

      {/* Header */}
      <div className="border-b bg-gradient-to-b from-blue-50/50 to-white/80 shadow-sm backdrop-blur relative z-10">
        <div className="container-7xl px-4 py-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="max-w-3xl">
            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
              Your Dashboard
            </h1>

            {/* Aligned welcome + tagline copy */}
            <div className="mt-3 rounded-2xl border border-white/60 bg-white/70 backdrop-blur-md shadow-sm p-4">
              <p className="text-slate-800 text-base md:text-lg font-semibold">
                Welcome {firstName}! Your personalized dashboard is ready with your saved homes, custom
                searches, and account details to help you find your perfect property.{" "}
                <span className="font-bold">Explore now!</span>
              </p>
              <p className="mt-2 text-slate-600 text-sm md:text-base">
                <span className="font-semibold">EcoListing — A Smarter Way to Buy and Sell Homes.</span>{" "}
                Low commission sales, advanced technology, and personalized support for a seamless
                property-selling experience.
              </p>
            </div>
          </div>

          {/* CTAs */}
          <div className="flex items-center gap-3">
            <Link
              to="/tour"
              className={cx(
                "inline-flex items-center gap-2 rounded-full px-5 py-2.5 font-semibold text-white focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200",
                "bg-gradient-to-r from-indigo-600 via-blue-500 to-emerald-500 shadow-lg hover:shadow-xl transition-all animate-bounce-cta"
              )}
              aria-label="Contact Agent"
            >
              <span className="relative flex items-center gap-2">
                <span className="relative flex h-5 w-5 items-center justify-center">
                  <ChatBubbleLeftEllipsisIcon className="h-5 w-5 text-white animate-bounce-short" />
                  <span
                    className="absolute -bottom-1 -right-1 h-2 w-2 rounded-full bg-emerald-400 border-2 border-white animate-pulse"
                    aria-hidden
                  />
                </span>
                Contact Agent
                <ArrowRightIcon className="h-4 w-4 ml-0.5" />
              </span>
            </Link>
            {/* Mini chat button */}
            <button
              type="button"
              onClick={() => {
                if (loc.pathname !== "/dashboard/messages") {
                  nav("/dashboard/messages");
                }
                // Optionally: window.dispatchEvent(new Event("chat:open"));
              }}
              className="h-11 w-11 rounded-full shadow-lg bg-gradient-to-r from-indigo-600 to-emerald-500 grid place-items-center focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200"
              aria-label="Open chat"
              title="Open chat"
            >
              <ChatBubbleLeftEllipsisIcon className="h-6 w-6 text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container-7xl px-4 py-8 grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-8 relative z-10">
        {/* Aside */}
        <aside className="lg:sticky lg:top-24 h-max space-y-3">
          <Pill to="/dashboard/saved-homes" icon={HeartIcon} label="Saved Homes" count={counts.homes ?? undefined} />
          <Pill
            to="/dashboard/saved-searches"
            icon={MagnifyingGlassCircleIcon}
            label="Saved Searches"
            count={counts.searches ?? undefined}
          />
          <Pill
            to="/dashboard/appointments"
            icon={CalendarIcon}
            label="Appointments"
            count={counts.appts ?? undefined}
          />
          <Pill
            to="/dashboard/messages"
            icon={ChatBubbleLeftRightIcon}
            label="Messages (Chat)"
            count={counts.convos ?? undefined}
          />
          <Pill to="/dashboard/profile" icon={Cog6ToothIcon} label="Profile / Settings" />
        </aside>

        {/* Main */}
        <section className="min-h-[50vh] focus:outline-none" tabIndex={-1} id="dashboard-main-content">
          <Outlet />
        </section>
      </div>

      {/* Floating Chat (FAB + Panel) */}
      <Chat />

      {/* Styles for glassmorphism, gradients, animations */}
      <style>{`
        :root { --glass-bg: rgba(255,255,255,0.55); }
        .glass-card-pro {
          background: var(--glass-bg);
          backdrop-filter: blur(18px) saturate(1.4);
          border-radius: 1.3rem;
          box-shadow: 0 6px 24px 0 rgba(16, 185, 129, 0.10);
        }
        .animate-gradientspin {
          animation: gradientspin 1.8s linear infinite;
        }
        @keyframes gradientspin {
          to { filter: hue-rotate(360deg); }
        }
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
