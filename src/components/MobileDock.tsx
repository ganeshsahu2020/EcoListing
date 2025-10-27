import React from "react";
import { NavLink } from "react-router-dom";
import {
  MagnifyingGlassIcon as SearchIcon,
  HeartIcon,
  MapPinIcon,
  ChatBubbleLeftRightIcon as ChatIcon,
  CalendarIcon,
  UserCircleIcon as ProfileIcon,
} from "@heroicons/react/24/outline";

const itemBase =
  "flex flex-col items-center justify-center gap-1 flex-1 py-2 text-[11px] font-medium";
const itemIdle =
  "text-slate-500 hover:text-slate-900";
const itemActive =
  "text-slate-900";

export default function MobileDock({
  savedCount = 0,
  toursCount = 0,
}: {
  savedCount?: number;
  toursCount?: number;
}) {
  return (
    <div
      className={[
        // fixed on top of everything
        "md:hidden fixed inset-x-0 bottom-0 z-[60]",
        // ensure it accepts taps
        "pointer-events-auto",
        // glass + border
        "bg-white/95 backdrop-blur border-t",
      ].join(" ")}
      style={{ borderColor: "rgba(226,232,240,.6)" }}
    >
      <nav className="flex items-stretch">
        <NavLink to="/find" className={({ isActive }) => [itemBase, isActive ? itemActive : itemIdle].join(" ")}>
          <SearchIcon className="h-5 w-5" />
          <span>Search</span>
        </NavLink>

        <NavLink to="/saved" className={({ isActive }) => [itemBase, isActive ? itemActive : itemIdle].join(" ")}>
          <div className="relative">
            <HeartIcon className="h-5 w-5" />
            {savedCount > 0 && (
              <span className="absolute -top-1 -right-2 h-4 min-w-[16px] px-1 rounded-full text-[10px] leading-4 text-white text-center"
                    style={{ background: "linear-gradient(90deg,#1E90FF,#1ABC9C)" }}>
                {Math.min(99, savedCount)}
              </span>
            )}
          </div>
          <span>Saved</span>
        </NavLink>

        {/* Your map route is /search in Header — keep it consistent */}
        <NavLink to="/search" className={({ isActive }) => [itemBase, isActive ? itemActive : itemIdle].join(" ")}>
          <MapPinIcon className="h-5 w-5" />
          <span>Map</span>
        </NavLink>

        <NavLink to="/chat" className={({ isActive }) => [itemBase, isActive ? itemActive : itemIdle].join(" ")}>
          <ChatIcon className="h-5 w-5" />
          <span>Chat</span>
        </NavLink>

        <NavLink to="/appointments" className={({ isActive }) => [itemBase, isActive ? itemActive : itemIdle].join(" ")}>
          <div className="relative">
            <CalendarIcon className="h-5 w-5" />
            {toursCount > 0 && (
              <span className="absolute -top-1 -right-2 h-4 min-w-[16px] px-1 rounded-full text-[10px] leading-4 text-white text-center"
                    style={{ background: "linear-gradient(90deg,#1E90FF,#1ABC9C)" }}>
                {Math.min(99, toursCount)}
              </span>
            )}
          </div>
          <span>Tours</span>
        </NavLink>

        <NavLink to="/dashboard" className={({ isActive }) => [itemBase, isActive ? itemActive : itemIdle].join(" ")}>
          <ProfileIcon className="h-5 w-5" />
          <span>Profile</span>
        </NavLink>
      </nav>
      {/* iOS safe area */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </div>
  );
}
