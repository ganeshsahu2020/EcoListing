import React from "react";
import { GlassButton, GlassCard } from "../GlassUI";
import { fmtMoney0, getPinIcon } from "./utils";
import { Listing } from "./types";

type Props = {
  listing: Listing;
  onView: (l: Listing) => void;
  onContact: (l: Listing) => void;
  onCenter: (l: Listing) => void;
  saved: boolean;
  onToggleSave: (id: string) => void;
};

export default function ListingCard({
  listing: l,
  onView,
  onContact,
  onCenter,
  saved,
  onToggleSave,
}: Props) {
  return (
    <GlassCard
      className="flex gap-3 items-center px-3 py-3 group transition border border-transparent hover:border-blue-300"
      tabIndex={0}
      aria-label={`Listing at ${l.address}, ${l.city}`}
      onClick={() => onView(l)}
      onKeyDown={(e) => e.key === "Enter" && onView(l)}
    >
      <div className="flex items-center justify-center w-16 h-16 rounded-lg overflow-hidden bg-slate-100">
        {l.image_url ? (
          <img
            src={l.image_url}
            alt="Listing"
            className="w-16 h-16 object-cover"
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          getPinIcon(l.property_type)
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="font-bold text-[17px] text-blue-700 group-hover:underline">
          {fmtMoney0(l.list_price)}
        </div>
        <div className="text-slate-600 text-sm truncate">
          {[l.address, l.city].filter(Boolean).join(", ") || "—"}
        </div>
        <div className="flex gap-3 mt-1 text-xs text-slate-500">
          {l.beds != null && <span>🛏 {l.beds}</span>}
          {l.baths != null && <span>🛁 {l.baths}</span>}
          {l.sqft != null && <span>📐 {Number(l.sqft).toLocaleString()} sqft</span>}
          {l.price_per_sqft != null && <span>$/ft² {l.price_per_sqft}</span>}
        </div>
      </div>

      <div className="flex flex-col items-end gap-2">
        <div className="flex gap-2">
          <GlassButton
            className="bg-gradient-to-r from-blue-600 to-emerald-400 text-white px-4 py-1.5 rounded-full font-bold text-xs shadow"
            onClick={(e) => {
              e.stopPropagation();
              onView(l);
            }}
          >
            View details
          </GlassButton>
          <GlassButton
            className="bg-gradient-to-r from-indigo-600 to-emerald-500 text-white px-4 py-1.5 rounded-full font-bold text-xs shadow"
            onClick={(e) => {
              e.stopPropagation();
              onContact(l);
            }}
            aria-label="Contact Agent"
            title="Contact Agent"
          >
            Contact Agent →
          </GlassButton>
        </div>
        <button
          className={`text-xs ${saved ? "text-rose-600" : "text-blue-600"} underline`}
          onClick={(e) => {
            e.stopPropagation();
            onToggleSave(l.id);
          }}
        >
          {saved ? "Saved" : "Save"}
        </button>
        <button
          className="text-[11px] text-blue-600 underline"
          onClick={(e) => {
            e.stopPropagation();
            onCenter(l);
          }}
        >
          Center on map
        </button>
      </div>
    </GlassCard>
  );
}
