import React, { useEffect, useRef } from "react";
import { Link, NavLink } from "react-router-dom";
import {
  HomeIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  DocumentTextIcon,
  CalendarIcon,
  ChatBubbleLeftRightIcon,
  InboxStackIcon,
} from "@heroicons/react/24/outline";

type Props = {
  id: string;
  open: boolean;
  onClose: () => void;
  returnFocusRef?: React.RefObject<HTMLElement>;
  user: boolean;
  role: string | null;
  onAuthClick: (mode: "login" | "signup") => void;
};

const BC_BLUE = "#1E90FF";
const BC_GREEN = "#1ABC9C";

export default function PrimaryMobileNav({
  id,
  open,
  onClose,
  returnFocusRef,
  user,
  role,
  onAuthClick,
}: Props) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const firstFocusable = useRef<HTMLAnchorElement | HTMLButtonElement | null>(null);

  // Body scroll lock
  useEffect(() => {
    if (!open) return;
    const { overflow, paddingRight } = document.body.style;
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    if (scrollbar > 0) document.body.style.paddingRight = `${scrollbar}px`;
    return () => {
      document.body.style.overflow = overflow;
      document.body.style.paddingRight = paddingRight;
    };
  }, [open]);

  // ESC / focus trap / outside click
  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab") {
        const focusables = panelRef.current?.querySelectorAll<HTMLElement>(
          'a[href],button:not([disabled]),[tabindex]:not([tabindex="-1"])'
        );
        if (!focusables || focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault(); (last as HTMLElement).focus(); return;
        }
        if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault(); (first as HTMLElement).focus(); return;
        }
      }
    };

    const onClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (panelRef.current && !panelRef.current.contains(target)) onClose();
    };

    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open, onClose]);

  // Focus management
  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => firstFocusable.current?.focus());
    } else {
      returnFocusRef?.current?.focus();
    }
  }, [open, returnFocusRef]);

  const isAgent = role === "agent" || role === "superadmin";
  const isSuper = role === "superadmin";

  const itemCls =
    "block w-full text-left px-4 py-3 text-base rounded-xl transition-all duration-200 font-medium backdrop-blur-sm border text-slate-600 hover:bg-white/50 active:scale-95";

  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden={!open}
        className={["md:hidden fixed inset-0 z-40 transition-opacity", open ? "opacity-100 bg-black/30" : "opacity-0 pointer-events-none"].join(" ")}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        id={id}
        role="menu"
        aria-label="Mobile navigation"
        aria-hidden={!open}
        className={[
          "md:hidden fixed inset-x-0 top-16 z-50 px-4",
          "transition-all duration-300",
          open ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4 pointer-events-none",
        ].join(" ")}
      >
        <nav
          ref={panelRef}
          className="py-4 grid gap-1 rounded-2xl bg-white/95 backdrop-blur border shadow-2xl"
          style={{ borderColor: "rgba(226,232,240,0.6)" }}
        >
          <NavLink
            to="/"
            role="menuitem"
            title="Home"
            onClick={onClose}
            ref={(el) => (firstFocusable.current = el)}
            className={itemCls}
          >
            <span className="inline-flex items-center gap-2">
              <HomeIcon className="h-4 w-4" /> Home
            </span>
          </NavLink>

          <NavLink to="/search" role="menuitem" title="Map Search" onClick={onClose} className={itemCls}>
            <span className="inline-flex items-center gap-2">
              <MapPinIcon className="h-4 w-4" /> Map Search
            </span>
          </NavLink>

          <NavLink
            to="/whats-my-home-worth"
            role="menuitem"
            title="What’s My Home Worth"
            onClick={onClose}
            className={itemCls}
          >
            <span className="inline-flex items-center gap-2">
              <CurrencyDollarIcon className="h-4 w-4" /> What’s My Home Worth
            </span>
          </NavLink>

          <NavLink to="/market-trends" role="menuitem" title="Market Trends" onClick={onClose} className={itemCls}>
            <span className="inline-flex items-center gap-2">
              <ChartBarIcon className="h-4 w-4" /> Market Trends
            </span>
          </NavLink>

          <NavLink to="/how-we-sell" role="menuitem" title="How We Sell" onClick={onClose} className={itemCls}>
            <span className="inline-flex items-center gap-2">
              <DocumentTextIcon className="h-4 w-4" /> How We Sell
            </span>
          </NavLink>

          <Link to="/agent/report-request" role="menuitem" onClick={onClose} className={itemCls}>
            Request Agent Report
          </Link>

          {user && (
            <>
              <Link to="/dashboard" role="menuitem" onClick={onClose} className={itemCls}>
                Dashboard
              </Link>

              {isAgent && (
                <>
                  <Link to="/agent/dashboard" role="menuitem" onClick={onClose} className={itemCls}>
                    Agent Dashboard
                  </Link>
                  <Link to="/agent/leads" role="menuitem" onClick={onClose} className={itemCls}>
                    <span className="inline-flex items-center gap-2">
                      <InboxStackIcon className="h-4 w-4" /> Lead Inbox
                    </span>
                  </Link>
                  <Link to="/agent/appointments" role="menuitem" onClick={onClose} className={itemCls}>
                    <span className="inline-flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4" /> Appointments
                    </span>
                  </Link>
                  <Link to="/agent/messages" role="menuitem" onClick={onClose} className={itemCls}>
                    <span className="inline-flex items-center gap-2">
                      <ChatBubbleLeftRightIcon className="h-4 w-4" /> Messages
                    </span>
                  </Link>
                  <Link to="/agent/reports/new" role="menuitem" onClick={onClose} className={itemCls}>
                    Prepare Agent Report
                  </Link>
                  <Link to="/agent/reports" role="menuitem" onClick={onClose} className={itemCls}>
                    Report Requests
                  </Link>
                </>
              )}

              {isSuper && (
                <Link to="/admin/dashboard" role="menuitem" onClick={onClose} className={itemCls}>
                  Admin Dashboard
                </Link>
              )}
            </>
          )}

          {!user && (
            <div className="flex flex-col gap-2 mt-4 pt-4 border-t" style={{ borderColor: "rgba(226,232,240,.6)" }}>
              <button
                onClick={() => {
                  onAuthClick("login");
                  onClose();
                }}
                className="w-full py-3 px-4 rounded-lg border bg-white/90 font-medium text-base shadow-xs hover:bg-white transition-all duration-200"
                style={{ color: BC_BLUE, borderColor: `${BC_GREEN}4d` }}
              >
                Login
              </button>
              <button
                onClick={() => {
                  onAuthClick("signup");
                  onClose();
                }}
                className="w-full py-3 px-4 rounded-lg text-white font-semibold text-base shadow-md transition-all duration-200"
                style={{ background: `linear-gradient(90deg, ${BC_GREEN}, ${BC_BLUE})` }}
              >
                Sign up
              </button>
            </div>
          )}
        </nav>
      </div>
    </>
  );
}
