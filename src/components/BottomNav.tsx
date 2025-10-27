import { useLocation, useNavigate } from "react-router-dom";
import {
  MagnifyingGlassIcon,
  HeartIcon,
  MapPinIcon,
  CalendarDaysIcon,
  UserIcon,
  ChatBubbleLeftRightIcon,
} from "@heroicons/react/24/outline";
import {
  MagnifyingGlassIcon as MagnifyingGlassSolid,
  HeartIcon as HeartSolid,
  MapPinIcon as MapPinSolid,
  CalendarDaysIcon as CalendarDaysSolid,
  UserCircleIcon as UserSolid,
  ChatBubbleLeftRightIcon as ChatBubbleLeftRightSolid,
} from "@heroicons/react/24/solid";
import clsx from "clsx";
import { useCallback } from "react";

type Props = {
  /** Saved properties badge count */
  savedCount?: number;
  /** Tours badge count */
  toursCount?: number;
  /** If you're on the map page, this toggles between map/list view */
  onToggleMapView?: () => void;
  /** If provided, shows "active" for Map when true (use on map pages) */
  mapActiveOverride?: boolean;
};

const BLUE = "#2563eb";

export default function BottomNav({
  savedCount = 0,
  toursCount = 0,
  onToggleMapView,
  mapActiveOverride,
}: Props) {
  const { pathname } = useLocation();
  const nav = useNavigate();

  // active checks
  const isHome = pathname === "/" || pathname.startsWith("/search");
  const isSaved = pathname.startsWith("/featured") || pathname.startsWith("/saved");
  const isMap = mapActiveOverride ?? pathname.startsWith("/map");
  const isChat = pathname.startsWith("/chat");
  const isTours = pathname.startsWith("/tours");
  const isProfile = pathname.startsWith("/profile") || pathname.startsWith("/account");

  // simple haptic (Vibration API; safe no-op on desktop)
  const haptic = useCallback(() => {
    try {
      if ("vibrate" in navigator) navigator.vibrate(10);
    } catch {}
  }, []);

  // container height: 56px + safe area. We use h-14 + extra bottom padding.
  return (
    <nav
      role="tablist"
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-50 border-t bg-white shadow-[0_-2px_10px_rgba(0,0,0,0.1)] md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {/* 6 items now (added Chat) */}
      <div className="grid h-14 grid-cols-6">
        {/* Search */}
        <TabItem
          label="Search"
          active={isHome}
          onClick={() => {
            haptic();
            nav("/");
          }}
          OutlineIcon={MagnifyingGlassIcon}
          SolidIcon={MagnifyingGlassSolid}
        />

        {/* Saved */}
        <TabItem
          label="Saved"
          active={isSaved}
          onClick={() => {
            haptic();
            nav("/featured");
          }}
          OutlineIcon={HeartIcon}
          SolidIcon={HeartSolid}
          badge={savedCount}
        />

        {/* Map (toggle if handler provided) */}
        <TabItem
          label={onToggleMapView ? "Map / List" : "Map"}
          active={isMap}
          onClick={() => {
            haptic();
            if (onToggleMapView) onToggleMapView();
            else nav("/map");
          }}
          OutlineIcon={MapPinIcon}
          SolidIcon={MapPinSolid}
        />

        {/* Chat */}
        <TabItem
          label="Chat"
          active={isChat}
          onClick={() => {
            haptic();
            nav("/chat");
          }}
          OutlineIcon={ChatBubbleLeftRightIcon}
          SolidIcon={ChatBubbleLeftRightSolid}
        />

        {/* Tours */}
        <TabItem
          label="Tours"
          active={isTours}
          onClick={() => {
            haptic();
            nav("/tours");
          }}
          OutlineIcon={CalendarDaysIcon}
          SolidIcon={CalendarDaysSolid}
          badge={toursCount}
        />

        {/* Profile */}
        <TabItem
          label="Profile"
          active={isProfile}
          onClick={() => {
            haptic();
            nav("/account");
          }}
          OutlineIcon={UserIcon}
          SolidIcon={UserSolid}
        />
      </div>
    </nav>
  );
}

type TabItemProps = {
  label: string;
  active?: boolean;
  onClick: () => void;
  OutlineIcon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  SolidIcon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  badge?: number;
};

function TabItem({
  label,
  active = false,
  onClick,
  OutlineIcon,
  SolidIcon,
  badge = 0,
}: TabItemProps) {
  return (
    <button
      role="tab"
      aria-selected={active}
      aria-label={label}
      className={clsx(
        "relative flex flex-col items-center justify-center gap-0.5 transition-all",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 active:scale-95"
      )}
      onClick={onClick}
    >
      <div className={clsx("relative transition-transform", active ? "scale-110" : "scale-100")}>
        {active ? (
          <SolidIcon width={24} height={24} color={BLUE} />
        ) : (
          <OutlineIcon width={24} height={24} className="text-slate-500" />
        )}

        {badge > 0 && (
          <span className="absolute -right-2 -top-1 min-w-[18px] rounded-full bg-red-500 px-1 text-center text-[10px] font-semibold leading-[18px] text-white">
            {badge > 99 ? "99+" : badge}
          </span>
        )}
      </div>
      <span
        className={clsx(
          "text-[11px] leading-none transition-colors",
          active ? "font-semibold text-[#2563eb]" : "font-medium text-slate-500"
        )}
      >
        {label}
      </span>
      {/* active indicator bar */}
      <span
        aria-hidden
        className={clsx(
          "absolute inset-x-6 bottom-0 h-0.5 rounded-full transition-opacity",
          active ? "bg-[#2563eb] opacity-100" : "opacity-0"
        )}
      />
    </button>
  );
}
