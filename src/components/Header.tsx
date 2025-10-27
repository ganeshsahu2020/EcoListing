import React, { useEffect, useRef, useState, useLayoutEffect, useId } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  BellIcon,
  ChatBubbleLeftRightIcon,
  ChevronDownIcon,
  HeartIcon,
  UserCircleIcon,
  Bars3Icon,
  XMarkIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  CalendarIcon,
  DocumentTextIcon,
  InboxStackIcon,
  HomeIcon,
  MapPinIcon,
  CurrencyDollarIcon,
} from "@heroicons/react/24/outline";

import AuthDialog from "./auth/AuthDialog";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../utils/supabaseClient";
import SellerInsightsStrip from "./SellerInsightsStrip";
import PrimaryMobileNav from "./PrimaryMobileNav"; // ⬅️ new component

/* ───────────────────────────────────────────────────────── */
const BC_BLUE = "#1E90FF";
const BC_GREEN = "#1ABC9C";

function cx(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(" ");
}

function AnimatedIcon({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cx(
        "inline-flex h-6 w-6 items-center justify-center rounded-md",
        "shadow-md shadow-slate-900/5 backdrop-blur-xl border",
        "transition-all duration-300 animate-gradient-float",
        "group-hover:scale-110",
        className
      )}
      aria-hidden="true"
      style={{
        borderColor: "rgba(255,255,255,0.5)",
        background: `linear-gradient(135deg, ${BC_GREEN}99, ${BC_GREEN}55, ${BC_BLUE}66)`,
      }}
    >
      {children}
    </span>
  );
}

/* Brand */
function BrandIcon({ size = 24 }: { size?: number }) {
  const candidates = ["/ecolisting-icon.svg", "/ecolisting-wordmark-dark.svg", "/logo.svg"];
  const [idx, setIdx] = useState(0);
  return (
    <img
      src={candidates[idx]}
      alt="Eco Listing"
      height={size}
      width={size}
      className="h-6 w-6 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3"
      onError={() => setIdx((i) => (i < candidates.length - 1 ? i + 1 : i))}
      draggable={false}
      loading="eager"
    />
  );
}
function BrandMark() {
  return (
    <span className="inline-flex items-center gap-1 group whitespace-nowrap">
      <BrandIcon size={24} />
      <span
        className="text-base font-bold leading-none tracking-tight select-none"
        style={{
          fontFamily:
            "Inter, Nunito, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial",
          backgroundImage: `linear-gradient(90deg, ${BC_GREEN}, ${BC_BLUE})`,
          WebkitBackgroundClip: "text",
          color: "transparent",
        }}
      >
        <span className="font-light">Eco</span>
        <span className="font-black">Listing</span>
      </span>
    </span>
  );
}

/* Nav link styles */
const navLink = ({ isActive }: { isActive: boolean }) =>
  cx(
    "relative group px-2.5 py-1 rounded-md text-[13px] font-medium transition-all duration-200 whitespace-nowrap",
    "backdrop-blur-sm border",
    isActive ? "text-slate-900 shadow-[0_2px_12px_rgba(30,144,255,0.12)]" : "text-slate-600 hover:text-slate-900",
    "lg:px-2.5 lg:py-1.5 lg:text-sm"
  );

function GlassCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cx(
        "backdrop-blur-xl bg-white/80 dark:bg-slate-900/80",
        "border border-white/30 shadow-2xl shadow-black/5",
        "rounded-2xl",
        className
      )}
    >
      {children}
    </div>
  );
}

/* Dashboards dropdown */
function DashMenu({ showAgent, showAdmin }: { showAgent: boolean; showAdmin: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (open && ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className={cx(
          "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[13px] lg:text-sm font-medium",
          "text-slate-700 bg-white/50 hover:bg-white/70 border border-white/60 backdrop-blur-sm transition-all"
        )}
        aria-haspopup="menu"
        aria-expanded={open}
        style={{ outlineColor: BC_BLUE }}
      >
        <Cog6ToothIcon className="h-4 w-4" />
        <span>Dashboards</span>
        <ChevronDownIcon className={cx("h-3.5 w-3.5 text-slate-400 transition-transform", open && "rotate-180")} />
      </button>

      <div
        className={cx(
          "absolute right-0 mt-1 w-56 origin-top-right transition-all duration-150",
          open ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-95 pointer-events-none"
        )}
        role="menu"
      >
        <GlassCard className="p-2">
          <ul className="py-1">
            <li>
              <Link
                to="/dashboard"
                className="block px-3 py-2 text-sm rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                onClick={() => setOpen(false)}
              >
                <span className="inline-flex items-center gap-2">
                  <Cog6ToothIcon className="h-4 w-4" />
                  User Dashboard
                </span>
              </Link>
            </li>
            {showAgent && (
              <li>
                <Link
                  to="/agent/dashboard"
                  className="block px-3 py-2 text-sm rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  onClick={() => setOpen(false)}
                >
                  <span className="inline-flex items-center gap-2">
                    <Cog6ToothIcon className="h-4 w-4" />
                    Agent Dashboard
                  </span>
                </Link>
              </li>
            )}
            {showAdmin && (
              <li>
                <Link
                  to="/admin/dashboard"
                  className="block px-3 py-2 text-sm rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  onClick={() => setOpen(false)}
                >
                  <span className="inline-flex items-center gap-2">
                    <ChartBarIcon className="h-4 w-4" />
                    Admin Dashboard
                  </span>
                </Link>
              </li>
            )}
          </ul>
        </GlassCard>
      </div>
    </div>
  );
}

/* Notifications */
type NotificationRow = {
  id: string;
  created_at: string;
  user_uid: string;
  title: string | null;
  body: string | null;
  kind: string | null;
  link_url: string | null;
  read_at: string | null;
  meta: any | null;
};

function NotificationBell({ onRequireAuth }: { onRequireAuth: () => void }) {
  const nav = useNavigate();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationRow[]>([]);
  const [unread, setUnread] = useState<number>(0);
  const ref = useRef<HTMLDivElement | null>(null);

  async function load() {
    if (!user) return;
    const uid = user.id;

    const { data: rows } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_uid", uid)
      .order("created_at", { ascending: false })
      .limit(10);
    setItems((rows || []) as NotificationRow[]);

    const { count } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_uid", uid)
      .is("read_at", null);
    setUnread(count ?? 0);
  }

  useEffect(() => {
    if (!user) return;
    load();

    const uid = user.id;
    const ch = supabase
      .channel(`rt-notify-${uid}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_uid=eq.${uid}` },
        (payload) => {
          const n = payload.new as NotificationRow;
          setItems((prev) => [n, ...prev].slice(0, 10));
          setUnread((c) => (c ?? 0) + 1);
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "notifications", filter: `user_uid=eq.${uid}` },
        (payload) => {
          const n = payload.new as NotificationRow;
          setItems((prev) => prev.map((r) => (r.id === n.id ? n : r)));
        }
      )
      .subscribe();

    const ping = supabase
      .channel("staff-alerts", { config: { broadcast: { self: true } } })
      .on("broadcast", { event: "user_message" }, () => {
        setUnread((c) => (c ?? 0) + 1);
        setTimeout(() => setUnread((c) => Math.max(0, (c ?? 0) - 1)), 3000);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(ch);
      supabase.removeChannel(ping);
    };
  }, [user?.id]);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (open && ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function markAllRead() {
    if (!user) return onRequireAuth();
    await supabase.from("notifications").update({ read_at: new Date().toISOString() }).is("read_at", null);
    setUnread(0);
    setItems((arr) => arr.map((a) => (a.read_at ? a : { ...a, read_at: new Date().toISOString() })));
  }

  async function openItem(n: NotificationRow) {
    if (!user) return onRequireAuth();
    if (!n.read_at) {
      await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", n.id);
      setUnread((c) => Math.max(0, (c ?? 0) - 1));
      setItems((arr) => arr.map((a) => (a.id === n.id ? { ...a, read_at: new Date().toISOString() } : a)));
    }
    setOpen(false);
    if (n.link_url) nav(n.link_url);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => (user ? setOpen((o) => !o) : onRequireAuth())}
        className="relative group rounded-lg p-1 hover:bg-white/30 transition-all duration-200 focus:outline-none"
        title="Notifications"
        aria-label="Notifications"
        aria-expanded={open}
        aria-haspopup="menu"
        style={{ outlineColor: BC_BLUE }}
      >
        <span className="relative inline-block">
          <AnimatedIcon>
            <BellIcon className="h-4.5 w-4.5 text-slate-800 group-hover:scale-110 transition-transform" />
          </AnimatedIcon>
          {unread > 0 && (
            <span
              className="absolute -right-1 -top-1 inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full px-0.5 text-[9px] font-semibold text-white shadow-lg"
              style={{ background: `linear-gradient(90deg, ${BC_BLUE}, ${BC_GREEN})` }}
            >
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </span>
      </button>

      <div
        className={cx(
          "absolute right-0 mt-1 w-[20rem] origin-top-right transition-all duration-150 z-50",
          open ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-95 pointer-events-none"
        )}
        role="menu"
        aria-label="Notifications dropdown"
        aria-hidden={!open}
        {...(!open ? { hidden: true } : {})}
      >
        <GlassCard className="p-2">
          <div className="flex items-center justify-between px-2 py-1.5">
            <div className="text-sm font-semibold text-slate-800">Notifications</div>
            {unread > 0 && (
              <button onClick={markAllRead} className="text-xs" style={{ color: BC_BLUE }}>
                Mark all read
              </button>
            )}
          </div>
          <ul className="max-h-96 overflow-y-auto divide-y divide-white/20">
            {items.length === 0 ? (
              <li className="px-3 py-6 text-sm text-slate-500">No notifications yet.</li>
            ) : (
              items.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => openItem(n)}
                    className={cx("w-full text-left px-3 py-2 rounded-lg transition", "hover:bg-slate-50")}
                  >
                    <div className="flex items-start gap-2">
                      <span
                        className={cx("mt-1 h-2 w-2 rounded-full flex-shrink-0", n.read_at ? "bg-slate-300" : "bg-green-500")}
                        aria-hidden="true"
                      />
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-slate-800 truncate">
                          {n.title || n.kind || "Notification"}
                        </div>
                        {n.body && <div className="text-xs text-slate-600 line-clamp-2">{n.body}</div>}
                        <div className="text-[11px] text-slate-400 mt-0.5">{new Date(n.created_at).toLocaleString()}</div>
                      </div>
                    </div>
                  </button>
                </li>
              ))
            )}
          </ul>
        </GlassCard>
      </div>
    </div>
  );
}

/* Profile menu (unchanged) */
function ProfileMenu({
  displayName,
  signOut,
  role,
  onClose,
  profileOpen,
  setProfileOpen,
  profileRef,
  userEmail,
  avatarUrl,
}: {
  displayName: string;
  signOut: () => void;
  role?: string | null;
  onClose: () => void;
  profileOpen: boolean;
  setProfileOpen: (v: boolean) => void;
  profileRef: React.RefObject<HTMLDivElement>;
  userEmail?: string | null;
  avatarUrl?: string | null;
}) {
  const isSuper = role === "superadmin";
  const isAgent = role === "agent" || isSuper;

  return (
    <div className="relative ml-1" ref={profileRef}>
      <button
        onClick={() => setProfileOpen(!profileOpen)}
        aria-haspopup="menu"
        aria-expanded={profileOpen}
        aria-label="Profile menu"
        className={cx(
          "flex items-center gap-1 rounded-lg pl-1.5 pr-2 py-1",
          "bg-white/60 hover:bg-white/80 shadow-xs backdrop-blur-sm",
          "border border-white/50 transition-all duration-200"
        )}
        style={{ outlineColor: BC_BLUE }}
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt="Avatar" className="h-6 w-6 rounded-full ring-1 ring-slate-200 object-cover shadow-sm" />
        ) : (
          <span
            className={cx(
              "inline-flex h-6 w-6 items-center justify-center rounded-full shadow-sm",
              "bg-white text-slate-700 ring-1 ring-slate-200 font-semibold text-xs"
            )}
          >
            {displayName?.[0]?.toUpperCase() || <UserCircleIcon className="h-4 w-4" />}
          </span>
        )}
        <span className="hidden sm:inline text-xs font-medium text-slate-900 capitalize max-w-[120px] truncate">
          {displayName || "user"}
        </span>
        <ChevronDownIcon
          className={cx("h-3.5 w-3.5 text-slate-400 transition-transform duration-200", profileOpen && "rotate-180")}
        />
      </button>

      <div
        className={cx(
          "absolute right-0 mt-1.5 w-56 origin-top-right",
          "transition-all duration-200 ease-out",
          profileOpen ? "opacity-100 scale-100 translate-y-0 pointer-events-auto" : "opacity-0 scale-95 -translate-y-1 pointer-events-none"
        )}
        role="menu"
        aria-label="Profile dropdown"
      >
        <GlassCard className="p-2">
          <div className="px-3 py-2 border-b border-white/20">
            <p className="text-[11px] text-slate-500">Signed in as</p>
            <p className="mt-0.5 truncate font-semibold text-slate-900 dark:text-slate-50 text-sm">
              {userEmail || "superadmin@domain.com"}
            </p>
          </div>
          <ul className="py-1" role="none">
            {role === "superadmin" && (
              <>
                <li>
                  <Link
                    to="/admin/dashboard"
                    role="menuitem"
                    className="block px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-lg transition-all duration-150"
                    onClick={onClose}
                  >
                    <span className="inline-flex items-center gap-2">
                      <ChartBarIcon className="h-4 w-4" />
                      Admin Dashboard
                    </span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/admin/users"
                    role="menuitem"
                    className="block px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-lg transition-all duration-150"
                    onClick={onClose}
                  >
                    Users
                  </Link>
                </li>
                <li>
                  <Link
                    to="/agents"
                    role="menuitem"
                    className="block px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-lg transition-all duration-150"
                    onClick={onClose}
                  >
                    Agents
                  </Link>
                </li>
                <li>
                  <Link
                    to="/admin/contact-messages"
                    role="menuitem"
                    className="block px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-lg transition-all duration-150"
                    onClick={onClose}
                  >
                    Contact Messages
                  </Link>
                </li>
              </>
            )}

            <li>
              <Link
                to="/dashboard"
                role="menuitem"
                className="block px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-lg transition-all duration-150"
                onClick={onClose}
              >
                <span className="inline-flex items-center gap-2">
                  <Cog6ToothIcon className="h-4 w-4" />
                  Dashboard
                </span>
              </Link>
            </li>
            <li className="grid grid-cols-2 gap-1 px-2 py-1">
              <Link
                to="/dashboard/saved-homes"
                className="px-2 py-1.5 text-xs rounded-lg hover:bg-slate-50 text-slate-600"
                onClick={onClose}
              >
                Saved Homes
              </Link>
              <Link
                to="/dashboard/saved-searches"
                className="px-2 py-1.5 text-xs rounded-lg hover:bg-slate-50 text-slate-600"
                onClick={onClose}
              >
                Saved Searches
              </Link>
              <Link
                to="/dashboard/appointments"
                className="px-2 py-1.5 text-xs rounded-lg hover:bg-slate-50 text-slate-600 inline-flex items-center gap-1"
                onClick={onClose}
              >
                <CalendarIcon className="h-3.5 w-3.5" />
                Appointments
              </Link>
              <Link
                to="/dashboard/messages"
                className="px-2 py-1.5 text-xs rounded-lg hover:bg-slate-50 text-slate-600"
                onClick={onClose}
              >
                Messages
              </Link>
              <Link
                to="/dashboard/profile"
                className="px-2 py-1.5 text-xs rounded-lg hover:bg-slate-50 text-slate-600 col-span-2"
                onClick={onClose}
              >
                Profile / Settings
              </Link>
            </li>

            {(role === "agent" || role === "superadmin") && (
              <>
                <li className="my-1 border-t border-white/20" />
                <li>
                  <Link
                    to="/agent/dashboard"
                    role="menuitem"
                    className="block px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-lg transition-all duration-150"
                    onClick={onClose}
                  >
                    <span className="inline-flex items-center gap-2">
                      <Cog6ToothIcon className="h-4 w-4" />
                      Agent Dashboard
                    </span>
                  </Link>
                </li>
                <li className="grid grid-cols-2 gap-1 px-2 py-1">
                  <Link
                    to="/agent/leads"
                    className="px-2 py-1.5 text-xs rounded-lg hover:bg-slate-50 text-slate-600"
                    onClick={onClose}
                  >
                    Lead Inbox
                  </Link>
                  <Link
                    to="/agent/profile"
                    className="px-2 py-1.5 text-xs rounded-lg hover:bg-slate-50 text-slate-600"
                    onClick={onClose}
                  >
                    Agent Profile
                  </Link>
                </li>
                <li className="grid grid-cols-2 gap-1 px-2 py-1">
                  <Link
                    to="/agent/appointments"
                    className="px-2 py-1.5 text-xs rounded-lg hover:bg-slate-50 text-slate-600 inline-flex items-center gap-1"
                    onClick={onClose}
                  >
                    <CalendarIcon className="h-3.5 w-3.5" />
                    Appointments
                  </Link>
                  <Link
                    to="/agent/messages"
                    className="px-2 py-1.5 text-xs rounded-lg hover:bg-slate-50 text-slate-600 inline-flex items-center gap-1"
                    onClick={onClose}
                  >
                    <ChatBubbleLeftRightIcon className="h-3.5 w-3.5" />
                    Messages
                  </Link>
                </li>
                <li className="grid grid-cols-2 gap-1 px-2 py-1">
                  <Link
                    to="/agent/reports/new"
                    className="px-2 py-1.5 text-xs rounded-lg hover:bg-slate-50 text-slate-600 inline-flex items-center gap-1"
                    onClick={onClose}
                  >
                    <DocumentTextIcon className="h-3.5 w-3.5" />
                    Prepare Report
                  </Link>
                  <Link
                    to="/agent/reports"
                    className="px-2 py-1.5 text-xs rounded-lg hover:bg-slate-50 text-slate-600 inline-flex items-center gap-1"
                    onClick={onClose}
                  >
                    <InboxStackIcon className="h-3.5 w-3.5" />
                    Report Requests
                  </Link>
                </li>
              </>
            )}

            <li className="my-1 border-t border-white/20" />
            <li>
              <button
                onClick={signOut}
                role="menuitem"
                className="w-full text-left px-3 py-2 text-sm text-rose-600 hover:bg-rose-50/60 rounded-lg font-medium transition-all duration-150"
              >
                Logout
              </button>
            </li>
          </ul>
        </GlassCard>
      </div>
    </div>
  );
}

/* Header */
export default function Header({ favoritesCount = 0 }: { favoritesCount?: number }) {
  const { user, role, signOut } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();

  // ⬇️ renamed to navOpen and moved to PrimaryMobileNav pattern
  const [navOpen, setNavOpen] = useState(false);
  const menuBtnRef = useRef<HTMLButtonElement | null>(null);
  const menuId = useId();

  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement | null>(null);

  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");

  const isSuper = role === "superadmin";
  const isAgent = role === "agent" || isSuper;
  const isHome = loc.pathname === "/";

  const displayName =
    (user as any)?.user_metadata?.display_name ||
    (user as any)?.user_metadata?.full_name ||
    (user?.email ? user.email.split("@")[0] : "") ||
    (role || "user");

  useEffect(() => {
    setNavOpen(false);
    setProfileOpen(false);
  }, [loc.pathname]);

  // Close on ESC / outside for profile (mobile menu handled inside PrimaryMobileNav)
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setProfileOpen(false);
      }
    }
    function onDown(e: MouseEvent) {
      if (profileOpen && profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    }
    window.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDown);
    };
  }, [profileOpen]);

  const handleAuthClick = (mode: "login" | "signup") => {
    setAuthMode(mode);
    setAuthOpen(true);
    setNavOpen(false);
  };

  const headerRef = useRef<HTMLDivElement | null>(null);
  const stripRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    const setVar = () => {
      const hHeader = headerRef.current?.offsetHeight ?? 0;
      const hStrip = stripRef.current?.offsetHeight ?? 0;
      document.documentElement.style.setProperty("--app-header-h", `${hHeader + hStrip}px`);
    };
    setVar();

    const ro = new ResizeObserver(setVar);
    if (headerRef.current) ro.observe(headerRef.current);
    if (stripRef.current) ro.observe(stripRef.current);

    window.addEventListener("resize", setVar);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", setVar);
    };
  }, []);

  const [atTop, setAtTop] = useState(true);
  useEffect(() => {
    const onScroll = () => setAtTop(window.scrollY < 2);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      {/* Top header */}
      <header
        ref={headerRef}
        className={cx(
          "sticky top-0 z-50 w-full transition-all duration-300",
          isHome && atTop ? "bg-transparent backdrop-blur-0 border-b-0 shadow-none" : "bg-white/70 backdrop-blur-xl border-b shadow-lg"
        )}
        aria-label="Site header"
        style={{ borderColor: "rgba(226,232,240,.6)" }}
      >
        <div
          className={cx(
            "mx-auto h-16",
            "grid items-center gap-2 px-3",
            "grid-cols-[auto_auto_1fr_auto]",
            "md:grid-cols-[auto_1fr_auto] md:gap-3 md:px-4",
            "lg:grid-cols-[auto_1fr_auto] lg:gap-4 lg:px-6",
            "xl:max-w-screen-2xl xl:px-8"
          )}
          style={{ fontFamily: "Inter, Nunito, ui-sans-serif, system-ui" }}
        >
          {/* Brand */}
          <Link to="/" className="flex items-center gap-1 group justify-self-start" aria-label="EcoListing Home" onClick={() => setNavOpen(false)}>
            <BrandMark />
          </Link>

          {/* Mobile hamburger (trigger) */}
          <button
            ref={menuBtnRef}
            type="button"
            className="inline-flex md:hidden items-center gap-2 rounded-lg px-3 py-2 border hover:bg-white/60 active:scale-95 justify-self-start"
            aria-controls={menuId}
            aria-expanded={navOpen}
            aria-haspopup="menu"
            onClick={() => setNavOpen(true)}
            style={{ outlineColor: BC_BLUE }}
          >
            <span className="sr-only">Open menu</span>
            {navOpen ? (
              <XMarkIcon className="w-5 h-5" />
            ) : (
              <Bars3Icon className="w-5 h-5" />
            )}
          </button>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1 justify-self-center lg:gap-1.5" aria-label="Primary navigation">
            <NavLink to="/" className={navLink} end title="Home">
              <span className="inline-flex items-center gap-1">
                <AnimatedIcon className="h-5 w-5">
                  <HomeIcon className="h-3.5 w-3.5" />
                </AnimatedIcon>
                Home
              </span>
            </NavLink>

            <NavLink to="/search" className={navLink} title="Map Search">
              <span className="inline-flex items-center gap-1">
                <AnimatedIcon className="h-5 w-5">
                  <MapPinIcon className="h-3.5 w-3.5" />
                </AnimatedIcon>
                Map Search
              </span>
            </NavLink>

            <NavLink to="/whats-my-home-worth" className={navLink} title="What’s My Home Worth">
              <span className="inline-flex items-center gap-1">
                <AnimatedIcon className="h-5 w-5">
                  <CurrencyDollarIcon className="h-3.5 w-3.5" />
                </AnimatedIcon>
                What’s My Home Worth
              </span>
            </NavLink>

            <NavLink to="/market-trends" className={navLink} title="Market Trends">
              <span className="inline-flex items-center gap-1">
                <AnimatedIcon className="h-5 w-5">
                  <ChartBarIcon className="h-3.5 w-3.5" />
                </AnimatedIcon>
                Market Trends
              </span>
            </NavLink>

            <NavLink to="/how-we-sell" className={navLink} title="How We Sell">
              <span className="inline-flex items-center gap-1">
                <AnimatedIcon className="h-5 w-5">
                  <DocumentTextIcon className="h-3.5 w-3.5" />
                </AnimatedIcon>
                How We Sell
              </span>
            </NavLink>

            {user && <DashMenu showAgent={isAgent} showAdmin={isSuper} />}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-1 sm:gap-1.5 justify-self-end">
            <Link
              to="/saved"
              className="relative group rounded-lg p-1 hover:bg-white/30 transition-all duration-200"
              title="Saved homes"
              aria-label="Saved homes"
              onClick={() => setNavOpen(false)}
              style={{ outlineColor: BC_BLUE }}
            >
              <AnimatedIcon>
                <HeartIcon className="h-4.5 w-4.5 text-rose-600 group-hover:scale-110 transition-transform" />
              </AnimatedIcon>
            </Link>

            <Link
              to="/chat"
              className="group rounded-lg p-1 hover:bg-white/30 transition-all duration-200"
              title="Chat"
              aria-label="Chat"
              onClick={() => setNavOpen(false)}
              style={{ outlineColor: BC_BLUE }}
            >
              <AnimatedIcon>
                <ChatBubbleLeftRightIcon className="h-4.5 w-4.5 text-slate-800 group-hover:scale-110 transition-transform" />
              </AnimatedIcon>
            </Link>

            <NotificationBell
              onRequireAuth={() => {
                setAuthMode("login");
                setAuthOpen(true);
              }}
            />

            {!user ? (
              <div className="hidden sm:flex items-center gap-1.5 ml-1">
                <button
                  onClick={() => handleAuthClick("login")}
                  className="h-8 px-3 rounded-lg border bg-white/80 font-medium text-xs shadow-xs hover:bg白 transition-all duration-200 backdrop-blur-sm"
                  aria-label="Login"
                  style={{ color: BC_BLUE, borderColor: `${BC_GREEN}40` }}
                >
                  Login
                </button>
                <button
                  onClick={() => handleAuthClick("signup")}
                  className="h-8 px-3 rounded-lg text-white font-semibold text-xs shadow-md transition-all duration-200 backdrop-blur-sm"
                  aria-label="Sign up"
                  style={{ background: `linear-gradient(90deg, ${BC_GREEN}, ${BC_BLUE})` }}
                >
                  Sign up
                </button>
              </div>
            ) : (
              <ProfileMenu
                displayName={displayName}
                signOut={signOut}
                role={role}
                onClose={() => setProfileOpen(false)}
                profileOpen={profileOpen}
                setProfileOpen={setProfileOpen}
                profileRef={profileRef}
                userEmail={(user as any)?.email || null}
                avatarUrl={(user as any)?.user_metadata?.avatar_url || null}
              />
            )}
          </div>
        </div>
      </header>

      {/* Mobile Nav (new component) */}
      <PrimaryMobileNav
        id={menuId}
        open={navOpen}
        onClose={() => setNavOpen(false)}
        returnFocusRef={menuBtnRef}
        user={!!user}
        role={role || null}
        onAuthClick={handleAuthClick}
      />

      {/* Seller Insights Strip */}
      <div ref={stripRef} className="w-full">
        <div className="px-3 md:px-4 lg:px-6 xl:max-w-screen-2xl xl:mx-auto xl:px-8">
          <SellerInsightsStrip
            height={48}
            floating={isHome}
            badgeTo="/seller-insights"
            ctaTo="/find-comparable"
            collapsedTo="/seller-insights"
            onCtaClick={() => nav("/find-comparable")}
          />
        </div>
      </div>

      {!user && <AuthDialog open={authOpen} initialMode={authMode} onClose={() => setAuthOpen(false)} />}

      <style>{`
        @keyframes gradient-float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-1px); }
        }
        .animate-gradient-float { animation: gradient-float 3s ease-in-out infinite; }
      `}</style>
    </>
  );
}
