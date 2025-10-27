// ui/src/components/ListingCard.tsx
import React from "react";
import { Link } from "react-router-dom";
import { HeartIcon } from "@heroicons/react/24/outline";

type Props = {
  id: string;
  href: string;
  image?: string | null;
  price: string;
  beds: number | string;
  baths: number | string;
  sqft: string | number;
  address: string;
  hood?: string;
  status?: string;
  agent?: string;
  saved?: boolean;
  canSave?: boolean;
};

export default function ListingCard({
  href,
  image,
  price,
  beds,
  baths,
  sqft,
  address,
  hood,
  status,
  saved = false,
  canSave = false,
}: Props) {
  return (
    <Link
      to={href}
      className="group block rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition"
    >
      <div className="relative overflow-hidden rounded-t-2xl">
        <div className="aspect-[16/10] w-full bg-slate-100">
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          <img
            src={image || "/placeholder-house.jpg"}
            loading="lazy"
            decoding="async"
            draggable={false}
            className="h-full w-full object-cover"
            onError={(e) => {
              const el = e.currentTarget;
              if (el.src.endsWith("placeholder-house.jpg")) return;
              el.src = "/placeholder-house.jpg";
            }}
          />
        </div>

        {status && (
          <span className="absolute left-3 top-3 rounded-md bg-black/70 px-2 py-1 text-xs font-medium text-white">
            {status}
          </span>
        )}

        <button
          type="button"
          aria-label="Save"
          className="absolute right-3 top-3 rounded-full bg-white/90 p-2 shadow hover:bg-white"
          onClick={(e) => e.preventDefault()}
          disabled={!canSave}
        >
          <HeartIcon className={`h-5 w-5 ${saved ? "fill-rose-500 text-rose-500" : "text-slate-700"}`} />
        </button>
      </div>

      <div className="p-4">
        <div className="mb-1 text-xl font-semibold text-slate-900">{price}</div>
        <div className="mb-2 text-sm text-slate-700">
          {typeof hood === "string" && hood ? `in ${hood}` : null}
        </div>

        <div className="mb-3 line-clamp-1 text-slate-800">{address}</div>

        <div className="flex items-center gap-4 text-sm text-slate-600">
          <span>{beds || 0} bd</span>
          <span>{baths || 0} ba</span>
          <span>{typeof sqft === "number" ? sqft.toLocaleString() : String(sqft)} sqft</span>
        </div>
      </div>
    </Link>
  );
}
