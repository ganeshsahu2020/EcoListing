// ui/src/components/AccountMenu.tsx
import React, { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  HeartIcon,
  MagnifyingGlassCircleIcon,
  CalendarIcon,
  ChatBubbleLeftRightIcon,
  Cog6ToothIcon,
  ArrowRightIcon,
  UserCircleIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import { supabase } from "../utils/supabaseClient";
import { useMyRole } from "../utils/useMyRole";

type Props = {
  onClose?: () => void; // optional: close the popover/dropdown when an item is clicked
  className?: string;
};

function itemCx(isActive: boolean) {
  return [
    "group flex items-center gap-3 rounded-xl px-3 py-2 transition",
    isActive ? "bg-emerald-50 text-emerald-900" : "hover:bg-slate-100",
  ].join(" ");
}

export default function AccountMenu({ onClose, className = "" }: Props) {
  const nav = useNavigate();
  const { role } = useMyRole();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      setEmail(data.user?.email ?? null);
    })();
  }, []);

  const isAgent = role === "agent" || role === "superadmin";
  const dashboardPath = isAgent ? "/agent" : "/dashboard";
  const apptPath = isAgent ? "/agent/appointments" : "/dashboard/appointments";
  const messagesPath = isAgent ? "/agent/messages" : "/dashboard/messages";
  const profilePath = isAgent ? "/agent/profile" : "/dashboard/profile";

  async function handleLogout() {
    try {
      await supabase.auth.signOut();
      onClose?.();
      nav("/auth/login");
    } catch {
      // no-op
    }
  }

  return (
    <div
      className={[
        "w-[300px] rounded-2xl border border-slate-200 bg-white/95 backdrop-blur shadow-xl",
        className,
      ].join(" ")}
      role="menu"
      aria-label="Account"
    >
      {/* Header */}
      <div className="px-4 py-4 border-b border-slate-200/70">
        <div className="flex items-center gap-3">
          <UserCircleIcon className="h-9 w-9 text-emerald-600" />
          <div className="min-w-0">
            <div className="text-xs text-slate-500">Signed in as</div>
            <div className="font-semibold text-slate-900 truncate" title={email || ""}>
              {email || "—"}
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="px-2 py-2 space-y-1" role="none">
        <NavLink
          to={dashboardPath}
          className={({ isActive }) => itemCx(isActive)}
          onClick={onClose}
          role="menuitem"
        >
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400/60 via-emerald-200/50 to-sky-300/40 border border-white/30 shadow">
            <ShieldCheckIcon className="h-5 w-5 text-emerald-800" />
          </span>
          <span className="font-semibold">Dashboard</span>
          <ArrowRightIcon className="ml-auto h-4 w-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
        </NavLink>

        {/* Saved (always under user dashboard) */}
        <NavLink
          to="/dashboard/saved-homes"
          className={({ isActive }) => itemCx(isActive)}
          onClick={onClose}
          role="menuitem"
        >
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white border border-slate-200 shadow-sm">
            <HeartIcon className="h-5 w-5 text-emerald-700" />
          </span>
          <span>Saved Homes</span>
        </NavLink>

        <NavLink
          to="/dashboard/saved-searches"
          className={({ isActive }) => itemCx(isActive)}
          onClick={onClose}
          role="menuitem"
        >
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white border border-slate-200 shadow-sm">
            <MagnifyingGlassCircleIcon className="h-5 w-5 text-emerald-700" />
          </span>
          <span>Saved Searches</span>
        </NavLink>

        {/* Appointments / Messages route switch by role */}
        <NavLink
          to={apptPath}
          className={({ isActive }) => itemCx(isActive)}
          onClick={onClose}
          role="menuitem"
        >
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white border border-slate-200 shadow-sm">
            <CalendarIcon className="h-5 w-5 text-emerald-700" />
          </span>
          <span>Appointments</span>
        </NavLink>

        <NavLink
          to={messagesPath}
          className={({ isActive }) => itemCx(isActive)}
          onClick={onClose}
          role="menuitem"
        >
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white border border-slate-200 shadow-sm">
            <ChatBubbleLeftRightIcon className="h-5 w-5 text-emerald-700" />
          </span>
          <span>Messages</span>
        </NavLink>

        <NavLink
          to={profilePath}
          className={({ isActive }) => itemCx(isActive)}
          onClick={onClose}
          role="menuitem"
        >
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white border border-slate-200 shadow-sm">
            <Cog6ToothIcon className="h-5 w-5 text-emerald-700" />
          </span>
          <span>Profile / Settings</span>
        </NavLink>
      </nav>

      {/* Footer actions */}
      <div className="px-4 py-3 border-t border-slate-200/70">
        <div className="flex items-center justify-between">
          <Link
            to="/contact"
            className="text-sm font-medium text-emerald-700 hover:text-emerald-800"
            onClick={onClose}
          >
            Help & Support
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="text-sm font-semibold text-rose-600 hover:text-rose-700"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
