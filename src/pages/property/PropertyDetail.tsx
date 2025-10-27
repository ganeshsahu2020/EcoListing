import React, { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getListingFullByMls, fetchListingsDirect } from "../../utils/repliersClient";
import { ArrowLeftIcon, ChatBubbleOvalLeftEllipsisIcon } from "@heroicons/react/24/outline";

import KeyFeatures from "../../components/property/KeyFeatures";
import ScheduleViewingCard from "../../components/property/ScheduleViewingCard";
import PropertyMap from "../../components/property/PropertyMap";
import MortgageCalculator, { MortgageForm } from "../../components/property/MortgageCalculator";
import ClosingCostsCard, { ClosingForm } from "../../components/property/ClosingCostsCard";

// NEW: tiny presentational cards
import PropertyEstimateCard from "../../components/property/PropertyEstimateCard";
import PropertyHistoryCard from "../../components/property/PropertyHistoryCard";

// NEW: extracted feature modules
import EnergyMonthlyCostEstimator from "../../components/property/EnergyMonthlyCostEstimator";
import NeighborhoodSnapshot from "../../components/property/NeighborhoodSnapshot";
import WhatsNearby from "../../components/property/WhatsNearby";
import Transportation from "../../components/property/Transportation";
import NearByComp from "../../components/property/NearByComp";
import OpenHouseCalendar from "../../components/property/OpenHouseCalendar";
import StructuredMedia from "../../components/property/StructuredMedia";
import AccessibilityPolish from "../../components/property/AccessibilityPolish";

/* ─────────────────────────────────────────────────────────
   BC Design Tokens
   ──────────────────────────────────────────────────────── */
const BC_BLUE = "#1E90FF";   // active/links
const BC_GREEN = "#1ABC9C";  // CTAs
const BC_GREEN_DARK = "#12997F";

/* ─────────────────────────────────────────────────────────
   Helpers & utils
   ──────────────────────────────────────────────────────── */
const CDN = "https://cdn.repliers.io";
const toCdn = (path?: string | null, klass: "small" | "medium" | "large" = "large") =>
  path ? (/^https?:\/\//i.test(path) ? path : `${CDN}/${path}?class=${klass}`) : null;

const fmtMoney = (n?: number | null) =>
  typeof n === "number"
    ? n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })
    : "—";

const titleize = (s?: string | null) => (s ?? "").replace(/\b\w/g, (ch) => ch.toUpperCase());

function fmtAddress(addr: any): string | undefined {
  if (!addr) return undefined;
  if (typeof addr === "string") return addr;
  const unit = addr.unitNumber || addr.UnitNumber || "";
  const bits = [
    addr.streetNumber || addr.StreetNumber,
    addr.streetDirectionPrefix || addr.streetDirection || addr.StreetDirection || "",
    addr.streetName || addr.StreetName,
    addr.streetSuffix || addr.StreetSuffix || "",
  ]
    .filter(Boolean)
    .join(" ");
  const city = addr.city || addr.City;
  return [unit && `#${unit}`, bits, city].filter(Boolean).join(", ") || addr.addressKey || undefined;
}

/* ─────────────────────────────────────────────────────────
   Types
   ──────────────────────────────────────────────────────── */
type RoomVM = { level?: string | null; name?: string | null; dim_imperial?: string | null; dim_metric?: string | null };
type SaleEventVM = { date?: string | null; status?: string | null; price?: number | null };
type ListingVM = {
  id?: string | null;
  mls_id?: string | null;
  price?: number | null;
  beds?: number | null;
  baths?: number | null;
  sqft?: number | null;
  address?: any;
  city?: string | null;
  status?: string | null;
  property_type?: string | null;
  year_built?: number | null;
  lot_sqft?: number | null;
  dom?: number | null;
  price_per_sqft?: number | null;
  lat?: number | null;
  lon?: number | null;
  image_url?: string | null;
  estimate_value?: number | null;
  last_updated_on?: string | null;
};
type FullVM = {
  listing: ListingVM;
  photos: string[];
  description?: string | null;
  virtualTourUrl?: string | null;
  rooms?: RoomVM[];
  measurements?: { square_footage?: number | null; total_finished_area?: number | null };
  building?: {
    bathrooms_total?: number | null;
    features?: string[];
    heating_type?: string | null;
    cooling?: string | null;
    fireplace?: number | null;
    parking_total?: number | null;
    building_type?: string | null;
    title?: string | null;
    neighbourhood?: string | null;
    land_size?: string | null;
    built_in?: number | null;
    annual_taxes?: number | null;
    time_on_portal?: string | null;
    view?: string | null;
  };
  sale_history?: SaleEventVM[];
  tax_history?: { year?: string | null; amount?: number | null }[];
  land?: { view?: string | null; access?: string | null; zoning_description?: string | null; zoning_type?: string | null; lot_features?: string[] };
};

/* Extend Repliers listing with optional fields we read defensively */
type RepliersListingExtra = {
  price?: number;
  estimate_value?: number;
  last_updated_on?: string;
};

/* JSON-LD */
function ListingJsonLd({ listing }: { listing: ListingVM }) {
  const address = fmtAddress(listing.address) || "";
  const json = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: address || "Property",
    description: "Real estate listing",
    brand: listing.property_type || "Home",
    sku: listing.mls_id || listing.id || "",
    offers: {
      "@type": "Offer",
      price: listing.price || "",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
    },
    additionalProperty: [
      { "@type": "PropertyValue", name: "Beds", value: listing.beds ?? "" },
      { "@type": "PropertyValue", name: "Baths", value: listing.baths ?? "" },
      { "@type": "PropertyValue", name: "SquareFeet", value: listing.sqft ?? "" },
    ],
  };
  return (
    <script
      type="application/ld+json"
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }}
    />
  );
}

/* ─────────────────────────────────────────────────────────
   Small components
   ──────────────────────────────────────────────────────── */
function StickyCTA(props: {
  show: boolean;
  priceText: string;
  onContact: () => void;
  onSchedule: () => void;
  saved: boolean;
  onToggleSave: () => void;
}) {
  if (!props.show) return null;
  return (
    <div
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur border-t border-slate-200"
      role="region"
      aria-label="Mobile call to action"
    >
      <div className="mx-auto max-w-7xl px-3 py-2 flex items-center gap-2">
        <div className="font-extrabold text-lg text-slate-900">{props.priceText}</div>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={props.onToggleSave}
            className={`rounded-full px-3 py-2 text-sm border focus-visible:ring-2`}
            style={{
              borderColor: props.saved ? "transparent" : "#e2e8f0",
              background: props.saved ? BC_BLUE : "white",
              color: props.saved ? "white" : "#334155",
              outlineColor: BC_BLUE
            }}
          >
            {props.saved ? "Saved" : "Save"}
          </button>
          <button
            onClick={props.onContact}
            className="rounded-full px-3 py-2 text-sm text-white shadow focus-visible:ring-2"
            style={{ background: `linear-gradient(90deg, ${BC_GREEN}, ${BC_GREEN_DARK})`, outlineColor: BC_BLUE }}
          >
            Contact
          </button>
          <button
            onClick={props.onSchedule}
            className="rounded-full px-3 py-2 text-sm text-white shadow focus-visible:ring-2"
            style={{ background: `linear-gradient(90deg, ${BC_GREEN}, ${BC_GREEN_DARK})`, outlineColor: BC_BLUE }}
          >
            Schedule
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Lightbox (new)
   ──────────────────────────────────────────────────────── */
function Lightbox({
  images,
  startIndex,
  onClose,
}: {
  images: string[];
  startIndex: number;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(startIndex);
  const count = images.length || 0;
  const go = (i: number) => setIndex(((i % count) + count) % count);
  const next = () => go(index + 1);
  const prev = () => go(index - 1);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        next();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        prev();
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener("keydown", onKey, { passive: false });
    closeBtnRef.current?.focus();
    return () => document.removeEventListener("keydown", onKey as any);
  }, [index, onClose]);

  if (!count) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex flex-col"
      onClick={onClose}
    >
      <div className="flex items-center justify-between text-white px-5 py-3 select-none" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3">
          <button
            ref={closeBtnRef}
            aria-label="Close"
            className="w-9 h-9 rounded-full hover:bg-white/20 flex items-center justify-center text-2xl leading-none"
            onClick={onClose}
          >
            ×
          </button>
          <span className="opacity-90 text-sm">{index + 1} of {count}</span>
        </div>
      </div>

      <div className="relative flex-1" onClick={(e) => e.stopPropagation()}>
        <img
          src={images[index]}
          alt={`Photo ${index + 1}`}
          className="absolute inset-0 m-auto max-h-full max-w-full object-contain"
          style={{ top: 0, bottom: 0, left: 0, right: 0 }}
        />

        {count > 1 && (
          <>
            <button
              aria-label="Previous"
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 hover:bg-white text-slate-900 text-2xl shadow"
              onClick={prev}
            >
              ‹
            </button>
            <button
              aria-label="Next"
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 hover:bg-white text-slate-900 text-2xl shadow"
              onClick={next}
            >
              ›
            </button>

            <div className="absolute left-1/2 -translate-x-1/2 bottom-4 flex gap-1">
              {images.map((_, i) => (
                <button
                  key={i}
                  aria-label={`Go to photo ${i + 1}`}
                  onClick={() => go(i)}
                  className={`h-2 w-2 rounded-full ${i === index ? "bg-white" : "bg-white/60"}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Main page
   ──────────────────────────────────────────────────────── */
export default function PropertyDetails() {
  const { rid = "" } = useParams();
  const navigate = useNavigate();
  const decoded = decodeURIComponent(rid);
  const isMLS = decoded.startsWith("mls:");
  const mls = isMLS ? decoded.slice(4) : null;

  // Detect preview/embed mode: ?embed=1 OR being rendered in an iframe
  const params = new URLSearchParams(window.location.search);
  const embedFromQuery = params.get("embed") === "1";
  const inIframe = (() => {
    try { return window.self !== window.top; } catch { return true; }
  })();
  const EMBED = embedFromQuery || inIframe;

  // In embed mode, add a class on <html> we can target with CSS to hide global header/footer
  useEffect(() => {
    if (EMBED) {
      document.documentElement.classList.add("is-embed");
      return () => document.documentElement.classList.remove("is-embed");
    }
  }, [EMBED]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [full, setFull] = useState<FullVM | null>(null);
  const [similar, setSimilar] = useState<ListingVM[]>([]);
  const [metric, setMetric] = useState(true);

  // Lightbox state
  const [lbOpen, setLbOpen] = useState(false);
  const [lbIndex, setLbIndex] = useState(0);

  // Controlled forms
  const [mortgage, setMortgage] = useState<MortgageForm>({
    price: 0,
    downPct: 20,
    rate: 5,
    years: 25,
    freq: "Monthly",
    annualTax: null,
    open: false,
  });
  const [closing, setClosing] = useState<ClosingForm>({
    open: false,
    downAmt: 65000,
    legal: 1800,
    titleIns: 350,
    provLtt: 2500,
    muniLtt: 0,
    rebate: 0,
    other: 600,
  });

  // Scroll mini-header trigger
  const heroRef = useRef<HTMLDivElement | null>(null);
  const [showMini, setShowMini] = useState(false);

  useEffect(() => {
    let cancel = false;
    (async () => {
      setLoading(true);
      setError(null);
      setFull(null);
      try {
        if (!isMLS || !mls) throw new Error("This detail view only supports MLS-based URLs.");
        const raw = await getListingFullByMls(mls);
        if (cancel) return;

        const listingRaw = raw.listing as (typeof raw.listing & RepliersListingExtra);

        const vm: FullVM = {
          listing: {
            id: listingRaw?.id ?? null,
            mls_id: listingRaw?.mls_id ?? mls,
            price: listingRaw?.list_price ?? (listingRaw as any)?.price ?? null,
            beds: listingRaw?.beds ?? null,
            baths: listingRaw?.baths ?? null,
            sqft: listingRaw?.sqft ?? null,
            address: listingRaw?.address ?? null,
            city: listingRaw?.city ?? null,
            status: listingRaw?.status ?? null,
            property_type: listingRaw?.property_type ?? null,
            year_built: listingRaw?.year_built ?? null,
            lot_sqft: listingRaw?.lot_sqft ?? null,
            dom: listingRaw?.dom ?? null,
            price_per_sqft: listingRaw?.price_per_sqft ?? null,
            lat: listingRaw?.lat ?? null,
            lon: listingRaw?.lon ?? null,
            image_url: listingRaw?.image_url ?? null,
            estimate_value: listingRaw?.estimate_value ?? null,
            last_updated_on: listingRaw?.last_updated_on ?? null,
          },
          photos: (raw.photos || []).map((p: string) => toCdn(p, "large") || p).filter(Boolean) as string[],
          description: (raw as any)?.description ?? null,
          virtualTourUrl: (raw as any)?.virtualTourUrl ?? null,
          rooms: (raw as any)?.rooms || [],
          measurements: (raw as any)?.measurements || {},
          building: (raw as any)?.building || {},
          sale_history: (raw as any)?.sale_history || [],
          tax_history: (raw as any)?.tax_history || [],
          land: (raw as any)?.land || {},
        };
        setFull(vm);
        setMortgage((m) => ({ ...m, price: vm.listing.price ?? 0, annualTax: vm.building?.annual_taxes ?? null }));

        // Fetch comps around subject
        if (listingRaw?.lat && listingRaw?.lon) {
          const d = 0.3;
          const sim = await fetchListingsDirect({
            west: listingRaw.lon - d,
            south: listingRaw.lat - d,
            east: listingRaw.lon + d,
            north: listingRaw.lat + d,
            status: "A",
            limit: 300,
            dropUnmappable: true,
          });
          const arr: ListingVM[] = (sim as any[])
            .filter((s: any) => s.mls_id !== vm.listing.mls_id)
            .map((s: any) => ({
              id: s.id,
              mls_id: s.mls_id,
              price: s.list_price,
              beds: s.beds ?? null,
              baths: s.baths ?? null,
              sqft: s.sqft ?? null,
              address: s.address ?? null,
              city: s.city ?? null,
              status: s.status ?? null,
              property_type: s.property_type ?? null,
              year_built: s.year_built ?? null,
              lot_sqft: s.lot_sqft ?? null,
              price_per_sqft: s.price_per_sqft ?? null,
              lat: s.lat ?? null,
              lon: s.lon ?? null,
              image_url: s.image_url ?? null,
            }));
          if (!cancel) setSimilar(arr);
        }
      } catch (e: any) {
        if (!cancel) setError(e?.message || String(e));
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [decoded, isMLS, mls]);

  // Mini-header observer
  useEffect(() => {
    if (!heroRef.current) return;
    const el = heroRef.current;
    const obs = new IntersectionObserver(
      (entries) => setShowMini(!entries[0].isIntersecting),
      { threshold: 0.01 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [heroRef.current]);

  const priceText = useMemo(() => fmtMoney(full?.listing?.price ?? null), [full?.listing?.price]);

  // Save/unsave localStorage
  function useSavedListing(mlsId?: string | null) {
    const [savedX, setSavedX] = useState(false);
    useEffect(() => {
      if (!mlsId) return;
      const list = JSON.parse(localStorage.getItem("savedListings") || "[]") as string[];
      setSavedX(list.includes(mlsId));
    }, [mlsId]);
    const toggleX = () => {
      if (!mlsId) return;
      const set = new Set<string>(JSON.parse(localStorage.getItem("savedListings") || "[]"));
      if (set.has(mlsId)) set.delete(mlsId); else set.add(mlsId);
      localStorage.setItem("savedListings", JSON.stringify([...set]));
      setSavedX((s) => !s);
    };
    return { saved: savedX, toggle: toggleX };
  }

  const { saved, toggle } = useSavedListing(full?.listing?.mls_id);

  // Summary strip
  const summary = full && (
    <div
      ref={heroRef}
      className="mt-3 rounded-2xl px-4 py-4 flex flex-wrap items-center gap-4 bg-white/90 border shadow-sm"
      role="region"
      aria-label="Listing summary"
      style={{ borderColor: "#e2e8f0", boxShadow: "0 6px 20px rgba(30,144,255,.06)" }}
    >
      <div className="text-3xl font-extrabold"
           style={{ background: `linear-gradient(90deg, ${BC_BLUE}, #60b6ff)`, WebkitBackgroundClip: "text", color: "transparent" }}>
        {priceText}
      </div>
      <div className="flex-1 min-w-[220px]">
        <div className="font-bold text-slate-900" style={{ fontSize: 18 }}>
          {fmtAddress(full?.listing?.address) || "—"}
        </div>
        <div className="text-slate-600" style={{ fontSize: 14 }}>{full?.listing?.city || ""}</div>
      </div>
      <div className="flex items-center gap-6 text-slate-800">
        <span><strong>{typeof full.listing.beds === "number" ? full.listing.beds : "—"}</strong>&nbsp;bd</span>
        <span><strong>{typeof full.listing.baths === "number" ? full.listing.baths : "—"}</strong>&nbsp;ba</span>
        <span>
          <strong>{typeof full.listing.sqft === "number" ? full.listing.sqft.toLocaleString() : full.listing.sqft ?? "—"}</strong>&nbsp;sqft
        </span>
      </div>
      <div className="flex items-center gap-2 ml-auto">
        <button
          type="button"
          aria-label="Save listing"
          onClick={toggle}
          className="rounded-full px-4 py-2 border shadow-sm font-semibold hover:bg-slate-50 focus-visible:ring-2"
          style={{
            borderColor: saved ? "transparent" : "#e2e8f0",
            background: saved ? BC_BLUE : "white",
            color: saved ? "white" : "#334155",
            outlineColor: BC_BLUE
          }}
        >
          {saved ? "Saved" : "Save"}
        </button>

        <button
          type="button"
          aria-label="Share"
          onClick={() => {
            const title = fmtAddress(full?.listing?.address) || "Listing";
            const text = `${priceText} • ${full?.listing?.beds ?? "—"} bd · ${full?.listing?.baths ?? "—"} ba`;
            if ((navigator as any).share) (navigator as any).share({ title, url: window.location.href, text });
            else { navigator.clipboard.writeText(window.location.href); alert("Link copied to clipboard"); }
          }}
          className="rounded-full px-4 py-2 border bg-white text-slate-700 shadow-sm hover:bg-slate-50 font-semibold focus-visible:ring-2"
          style={{ borderColor: "#e2e8f0", outlineColor: BC_BLUE }}
        >
          Share
        </button>

        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-full px-4 py-2 border bg-white text-slate-700 shadow-sm hover:bg-slate-50 font-semibold focus-visible:ring-2"
          style={{ borderColor: "#e2e8f0", outlineColor: BC_BLUE }}
        >
          Print Flyer
        </button>

        <button
          type="button"
          aria-label="Contact Agent"
          className="flex items-center gap-2 rounded-full px-6 py-2 text-white font-semibold shadow-sm focus-visible:ring-2"
          style={{ background: `linear-gradient(90deg, ${BC_GREEN}, ${BC_GREEN_DARK})`, outlineColor: BC_BLUE }}
          onClick={() => navigate(`/tour?ref=${encodeURIComponent(full.listing.mls_id || full.listing.id || "")}`)}
        >
          Contact Agent
        </button>
      </div>
    </div>
  );

  const openLightbox = (i: number) => {
    setLbIndex(i);
    setLbOpen(true);
  };

  return (
    <div
      className="relative min-h-screen pb-16 -mt-6 sm:-mt-10 md:-mt-12 lg:-mt-14 xl:-mt-16 font-sans"
      style={{
        background: "linear-gradient(135deg, #f7fafc 0%, #ffffff 50%, #eef5ff 100%)",
        fontFamily: 'Inter, Nunito, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial'
      }}
    >
      <AccessibilityPolish />

      {/* Scroll mini-header (hide in embed) */}
      {showMini && full && !EMBED && (
        <div className="fixed top-0 left-0 right-0 z-40 border-b bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70"
             style={{ borderColor: "#e2e8f0" }}>
          <div className="mx-auto max-w-7xl px-3 py-2 flex items-center gap-3">
            <div className="font-extrabold text-slate-900">{priceText}</div>
            <div className="text-slate-700 text-sm">
              {full.listing.beds ?? "—"} bd • {full.listing.baths ?? "—"} ba • {typeof full.listing.sqft === "number" ? full.listing.sqft.toLocaleString() : full.listing.sqft ?? "—"} sqft
            </div>
            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={() => navigate(`/tour?ref=${encodeURIComponent(full.listing.mls_id || full.listing.id || "")}`)}
                className="rounded-full px-3 py-1.5 text-sm text-white shadow focus-visible:ring-2"
                style={{ background: `linear-gradient(90deg, ${BC_GREEN}, ${BC_GREEN_DARK})`, outlineColor: BC_BLUE }}
              >
                Schedule
              </button>
              <button
                onClick={toggle}
                className="rounded-full px-3 py-1.5 text-sm border bg-white text-slate-700 hover:bg-slate-50 focus-visible:ring-2"
                style={{ borderColor: "#e2e8f0", outlineColor: BC_BLUE }}
              >
                {saved ? "Saved" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Container width shrinks in embed to feel like mobile/tablet card */}
      <div className={`mx-auto ${EMBED ? "max-w-[720px]" : "max-w-7xl"} px-2 sm:px-4 py-4`}>
        {/* Hide Back to Listings in embed */}
        {!EMBED && (
          <nav className="mb-3 flex items-center justify-between" aria-label="Breadcrumb">
            <Link
              to="/listings"
              className="group inline-flex items-center gap-2 rounded-2xl border bg-white/80 backdrop-blur px-4 py-2 text-slate-700 shadow-sm hover:bg-white focus-visible:ring-2"
              style={{ borderColor: "#e2e8f0", outlineColor: BC_BLUE, color: BC_BLUE }}
            >
              <ArrowLeftIcon className="h-5 w-5" />
              <span className="font-semibold">Back to Listings</span>
            </Link>
          </nav>
        )}

        {loading && (
          <div
            className="rounded-3xl border bg-white/70 backdrop-blur p-10 shadow-sm text-lg text-slate-700 flex items-center justify-center min-h-[300px] animate-pulse"
            style={{ borderColor: "#e2e8f0" }}
          >
            Loading property…
          </div>
        )}
        {!loading && error && (
          <div
            className="rounded-3xl border bg-rose-50/80 backdrop-blur p-8 text-rose-900 shadow-sm"
            role="alert"
            aria-live="assertive"
            style={{ borderColor: "#fecaca" }}
          >
            {error}
          </div>
        )}

        {!loading && !error && full && (
          <Fragment>
            <ListingJsonLd listing={full.listing} />

            {/* Media — in EMBED force a single column (mobile feel) */}
            <section className="grid grid-cols-12 gap-4" aria-label="Property media">
              <div className={EMBED ? "col-span-12" : "col-span-12 md:col-span-3"}>
                <div className="max-h-[520px] overflow-y-auto pr-1 grid grid-cols-4 md:grid-cols-1 gap-3">
                  {(full.photos?.length ? full.photos : ["/placeholder-house.jpg"]).map((src, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => openLightbox(i)}
                      className="block focus-visible:ring-2 rounded-xl"
                      style={{ outlineColor: BC_BLUE }}
                      aria-label={`Open photo ${i + 1}`}
                    >
                      <img
                        src={src || "/placeholder-house.jpg"}
                        className="w-full aspect-[4/3] object-cover rounded-xl border shadow-sm"
                        style={{ borderColor: "#e2e8f0" }}
                        alt={`Photo ${i + 1}`}
                        loading={i > 4 ? "lazy" : "eager"}
                      />
                    </button>
                  ))}
                </div>
              </div>
              <div className={EMBED ? "col-span-12" : "col-span-12 md:col-span-9"}>
                <button
                  type="button"
                  onClick={() => openLightbox(0)}
                  className="block w-full focus-visible:ring-2 rounded-3xl"
                  style={{ outlineColor: BC_BLUE }}
                  aria-label="Expand primary photo"
                >
                  <img
                    src={(full.photos?.[0] && full.photos[0]) || "/placeholder-house.jpg"}
                    className="w-full max-h-[520px] object-cover rounded-3xl border shadow"
                    style={{ borderColor: "#e2e8f0" }}
                    alt="Primary"
                  />
                </button>
                {summary}
              </div>
            </section>

            {/* Structured media (3D + floor plans) */}
            <StructuredMedia virtualTourUrl={full.virtualTourUrl} photos={full.photos} />

            {/* Main grid */}
            <div className="mt-8 grid grid-cols-12 gap-6">
              {/* LEFT */}
              <main id="main-content" className="col-span-12 lg:col-span-8 space-y-6" role="main">
                {/* Key Features + Map */}
                <KeyFeatures listing={full.listing} building={full.building}>
                  <PropertyMap
                    key={full.listing.mls_id || full.listing.id || "subject"}
                    lat={full.listing.lat as any}
                    lon={full.listing.lon as any}
                    similar={similar}
                    heightClass="h-[240px] sm:h-[300px] md:h-[360px] lg:h-[420px]"
                    defaultStyle="pmtiles-local"
                  />
                </KeyFeatures>

                {/* AI neighborhood summary */}
                <NeighborhoodSnapshot listing={full.listing} building={full.building} comps={similar} radiusKm={3} />

                {/* Estimate + Mortgage + Energy */}
                <PropertyEstimateCard daysOnMarket={full.listing.dom} estimatedValue={full.listing.estimate_value} lastUpdatedOn={full.listing.last_updated_on} />
                <MortgageCalculator form={mortgage} onChange={setMortgage} />
                <EnergyMonthlyCostEstimator mortgage={mortgage} annualTax={full.building?.annual_taxes} />

                {/* Description */}
                {full.description && (
                  <section className="rounded-3xl border bg-white p-6 shadow-sm"
                           style={{ borderColor: "#e2e8f0" }}>
                    <h2 className="mb-3 font-bold text-slate-900" style={{ fontSize: 20 }}>Description</h2>
                    <p className="text-slate-700 leading-7 whitespace-pre-wrap" style={{ fontSize: 15 }}>{full.description}</p>
                  </section>
                )}

                {/* Property Details */}
                <section className="rounded-3xl border bg-white p-6 shadow-sm"
                         style={{ borderColor: "#e2e8f0" }}>
                  <h2 className="mb-4 font-bold text-slate-900" style={{ fontSize: 20 }}>Property Details</h2>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4">
                    <DetailRow label="Style" value={full.building?.building_type || full.listing.property_type || "—"} />
                    <DetailRow label="Age of property" value={full.building?.built_in ?? full.listing.year_built ?? "—"} />
                    <DetailRow label="Lot size" value={full.building?.land_size || (full.listing.lot_sqft ? `${full.listing.lot_sqft.toLocaleString()} sqft` : "—")} />
                    <DetailRow label="View" value={full.building?.view || full.land?.view || "—"} />
                    <DetailRow label="SqFt" value={typeof full.listing.sqft === "number" ? full.listing.sqft.toLocaleString() : full.listing.sqft ?? "—"} />
                    <DetailRow label="Parking Spaces" value={full.building?.parking_total ?? "—"} />
                  </div>

                  <div className="mt-4 grid sm:grid-cols-2 gap-6">
                    <DetailRow label="MLS® Number" value={full.listing.mls_id ?? "—"} />
                    <DetailRow label="Community Name" value={full.building?.neighbourhood ?? full.listing.city ?? "—"} />
                  </div>
                  <div className="mt-2 text-sm text-slate-500">Data Source: CREA • Listing by respective brokerage</div>
                </section>

                {/* Interior / Rooms */}
                {(full.building?.features?.length || full.rooms?.length) && (
                  <section className="rounded-3xl border bg-white p-6 shadow-sm"
                           style={{ borderColor: "#e2e8f0" }}>
                    <h2 className="mb-4 font-bold text-slate-900" style={{ fontSize: 20 }}>Interior</h2>
                    <div className="grid sm:grid-cols-2 gap-6">
                      <DetailRow label="Features" value={(full.building?.features || []).join(", ") || "—"} />
                      <DetailRow label="Heating" value={full.building?.heating_type || "—"} />
                    </div>

                    {full.rooms && full.rooms.length > 0 && (
                      <div className="mt-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-slate-700 font-semibold" style={{ fontSize: 16 }}>Rooms</div>
                          <UnitToggle metric={metric} onToggle={() => setMetric((m) => !m)} />
                        </div>
                        <div className="overflow-x-auto">
                          <table className="min-w-[520px] w-full text-left">
                            <thead>
                              <tr className="text-slate-600 text-sm">
                                <th className="py-2 pr-4">Level</th>
                                <th className="py-2 pr-4">Room</th>
                                <th className="py-2 pr-4">Size</th>
                              </tr>
                            </thead>
                            <tbody>
                              {full.rooms.map((r, i) => (
                                <tr key={i} className="border-t" style={{ borderColor: "#e2e8f0" }}>
                                  <td className="py-2 pr-4">{titleize(r.level) || "—"}</td>
                                  <td className="py-2 pr-4">{titleize(r.name) || "—"}</td>
                                  <td className="py-2 pr-4">{metric ? r.dim_metric || "—" : r.dim_imperial || "—"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </section>
                )}

                {/* History */}
                <PropertyHistoryCard sales={full.sale_history} taxes={full.tax_history} />

                {/* Nearby / Transport */}
                <WhatsNearby lat={full.listing.lat} lon={full.listing.lon} />
                <Transportation lat={full.listing.lat} lon={full.listing.lon} />

                {/* Comps map + table + filters + sparkline */}
                <NearByComp subject={{ lat: full.listing.lat, lon: full.listing.lon }} comps={similar} initialRadiusKm={3} />

                {/* Closing costs */}
                <ClosingCostsCard form={closing} onChange={setClosing} />
              </main>

              {/* RIGHT — sticky sidebar */}
              <aside className="col-span-12 lg:col-span-4 space-y-6 lg:sticky lg:top-6 self-start" aria-label="Contact and scheduling">
                <ScheduleViewingCard
                  className="w-full"
                  mlsId={full.listing.mls_id}
                  addressLine={fmtAddress(full.listing.address)}
                  onSchedule={() => navigate(`/tour?ref=${encodeURIComponent(full.listing.mls_id || full.listing.id || "")}`)}
                  onContact={() => navigate(`/tour?ref=${encodeURIComponent(full.listing.mls_id || full.listing.id || "")}`)}
                  // Visual tuning for BC CTAs is handled within the component via global CSS tokens below
                />
                <OpenHouseCalendar mlsId={full.listing.mls_id} address={fmtAddress(full.listing.address)} />
              </aside>
            </div>
          </Fragment>
        )}
      </div>

      {/* Chat FAB — only on full page, not in embed */}
      {!EMBED && !loading && !error && full && (
        <button
          aria-label="Open chat"
          type="button"
          className="fixed z-50 bottom-6 right-6 md:bottom-10 md:right-10 text-white shadow-lg rounded-full w-16 h-16 flex items-center justify-center focus-visible:ring-4 hover:scale-110 transition-transform no-print"
          style={{
            background: `linear-gradient(135deg, ${BC_GREEN}, ${BC_GREEN_DARK})`,
            outlineColor: BC_BLUE
          }}
          onClick={() => navigate(`/chat?mls=${encodeURIComponent(full.listing.mls_id || "")}`)}
        >
          <ChatBubbleOvalLeftEllipsisIcon className="h-8 w-8" />
        </button>
      )}

      {/* Mobile Sticky CTA — hidden in embed */}
      {!EMBED && (
        <StickyCTA
          show={!loading && !error && !!full}
          priceText={priceText}
          onContact={() => navigate(`/tour?ref=${encodeURIComponent(full?.listing.mls_id || full?.listing.id || "")}`)}
          onSchedule={() => navigate(`/tour?ref=${encodeURIComponent(full?.listing.mls_id || full?.listing.id || "")}`)}
          saved={saved}
          onToggleSave={toggle}
        />
      )}

      {/* Lightbox mount */}
      {lbOpen && full?.photos?.length ? (
        <Lightbox images={full.photos} startIndex={lbIndex} onClose={() => setLbOpen(false)} />
      ) : null}

      <style>{`
        /* Typography & palette */
        :root{
          --bc-blue: ${BC_BLUE};
          --bc-green: ${BC_GREEN};
          --bc-green-dark: ${BC_GREEN_DARK};
        }
        .bc-link { color: var(--bc-blue); }
        .bc-link:hover { text-decoration: underline; }

        .glass-card{backdrop-filter:blur(14px) saturate(160%); background:rgba(255,255,255,0.76); box-shadow:0 6px 32px 0 rgba(60,90,120,0.08),0 1.5px 5px 0 rgba(16,20,30,0.06)}
        @media print { .no-print, .fixed, .sticky { display: none !important; } body { background: white; } }

        /* ── Embed/preview mode tweaks ───────────────────────────────── */
        .is-embed [data-app-header],
        .is-embed header,
        .is-embed [role="banner"] { display: none !important; }
        .is-embed footer,
        .is-embed [role="contentinfo"],
        .is-embed [data-app-footer],
        .is-embed [data-mobile-nav],
        .is-embed .mobile-tabbar,
        .is-embed .bottom-nav,
        .is-embed .app-tabbar { display: none !important; }
        .is-embed body { background: white !important; }
        .is-embed .no-print { display: none !important; }

        /* Headings & body sizes (accessibility-friendly) */
        h1 { font-weight: 800; font-size: 24px; }
        h2 { font-weight: 700; font-size: 20px; }
        h3 { font-weight: 700; font-size: 18px; }
        body, p, li, td, th { font-size: 15px; }

        /* Nudge common CTA components (if they rely on default classes) */
        .btn-cta, .cta, [data-cta="primary"]{
          background: linear-gradient(90deg, var(--bc-green), var(--bc-green-dark)) !important;
          color: #fff !important;
          border: 0 !important;
          box-shadow: 0 6px 14px rgba(26,188,156,.25) !important;
        }
        .btn-cta:focus, .cta:focus, [data-cta="primary"]:focus{
          outline: 2px solid var(--bc-blue) !important;
          outline-offset: 2px;
        }
        .link-primary, a.link, a {
          color: var(--bc-blue);
        }
        a:focus-visible{
          outline: 2px solid var(--bc-blue);
          outline-offset: 2px;
        }
      `}</style>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-6 border-b py-2" style={{ borderColor: "#e2e8f0" }}>
      <div className="text-slate-500" style={{ fontSize: 14 }}>{label}</div>
      <div className="font-semibold text-slate-800 text-right" style={{ fontSize: 15 }}>{value}</div>
    </div>
  );
}

function UnitToggle({ metric, onToggle }: { metric: boolean; onToggle: () => void }) {
  return (
    <div className="flex items-center gap-2 text-sm text-slate-700">
      <span className={!metric ? "opacity-60" : ""}>Metric</span>
      <label className="relative inline-flex cursor-pointer items-center">
        <input type="checkbox" className="sr-only peer" checked={!metric} onChange={onToggle} />
        <div className="w-10 h-5 bg-slate-300 rounded-full peer peer-checked:bg-slate-400 peer-checked:after:translate-x-5 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-4 after:w-4 after:transition-all" />
      </label>
      <span className={metric ? "opacity-60" : ""}>Imperial</span>
    </div>
  );
}
