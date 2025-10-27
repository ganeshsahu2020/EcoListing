// ui/src/pages/MapSearchSummary.tsx
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useLayoutEffect,
} from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { supabase } from "../utils/supabaseClient";

// Map
import PropertyMap, {
  PropertyMapHandle,
  type Mini as PropertyMini,
} from "../components/maps/PropertyMap";

// NEW: lightweight in-app property preview (no iframe)
import PropertyDetailPreview from "../components/mapsearch/PropertyDetail";

import { GlassButton } from "../components/GlassUI";
import { useA11yAnnouncement } from "../utils/a11y";
import { fetchListingsDirect } from "../utils/repliersClient";
import AllSearch, {
  type FilterState as AllFilterState,
} from "../components/AllSearch";
import Chat from "./Chat";
import {
  AdjustmentsHorizontalIcon as SlidersHorizontalIcon,
  HeartIcon,
  MapPinIcon,
  BuildingStorefrontIcon,
  HomeModernIcon,
  SparklesIcon,
  ChartBarIcon,
  ClockIcon,
  ArrowsPointingOutIcon,
} from "@heroicons/react/24/outline";
import {
  HeartIcon as HeartSolidIcon,
  SparklesIcon as SparklesSolidIcon,
} from "@heroicons/react/24/solid";

// Barrel from mapsearch
import {
  Listing,
  UIMapFilters,
  INITIAL_UI_FILTERS,
  hrefFor,
  getAddress,
  getCity,
  getPostal,
  debounce,
  fmtMoney0,
  applyClientFilters,
  applyClientSort,
  summarizeMarketPill,
  MarketMenu,
  PriceMenu,
  BedsBathsMenu,
  PropertyTypeMenu,
  HomeTypeMenu, // kept for parity
  MoreMenu,
  CommuteMenu,
  type CommuteState,
  LifestyleToggles,
  SaveSearchDialog,
  CompsDrawer,
  SkipLink,
} from "../components/mapsearch";

/* ------------------------------ Small util ------------------------------ */
function cx(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(" ");
}

/* ------------------------------ Config ------------------------------ */
const CLUSTER_LIMIT = 200;
const DEFAULT_BBOX: [number, number, number, number] = [-125, 25, -66, 49];

/* Bridge: AllSearch <-> UIMapFilters (unchanged) */
const ALL_STYLES = {
  Detached: [
    "Bungalow",
    "Bungalow-Raised",
    "1 1/2 Storey",
    "2-Storey",
    "2 1/2 Storey",
    "3-Storey",
    "Backsplit",
    "Sidesplit",
    "Others",
  ],
  "Semi Detached": [
    "Bungalow",
    "Bungalow-Raised",
    "1 1/2 Storey",
    "2-Storey",
    "2 1/2 Storey",
    "3-Storey",
    "Backsplit",
    "Sidesplit",
    "Others",
  ],
  Condo: ["Condo Apartment", "Condo Townhouse", "Loft", "Others"],
  Townhouse: ["1 1/2 Storey", "2-Storey", "2 1/2 Storey", "3-Storey", "Others"],
  Land: [] as string[],
} as const;

function uiToAll(f: UIMapFilters): Partial<AllFilterState> {
  const status: AllFilterState["status"] =
    f.market.mode === "sold" ? "sold" : "for-sale";
  const daysOnMarket: AllFilterState["daysOnMarket"] =
    f.market.mode === "forSale"
      ? (["all", "24h", "3d", "7d", "30d", "90d"].includes(f.market.forSaleDays)
          ? (f.market.forSaleDays as AllFilterState["daysOnMarket"])
          : "90d")
      : "all";
  const soldWithin: AllFilterState["soldWithin"] =
    f.market.mode === "sold"
      ? f.market.soldWithin === "year-2000-or-earlier"
        ? "year-2000"
        : (f.market.soldWithin as AllFilterState["soldWithin"])
      : "30d";

  const propertyTypes = {
    Detached: f.propertyType.categories.detached,
    "Semi Detached": f.propertyType.categories.semiDetached,
    Condo: f.propertyType.categories.condo,
    Townhouse: f.propertyType.categories.townhouse,
    Land: f.propertyType.categories.land,
  };

  const selectedSub = Object.entries(f.propertyType.subtypes)
    .filter(([, v]) => v)
    .map(([k]) => k);

  const propertyStyles = {
    Detached: selectedSub.filter((s) =>
      (ALL_STYLES.Detached as readonly string[]).includes(s as any)
    ),
    "Semi Detached": selectedSub.filter((s) =>
      (ALL_STYLES["Semi Detached"] as readonly string[]).includes(s as any)
    ),
    Condo: selectedSub.filter((s) =>
      (ALL_STYLES.Condo as readonly string[]).includes(s as any)
    ),
    Townhouse: selectedSub.filter((s) =>
      (ALL_STYLES.Townhouse as readonly string[]).includes(s as any)
    ),
    Land: [] as string[],
  };

  const beds: AllFilterState["beds"] =
    f.bedsMin == null ? "any" : f.bedsMin >= 5 ? "5+" : (f.bedsMin as 1 | 2 | 3 | 4);
  const bathsMin = (f.bathsMin ?? 0) as AllFilterState["bathsMin"];

  const amenities: string[] = [];
  if (f.more.pool) amenities.push("Pool");
  if (f.more.parking) amenities.push("Parking");

  const parking = {
    totalMin: f.more.parking ? (1 as const) : ("any" as const),
    mustHaveGarage: null,
    garageSpacesMin: "any" as const,
  };

  return {
    status,
    daysOnMarket,
    soldWithin,
    priceMin: f.priceMin ?? null,
    priceMax: f.priceMax ?? null,
    propertyTypes,
    propertyStyles,
    beds,
    excludeDenBasement: false,
    bathsMin,
    openHouse: "any",
    listingInfo: { floorPlan: false, virtualTour: false, priceDecreased: false },
    taxesMax: null,
    maintenanceMax: null,
    excludeMaintenance: false,
    sizeMin: f.more.sqftMin ?? null,
    sizeMax: f.more.sqftMax ?? null,
    ageMin: null,
    ageMax: null,
    renovated: { kitchen: false, bathroom: false },
    basement: { mustHave: null, type: null, separateEntrance: null },
    amenities,
    keywords: [],
    locatedNear: { waterfront: false, forest: false, mountain: false },
    lot: { widthMin: null, depthMin: null },
    parking,
    proximity: { transit: false, bike: false, pedestrian: false, car: false },
    accessTo: {
      primarySchools: false,
      highSchools: false,
      parks: false,
      cafes: false,
      nightlife: false,
      restaurants: false,
      groceries: false,
      shopping: false,
    },
    atmosphere: { quiet: false, vibrant: false },
  };
}

function allToUi(prev: UIMapFilters, s: AllFilterState): UIMapFilters {
  const mode = s.status === "sold" ? "sold" : "forSale";
  const categories = {
    detached: !!s.propertyTypes.Detached,
    semiDetached: !!s.propertyTypes["Semi Detached"],
    condo: !!s.propertyTypes.Condo,
    townhouse: !!s.propertyTypes.Townhouse,
    land: !!s.propertyTypes.Land,
    other: prev.propertyType.categories.other,
  };
  const subtypes: Record<string, boolean> = {};
  (
    ["Detached", "Semi Detached", "Condo", "Townhouse", "Land"] as const
  ).forEach((g) =>
    (s.propertyStyles[g] || []).forEach((label) => (subtypes[label] = true))
  );
  const bedsMin =
    s.beds === "any" ? null : s.beds === "studio" ? 0 : s.beds === "5+" ? 5 : (s.beds as number);
  const bathsMin = s.bathsMin === 0 ? null : s.bathsMin;
  const more = {
    ...prev.more,
    sqftMin: s.sizeMin ?? null,
    sqftMax: s.sizeMax ?? null,
    pool: s.amenities.includes("Pool") || prev.more.pool,
    parking: s.parking.totalMin !== "any" || prev.more.parking,
  };
  return {
    ...prev,
    priceMin: s.priceMin ?? null,
    priceMax: s.priceMax ?? null,
    bedsMin,
    bathsMin,
    propertyType: { categories, subtypes },
    market: {
      mode: mode as UIMapFilters["market"]["mode"],
      forSaleDays:
        mode === "forSale"
          ? (s.daysOnMarket as UIMapFilters["market"]["forSaleDays"])
          : prev.market.forSaleDays,
      soldWithin:
        mode === "sold"
          ? (s.soldWithin === "year-2000"
              ? "year-2000-or-earlier"
              : (s.soldWithin as UIMapFilters["market"]["soldWithin"]))
          : prev.market.soldWithin,
    },
    more,
  };
}

/* ------------------------------ Small helpers ------------------------------ */
function getListingPhotos(l: any): string[] {
  const arr =
    l.photos ||
    l.images ||
    l.image_urls ||
    l.gallery ||
    (Array.isArray(l.media) ? l.media.map((m: any) => m.url) : null);
  const first = typeof l.image_url === "string" && l.image_url ? [l.image_url] : [];
  const out = (arr && Array.isArray(arr) ? arr : []).filter(Boolean);
  return out.length ? out : first;
}
function daysAgo(dateString?: string | null): number | null {
  if (!dateString) return null;
  const t = new Date(dateString).getTime();
  if (!Number.isFinite(t)) return null;
  const ms = Date.now() - t;
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
}

/* ------------------------------ Design tokens ------------------------------ */
const BLUE = "#1E90FF";
const GREEN = "#1ABC9C";
const GREEN_DARK = "#12997F";

/* ------------------------------ Lux bits ------------------------------ */
const PremiumBadge = () => (
  <div
    className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-white text-xs font-semibold"
    style={{ background: `linear-gradient(90deg, ${BLUE}, #4fb4ff)` }}
  >
    <SparklesSolidIcon className="w-3 h-3" />
    <span>PREMIUM</span>
  </div>
);

const DataMetric = ({
  label,
  value,
  icon,
  trend,
}: {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: "up" | "down" | "neutral";
}) => (
  <div className="flex items-center gap-2 p-2 rounded-lg border bg-white">
    {icon && <div className="text-slate-600">{icon}</div>}
    <div className="flex-1 min-w-0">
      <div className="text-xs text-slate-600 font-medium truncate">{label}</div>
      <div
        className={`text-sm font-semibold truncate ${
          trend === "up"
            ? "text-emerald-600"
            : trend === "down"
            ? "text-rose-600"
            : "text-slate-900"
        }`}
      >
        {value}
      </div>
    </div>
  </div>
);

const LuxuryShimmer = () => (
  <div className="animate-pulse">
    <div
      className="rounded-2xl h-64 mb-4"
      style={{
        background: `linear-gradient(90deg, #f5f7fb, #eef2f7, #f5f7fb)`,
      }}
    ></div>
    <div className="space-y-3">
      <div className="h-4 bg-slate-200 rounded w-3/4"></div>
      <div className="h-3 bg-slate-200 rounded w-1/2"></div>
      <div className="h-3 bg-slate-200 rounded w-2/3"></div>
    </div>
  </div>
);

/* ------------------------------ Page ------------------------------ */
export default function MapSearchSummary() {
  const navigate = useNavigate();

  // Map imperative API
  const mapApi = useRef<PropertyMapHandle | null>(null);
  const mapPanelRef = useRef<HTMLDivElement | null>(null);

  // NEW: structured preview target
  const [previewTarget, setPreviewTarget] = useState<{
    mls?: string | null;
    id?: string | null;
  } | null>(null);

  // Close preview on ESC
  useEffect(() => {
    if (!previewTarget) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPreviewTarget(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [previewTarget]);

  // Bbox & data
  const [bbox] = useState<[number, number, number, number]>(DEFAULT_BBOX);

  const [listings, setListings] = useState<Listing[]>([]);
  const listingsRef = useRef<Listing[]>([]);
  useEffect(() => {
    listingsRef.current = listings;
  }, [listings]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalInView, setTotalInView] = useState<number | null>(null);

  // Drawer & menus
  const [openSmart, setOpenSmart] = useState(false);
  const [openPrice, setOpenPrice] = useState(false);
  const [openBeds, setOpenBeds] = useState(false);
  const [openHomeType, setOpenHomeType] = useState(false);
  const [openMore, setOpenMore] = useState(false);
  const [openPropType, setOpenPropType] = useState(false);
  const [openMarket, setOpenMarket] = useState(false);
  const [openCommute, setOpenCommute] = useState(false);

  // Menu anchors
  const refMarketBtn = useRef<HTMLButtonElement | null>(null);
  const refPriceBtn = useRef<HTMLButtonElement | null>(null);
  const refBedsBtn = useRef<HTMLButtonElement | null>(null);
  const refPropBtn = useRef<HTMLButtonElement | null>(null);
  const refHomeBtn = useRef<HTMLButtonElement | null>(null);
  const refMoreBtn = useRef<HTMLButtonElement | null>(null);
  const refCommuteBtn = useRef<HTMLButtonElement | null>(null);

  // Commute & lifestyle
  const [commute, setCommute] = useState<CommuteState>({
    address: "",
    minutes: [15, 30, 45],
    center: null,
  });
  const [lifestyle, setLifestyle] = useState({
    schools: false,
    groceries: false,
    parks: false,
    transit: false,
  });

  // Save & comps
  const [saveOpen, setSaveOpen] = useState(false);
  const [openComps, setOpenComps] = useState(false);

  // Sticky mini header
  const listRef = React.useRef<HTMLDivElement | null>(null);
  const [showMini, setShowMini] = useState(false);
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const onScroll = () => setShowMini(el.scrollTop > 200);
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  // Saved (local UI)
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const announce = useA11yAnnouncement();

  // Filters (SoT)
  const [filters, _setFilters] = useState<UIMapFilters>(INITIAL_UI_FILTERS);
  const filtersRef = useRef<UIMapFilters>(INITIAL_UI_FILTERS);
  const setFilters = (
    updater: UIMapFilters | ((f: UIMapFilters) => UIMapFilters)
  ) => {
    _setFilters((prev) => {
      const next =
        typeof updater === "function" ? (updater as any)(prev) : updater;
      filtersRef.current = next;
      return next;
    });
  };

  /* Enhanced stats */
  const { medianPrice, avgPpsf, avgDaysOnMarket, luxuryCount } = useMemo(() => {
    if (!listings?.length)
      return {
        medianPrice: null,
        avgPpsf: null,
        avgDaysOnMarket: null,
        luxuryCount: 0,
      };

    const prices = listings
      .map((l) => l.list_price)
      .filter((n): n is number => Number.isFinite(n))
      .sort((a, b) => a - b);
    const median = prices.length
      ? prices.length % 2
        ? prices[(prices.length - 1) / 2]
        : Math.round(
            (prices[prices.length / 2 - 1] + prices[prices.length / 2]) / 2
          )
      : null;

    const ppsfVals = listings
      .map((l) => {
        const direct =
          typeof l.price_per_sqft === "number" &&
          Number.isFinite(l.price_per_sqft)
            ? l.price_per_sqft
            : null;
        const computed =
          Number.isFinite(l.list_price) &&
          Number.isFinite(l.sqft ?? NaN) &&
          (l.sqft ?? 0) > 0
            ? l.list_price / (l.sqft as number)
            : null;
        return direct ?? computed;
      })
      .filter((n): n is number => Number.isFinite(n));
    const avg = ppsfVals.length
      ? Math.round(ppsfVals.reduce((a, b) => a + b, 0) / ppsfVals.length)
      : null;

    const daysOnMarket = listings
      .map((l) => daysAgo(l.list_date))
      .filter((n): n is number => n !== null);
    const avgDom = daysOnMarket.length
      ? Math.round(
          daysOnMarket.reduce((a, b) => a + b, 0) / daysOnMarket.length
        )
      : null;

    const luxury = listings.filter(
      (l) =>
        l.list_price > 1_000_000 ||
        (l as any).luxury_features?.length > 0 ||
        (l.sqft && l.sqft > 3000)
    ).length;

    return {
      medianPrice: median,
      avgPpsf: avg,
      avgDaysOnMarket: avgDom,
      luxuryCount: luxury,
    };
  }, [listings]);

  /* Navigation helpers */
  const navigateToFullDetails = useCallback(
    (l: Listing) => navigate(hrefFor(l.mls_id, l.id)),
    [navigate]
  );

  const gotoContactAgent = useCallback(
    (l?: Listing) => {
      const params = new URLSearchParams();
      const addr = [getAddress(l || {}), getCity(l || {}), getPostal(l || {})]
        .filter(Boolean)
        .join(", ");
      if (addr) params.set("address", addr);
      if (l?.list_price && Number.isFinite(l.list_price)) {
        const est = Math.round(l.list_price);
        const lo = Math.round(est * 0.95);
        const hi = Math.round(est * 1.05);
        params.set("est", String(est));
        params.set("lo", String(lo));
        params.set("hi", String(hi));
        params.set("conf", "0.7");
      }
      navigate(`/agent/report-request?${params.toString()}`);
    },
    [navigate]
  );

  /* Fetch within bbox */
  const fetchWithinBounds = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [west, south, east, north] = bbox;
      const statusParam = filtersRef.current.market.mode === "sold" ? "S" : "A";

      const items = await fetchListingsDirect({
        west,
        south,
        east,
        north,
        status: statusParam,
        limit: CLUSTER_LIMIT,
      });

      let normalized: Listing[] = (items || [])
        .map((x: any) => {
          const lat =
            typeof x.lat === "number"
              ? x.lat
              : typeof x.latitude === "number"
              ? x.latitude
              : NaN;
          const lon =
            typeof x.lon === "number"
              ? x.lon
              : typeof x.lng === "number"
              ? x.lng
              : typeof x.longitude === "number"
              ? x.longitude
              : NaN;
          const price =
            typeof x.list_price === "number"
              ? x.list_price
              : typeof x.price === "number"
              ? x.price
              : typeof x.listPrice === "number"
              ? x.listPrice
              : NaN;
          return {
            ...x,
            lat,
            lon,
            list_price: price,
            address: getAddress(x),
            city: getCity(x),
            postal_code: getPostal(x),
            status: x.status ?? statusParam,
          };
        })
        .filter(
          (l) =>
            Number.isFinite(l.lat) &&
            Number.isFinite(l.lon) &&
            Number.isFinite(l.list_price)
        )
        .map((l) => ({
          ...l,
          price_per_sqft:
            Number.isFinite(l.list_price) &&
            Number.isFinite(l.sqft ?? NaN) &&
            (l.sqft ?? 0) > 0
              ? Math.round(l.list_price / (l.sqft as number))
              : (l as any).price_per_sqft ?? null,
        }));

      const f = filtersRef.current;
      normalized = applyClientFilters(normalized, f);
      normalized = applyClientSort(normalized, f.sort);

      setListings(normalized);
      setTotalInView(normalized.length);

      mapApi.current?.setPoints(
        normalized.map(
          (l) =>
            ({
              id: l.id,
              lat: l.lat,
              lon: l.lon,
              price: l.list_price,
              image_url:
                (l as any).image_url ||
                (Array.isArray((l as any).photos)
                  ? (l as any).photos?.[0]
                  : undefined),
              mls_id: l.mls_id,
              is_premium:
                l.list_price > 1_000_000 ||
                (l as any).luxury_features?.length > 0,
            } as PropertyMini)
        )
      );
      mapApi.current?.fitToPoints();
    } catch (e: any) {
      console.error("[repliers-direct] fetch error", e);
      setError(e?.message || "Failed to load listings.");
      setListings([]);
      setTotalInView(0);
      mapApi.current?.setPoints([]);
    } finally {
      setLoading(false);
    }
  }, [bbox]);

  useEffect(() => {
    fetchWithinBounds();
  }, [fetchWithinBounds]);

  /* Pan map ONLY (do NOT open preview) */
  const centerExternalMap = useCallback((l: Listing) => {
    // 1) Pan/zoom the map
    mapApi.current?.centerOn(
      { id: l.id, lat: l.lat, lon: l.lon },
      { openCard: false, zoom: 16 }
    );

    // 2) Bring the map panel into view on small screens
    const el = mapPanelRef.current;
    if (!el) return;

    // Reset the internal list scroller so we’re not “trapped” inside it
    listRef.current?.scrollTo?.({ top: 0, behavior: "smooth" });

    const isSmall =
      window.matchMedia?.("(max-width: 1023px)")?.matches ?? true;
    if (isSmall) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      el.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
    }

    // 3) Move focus to the map for a11y
    window.setTimeout(() => el.focus?.(), 300);
  }, []);

  /* Query helper */
  const debouncedQuery = useMemo(
    () =>
      debounce((v: string) => {
        setFilters((f) => ({ ...f, query: v }));
        fetchWithinBounds();
      }, 350),
    [fetchWithinBounds]
  );

  const toggleSave = (id: string) => {
    setSavedIds((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      announce(
        n.has(id)
          ? "Property saved to favorites"
          : "Property removed from favorites"
      );
      return n;
    });
  };

  const resetAllFilters = () => {
    setFilters(INITIAL_UI_FILTERS);
    fetchWithinBounds();
    announce("All filters have been reset");
  };

  const closeAllMenus = () => {
    setOpenPrice(false);
    setOpenBeds(false);
    setOpenHomeType(false);
    setOpenMore(false);
    setOpenPropType(false);
    setOpenMarket(false);
    setOpenCommute(false);
  };

  const marketLabel = summarizeMarketPill(filters.market);
  const marketSuffix =
    filters.market.mode === "forSale"
      ? filters.market.forSaleDays
      : filters.market.soldWithin;

  /* ---------- NEW: center helpers ---------- */
  const fitToResults = useCallback((): boolean => {
    if (!mapApi.current) return false;
    if (listingsRef.current.length > 0) {
      mapApi.current.fitToPoints();
      return true;
    }
    return false;
  }, []);

  const centerOnMap = useCallback(() => {
    const api: any = mapApi.current;
    if (!api) return;

    const flyTo = (lng: number, lat: number, zoom = 13) => {
      if (typeof api.centerTo === "function") api.centerTo([lng, lat], { zoom });
      else if (typeof api.flyTo === "function") api.flyTo([lng, lat], { zoom });
      else if (typeof api.centerOn === "function")
        api.centerOn({ id: "__me", lat, lon: lng }, { openCard: false, zoom });
      else fitToResults();
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          flyTo(longitude, latitude, 13);
        },
        () => {
          if (!fitToResults()) {
            if (typeof api.easeTo === "function") api.easeTo({ zoom: 10 });
          }
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      if (!fitToResults()) {
        if (typeof api.easeTo === "function") api.easeTo({ zoom: 10 });
      }
    }
  }, [fitToResults]);
  /* ---------------------------------------- */

  /* ------------------------------ Layout ------------------------------ */
  return (
    <>
      <SkipLink />

      <div
        className="font-sans"
        style={{
          fontFamily:
            "Inter, Nunito, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial",
        }}
      >
        {/* Top Toolbar */}
        <div className="w-full -mt-7 sm:-mt-11 md:-mt-[52px] lg:-mt-[60px] xl:-mt-[68px]">
          <div className="mx-auto max-w-[1600px] px-3 sm:px-4 border-b bg-white/95 supports-[backdrop-filter]:backdrop-blur-md shadow-sm text-slate-900">
            {/* Search row */}
            <div className="flex items-center gap-2 py-3">
              <div className="relative w-full max-w-[780px]">
                <input
                  type="text"
                  inputMode="search"
                  placeholder="Search addresses, neighbourhoods, or postal codes in BC…"
                  className="w-full h-12 rounded-xl border border-slate-200 px-5 pr-12 bg-white placeholder:text-slate-400 text-[15px] focus:outline-none focus:ring-2"
                  style={{
                    boxShadow: "inset 0 1px 2px rgba(16,24,40,.04)",
                    outlineColor: BLUE,
                  }}
                  onChange={(e) => debouncedQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (
                      (e as React.KeyboardEvent<HTMLInputElement>).key === "Enter"
                    ) {
                      setFilters((f) => ({
                        ...f,
                        query: (e.target as HTMLInputElement).value,
                      }));
                      fetchWithinBounds();
                    }
                  }}
                  aria-label="Search properties by address, neighbourhood, city, or postal code"
                />
                <span
                  className="absolute right-4 top-1/2 -translate-y-1/2"
                  style={{ color: BLUE }}
                >
                  🔍
                </span>
              </div>

              {/* Quick actions */}
              <div className="hidden lg:flex items-center gap-2 ml-2">
                <button
                  className="h-12 px-4 rounded-xl text-white font-semibold text-sm shadow-sm focus:outline-none focus-visible:ring-2"
                  style={{
                    background: `linear-gradient(90deg, ${GREEN}, ${GREEN_DARK})`,
                    boxShadow: "0 6px 14px rgba(26,188,156,.25)",
                    outlineColor: BLUE,
                  }}
                  onClick={() => setOpenSmart(true)}
                >
                  <SparklesIcon className="w-4 h-4 inline mr-2" />
                  Smart Filters
                </button>
              </div>
            </div>

            {/* Filter row */}
            <div className="pb-3">
              <div
                className="relative flex items-center gap-2 overflow-x-auto overflow-y-visible whitespace-nowrap flex-nowrap scroll-smooth py-1"
                style={{ scrollbarWidth: "thin", scrollbarGutter: "stable both-edges" }}
                aria-label="Property search filters"
              >
                {/* All filters */}
                <button
                  className="h-10 rounded-xl border px-4 text-[14px] shadow-sm inline-flex items-center gap-2 shrink-0 bg-white hover:bg-slate-50 focus:outline-none focus-visible:ring-2"
                  style={{ borderColor: "#e2e8f0", color: BLUE, outlineColor: BLUE }}
                  onClick={() => setOpenSmart(true)}
                  aria-haspopup="dialog"
                  aria-expanded={openSmart}
                >
                  <SlidersHorizontalIcon className="h-5 w-5" />
                  <span className="font-medium">All Filters</span>
                </button>

                {/* Market */}
                <div className="shrink-0">
                  <button
                    ref={refMarketBtn}
                    className="h-10 rounded-xl border px-4 text-[14px] whitespace-nowrap shadow-sm inline-flex items-center gap-2 transition-colors focus:outline-none focus-visible:ring-2"
                    style={{
                      borderColor: "#e2e8f0",
                      color: filters.market.mode === "sold" ? "#ef4444" : "#0f172a",
                      background: "white",
                      outlineColor: BLUE,
                    }}
                    onClick={() => {
                      setOpenMarket((s) => !s);
                      setOpenBeds(false);
                      setOpenPrice(false);
                      setOpenHomeType(false);
                      setOpenMore(false);
                      setOpenPropType(false);
                      setOpenCommute(false);
                    }}
                    aria-haspopup="dialog"
                    aria-expanded={openMarket}
                  >
                    <BuildingStorefrontIcon className="w-4 h-4" />
                    <span className="font-medium">
                      {marketLabel}
                      {marketSuffix ? ` • ${marketSuffix}` : ""}
                    </span>
                    <span className="text-slate-400">▾</span>
                  </button>
                  <Floating
                    open={openMarket}
                    anchorRef={refMarketBtn}
                    onClose={() => setOpenMarket(false)}
                  >
                    <div
                      className="rounded-xl border bg-white shadow-xl"
                      style={{ borderColor: "#e2e8f0" }}
                    >
                      <MarketMenu
                        open={openMarket}
                        filters={filters}
                        setFilters={setFilters}
                        onClear={() => {
                          setFilters((f) => ({
                            ...f,
                            market: {
                              mode: "forSale",
                              forSaleDays: "all",
                              soldWithin: "30d",
                            },
                          }));
                          fetchWithinBounds();
                        }}
                        onApply={() => {
                          fetchWithinBounds();
                        }}
                        onClose={() => setOpenMarket(false)}
                      />
                    </div>
                  </Floating>
                </div>

                {/* Price */}
                <div className="shrink-0">
                  <button
                    ref={refPriceBtn}
                    className="h-10 min-w-[120px] rounded-xl border px-4 text-left text-[14px] shadow-sm flex items-center gap-2 bg-white hover:bg-slate-50 focus:outline-none focus-visible:ring-2"
                    style={{ borderColor: "#e2e8f0", color: "#0f172a", outlineColor: BLUE }}
                    onClick={() => {
                      setOpenPrice((s) => !s);
                      setOpenBeds(false);
                      setOpenHomeType(false);
                      setOpenMore(false);
                      setOpenPropType(false);
                      setOpenMarket(false);
                      setOpenCommute(false);
                    }}
                    aria-haspopup="dialog"
                    aria-expanded={openPrice}
                  >
                    <span style={{ color: BLUE }}>💰</span>
                    <span className="font-medium">Price</span>
                    <span className="text-slate-400 ml-auto">▾</span>
                  </button>
                  <Floating
                    open={openPrice}
                    anchorRef={refPriceBtn}
                    onClose={() => setOpenPrice(false)}
                  >
                    <div
                      className="rounded-xl border bg-white shadow-xl"
                      style={{ borderColor: "#e2e8f0" }}
                    >
                      <PriceMenu
                        open={openPrice}
                        filters={filters}
                        setFilters={setFilters}
                        onClear={() => {
                          setFilters((f) => ({
                            ...f,
                            priceMin: null,
                            priceMax: null,
                            monthlyMin: null,
                            monthlyMax: null,
                          }));
                          fetchWithinBounds();
                        }}
                        onApply={() => {
                          fetchWithinBounds();
                        }}
                        onClose={() => setOpenPrice(false)}
                      />
                    </div>
                  </Floating>
                </div>

                {/* Beds & Baths */}
                <div className="shrink-0">
                  <button
                    ref={refBedsBtn}
                    className="h-10 min-w=[140px] min-w-[140px] rounded-xl border px-4 text-left text-[14px] shadow-sm flex items-center gap-2 bg-white hover:bg-slate-50 focus:outline-none focus-visible:ring-2"
                    style={{ borderColor: "#e2e8f0", color: "#0f172a", outlineColor: BLUE }}
                    onClick={() => {
                      setOpenBeds((s) => !s);
                      setOpenPrice(false);
                      setOpenHomeType(false);
                      setOpenMore(false);
                      setOpenPropType(false);
                      setOpenMarket(false);
                      setOpenCommute(false);
                    }}
                    aria-haspopup="dialog"
                    aria-expanded={openBeds}
                  >
                    <span style={{ color: BLUE }}>🛏️</span>
                    <span className="font-medium">Beds &amp; Baths</span>
                    <span className="text-slate-400 ml-auto">▾</span>
                  </button>
                  <Floating
                    open={openBeds}
                    anchorRef={refBedsBtn}
                    onClose={() => setOpenBeds(false)}
                  >
                    <div
                      className="rounded-xl border bg-white shadow-xl"
                      style={{ borderColor: "#e2e8f0" }}
                    >
                      <BedsBathsMenu
                        open={openBeds}
                        filters={filters}
                        setFilters={setFilters}
                        onClear={() => {
                          setFilters((f) => ({
                            ...f,
                            bedsMin: null,
                            bathsMin: null,
                            bedsExact: false,
                          }));
                          fetchWithinBounds();
                        }}
                        onApply={() => {
                          fetchWithinBounds();
                        }}
                        onClose={() => setOpenBeds(false)}
                      />
                    </div>
                  </Floating>
                </div>

                {/* Property Type */}
                <div className="shrink-0">
                  <button
                    ref={refPropBtn}
                    className="h-10 rounded-xl border px-4 text-[14px] text-left shadow-sm inline-flex items-center gap-2 bg-white hover:bg-slate-50 focus:outline-none focus-visible:ring-2"
                    style={{ borderColor: "#e2e8f0", color: "#0f172a", outlineColor: BLUE }}
                    onClick={() => {
                      setOpenPropType((s) => !s);
                      setOpenBeds(false);
                      setOpenPrice(false);
                      setOpenHomeType(false);
                      setOpenMore(false);
                      setOpenMarket(false);
                      setOpenCommute(false);
                    }}
                    aria-haspopup="dialog"
                    aria-expanded={openPropType}
                  >
                    <HomeModernIcon className="w-4 h-4" style={{ color: BLUE }} />
                    <span className="font-medium">Property Type</span>
                    <span className="text-slate-400">▾</span>
                  </button>
                  <Floating
                    open={openPropType}
                    anchorRef={refPropBtn}
                    onClose={() => setOpenPropType(false)}
                  >
                    <div
                      className="rounded-xl border bg-white shadow-xl"
                      style={{ borderColor: "#e2e8f0" }}
                    >
                      <PropertyTypeMenu
                        open={openPropType}
                        filters={filters}
                        setFilters={setFilters}
                        onClear={() => {
                          setFilters((f) => ({
                            ...f,
                            propertyType: {
                              categories: {
                                detached: false,
                                semiDetached: false,
                                condo: false,
                                townhouse: false,
                                land: false,
                                other: false,
                              },
                              subtypes: {},
                            },
                          }));
                          fetchWithinBounds();
                        }}
                        onApply={() => {
                          fetchWithinBounds();
                        }}
                        onClose={() => setOpenPropType(false)}
                      />
                    </div>
                  </Floating>
                </div>

                {/* More */}
                <div className="shrink-0">
                  <button
                    ref={refMoreBtn}
                    className="h-10 min-w-[100px] rounded-xl border px-4 text-left text-[14px] shadow-sm flex items-center gap-2 bg-white hover:bg-slate-50 focus:outline-none focus-visible:ring-2"
                    style={{ borderColor: "#e2e8f0", color: "#0f172a", outlineColor: BLUE }}
                    onClick={() => {
                      setOpenMore((s) => !s);
                      setOpenBeds(false);
                      setOpenPrice(false);
                      setOpenHomeType(false);
                      setOpenPropType(false);
                      setOpenMarket(false);
                      setOpenCommute(false);
                    }}
                    aria-haspopup="dialog"
                    aria-expanded={openMore}
                  >
                    <span style={{ color: BLUE }}>⭐</span>
                    <span className="font-medium">More</span>
                    <span className="text-slate-400 ml-auto">▾</span>
                  </button>
                  <Floating
                    open={openMore}
                    anchorRef={refMoreBtn}
                    onClose={() => setOpenMore(false)}
                  >
                    <div
                      className="rounded-xl border bg-white shadow-xl"
                      style={{ borderColor: "#e2e8f0" }}
                    >
                      <MoreMenu
                        open={openMore}
                        filters={filters}
                        setFilters={setFilters}
                        onClear={() => {
                          setFilters((f) => ({ ...f, more: {} as any }));
                          fetchWithinBounds();
                        }}
                        onApply={() => {
                          fetchWithinBounds();
                        }}
                        onClose={() => setOpenMore(false)}
                      />
                    </div>
                  </Floating>
                </div>

                {/* Commute */}
                <div className="shrink-0">
                  <button
                    ref={refCommuteBtn}
                    className="h-10 rounded-xl border px-4 text-[14px] shadow-sm flex items-center gap-2 bg-white hover:bg-slate-50 focus:outline-none focus-visible:ring-2"
                    style={{ borderColor: "#e2e8f0", color: "#0f172a", outlineColor: BLUE }}
                    onClick={() => {
                      setOpenCommute((s) => !s);
                      setOpenPrice(false);
                      setOpenBeds(false);
                      setOpenHomeType(false);
                      setOpenMore(false);
                      setOpenPropType(false);
                      setOpenMarket(false);
                    }}
                    aria-haspopup="dialog"
                    aria-expanded={openCommute}
                  >
                    <MapPinIcon className="w-4 h-4" style={{ color: BLUE }} />
                    <span className="font-medium">Commute</span>
                    <span className="text-slate-400">▾</span>
                  </button>
                  <Floating
                    open={openCommute}
                    anchorRef={refCommuteBtn}
                    onClose={() => setOpenCommute(false)}
                  >
                    <div
                      className="rounded-xl border bg-white shadow-xl"
                      style={{ borderColor: "#e2e8f0" }}
                    >
                      <CommuteMenu
                        open={openCommute}
                        state={commute}
                        setState={setCommute}
                        onApply={() => {}}
                        onClear={() => {}}
                        onClose={() => setOpenCommute(false)}
                      />
                    </div>
                  </Floating>
                </div>

                {/* Lifestyle */}
                <div className="hidden xl:block w-px h-6 bg-slate-200 mx-2 shrink-0" />
                <div className="hidden xl:block shrink-0">
                  <LifestyleToggles value={lifestyle} onChange={setLifestyle} />
                </div>

                {/* Right actions */}
                <div className="ml-auto flex items-center gap-3 shrink-0 pl-2">
                  <label className="hidden sm:block text-[13px] text-slate-600 font-medium">
                    Sort By
                  </label>
                  <select
                    className="h-10 w-[180px] rounded-xl border bg-white text-[13px] shadow-sm focus:outline-none focus-visible:ring-2"
                    style={{ borderColor: "#e2e8f0", color: "#0f172a", outlineColor: BLUE }}
                    value={filters.sort}
                    onChange={(e) => {
                      const sort = e.target.value as UIMapFilters["sort"];
                      setFilters((f) => ({ ...f, sort }));
                      setListings((rows) => applyClientSort(rows, sort));
                      announce(`Sorted by ${e.target.selectedOptions[0].text}`);
                    }}
                  >
                    <option value="newest">Newest First</option>
                    <option value="price">Price (High to Low)</option>
                    <option value="priceAsc">Price (Low to High)</option>
                    <option value="days">Days on Market</option>
                    <option value="luxury">Luxury Properties</option>
                  </select>

                  <GlassButton
                    className="h-10 px-5 rounded-xl text-[14px] font-semibold text-white shadow-sm focus:outline-none focus-visible:ring-2"
                    style={{
                      background: `linear-gradient(90deg, ${GREEN}, ${GREEN_DARK})`,
                      outlineColor: BLUE,
                    }}
                    onClick={fetchWithinBounds}
                  >
                    <SparklesIcon className="w-4 h-4 inline mr-2" />
                    Apply Filters
                  </GlassButton>

                  <button
                    className="text-[14px] text-slate-600 hover:text-slate-900 transition-colors hidden md:block font-medium focus:outline-none focus-visible:ring-2 rounded-md px-2"
                    style={{ outlineColor: BLUE }}
                    onClick={resetAllFilters}
                  >
                    Reset All
                  </button>

                  <GlassButton
                    className="h-10 px-5 rounded-xl text-[14px] font-semibold text-white shadow-sm focus:outline-none focus-visible:ring-2"
                    style={{
                      background: `linear-gradient(90deg, ${GREEN}, ${GREEN_DARK})`,
                      outlineColor: BLUE,
                    }}
                    onClick={() => setSaveOpen(true)}
                  >
                    💾 Save Search
                  </GlassButton>
                </div>
              </div>

              {/* Stats Bar */}
              <div className="pt-3 pb-1 text-slate-700">
                <div className="flex items-center gap-6 flex-wrap">
                  <span className="font-bold text-[15px]" style={{ color: BLUE }}>
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <div
                          className="animate-spin rounded-full h-4 w-4 border-2"
                          style={{ borderColor: BLUE, borderTopColor: "transparent" }}
                        />
                        Loading properties…
                      </span>
                    ) : totalInView != null ? (
                      `${totalInView.toLocaleString()} listings`
                    ) : (
                      `${listings.length} properties`
                    )}
                  </span>

                  {medianPrice && (
                    <span className="text-[13px] font-semibold flex items-center gap-1">
                      <ChartBarIcon className="w-4 h-4" style={{ color: BLUE }} />
                      Median: {fmtMoney0(medianPrice)}
                    </span>
                  )}

                  {avgPpsf && (
                    <span className="text-[13px] font-semibold flex items-center gap-1">
                      📊 Avg $/sqft: {fmtMoney0(avgPpsf)}
                    </span>
                  )}

                  {avgDaysOnMarket && (
                    <span className="text-[13px] font-semibold flex items-center gap-1">
                      <ClockIcon className="w-4 h-4" style={{ color: BLUE }} />
                      Avg DOM: {avgDaysOnMarket} days
                    </span>
                  )}

                  {luxuryCount > 0 && (
                    <span className="text-[13px] font-semibold flex items-center gap-1">
                      <SparklesSolidIcon className="w-4 h-4" style={{ color: BLUE }} />
                      Premium: {luxuryCount} properties
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main layout */}
        <div
          className="
            relative
            grid grid-rows-[auto_1fr] lg:grid-rows-1
            grid-cols-1 lg:grid-cols-[minmax(320px,400px)_1fr]
            h-[calc(100vh-var(--app-header-h,0px))]
            w-full bg-gradient-to-br from-white via-[#f7fafc] to-[#eef5ff]
            min-h-0
          "
        >
          {/* Sidebar */}
          <aside
            className="
              order-2 lg:order-1
              bg-white/90 supports-[backdrop-filter]:backdrop-blur-lg
              border-r border-slate-200 min-h-0
              lg:sticky lg:top-[var(--app-header-h,0px)]
              shadow-inner
            "
          >
            <section
              ref={listRef}
              id="result-list"
              role="list"
              aria-label="Property search results"
              className="px-4 py-4 h-full overflow-y-auto"
            >
              {showMini && (
                <div className="sticky top-0 z-10 -mt-4 mb-3 bg-white/95 backdrop-blur-md border-b border-slate-200 px-3 py-2.5 flex items-center gap-2 rounded-b-xl shadow-sm">
                  <span className="text-xs sm:text-sm font-semibold text-slate-700">
                    {totalInView?.toLocaleString() ?? listings.length} results
                  </span>

                  <div className="ml-auto flex items-center gap-1.5">
                    <GlassButton
                      className="h-8 px-3 rounded-lg text-xs font-semibold leading-none text-white focus:outline-none focus-visible:ring-2"
                      style={{
                        background: `linear-gradient(90deg, ${GREEN}, ${GREEN_DARK})`,
                        outlineColor: BLUE,
                      }}
                      onClick={fetchWithinBounds}
                    >
                      <span className="mr-1" aria-hidden>
                        🔄
                      </span>
                      Refresh
                    </GlassButton>

                    <GlassButton
                      className="h-8 px-3 rounded-lg text-xs font-semibold leading-none text-white focus:outline-none focus-visible:ring-2"
                      style={{
                        background: `linear-gradient(90deg, ${GREEN}, ${GREEN_DARK})`,
                        outlineColor: BLUE,
                      }}
                      onClick={() => setSaveOpen(true)}
                    >
                      <span className="mr-1" aria-hidden>
                        💾
                      </span>
                      Save
                    </GlassButton>

                    <button
                      className="h-8 px-3 rounded-lg border text-xs font-medium leading-none bg-white hover:bg-slate-50 transition-colors focus:outline-none focus-visible:ring-2"
                      style={{ borderColor: "#e2e8f0", color: "#0f172a", outlineColor: BLUE }}
                      onClick={() => setOpenComps(true)}
                    >
                      <span className="mr-1" aria-hidden>
                        📈
                      </span>
                      Comps
                    </button>
                  </div>
                </div>
              )}

              {/* Listings Grid */}
              <div className="grid grid-cols-1 gap-4">
                {loading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <LuxuryShimmer key={i} />
                    ))}
                  </div>
                ) : listings.length === 0 ? (
                  <div className="mt-8 text-center">
                    <div className="text-slate-300 text-6xl mb-4">🏠</div>
                    <div className="text-slate-600 text-lg font-semibold mb-2">
                      {error ? "Failed to load properties" : "No properties found"}
                    </div>
                    <div className="text-slate-500 text-sm">
                      {error
                        ? "Please try refreshing the page"
                        : "Adjust your filters or expand the search area"}
                    </div>
                    {error && (
                      <button
                        className="mt-4 px-6 py-2 rounded-xl text-white font-medium focus:outline-none focus-visible:ring-2"
                        style={{
                          background: `linear-gradient(90deg, ${GREEN}, ${GREEN_DARK})`,
                          outlineColor: BLUE,
                        }}
                        onClick={fetchWithinBounds}
                      >
                        Retry Search
                      </button>
                    )}
                  </div>
                ) : (
                  listings.map((l) => (
                    <div role="listitem" key={l.id}>
                      <ListingCardLux
                        listing={l}
                        saved={savedIds.has(l.id)}
                        onDetails={() => navigateToFullDetails(l)}
                        onContact={() => gotoContactAgent(l)}
                        onSaveToggle={() => toggleSave(l.id)}
                        onCenter={() => centerExternalMap(l)}
                      />
                    </div>
                  ))
                )}
              </div>
            </section>
          </aside>

          {/* Map Panel */}
          <div
            ref={mapPanelRef}
            id="map-panel"
            className="
              relative order-1 lg:order-2 min-w-0 overflow-hidden
              min-h-[340px] sm:min-h-[420px] lg:min-h-0
            "
            tabIndex={-1}
            aria-label="Map"
            style={{ scrollMarginTop: "72px" }}
          >
            {/* Always fill the map panel across breakpoints */}
            <div className="absolute inset-0">
              <PropertyMap
                ref={mapApi}
                className="h-full"
                heightClass="h-[340px] sm:h-[420px] lg:h-full"
                similar={listings.map((l) => ({
                  id: l.id,
                  lat: l.lat,
                  lon: l.lon,
                  price: l.list_price,
                  image_url:
                    (l as any).image_url ||
                    (Array.isArray((l as any).photos) ? (l as any).photos?.[0] : undefined),
                  mls_id: l.mls_id,
                  is_premium:
                    l.list_price > 1_000_000 || (l as any).luxury_features?.length > 0,
                }))}
                onMarkerClick={(mini) => {
                  const mls = (mini as any)?.mls_id ?? null;
                  const id = (mini as any)?.id ?? null;
                  if (!mls && !id) return;
                  setPreviewTarget({ mls, id });
                }}
                onViewDetails={(mini) => {
                  const hit =
                    listings.find((x) => String(x.id) === String(mini.id)) ||
                    listings.find((x) => String(x.mls_id) === String((mini as any).mls_id));
                  if (hit) navigate(hrefFor(hit.mls_id, hit.id));
                }}
              />
            </div>

            {/* Center-on-map floating button */}
            <button
              type="button"
              onClick={centerOnMap}
              className="absolute right-4 bottom-24 md:bottom-6 z-[200] rounded-full border bg-white/90 backdrop-blur px-3 py-2 shadow"
              style={{ borderColor: "rgba(226,232,240,.6)" }}
            >
              Center on Map
            </button>
          </div>

          {/* SR live region */}
          <div
            aria-live="polite"
            className="sr-only"
            tabIndex={-1}
            role="status"
            id="mapsearch-announcement"
          />
        </div>

        {/* Floating Chat */}
        <Chat />

        {/* AllSearch Drawer */}
        {openSmart && (
          <div className="fixed inset-0 z-[100]">
            <div
              className="absolute inset-0"
              style={{ backgroundColor: "rgba(15,23,42,.55)", backdropFilter: "blur(8px)" }}
              onClick={() => setOpenSmart(false)}
            />
            <div
              className="absolute right-0 top-0 h-full w-full sm:w-[680px] md:w-[760px] bg-white shadow-2xl border-l overflow-hidden flex flex-col"
              style={{ borderColor: "#e2e8f0", borderTopLeftRadius: 16, borderBottomLeftRadius: 16 }}
            >
              <div className="sticky top-0 z-10 flex items-center justify-between px-6 h-16 border-b bg-white/95 backdrop-blur">
                <div className="flex items-center gap-3">
                  <SlidersHorizontalIcon className="h-6 w-6" style={{ color: BLUE }} />
                  <h3 className="font-bold" style={{ fontSize: 22 }}>
                    Advanced Filters
                  </h3>
                </div>
                <button
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg hover:bg-slate-100 transition-colors focus:outline-none focus-visible:ring-2"
                  style={{ outlineColor: BLUE }}
                  onClick={() => setOpenSmart(false)}
                  aria-label="Close advanced filters"
                >
                  <span className="text-slate-600 text-lg">×</span>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-4 sm:px-6 pt-4 pb-8">
                <AllSearch
                  mode="sidebar"
                  showHeader={false}
                  value={uiToAll(filtersRef.current)}
                  onChange={() => {}}
                  onReset={() => {
                    resetAllFilters();
                    announce("All filters have been reset.");
                  }}
                  onApply={(s) => {
                    const next = allToUi(filtersRef.current, s);
                    setFilters(next);
                    filtersRef.current = next;
                    fetchWithinBounds();
                    setOpenSmart(false);
                    announce("Advanced filters applied successfully");
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Save Search dialog */}
        <SaveSearchDialog
          open={saveOpen}
          onClose={() => setSaveOpen(false)}
          onSubmit={async (p) => {
            setSaveOpen(false);
            const payload = {
              name: p.name,
              frequency: p.frequency,
              filters: filtersRef.current,
              created_at: new Date().toISOString(),
            };
            await toast.promise(
              Promise.resolve(supabase.from("agent_display_overrides").insert(payload as any)),
              { loading: "Saving…", success: "Saved!", error: "Failed to save" }
            );
            announce(`Search "${p.name}" saved successfully`);
          }}
        />

        {/* Comps Drawer */}
        <CompsDrawer open={openComps} onClose={() => setOpenComps(false)} rows={listings} />
      </div>

      {/* === Preview Portal (ALWAYS on top of everything) === */}
      {previewTarget &&
        createPortal(
          <div
            className="fixed inset-0 z-[1200] flex items-center justify-center p-3 sm:p-6"
            role="dialog"
            aria-modal="true"
            aria-label="Property preview"
          >
            {/* backdrop */}
            <div
              className="absolute inset-0 backdrop-blur-md"
              style={{ backgroundColor: "rgba(15,23,42,.45)" }}
              onClick={() => setPreviewTarget(null)}
              aria-hidden="true"
            />
            {/* panel */}
            <div
              className="relative bg-white shadow-2xl border rounded-2xl overflow-hidden flex flex-col transform transition-all duration-300 pointer-events-auto"
              style={{
                borderColor: "#e2e8f0",
                width: "380px",
                maxWidth: "92vw",
                height: "700px",
                maxHeight: "85vh",
              }}
            >
              <PropertyDetailPreview
                mls={previewTarget.mls ?? undefined}
                id={previewTarget.id ?? undefined}
                onViewDetails={(href) => {
                  setPreviewTarget(null);
                  navigate(href);
                }}
                onClose={() => setPreviewTarget(null)}
              />
            </div>
          </div>,
          document.body
        )}
    </>
  );
}

/* ------------------------------ Listing Card ------------------------------ */
function ListingCardLux({
  listing,
  saved,
  onDetails,
  onContact,
  onSaveToggle,
  onCenter,
}: {
  listing: Listing;
  saved: boolean;
  onDetails: () => void;
  onContact: () => void;
  onSaveToggle: () => void;
  onCenter: () => void;
}) {
  const photos = getListingPhotos(listing);
  const first = photos[0] || listing.image_url || "";
  const dAgo = daysAgo(listing.list_date);

  const domLabel =
    dAgo == null ? null : dAgo >= 365 ? "1+ Year" : dAgo === 0 ? "New Today" : `${dAgo} days`;

  const beds = Number.isFinite(listing.beds as any) ? (listing.beds as any) : null;
  const baths = Number.isFinite(listing.baths as any) ? (listing.baths as any) : null;
  const sqft = Number.isFinite(listing.sqft as any) ? (listing.sqft as any) : null;

  const isLuxury =
    listing.list_price > 1_000_000 ||
    (listing as any).luxury_features?.length > 0 ||
    (sqft && sqft > 3000);
  const ppsf = Number.isFinite((listing as any).price_per_sqft)
    ? (listing as any).price_per_sqft
    : null;

  const l: any = listing;

  return (
    <article
      className="rounded-2xl border bg-white shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group"
      style={{ borderColor: "#e2e8f0" }}
    >
      <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
        {first ? (
          <img
            src={first}
            alt={listing.address || l.full_address || "Property photo"}
            className="absolute inset-0 h-full w-full object-cover group-hover:scale-105 transition-transform duration-600"
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-slate-400">
            <HomeModernIcon className="w-16 h-16" />
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />

        <div className="absolute top-4 left-4 right-4 flex items-start justify-between">
          <div className="flex flex-wrap gap-2">
            {isLuxury && <PremiumBadge />}
            {domLabel && (
              <span
                className="text-[11px] font-semibold px-3 py-1.5 rounded-full bg-white/95 border shadow-sm text-slate-700"
                style={{ borderColor: "#eef2f7" }}
              >
                📅 {domLabel}
              </span>
            )}
          </div>

          <button
            onClick={onSaveToggle}
            aria-label={saved ? "Remove from favourites" : "Add to favourites"}
            className="inline-flex items-center justify-center w-10 h-10 rounded-xl border shadow-sm backdrop-blur-sm transition-all duration-300 focus:outline-none focus-visible:ring-2"
            style={{
              borderColor: saved ? "transparent" : "#eef2f7",
              background: saved ? "#ef4444" : "rgba(255,255,255,.95)",
              color: saved ? "white" : "#0f172a",
              outlineColor: BLUE,
            }}
          >
            {saved ? <HeartSolidIcon className="w-5 h-5" /> : <HeartIcon className="w-5 h-5" />}
          </button>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="text-white font-bold leading-tight" style={{ fontSize: 20 }}>
            {Number.isFinite(listing.list_price as any)
              ? fmtMoney0(listing.list_price as any)
              : "Price upon request"}
          </div>
        </div>

        {photos.length > 1 && (
          <span className="absolute right-4 bottom-4 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-black/70 text-white backdrop-blur-sm">
            📸 1/{photos.length}
          </span>
        )}
      </div>

      <div className="p-5">
        <div className="mb-3">
          <h3 className="text-slate-900 font-bold leading-tight line-clamp-2" style={{ fontSize: 20 }}>
            {[getAddress(listing), getCity(listing)].filter(Boolean).join(", ") ||
              l.full_address ||
              l.street_address ||
              "Property"}
          </h3>
          <div className="mt-1.5 text-slate-600 text-sm leading-relaxed line-clamp-2">
            {l.description
              ? typeof l.description === "string"
                ? l.description.substring(0, 120) + "…"
                : "—"
              : "—"}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-4">
          {beds != null && <DataMetric label="Bedrooms" value={beds} icon={<span style={{ color: BLUE }}>🛏️</span>} />}
          {baths != null && <DataMetric label="Bathrooms" value={baths} icon={<span style={{ color: BLUE }}>🛁</span>} />}
          {sqft != null && (
            <DataMetric label="Square Feet" value={sqft.toLocaleString()} icon={<span style={{ color: BLUE }}>📐</span>} />
          )}
        </div>

        {(listing as any).lot_size && (
          <div className="mb-4">
            <DataMetric
              label="Lot Size"
              value={`${((listing as any).lot_size).toLocaleString()} sqft`}
              icon={<span style={{ color: BLUE }}>🌳</span>}
            />
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onDetails}
            className="flex-1 h-11 px-4 text-sm font-semibold rounded-xl text-white shadow-sm focus:outline-none focus-visible:ring-2"
            style={{ background: `linear-gradient(90deg, ${GREEN}, ${GREEN_DARK})`, outlineColor: BLUE }}
          >
            <ArrowsPointingOutIcon className="w-4 h-4 inline mr-2" />
            View Details
          </button>
          <button
            onClick={onContact}
            className="flex-1 h-11 px-4 text-sm font-semibold rounded-xl text-white shadow-sm focus:outline-none focus-visible:ring-2"
            style={{ background: `linear-gradient(90deg, ${GREEN}, ${GREEN_DARK})`, outlineColor: BLUE }}
          >
            💬 Contact Agent
          </button>
        </div>

        <button
          onClick={onCenter}
          className="w-full h-10 mt-3 rounded-xl border text-sm font-medium bg-white hover:bg-slate-50 transition-colors focus:outline-none focus-visible:ring-2"
          style={{ borderColor: "#e2e8f0", color: "#0f172a", outlineColor: BLUE }}
          title="Pan map to this property"
        >
          <MapPinIcon className="w-4 h-4 inline mr-2" style={{ color: BLUE }} />
          Center on Map
        </button>
      </div>
    </article>
  );
}

/* ------------------------------ Floating (portal) ------------------------------ */
function Floating({
  open,
  anchorRef,
  onClose,
  children,
}: {
  open: boolean;
  anchorRef: React.RefObject<HTMLElement | null>;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const [pos, setPos] = useState<{ left: number; top: number; minWidth: number }>(
    { left: 0, top: 0, minWidth: 0 }
  );
  const panelRef = useRef<HTMLDivElement | null>(null);

  const recalc = useCallback(() => {
    if (!open || !anchorRef.current) return;
    const r = anchorRef.current.getBoundingClientRect();
    setPos({
      left: Math.round(r.left),
      top: Math.round(r.bottom + 8),
      minWidth: Math.round(Math.max(r.width, 280)),
    });
  }, [open, anchorRef]);

  useLayoutEffect(() => {
    if (!open) return;
    recalc();
    const onScroll = () => recalc();
    const onResize = () => recalc();
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
    };
  }, [open, recalc]);

  useEffect(() => {
    if (!open) return;
    const handleDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (
        panelRef.current &&
        !panelRef.current.contains(t) &&
        anchorRef.current &&
        !anchorRef.current.contains(t)
      ) {
        onClose();
      }
    };
    window.addEventListener("mousedown", handleDown);
    return () => window.removeEventListener("mousedown", handleDown);
  }, [open, onClose, anchorRef]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[300] pointer-events-none">
      <div
        ref={panelRef}
        className="absolute pointer-events-auto"
        style={{ left: pos.left, top: pos.top, minWidth: pos.minWidth }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="relative">{children}</div>
      </div>
    </div>,
    document.body
  );
}
