import React, { useEffect, useMemo, useState } from "react";
import { SparklesIcon } from "@heroicons/react/24/outline";
import { getListingFullByMls, fetchListingsDirect } from "../../utils/repliersClient";
import { fmtMoney0, getAddress, getCity } from "./index"; // barrel from mapsearch

// Pull in the same modules used on the full details page (condensed here)
import KeyFeatures from "../property/KeyFeatures";
import NeighborhoodSnapshot from "../property/NeighborhoodSnapshot";
import PropertyEstimateCard from "../property/PropertyEstimateCard";
import PropertyHistoryCard from "../property/PropertyHistoryCard";
import WhatsNearby from "../property/WhatsNearby";
import Transportation from "../property/Transportation";

type Props = {
  /** Provide either MLS id or internal id (MLS preferred) */
  mls?: string | null;
  id?: string | null;

  /** Called when user clicks the “View Details” CTA */
  onViewDetails: (href: string) => void;

  /** Called when the overlay or close is invoked by parent */
  onClose: () => void;
};

/* ─────────────────────────────────────────────────────────
   Design tokens (keep in sync with MapSearchSummary)
   ──────────────────────────────────────────────────────── */
const BLUE = "#1E90FF";
const GREEN = "#1ABC9C";
const GREEN_DARK = "#12997F";

/* ─────────────────────────────────────────────────────────
   Helpers
   ──────────────────────────────────────────────────────── */
const CDN = "https://cdn.repliers.io";
const toCdn = (path?: string | null, klass: "small" | "medium" | "large" = "medium") =>
  path ? (/^https?:\/\//i.test(path) ? path : `${CDN}/${path}?class=${klass}`) : null;

function fallbackImg(list?: any): string | null {
  const photos = (list?.photos || list?.images || list?.image_urls || []) as string[];
  if (Array.isArray(photos) && photos[0]) return toCdn(photos[0], "medium") || photos[0];
  if (typeof list?.image_url === "string") return toCdn(list.image_url, "medium") || list.image_url;
  return null;
}

function daysAgo(dateString?: string | null): number | null {
  if (!dateString) return null;
  const t = new Date(dateString).getTime();
  if (!Number.isFinite(t)) return null;
  const ms = Date.now() - t;
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
}

/* ─────────────────────────────────────────────────────────
   Types
   ──────────────────────────────────────────────────────── */
type ListingVM = {
  id?: string | null;
  mls_id?: string | null;
  price?: number | null;
  list_price?: number | null; // sometimes provided as list_price
  beds?: number | null;
  baths?: number | null;
  sqft?: number | null;
  lat?: number | null;
  lon?: number | null;
  address?: any;
  addressLine?: string;
  city?: string | null;
  price_per_sqft?: number | null;
  dom?: number | null;
  estimate_value?: number | null;
  last_updated_on?: string | null;
};

type FullVM = {
  listing: ListingVM;
  photos: string[];
  description?: string | null;
  building?: {
    bathrooms_total?: number | null;
    features?: string[];
    heating_type?: string | null;
    cooling?: string | null;
    parking_total?: number | null;
    building_type?: string | null;
    land_size?: string | null;
    built_in?: number | null;
  } | null;
  sale_history?: { date?: string | null; status?: string | null; price?: number | null }[];
  tax_history?: { year?: string | null; amount?: number | null }[];
};

/* Allow reading a few optional fields that aren’t always present in the SDK type */
type RepliersListingExtra = {
  price?: number;
  estimate_value?: number;
  last_updated_on?: string;
  list_date?: string;
};

/* ─────────────────────────────────────────────────────────
   Tiny carousel with arrow keys + dots
   ──────────────────────────────────────────────────────── */
function Carousel({
  images,
  altFor,
}: {
  images: string[];
  altFor?: string | null | undefined;
}) {
  const [i, setI] = useState(0);
  const count = images.length;
  const go = (n: number) => setI(((n % count) + count) % count);
  const next = () => go(i + 1);
  const prev = () => go(i - 1);

  // keyboard support while preview is open
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        next();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        prev();
      }
    };
    document.addEventListener("keydown", onKey, { passive: false });
    return () => document.removeEventListener("keydown", onKey);
  }, [i, count]);

  if (!count) {
    return (
      <div className="relative">
        <img
          src="/placeholder-house.jpg"
          alt={altFor || "Property photo"}
          className="w-full h-[220px] sm:h-[260px] object-cover"
        />
      </div>
    );
  }

  return (
    <div className="relative">
      <img
        src={images[i]}
        alt={altFor || `Photo ${i + 1}`}
        className="w-full h-[220px] sm:h-[260px] object-cover"
      />

      {/* tiny controls */}
      {count > 1 && (
        <>
          <button
            aria-label="Previous photo"
            className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/85 hover:bg-white text-slate-900 text-lg shadow"
            onClick={prev}
          >
            ‹
          </button>
          <button
            aria-label="Next photo"
            className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/85 hover:bg-white text-slate-900 text-lg shadow"
            onClick={next}
          >
            ›
          </button>

          {/* dots */}
          <div className="absolute left-1/2 -translate-x-1/2 bottom-2 flex gap-1">
            {images.map((_, idx) => (
              <button
                key={idx}
                aria-label={`Go to photo ${idx + 1}`}
                onClick={() => go(idx)}
                className={`h-1.5 w-1.5 rounded-full ${idx === i ? "bg-white" : "bg-white/60"}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Minimal “card” detail used only inside MapSearchSummary’s overlay.
   ──────────────────────────────────────────────────────── */
export default function PropertyDetailPreview({ mls, id, onViewDetails, onClose }: Props) {
  const [loading, setLoading] = useState(true);
  const [full, setFull] = useState<FullVM | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [comps, setComps] = useState<ListingVM[]>([]);

  // fetch
  useEffect(() => {
    let cancel = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        if (!mls && !id) throw new Error("Invalid preview request.");

        if (mls) {
          const raw = await getListingFullByMls(mls);
          if (cancel) return;

          const listingRaw = raw.listing as (typeof raw.listing & RepliersListingExtra);

          const listing: ListingVM = {
            id: listingRaw?.id ?? null,
            mls_id: listingRaw?.mls_id ?? mls,
            price: listingRaw?.list_price ?? listingRaw?.price ?? null,
            list_price: listingRaw?.list_price ?? null,
            beds: listingRaw?.beds ?? null,
            baths: listingRaw?.baths ?? null,
            sqft: listingRaw?.sqft ?? null,
            lat: listingRaw?.lat ?? null,
            lon: listingRaw?.lon ?? null,
            address: listingRaw?.address ?? null,
            addressLine: getAddress(listingRaw || {}),
            city: getCity(listingRaw || {}),
            price_per_sqft: listingRaw?.price_per_sqft ?? null,
            dom: listingRaw?.dom ?? daysAgo(listingRaw?.list_date) ?? null,
            estimate_value: listingRaw?.estimate_value ?? null,
            last_updated_on: listingRaw?.last_updated_on ?? null,
          };

          const photos: string[] = (raw.photos || [])
            .map((p: string) => toCdn(p, "medium") || p)
            .filter(Boolean) as string[];

          const vm: FullVM = {
            listing,
            photos,
            description: (raw as any)?.description ?? null,
            building: (raw as any)?.building || null,
            sale_history: (raw as any)?.sale_history || [],
            tax_history: (raw as any)?.tax_history || [],
          };
          setFull(vm);

          // Nearby comps (very small bbox for preview)
          if (listing.lat && listing.lon) {
            const d = 0.3;
            const sim = await fetchListingsDirect({
              west: listing.lon - d,
              south: listing.lat - d,
              east: listing.lon + d,
              north: listing.lat + d,
              status: "A",
              limit: 150,
              dropUnmappable: true,
            });
            if (!cancel) {
              const arr: ListingVM[] = (sim as any[])
                .filter((s: any) => s.mls_id !== listing.mls_id)
                .map((s: any) => ({
                  id: s.id,
                  mls_id: s.mls_id,
                  price: s.list_price ?? null,
                  beds: s.beds ?? null,
                  baths: s.baths ?? null,
                  sqft: s.sqft ?? null,
                  address: s.address ?? null,
                  city: s.city ?? null,
                  price_per_sqft: s.price_per_sqft ?? null,
                  lat: s.lat ?? null,
                  lon: s.lon ?? null,
                }));
              setComps(arr);
            }
          }
        } else if (id) {
          // We intentionally prefer MLS flows; without MLS we keep this minimal.
          setError("Preview requires an MLS® number.");
        }
      } catch (e: any) {
        if (!cancel) setError(e?.message || "Failed to load preview.");
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [mls, id]);

  const priceText = useMemo(() => {
    const n = (full?.listing?.list_price ?? full?.listing?.price) ?? null;
    return n != null ? fmtMoney0(n) : "—";
  }, [full?.listing?.list_price, full?.listing?.price]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-700">Loading…</div>
    );
  }
  if (error || !full) {
    return (
      <div className="p-6 text-center text-rose-700">
        {error || "Unable to load preview."}
      </div>
    );
  }

  const href = `/property/${encodeURIComponent(`mls:${full.listing.mls_id}`)}`;

  return (
    <div
      className="flex flex-col h-full bg-white"
      // keep the compact, phone-card feel even if parent grows wider
      style={{ maxWidth: 400 }}
    >
      {/* header */}
      <div
        className="flex items-center justify-between h-12 px-5 border-b bg-white/95"
        style={{ borderColor: "#e2e8f0" }}
      >
        <div className="flex items-center gap-2">
          <SparklesIcon className="h-5 w-5" style={{ color: BLUE }} />
          <div className="font-semibold">Property Preview</div>
        </div>
        <button
          className="h-9 w-9 rounded-lg hover:bg-slate-100"
          onClick={onClose}
          aria-label="Close preview"
        >
          <span className="text-slate-600 text-lg">×</span>
        </button>
      </div>

      {/* body */}
      <div className="flex-1 overflow-auto">
        {/* media / carousel */}
        <Carousel
          images={full.photos?.length ? full.photos : [fallbackImg(full) || "/placeholder-house.jpg"]}
          altFor={full.listing.addressLine || "Property photo"}
        />

        {/* price + address */}
        <div className="px-4 py-3 border-b bg-white/95" style={{ borderColor: "#e2e8f0" }}>
          <div className="text-xl font-extrabold text-slate-900">{priceText}</div>
          <div className="text-slate-700 text-sm">
            {[full.listing.addressLine, full.listing.city].filter(Boolean).join(", ") || "—"}
          </div>
          <div className="mt-2 flex items-center gap-4 text-slate-700 text-sm">
            <span><strong>{typeof full.listing.beds === "number" ? full.listing.beds : "—"}</strong>&nbsp;bd</span>
            <span><strong>{typeof full.listing.baths === "number" ? full.listing.baths : "—"}</strong>&nbsp;ba</span>
            <span>
              <strong>
                {typeof full.listing.sqft === "number"
                  ? full.listing.sqft.toLocaleString()
                  : full.listing.sqft ?? "—"}
              </strong>
              &nbsp;sqft
            </span>
          </div>
        </div>

        {/* condensed details sections */}
        <div className="p-4 space-y-4">
          {/* Key Features (with small set of fields) */}
          <KeyFeatures listing={{
            address: full.listing.address,
            property_type: full?.building?.building_type || null,
            beds: full.listing.beds ?? null,
            baths: full.listing.baths ?? null,
            sqft: full.listing.sqft ?? null,
          }} building={{
            building_type: full?.building?.building_type ?? null,
            parking_total: full?.building?.parking_total ?? null
          }} />

          {/* Neighborhood Snapshot (heuristic) */}
          <NeighborhoodSnapshot
            listing={{
              dom: full.listing.dom ?? null,
              price: (full.listing.list_price ?? full.listing.price) ?? null,
              sqft: full.listing.sqft ?? null,
              price_per_sqft: full.listing.price_per_sqft ?? null,
            }}
            building={{
              parking_total: full?.building?.parking_total ?? null,
              cooling: full?.building?.cooling ?? null,
              heating_type: full?.building?.heating_type ?? null,
            }}
            comps={comps}
            radiusKm={3}
          />

          {/* Estimate */}
          <PropertyEstimateCard
            daysOnMarket={full.listing.dom ?? null}
            estimatedValue={full.listing.estimate_value ?? null}
            lastUpdatedOn={full.listing.last_updated_on ?? null}
          />

          {/* Property history (if any) */}
          <PropertyHistoryCard
            sales={(full as any).sale_history}
            taxes={(full as any).tax_history}
          />

          {/* Quick links */}
          <WhatsNearby lat={full.listing.lat} lon={full.listing.lon} />
          <Transportation lat={full.listing.lat} lon={full.listing.lon} />

          {/* Description snippet (keep short for preview) */}
          {full.description && (
            <section
              className="glass-card rounded-3xl border border-slate-200 p-4"
            >
              <h2 className="text-lg font-bold text-slate-800 mb-2">Description</h2>
              <p className="text-slate-700 text-sm">
                {full.description.length > 320 ? `${full.description.slice(0, 320)}…` : full.description}
              </p>
            </section>
          )}
        </div>
      </div>

      {/* footer actions */}
      <div
        className="p-4 flex gap-2 border-t bg-white/95"
        style={{ borderColor: "#e2e8f0" }}
      >
        <button
          className="flex-1 h-10 rounded-xl text-white font-semibold"
          style={{ background: `linear-gradient(90deg, ${GREEN}, ${GREEN_DARK})` }}
          onClick={() => onViewDetails(href)}
        >
          View Details
        </button>
        <button
          className="h-10 px-4 rounded-xl border bg-white"
          style={{ borderColor: "#e2e8f0", color: "#0f172a" }}
          onClick={onClose}
        >
          Close
        </button>
      </div>

      <style>{`
        .glass-card{
          backdrop-filter:blur(14px) saturate(160%);
          background:rgba(255,255,255,0.76);
          box-shadow:0 6px 32px 0 rgba(60,90,120,0.08),0 1.5px 5px 0 rgba(16,20,30,0.06)
        }
      `}</style>
    </div>
  );
}
