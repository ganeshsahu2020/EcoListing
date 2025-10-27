// ui/src/components/AllSearch.tsx
import React, {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
// AFTER (safe set)
import {
  Filter as FilterIcon,
  Building2,
  Home,
  Building,
  Landmark,
  Bed,
  Calendar,
  DollarSign,
  Ruler,
  Layers,
  Wrench,
  Snowflake,
  Flame,
  Dumbbell,
  Key,
  DoorOpen,
  Search,
  Mountain,
  Waves,
  Trees,
  Car,
  Bike,
  Train,
  ShoppingBag,
  Coffee,
  Martini,
  Utensils,
  Store,
  MapPin,
  ShieldCheck,
  Check,
  X,
  ChevronDown,
  ChevronRight,
  Trash2,
  RotateCcw,
  GraduationCap, // ✅ use instead of School (more widely available)
  Footprints, // ✅ keep for now; if your version lacks it, see note below
} from "lucide-react";
import { GlassCard, GlassButton } from "./GlassUI";

/* ─────────────────────────────────────────────────────────
   BC Design Tokens (Visual alignment w/ other files)
   ──────────────────────────────────────────────────────── */
const BC_BLUE = "#1E90FF";     // active/links
const BC_GREEN = "#1ABC9C";    // primary CTAs
const BC_GREEN_DARK = "#12997F";
const BORDER = "rgba(0,0,0,0.08)";
const PANEL_BG = "rgba(255,255,255,0.75)";

// ---------- Types & Constants ----------

export type ListingStatus = "for-sale" | "sold" | "all";

export interface FilterState {
  status: ListingStatus;

  // For Sale
  daysOnMarket:
    | "all"
    | "24h"
    | "3d"
    | "7d"
    | "30d"
    | "90d";

  // Sold
  soldWithin:
    | "24h"
    | "3d"
    | "7d"
    | "30d"
    | "90d"
    | "180d"
    | "365d"
    | "year-2025"
    | "year-2024"
    | "year-2023"
    | "year-2022"
    | "year-2021"
    | "year-2020"
    | "year-2019"
    | "year-2018"
    | "year-2017"
    | "year-2016"
    | "year-2015"
    | "year-2014"
    | "year-2013"
    | "year-2012"
    | "year-2011"
    | "year-2010"
    | "year-2009"
    | "year-2008"
    | "year-2007"
    | "year-2006"
    | "year-2005"
    | "year-2004"
    | "year-2003"
    | "year-2002"
    | "year-2001"
    | "year-2000";

  // Price
  priceMin: number | null;
  priceMax: number | null;

  // Property Type
  // Selected “main” types and fine-grained styles per type
  propertyTypes: {
    Detached: boolean;
    "Semi Detached": boolean;
    Condo: boolean;
    Townhouse: boolean;
    Land: boolean;
  };
  propertyStyles: {
    Detached: string[];
    "Semi Detached": string[];
    Condo: string[];
    Townhouse: string[];
    Land: string[]; // keep empty for now
  };

  // Beds/Baths
  beds: "any" | "studio" | 1 | 2 | 3 | 4 | "5+";
  excludeDenBasement: boolean;
  bathsMin: 0 | 1 | 1.5 | 2 | 2.5 | 3 | 3.5 | 4 | 4.5 | 5;

  // Open houses
  openHouse: "any" | "today" | "tomorrow" | "week";

  // Listing info
  listingInfo: {
    floorPlan: boolean;
    virtualTour: boolean;
    priceDecreased: boolean;
  };

  // Fees & Taxes
  taxesMax: number | null;
  maintenanceMax: number | null;
  excludeMaintenance: boolean;

  // Property size (sqft)
  sizeMin: number | null;
  sizeMax: number | null;

  // Age (years)
  ageMin: number | null;
  ageMax: number | null;

  // Renovations
  renovated: {
    kitchen: boolean;
    bathroom: boolean;
  };

  // Basement
  basement: {
    mustHave: boolean | null; // yes / no / null
    type: "any" | "finished" | "unfinished" | null;
    separateEntrance: boolean | null;
  };

  // Amenities (chips)
  amenities: string[];

  // Keywords (chips)
  keywords: string[];

  // Located near
  locatedNear: {
    waterfront: boolean;
    forest: boolean;
    mountain: boolean;
  };

  // Lot size (feet)
  lot: {
    widthMin: number | null;
    depthMin: number | null;
  };

  // Parking & Garage
  parking: {
    totalMin: "any" | 1 | 2 | 3 | 4 | "5+";
    mustHaveGarage: boolean | null;
    garageSpacesMin: "any" | 1 | 2 | 3 | 4;
  };

  // Proximity
  proximity: {
    transit: boolean;
    bike: boolean;
    pedestrian: boolean;
    car: boolean;
  };

  // Neighbourhood access to services
  accessTo: {
    primarySchools: boolean;
    highSchools: boolean;
    parks: boolean;
    cafes: boolean;
    nightlife: boolean;
    restaurants: boolean;
    groceries: boolean;
    shopping: boolean;
  };

  // Atmosphere
  atmosphere: {
    quiet: boolean;
    vibrant: boolean;
  };
}

export interface AllSearchProps {
  value?: Partial<FilterState>;
  onChange?: (state: FilterState) => void;
  onApply?: (state: FilterState) => void;
  onReset?: () => void;
  /** "sidebar" forces inline; "auto" uses bottom sheet on small screens */
  mode?: "auto" | "sidebar";
  /** Render header row with summary and open button (mobile) */
  showHeader?: boolean;
  /** Sticky on desktop */
  sticky?: boolean;
  className?: string;
}

const DEFAULT_STATE: FilterState = {
  status: "for-sale",
  daysOnMarket: "all",
  soldWithin: "30d",
  priceMin: null,
  priceMax: null,
  propertyTypes: {
    Detached: false,
    "Semi Detached": false,
    Condo: false,
    Townhouse: false,
    Land: false,
  },
  propertyStyles: {
    Detached: [],
    "Semi Detached": [],
    Condo: [],
    Townhouse: [],
    Land: [],
  },
  beds: "any",
  excludeDenBasement: false,
  bathsMin: 0,
  openHouse: "any",
  listingInfo: {
    floorPlan: false,
    virtualTour: false,
    priceDecreased: false,
  },
  taxesMax: null,
  maintenanceMax: null,
  excludeMaintenance: false,
  sizeMin: null,
  sizeMax: null,
  ageMin: null,
  ageMax: null,
  renovated: {
    kitchen: false,
    bathroom: false,
  },
  basement: {
    mustHave: null,
    type: null,
    separateEntrance: null,
  },
  amenities: [],
  keywords: [],
  locatedNear: {
    waterfront: false,
    forest: false,
    mountain: false,
  },
  lot: {
    widthMin: null,
    depthMin: null,
  },
  parking: {
    totalMin: "any",
    mustHaveGarage: null,
    garageSpacesMin: "any",
  },
  proximity: {
    transit: false,
    bike: false,
    pedestrian: false,
    car: false,
  },
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
  atmosphere: {
    quiet: false,
    vibrant: false,
  },
};

const PRICE_POINTS = [
  0, 50000, 100000, 150000, 200000, 250000, 300000, 350000, 400000, 450000,
  500000, 550000, 600000, 650000, 700000, 750000, 800000, 850000, 900000,
  950000, 1000000, 1100000, 1200000, 1300000, 1400000, 1500000, 1600000,
  1700000, 1800000, 1900000, 2000000, 2100000, 2200000, 2300000, 2400000,
  2500000, 2600000, 2700000, 2800000, 2900000, 3000000, 3100000, 3200000,
  3300000, 3400000, 3500000, 3600000, 3700000, 3800000, 3900000, 4000000,
  4100000, 4200000, 4300000, 4400000, 4500000, 4600000, 4700000, 4800000,
  4900000, 5000000,
];

const SIZE_POINTS = [0, 250, 500, 750, 1000, 1500, 2000, 2500, 3000, 3500, 4000, 4500, 5000];
const AGE_POINTS = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100];
const TAX_POINTS = [0, 500, 1000, 1500, 2000, 2500, 3000, 3500, 4000, 4500, 5000, 5500, 6000, 6500, 7000, 7500, 8000, 8500, 9000, 9500, 10000];
const MAINT_POINTS = [0, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1100, 1200, 1300, 1400, 1500, 1600, 1700, 1800, 1900, 2000];
const LOT_POINTS = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150, 160, 170, 180, 190, 200];

const KEYWORD_SUGGESTIONS = [
  "Air Conditioning",
  "Balcony",
  "Basement With Separate Entrance",
  "Car Friendly",
  "Carpet Floor",
  "Ceramic Floor",
  "Concrete Floor",
  "Cottage",
  "Cycling Friendly",
  "Den",
  "Fenced Yard",
  "Fireplace",
  "Floor Plan",
  "Gym or Fitness Room",
  "Hardwood Floor",
  "Locker",
  "Media Room",
  "Multi Kitchen",
  "Near Cafes",
  "Near Daycares",
  "Near Forest",
  "Near Greeneries",
  "Near Groceries",
  "Near High Schools",
  "Near Mountain",
  "Near Nightlife",
  "Near Parks",
  "Near Primary Schools",
  "Near Restaurants",
  "Near Shopping",
  "Near Waterfront",
  "Open Concept Kitchen",
  "Patio",
  "Pedestrian Friendly",
  "Pool",
  "Quiet",
  "Renovated Bathroom",
  "Renovated Home",
  "Renovated Kitchen",
  "Rustic Kitchen",
  "Transit Friendly",
  "Vibrant",
  "Virtual Tour",
];

// Property Type → Styles
const TYPE_STYLES: Record<
  keyof FilterState["propertyStyles"],
  string[]
> = {
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
  Land: [],
};

const DAYS_FOR_SALE = [
  { key: "all", label: "All" },
  { key: "24h", label: "Last 24 hours" },
  { key: "3d", label: "Last 3 days" },
  { key: "7d", label: "Last 7 days" },
  { key: "30d", label: "Last 30 days" },
  { key: "90d", label: "Last 90 days" },
] as const;

const SOLD_WITHIN = [
  { key: "24h", label: "Last 24 Hours" },
  { key: "3d", label: "Last 3 Days" },
  { key: "7d", label: "Last 7 Days" },
  { key: "30d", label: "Last 30 Days" },
  { key: "90d", label: "Last 90 Days" },
  { key: "180d", label: "Last 180 Days" },
  { key: "365d", label: "Last 365 Days" },
  // Years:
  "2025",
  "2024",
  "2023",
  "2022",
  "2021",
  "2020",
  "2019",
  "2018",
  "2017",
  "2016",
  "2015",
  "2014",
  "2013",
  "2012",
  "2011",
  "2010",
  "2009",
  "2008",
  "2007",
  "2006",
  "2005",
  "2004",
  "2003",
  "2002",
  "2001",
  "2000",
].map((v) =>
  typeof v === "string"
    ? { key: (`year-${v}` as const), label: v }
    : (v as any)
);

// ---------- Utilities & Hooks ----------

const clamp = (n: number, min: number, max: number) =>
  Math.max(min, Math.min(max, n));

const fmtPrice = (n: number | null) =>
  n == null || n === 0
    ? "—"
    : n >= 1_000_000
    ? `$${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 2)}M`
    : `$${n.toLocaleString()}`;

const fmtNum = (n: number | null) => (n == null || n === 0 ? "—" : n.toLocaleString());

function useDebounced<T>(value: T, delay = 250) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function useIsMobile() {
  const [isMobile, set] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia("(max-width: 767px)");
    const update = () => set(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);
  return isMobile;
}

// Trap focus inside modal while open
function useFocusTrap(enabled: boolean, scopeRef: React.RefObject<HTMLElement>) {
  useEffect(() => {
    if (!enabled || !scopeRef.current) return;
    const root = scopeRef.current;
    const focusable = () =>
      Array.from(
        root.querySelectorAll<HTMLElement>(
          'a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])'
        )
      ).filter((el) => !el.hasAttribute("disabled") && !el.getAttribute("aria-hidden"));

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const nodes = focusable();
      if (!nodes.length) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (e.shiftKey) {
        if (active === first || !root.contains(active)) {
          last.focus();
          e.preventDefault();
        }
      } else {
        if (active === last) {
          first.focus();
          e.preventDefault();
        }
      }
    };
    root.addEventListener("keydown", onKeyDown);
    // autofocus first
    queueMicrotask(() => {
      const nodes = focusable();
      nodes[0]?.focus();
    });
    return () => root.removeEventListener("keydown", onKeyDown);
  }, [enabled, scopeRef]);
}

// ---------- Reusable UI ----------

function GradientIcon({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={`inline-flex items-center justify-center text-transparent bg-clip-text ${className}`}
      style={{ backgroundImage: `linear-gradient(90deg, ${BC_BLUE}, ${BC_GREEN})` }}
      aria-hidden
    >
      {children}
    </span>
  );
}

function Section({
  title,
  icon,
  children,
  defaultOpen = true,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();
  return (
    <div
      className="rounded-2xl border shadow-sm"
      style={{ borderColor: BORDER, background: PANEL_BG, backdropFilter: "blur(12px)" }}
    >
      <button
        className="w-full flex items-center gap-2 px-4 py-3 text-left"
        onClick={() => setOpen((s) => !s)}
        aria-controls={id}
        aria-expanded={open}
        style={{ fontFamily: "Inter, Nunito, ui-sans-serif", fontSize: 16, fontWeight: 700 }}
      >
        <GradientIcon className="mr-1">{icon}</GradientIcon>
        <span className="text-slate-900">{title}</span>
        <span className="ml-auto text-slate-500">{open ? <ChevronDown size={18}/> : <ChevronRight size={18}/>}</span>
      </button>
      <div id={id} role="region" className={`px-4 pb-4 pt-0 ${open ? "block" : "hidden"}`}>
        {children}
      </div>
    </div>
  );
}

function TogglePill({
  active,
  onClick,
  children,
  ariaLabel,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  ariaLabel?: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={ariaLabel}
      onClick={onClick}
      className={`px-3 py-1.5 rounded-2xl text-sm transition-all border ${
        active
          ? "text-white shadow"
          : "text-slate-700 hover:bg-white"
      }`}
      style={{
        borderColor: active ? "transparent" : BORDER,
        background: active ? `linear-gradient(90deg, ${BC_BLUE}, ${BC_GREEN})` : "rgba(255,255,255,0.7)",
        fontFamily: "Inter, Nunito, ui-sans-serif",
      }}
    >
      {children}
    </button>
  );
}

function Chip({
  selected,
  onToggle,
  children,
}: {
  selected: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onToggle}
      className="px-2.5 py-1.5 rounded-xl text-xs font-medium border transition"
      style={{
        borderColor: selected ? "transparent" : BORDER,
        background: selected ? `linear-gradient(90deg, ${BC_GREEN}, ${BC_GREEN_DARK})` : "rgba(255,255,255,0.7)",
        color: selected ? "#fff" : "#334155",
        fontFamily: "Inter, Nunito, ui-sans-serif",
      }}
    >
      {children}
    </button>
  );
}

function Select({
  value,
  onChange,
  options,
  placeholder,
  ariaLabel,
}: {
  value: number | null;
  onChange: (v: number | null) => void;
  options: number[];
  placeholder: string;
  ariaLabel?: string;
}) {
  return (
    <select
      aria-label={ariaLabel}
      className="w-full h-10 rounded-xl bg-white border px-3 text-sm focus:outline-none focus:ring-4"
      style={{
        borderColor: BORDER,
        boxShadow: `0 0 0 3px ${BC_BLUE}33`, // replacement for "ring"
        fontFamily: "Inter, Nunito, ui-sans-serif",
      }}
      value={value == null ? "" : String(value)}
      onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
    >
      <option value="">{placeholder}</option>
      {options.map((n) => (
        <option key={n} value={n}>
          {n === 0 ? (placeholder.toLowerCase().includes("minimum") ? "No Minimum" : "No Maximum") : `$${n.toLocaleString()}`}
        </option>
      ))}
    </select>
  );
}

function DualRange({
  min,
  max,
  step = 1,
  value,
  onChange,
  ariaLabelMin,
  ariaLabelMax,
  format = (n: number) => String(n),
}: {
  min: number;
  max: number;
  step?: number;
  value: [number, number];
  onChange: (v: [number, number]) => void;
  ariaLabelMin?: string;
  ariaLabelMax?: string;
  format?: (n: number) => string;
}) {
  const [a, b] = value;
  const low = Math.min(a, b);
  const high = Math.max(a, b);
  const pct = (n: number) => ((n - min) / (max - min)) * 100;

  return (
    <div className="relative py-2 select-none">
      <div className="h-2 rounded-full" style={{ background: "rgba(0,0,0,0.06)" }} />
      <div
        className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-2 rounded-full"
        style={{
          left: `${pct(low)}%`,
          right: `${100 - pct(high)}%`,
          background: `linear-gradient(90deg, ${BC_BLUE}, ${BC_GREEN})`,
        }}
        aria-hidden
      />
      <input
        aria-label={ariaLabelMin}
        type="range"
        min={min}
        max={max}
        step={step}
        value={low}
        onChange={(e) => {
          const next = clamp(Number(e.target.value), min, high);
          onChange([next, high]);
        }}
        className="absolute inset-0 w-full appearance-none bg-transparent pointer-events-auto"
      />
      <input
        aria-label={ariaLabelMax}
        type="range"
        min={min}
        max={max}
        step={step}
        value={high}
        onChange={(e) => {
          const next = clamp(Number(e.target.value), low, max);
          onChange([low, next]);
        }}
        className="absolute inset-0 w-full appearance-none bg-transparent pointer-events-auto"
      />
      <div className="mt-2 flex justify-between text-xs text-slate-600" style={{ fontFamily: "Inter, Nunito, ui-sans-serif" }}>
        <span>{format(low)}</span>
        <span>{format(high)}</span>
      </div>

      {/* Thumb styles */}
      <style>{`
        input[type="range"] {
          -webkit-appearance: none;
          appearance: none;
          height: 0;
          outline: none;
        }
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 18px; height: 18px;
          border-radius: 9999px;
          background: linear-gradient(90deg, ${BC_BLUE}, ${BC_GREEN});
          border: 2px solid rgba(255,255,255,.9);
          box-shadow: 0 1px 2px rgba(0,0,0,.25);
          cursor: pointer;
          margin-top: -8px;
        }
        input[type="range"]::-moz-range-thumb {
          width: 18px; height: 18px;
          border-radius: 9999px;
          background: linear-gradient(90deg, ${BC_BLUE}, ${BC_GREEN});
          border: 2px solid rgba(255,255,255,.9);
          box-shadow: 0 1px 2px rgba(0,0,0,.25);
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}

// ---------- Main Component ----------

export default function AllSearch({
  value,
  onChange,
  onApply,
  onReset,
  mode = "auto",
  showHeader = true,
  sticky = true,
  className = "",
}: AllSearchProps) {
  const [state, setState] = useState<FilterState>(() => ({ ...DEFAULT_STATE, ...value }));
  const isMobile = useIsMobile();
  const useBottomSheet = mode === "auto" ? isMobile : false;

  const [open, setOpen] = useState(!useBottomSheet);
  useEffect(() => setOpen(!useBottomSheet), [useBottomSheet]);

  const modalRef = useRef<HTMLDivElement>(null);
  useFocusTrap(useBottomSheet && open, modalRef);

  // Sync out
  useEffect(() => {
    onChange?.(state);
  }, [state, onChange]);

  const selectedSummary = useMemo(() => {
    const parts: string[] = [];
    if (state.status !== "all") parts.push(state.status === "for-sale" ? "For Sale" : "Sold");
    if (state.priceMin || state.priceMax) parts.push(`Price ${fmtPrice(state.priceMin)}–${fmtPrice(state.priceMax)}`);
    const types = Object.entries(state.propertyTypes)
      .filter(([, v]) => v)
      .map(([k]) => k);
    if (types.length) parts.push(types.join(", "));
    if (state.beds !== "any") parts.push(`${state.beds === "studio" ? "Studio" : `${state.beds}+ Beds`}`);
    if (state.bathsMin) parts.push(`${state.bathsMin}+ Baths`);
    if (state.keywords.length) parts.push(`${state.keywords.length} keywords`);
    if (state.amenities.length) parts.push(`${state.amenities.length} amenities`);
    return parts.join(" • ");
  }, [state]);

  const apply = () => onApply?.(state);
  const reset = () => {
    setState(DEFAULT_STATE);
    onReset?.();
  };

  // ---------- Handlers ----------

  const setPriceMin = (n: number | null) => setState((s) => ({ ...s, priceMin: n }));
  const setPriceMax = (n: number | null) => setState((s) => ({ ...s, priceMax: n }));

  const updatePriceRange = (a: number | null, b: number | null) => {
    const [min, max] = [a ?? 0, b ?? 0].sort((x, y) => x - y);
    setState((s) => ({ ...s, priceMin: a, priceMax: b, }));
  };

  const toggleMainType = (k: keyof FilterState["propertyTypes"]) =>
    setState((s) => ({
      ...s,
      propertyTypes: { ...s.propertyTypes, [k]: !s.propertyTypes[k] },
    }));

  const toggleStyle = (group: keyof FilterState["propertyStyles"], style: string) =>
    setState((s) => {
      const set = new Set(s.propertyStyles[group]);
      set.has(style) ? set.delete(style) : set.add(style);
      return { ...s, propertyStyles: { ...s.propertyStyles, [group]: Array.from(set) } };
    });

  const toggleAmenity = (label: string) =>
    setState((s) => {
      const set = new Set(s.amenities);
      set.has(label) ? set.delete(label) : set.add(label);
      return { ...s, amenities: Array.from(set) };
    });

  const toggleKeyword = (label: string) =>
    setState((s) => {
      const set = new Set(s.keywords);
      set.has(label) ? set.delete(label) : set.add(label);
      return { ...s, keywords: Array.from(set) };
    });

  // ---------- Filter Panels ----------

  const StatusSection = (
    <Section
      title="Listing Status"
      icon={<FilterIcon size={18} />}
    >
      <div className="flex flex-wrap gap-2 mb-3" role="radiogroup" aria-label="Listing Status">
        {[
          { k: "for-sale", label: "For Sale" },
          { k: "sold", label: "Sold" },
          { k: "all", label: "All" },
        ].map((o) => (
          <TogglePill
            key={o.k}
            active={state.status === (o.k as ListingStatus)}
            onClick={() => setState((s) => ({ ...s, status: o.k as ListingStatus }))}
            ariaLabel={o.label}
          >
            {o.label}
          </TogglePill>
        ))}
      </div>

      {state.status === "for-sale" && (
        <div>
          <div className="text-xs font-medium text-slate-600 mb-2">Days on market</div>
          <div className="flex flex-wrap gap-2">
            {DAYS_FOR_SALE.map((o) => (
              <TogglePill
                key={o.key}
                active={state.daysOnMarket === o.key}
                onClick={() => setState((s) => ({ ...s, daysOnMarket: o.key }))}
              >
                {o.label}
              </TogglePill>
            ))}
          </div>
        </div>
      )}

      {state.status === "sold" && (
        <div>
          <div className="text-xs font-medium text-slate-600 mb-2">Sold within</div>
          <div className="grid grid-cols-2 gap-2 max-h-48 overflow-auto pr-1">
            {SOLD_WITHIN.map((o) => (
              <TogglePill
                key={o.key}
                active={state.soldWithin === (o.key as FilterState["soldWithin"])}
                onClick={() => setState((s) => ({ ...s, soldWithin: o.key as FilterState["soldWithin"] }))}
              >
                {o.label}
              </TogglePill>
            ))}
          </div>
        </div>
      )}
    </Section>
  );

  const PriceSection = (
    <Section
      title="Price"
      icon={<DollarSign size={18} />}
    >
      <div className="grid grid-cols-2 gap-3 mb-3">
        <Select
          ariaLabel="Minimum Price"
          value={state.priceMin}
          onChange={setPriceMin}
          options={PRICE_POINTS}
          placeholder="Min Price"
        />
        <Select
          ariaLabel="Maximum Price"
          value={state.priceMax}
          onChange={setPriceMax}
          options={PRICE_POINTS}
          placeholder="Max Price"
        />
      </div>

      <DualRange
        min={0}
        max={PRICE_POINTS[PRICE_POINTS.length - 1]}
        step={50000}
        value={[
          state.priceMin ?? 0,
          state.priceMax ?? PRICE_POINTS[PRICE_POINTS.length - 1],
        ]}
        onChange={([lo, hi]) => updatePriceRange(lo, hi)}
        ariaLabelMin="Min price"
        ariaLabelMax="Max price"
        format={(n) => fmtPrice(n)}
      />
    </Section>
  );

  const PropertyTypeSection = (
    <Section
      title="Property Type"
      icon={<Home size={18} />}
    >
      <div className="space-y-3">
        {(
          [
            { key: "Detached", icon: <Home size={16} /> },
            { key: "Semi Detached", icon: <Building2 size={16} /> },
            { key: "Condo", icon: <Building size={16} /> },
            { key: "Townhouse", icon: <Building size={16} /> },
            { key: "Land", icon: <Landmark size={16} /> },
          ] as const
        ).map(({ key, icon }) => {
          const k = key as keyof FilterState["propertyTypes"];
          const openDefault = state.propertyTypes[k] || state.propertyStyles[k].length > 0;
          return (
            <details
              key={key}
              className="group rounded-xl border"
              open={openDefault}
              style={{ borderColor: BORDER, background: "rgba(255,255,255,0.6)" }}
            >
              <summary className="cursor-pointer list-none px-3 py-2 flex items-center gap-2">
                <input
                  type="checkbox"
                  className="accent-[color:var(--bc-green,#1ABC9C)] scale-110 mr-1"
                  checked={state.propertyTypes[k]}
                  onChange={() => toggleMainType(k)}
                  aria-label={`Toggle ${key}`}
                />
                <GradientIcon>{icon}</GradientIcon>
                <span className="font-medium text-slate-800" style={{ fontFamily: "Inter, Nunito, ui-sans-serif" }}>{key}</span>
                <ChevronDown className="ml-auto transition group-open:rotate-180" size={16} />
              </summary>
              {TYPE_STYLES[k].length > 0 && (
                <div className="px-3 pb-3">
                  <div className="text-xs text-slate-600 mb-2">Styles</div>
                  <div className="flex flex-wrap gap-1.5">
                    {TYPE_STYLES[k].map((style) => (
                      <Chip
                        key={style}
                        selected={state.propertyStyles[k].includes(style)}
                        onToggle={() => toggleStyle(k, style)}
                      >
                        {style}
                      </Chip>
                    ))}
                  </div>
                </div>
              )}
            </details>
          );
        })}
      </div>
    </Section>
  );

  const BedsBathsSection = (
    <Section
      title="Beds & Baths"
      icon={<Bed size={18} />}
    >
      <div className="mb-3">
        <div className="text-xs font-medium text-slate-600 mb-2">Bedrooms</div>
        <div className="flex flex-wrap gap-2">
          {["any", "studio", 1, 2, 3, 4, "5+"].map((b) => (
            <TogglePill
              key={`beds-${b}`}
              active={state.beds === (b as FilterState["beds"])}
              onClick={() => setState((s) => ({ ...s, beds: b as FilterState["beds"] }))}
            >
              {b === "any" ? "Any" : b === "studio" ? "Studio" : `${b}`}
            </TogglePill>
          ))}
        </div>
        <label className="mt-3 flex items-center gap-2 text-sm text-slate-700" style={{ fontFamily: "Inter, Nunito, ui-sans-serif" }}>
          <input
            type="checkbox"
            className="accent-[color:var(--bc-green,#1ABC9C)]"
            checked={state.excludeDenBasement}
            onChange={(e) => setState((s) => ({ ...s, excludeDenBasement: e.target.checked }))}
          />
          Exclude Den/Basement
        </label>
      </div>

      <div>
        <div className="text-xs font-medium text-slate-600 mb-2">Bathrooms (min)</div>
        <div className="flex flex-wrap gap-2">
          {[0, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5].map((n) => (
            <TogglePill
              key={`baths-${n}`}
              active={state.bathsMin === (n as FilterState["bathsMin"])}
              onClick={() => setState((s) => ({ ...s, bathsMin: n as FilterState["bathsMin"] }))}
            >
              {n === 0 ? "Any" : `${n}+`}
            </TogglePill>
          ))}
        </div>
      </div>
    </Section>
  );

  const OpenHouseSection = (
    <Section
      title="Open Houses"
      icon={<Calendar size={18} />}
    >
      <div className="flex flex-wrap gap-2">
        {[
          { k: "any", label: "Any Day" },
          { k: "today", label: "Today" },
          { k: "tomorrow", label: "Tomorrow" },
          { k: "week", label: "Within a Week" },
        ].map((o) => (
          <TogglePill
            key={o.k}
            active={state.openHouse === (o.k as FilterState["openHouse"])}
            onClick={() => setState((s) => ({ ...s, openHouse: o.k as FilterState["openHouse"] }))}
          >
            {o.label}
          </TogglePill>
        ))}
      </div>
    </Section>
  );

  const ListingInfoSection = (
    <Section
      title="Listing Info"
      icon={<Layers size={18} />}
    >
      <div className="flex flex-wrap gap-3">
        <label className="flex items-center gap-2 text-sm" style={{ fontFamily: "Inter, Nunito, ui-sans-serif" }}>
          <input
            type="checkbox"
            className="accent-[color:var(--bc-green,#1ABC9C)]"
            checked={state.listingInfo.floorPlan}
            onChange={(e) => setState((s) => ({ ...s, listingInfo: { ...s.listingInfo, floorPlan: e.target.checked } }))}
          />
          Floor Plan(s)
        </label>
        <label className="flex items-center gap-2 text-sm" style={{ fontFamily: "Inter, Nunito, ui-sans-serif" }}>
          <input
            type="checkbox"
            className="accent-[color:var(--bc-green,#1ABC9C)]"
            checked={state.listingInfo.virtualTour}
            onChange={(e) => setState((s) => ({ ...s, listingInfo: { ...s.listingInfo, virtualTour: e.target.checked } }))}
          />
          Virtual Tour
        </label>
        <label className="flex items-center gap-2 text-sm" style={{ fontFamily: "Inter, Nunito, ui-sans-serif" }}>
          <input
            type="checkbox"
            className="accent-[color:var(--bc-green,#1ABC9C)]"
            checked={state.listingInfo.priceDecreased}
            onChange={(e) => setState((s) => ({ ...s, listingInfo: { ...s.listingInfo, priceDecreased: e.target.checked } }))}
          />
          Price Decreased
        </label>
      </div>
    </Section>
  );

  const FeesTaxesSection = (
    <Section
      title="Fees & Taxes"
      icon={<ShieldCheck size={18} />}
    >
      <div className="grid grid-cols-1 gap-4">
        <div>
          <div className="text-xs font-medium text-slate-600 mb-2">Property Taxes (Max)</div>
          <div className="grid grid-cols-2 gap-3">
            <Select
              ariaLabel="Max Property Tax"
              value={state.taxesMax}
              onChange={(v) => setState((s) => ({ ...s, taxesMax: v }))}
              options={TAX_POINTS}
              placeholder="No Maximum"
            />
            <DualRange
              min={0}
              max={10000}
              step={100}
              value={[0, state.taxesMax ?? 10000]}
              onChange={([, hi]) => setState((s) => ({ ...s, taxesMax: hi === 0 ? null : hi }))}
              ariaLabelMin="Min tax"
              ariaLabelMax="Max tax"
              format={(n) => (n === 0 ? "No Min" : `$${n.toLocaleString()}`)}
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-medium text-slate-600">Maintenance Fees (Max / Month)</div>
            <label className="flex items-center gap-2 text-xs text-slate-700" style={{ fontFamily: "Inter, Nunito, ui-sans-serif" }}>
              <input
                type="checkbox"
                className="accent-[color:var(--bc-green,#1ABC9C)]"
                checked={state.excludeMaintenance}
                onChange={(e) => setState((s) => ({ ...s, excludeMaintenance: e.target.checked }))}
              />
              Exclude Listings With Maintenance Fees
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Select
              ariaLabel="Max Maintenance Fee"
              value={state.maintenanceMax}
              onChange={(v) => setState((s) => ({ ...s, maintenanceMax: v }))}
              options={MAINT_POINTS}
              placeholder="No Maximum"
            />
            <DualRange
              min={0}
              max={2000}
              step={50}
              value={[0, state.maintenanceMax ?? 2000]}
              onChange={([, hi]) => setState((s) => ({ ...s, maintenanceMax: hi === 0 ? null : hi }))}
              ariaLabelMin="Min maint"
              ariaLabelMax="Max maint"
              format={(n) => (n === 0 ? "No Min" : `$${n}/mo`)}
            />
          </div>
        </div>
      </div>
    </Section>
  );

  const SizeSection = (
    <Section
      title="Property Size"
      icon={<Ruler size={18} />}
    >
      <div className="grid grid-cols-2 gap-3 mb-3">
        <select
          aria-label="Min Size"
          className="w-full h-10 rounded-xl bg-white border px-3 text-sm focus:outline-none focus:ring-4"
          style={{
            borderColor: BORDER,
            boxShadow: `0 0 0 3px ${BC_BLUE}33`,
            fontFamily: "Inter, Nunito, ui-sans-serif",
          }}
          value={state.sizeMin ?? ""}
          onChange={(e) => setState((s) => ({ ...s, sizeMin: e.target.value ? Number(e.target.value) : null }))}
        >
          <option value="">{`No Minimum`}</option>
          {SIZE_POINTS.slice(1).map((n) => (
            <option key={n} value={n}>{n.toLocaleString()} sqft</option>
          ))}
        </select>
        <select
          aria-label="Max Size"
          className="w-full h-10 rounded-xl bg-white border px-3 text-sm focus:outline-none focus:ring-4"
          style={{
            borderColor: BORDER,
            boxShadow: `0 0 0 3px ${BC_BLUE}33`,
            fontFamily: "Inter, Nunito, ui-sans-serif",
          }}
          value={state.sizeMax ?? ""}
          onChange={(e) => setState((s) => ({ ...s, sizeMax: e.target.value ? Number(e.target.value) : null }))}
        >
          <option value="">{`No Maximum`}</option>
          {SIZE_POINTS.slice(1).map((n) => (
            <option key={n} value={n}>{n.toLocaleString()} sqft</option>
          ))}
        </select>
      </div>

      <DualRange
        min={0}
        max={5000}
        step={50}
        value={[state.sizeMin ?? 0, state.sizeMax ?? 5000]}
        onChange={([lo, hi]) => setState((s) => ({ ...s, sizeMin: lo === 0 ? null : lo, sizeMax: hi === 5000 ? null : hi }))}
        ariaLabelMin="Min size"
        ariaLabelMax="Max size"
        format={(n) => (n === 0 ? "No Min" : `${n.toLocaleString()} sqft`)}
      />
    </Section>
  );

  const AgeSection = (
    <Section
      title="Property Age"
      icon={<Ruler size={18} />}
    >
      <div className="grid grid-cols-2 gap-3 mb-3">
        <select
          aria-label="Min Age"
          className="w-full h-10 rounded-xl bg-white border px-3 text-sm focus:outline-none focus:ring-4"
          style={{
            borderColor: BORDER,
            boxShadow: `0 0 0 3px ${BC_BLUE}33`,
            fontFamily: "Inter, Nunito, ui-sans-serif",
          }}
          value={state.ageMin ?? ""}
          onChange={(e) => setState((s) => ({ ...s, ageMin: e.target.value ? Number(e.target.value) : null }))}
        >
          <option value="">No Minimum</option>
          {AGE_POINTS.slice(1).map((n) => (
            <option key={n} value={n}>{n} Years</option>
          ))}
        </select>
        <select
          aria-label="Max Age"
          className="w-full h-10 rounded-xl bg-white border px-3 text-sm focus:outline-none focus:ring-4"
          style={{
            borderColor: BORDER,
            boxShadow: `0 0 0 3px ${BC_BLUE}33`,
            fontFamily: "Inter, Nunito, ui-sans-serif",
          }}
          value={state.ageMax ?? ""}
          onChange={(e) => setState((s) => ({ ...s, ageMax: e.target.value ? Number(e.target.value) : null }))}
        >
          <option value="">No Maximum</option>
          {AGE_POINTS.slice(1).map((n) => (
            <option key={n} value={n}>{n} Years</option>
          ))}
        </select>
      </div>

      <DualRange
        min={0}
        max={100}
        step={1}
        value={[state.ageMin ?? 0, state.ageMax ?? 100]}
        onChange={([lo, hi]) => setState((s) => ({ ...s, ageMin: lo === 0 ? null : lo, ageMax: hi === 100 ? null : hi }))}
        ariaLabelMin="Min age"
        ariaLabelMax="Max age"
        format={(n) => (n === 0 ? "No Min" : `${n}y`)}
      />
    </Section>
  );

  const RenovationsSection = (
    <Section
      title="Renovations"
      icon={<Wrench size={18} />}
    >
      <div className="flex flex-wrap gap-3">
        <label className="flex items-center gap-2 text-sm" style={{ fontFamily: "Inter, Nunito, ui-sans-serif" }}>
          <input
            type="checkbox"
            className="accent-[color:var(--bc-green,#1ABC9C)]"
            checked={state.renovated.kitchen}
            onChange={(e) => setState((s) => ({ ...s, renovated: { ...s.renovated, kitchen: e.target.checked } }))}
          />
          Renovated Kitchen
        </label>
        <label className="flex items-center gap-2 text-sm" style={{ fontFamily: "Inter, Nunito, ui-sans-serif" }}>
          <input
            type="checkbox"
            className="accent-[color:var(--bc-green,#1ABC9C)]"
            checked={state.renovated.bathroom}
            onChange={(e) => setState((s) => ({ ...s, renovated: { ...s.renovated, bathroom: e.target.checked } }))}
          />
          Renovated Bathroom
        </label>
      </div>
    </Section>
  );

  const BasementSection = (
    <Section
      title="Basement"
      icon={<DoorOpen size={18} />}
    >
      <div className="mb-3">
        <div className="text-xs font-medium text-slate-600 mb-2">Must Include a Basement?</div>
        <div className="flex gap-2">
          <TogglePill
            active={state.basement.mustHave === true}
            onClick={() => setState((s) => ({ ...s, basement: { ...s.basement, mustHave: true } }))}
          >
            Yes
          </TogglePill>
          <TogglePill
            active={state.basement.mustHave === false}
            onClick={() => setState((s) => ({ ...s, basement: { ...s.basement, mustHave: false } }))}
          >
            No
          </TogglePill>
          <TogglePill
            active={state.basement.mustHave === null}
            onClick={() => setState((s) => ({ ...s, basement: { ...s.basement, mustHave: null } }))}
          >
            Any
          </TogglePill>
        </div>
      </div>
      {state.basement.mustHave === true && (
        <>
          <div className="mb-3">
            <div className="text-xs font-medium text-slate-600 mb-2">Type</div>
            <div className="flex gap-2">
              {(["any", "finished", "unfinished"] as const).map((t) => (
                <TogglePill
                  key={t}
                  active={state.basement.type === t}
                  onClick={() => setState((s) => ({ ...s, basement: { ...s.basement, type: t } }))}
                >
                  {t[0].toUpperCase() + t.slice(1)}
                </TogglePill>
              ))}
            </div>
          </div>
          <div>
            <div className="text-xs font-medium text-slate-600 mb-2">Must Include a Separate Entrance?</div>
            <div className="flex gap-2">
              <TogglePill
                active={state.basement.separateEntrance === true}
                onClick={() => setState((s) => ({ ...s, basement: { ...s.basement, separateEntrance: true } }))}
              >
                Yes
              </TogglePill>
              <TogglePill
                active={state.basement.separateEntrance === false}
                onClick={() => setState((s) => ({ ...s, basement: { ...s.basement, separateEntrance: false } }))}
              >
                No
              </TogglePill>
              <TogglePill
                active={state.basement.separateEntrance === null}
                onClick={() => setState((s) => ({ ...s, basement: { ...s.basement, separateEntrance: null } }))}
              >
                Any
              </TogglePill>
            </div>
          </div>
        </>
      )}
    </Section>
  );

  const AmenitiesSection = (
    <Section
      title="Amenities"
      icon={<Dumbbell size={18} />}
    >
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: "Pool", icon: <Waves size={16} /> },
          { label: "Fireplace", icon: <Flame size={16} /> },
          { label: "Air Conditioning", icon: <Snowflake size={16} /> },
          { label: "Balcony", icon: <MapPin size={16} /> },
          { label: "Gym / Fitness Room", icon: <Dumbbell size={16} /> },
          { label: "Den", icon: <Key size={16} /> },
          { label: "Locker", icon: <Key size={16} /> },
          { label: "Secondary Kitchen", icon: <Utensils size={16} /> },
        ].map((a) => (
          <button
            type="button"
            key={a.label}
            onClick={() => toggleAmenity(a.label)}
            className="group flex items-center gap-2 px-3 py-2 rounded-xl border transition"
            style={{
              borderColor: state.amenities.includes(a.label) ? "transparent" : BORDER,
              background: state.amenities.includes(a.label)
                ? `linear-gradient(90deg, ${BC_GREEN}, ${BC_GREEN_DARK})`
                : "rgba(255,255,255,0.7)",
              color: state.amenities.includes(a.label) ? "#fff" : "#334155",
              fontFamily: "Inter, Nunito, ui-sans-serif",
            }}
          >
            <GradientIcon>{a.icon}</GradientIcon>
            <span className="text-sm">{a.label}</span>
            {state.amenities.includes(a.label) && <Check className="ml-auto" size={16} />}
          </button>
        ))}
      </div>
    </Section>
  );

  // Keywords with search + chips
  const [keywordQuery, setKeywordQuery] = useState("");
  const debouncedKeywordQuery = useDebounced(keywordQuery, 200);
  const keywordResults = useMemo(() => {
    const q = debouncedKeywordQuery.trim().toLowerCase();
    if (!q) return KEYWORD_SUGGESTIONS;
    return KEYWORD_SUGGESTIONS.filter((k) => k.toLowerCase().includes(q));
  }, [debouncedKeywordQuery]);

  const KeywordsSection = (
    <Section
      title="Keywords"
      icon={<Search size={18} />}
    >
      <div className="mb-2">
        <div className="relative">
          <input
            aria-label="Search keywords"
            type="text"
            value={keywordQuery}
            onChange={(e) => setKeywordQuery(e.target.value)}
            placeholder="Select or type keyword"
            className="w-full h-10 rounded-xl bg-white border px-3 pr-9 text-sm focus:outline-none focus:ring-4"
            style={{
              borderColor: BORDER,
              boxShadow: `0 0 0 3px ${BC_BLUE}33`,
              fontFamily: "Inter, Nunito, ui-sans-serif",
            }}
          />
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {keywordResults.map((k) => (
          <Chip key={k} selected={state.keywords.includes(k)} onToggle={() => toggleKeyword(k)}>
            + {k}
          </Chip>
        ))}
      </div>
      {state.keywords.length > 0 && (
        <div className="mt-3 flex items-center gap-2 flex-wrap">
          <div className="text-xs text-slate-600">Selected:</div>
          {state.keywords.map((k) => (
            <span
              key={`sel-${k}`}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs"
              style={{ background: `linear-gradient(90deg, ${BC_BLUE}22, ${BC_GREEN}22)`, color: "#0f172a", fontFamily: "Inter, Nunito, ui-sans-serif" }}
            >
              {k}
              <button
                aria-label={`Remove ${k}`}
                className="hover:opacity-80"
                onClick={() => toggleKeyword(k)}
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}
    </Section>
  );

  const LocatedNearSection = (
    <Section
      title="Location Features"
      icon={<Trees size={18} />}
    >
      <div className="grid grid-cols-3 gap-2">
        {[
          { k: "waterfront", label: "Waterfront", icon: <Waves size={16} /> },
          { k: "forest", label: "Forest", icon: <Trees size={16} /> },
          { k: "mountain", label: "Mountain", icon: <Mountain size={16} /> },
        ].map((o) => (
          <TogglePill
            key={o.k}
            active={(state.locatedNear as any)[o.k]}
            onClick={() =>
              setState((s) => ({
                ...s,
                locatedNear: { ...s.locatedNear, [o.k]: !(s.locatedNear as any)[o.k] } as FilterState["locatedNear"],
              }))
            }
          >
            <span className="inline-flex items-center gap-1">
              <GradientIcon>{o.icon}</GradientIcon>
              {o.label}
            </span>
          </TogglePill>
        ))}
      </div>
    </Section>
  );

  const LotSizeSection = (
    <Section
      title="Lot Size"
      icon={<Ruler size={18} />}
    >
      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="text-xs font-medium text-slate-600 mb-2">Min Lot Width</div>
          <select
            aria-label="Min Lot Width"
            className="w-full h-10 rounded-xl bg-white border px-3 text-sm focus:outline-none focus:ring-4"
            style={{
              borderColor: BORDER,
              boxShadow: `0 0 0 3px ${BC_BLUE}33`,
              fontFamily: "Inter, Nunito, ui-sans-serif",
            }}
            value={state.lot.widthMin ?? ""}
            onChange={(e) => setState((s) => ({ ...s, lot: { ...s.lot, widthMin: e.target.value ? Number(e.target.value) : null } }))}
          >
            <option value="">No Minimum</option>
            {LOT_POINTS.slice(1).map((n) => (
              <option key={n} value={n}>{n} Feet</option>
            ))}
          </select>
        </div>
        <div>
          <div className="text-xs font-medium text-slate-600 mb-2">Min Lot Depth</div>
          <select
            aria-label="Min Lot Depth"
            className="w-full h-10 rounded-xl bg-white border px-3 text-sm focus:outline-none focus:ring-4"
            style={{
              borderColor: BORDER,
              boxShadow: `0 0 0 3px ${BC_BLUE}33`,
              fontFamily: "Inter, Nunito, ui-sans-serif",
            }}
            value={state.lot.depthMin ?? ""}
            onChange={(e) => setState((s) => ({ ...s, lot: { ...s.lot, depthMin: e.target.value ? Number(e.target.value) : null } }))}
          >
            <option value="">No Minimum</option>
            {LOT_POINTS.slice(1).map((n) => (
              <option key={n} value={n}>{n} Feet</option>
            ))}
          </select>
        </div>
      </div>
    </Section>
  );

  const ParkingSection = (
    <Section
      title="Parking & Garage"
      icon={<Car size={18} />}
    >
      <div className="mb-3">
        <div className="text-xs font-medium text-slate-600 mb-2">Total Parking Spaces (incl. garage)</div>
        <div className="flex flex-wrap gap-2">
          {["any", 1, 2, 3, 4, "5+"].map((n) => (
            <TogglePill
              key={`pk-${n}`}
              active={state.parking.totalMin === (n as FilterState["parking"]["totalMin"])}
              onClick={() => setState((s) => ({ ...s, parking: { ...s.parking, totalMin: n as FilterState["parking"]["totalMin"] } }))}
            >
              {n === "any" ? "Any" : `${n}+`}
            </TogglePill>
          ))}
        </div>
      </div>
      <div className="mb-3">
        <div className="text-xs font-medium text-slate-600 mb-2">Must Include a Garage?</div>
        <div className="flex gap-2">
          <TogglePill
            active={state.parking.mustHaveGarage === true}
            onClick={() => setState((s) => ({ ...s, parking: { ...s.parking, mustHaveGarage: true } }))}
          >
            Yes
          </TogglePill>
          <TogglePill
            active={state.parking.mustHaveGarage === false}
            onClick={() => setState((s) => ({ ...s, parking: { ...s.parking, mustHaveGarage: false } }))}
          >
            No
          </TogglePill>
          <TogglePill
            active={state.parking.mustHaveGarage === null}
            onClick={() => setState((s) => ({ ...s, parking: { ...s.parking, mustHaveGarage: null } }))}
          >
            Any
          </TogglePill>
        </div>
      </div>
      {state.parking.mustHaveGarage === true && (
        <div>
          <div className="text-xs font-medium text-slate-600 mb-2">Garage Spaces</div>
          <div className="flex gap-2">
            {["any", 1, 2, 3, 4].map((n) => (
              <TogglePill
                key={`gar-${n}`}
                active={state.parking.garageSpacesMin === (n as FilterState["parking"]["garageSpacesMin"])}
                onClick={() =>
                  setState((s) => ({
                    ...s,
                    parking: { ...s.parking, garageSpacesMin: n as FilterState["parking"]["garageSpacesMin"] },
                  }))
                }
              >
                {n === "any" ? "Any" : `${n}+`}
              </TogglePill>
            ))}
          </div>
        </div>
      )}
    </Section>
  );

  const ProximitySection = (
    <Section
      title="Proximity & Access"
      icon={<Train size={18} />}
    >
      <div className="grid grid-cols-2 gap-2">
        {[
          { k: "transit", label: "Transit Friendly", icon: <Train size={16} /> },
          { k: "bike", label: "Bike Friendly", icon: <Bike size={16} /> },
          { k: "pedestrian", label: "Pedestrian Friendly", icon: <Footprints size={16} /> },
          { k: "car", label: "Car Friendly", icon: <Car size={16} /> },
        ].map((o) => (
          <TogglePill
            key={o.k}
            active={(state.proximity as any)[o.k]}
            onClick={() =>
              setState((s) => ({
                ...s,
                proximity: { ...s.proximity, [o.k]: !(s.proximity as any)[o.k] } as FilterState["proximity"],
              }))
            }
          >
            <span className="inline-flex items-center gap-1">
              <GradientIcon>{o.icon}</GradientIcon>
              {o.label}
            </span>
          </TogglePill>
        ))}
      </div>

      <div className="mt-4">
        <div className="text-xs font-medium text-slate-600 mb-2">Access to Services</div>
        <div className="grid grid-cols-2 gap-2">
          {[
            { k: "primarySchools", label: "Primary Schools", icon: <GraduationCap size={16} /> },
            { k: "highSchools",   label: "High Schools",   icon: <GraduationCap size={16} /> },
            { k: "parks", label: "Parks", icon: <Trees size={16} /> },
            { k: "cafes", label: "Cafes", icon: <Coffee size={16} /> },
            { k: "nightlife", label: "Nightlife", icon: <Martini size={16} /> },
            { k: "restaurants", label: "Restaurants", icon: <Utensils size={16} /> },
            { k: "groceries", label: "Groceries", icon: <ShoppingBag size={16} /> },
            { k: "shopping", label: "Shopping", icon: <Store size={16} /> },
          ].map((o) => (
            <TogglePill
              key={o.k}
              active={(state.accessTo as any)[o.k]}
              onClick={() =>
                setState((s) => ({
                  ...s,
                  accessTo: { ...s.accessTo, [o.k]: !(s.accessTo as any)[o.k] } as FilterState["accessTo"],
                }))
              }
            >
              <span className="inline-flex items-center gap-1">
                <GradientIcon>{o.icon}</GradientIcon>
                {o.label}
              </span>
            </TogglePill>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <div className="text-xs font-medium text-slate-600 mb-2">Neighbourhood Atmosphere</div>
        <div className="flex gap-2">
          <TogglePill
            active={state.atmosphere.quiet}
            onClick={() => setState((s) => ({ ...s, atmosphere: { ...s.atmosphere, quiet: !s.atmosphere.quiet } }))}
          >
            Quiet
          </TogglePill>
          <TogglePill
            active={state.atmosphere.vibrant}
            onClick={() => setState((s) => ({ ...s, atmosphere: { ...s.atmosphere, vibrant: !s.atmosphere.vibrant } }))}
          >
            Vibrant
          </TogglePill>
        </div>
      </div>
    </Section>
  );

  // ---------- Layout ----------

  const content = (
    <div className="space-y-4">
      {StatusSection}
      {PriceSection}
      {PropertyTypeSection}
      {BedsBathsSection}
      {OpenHouseSection}
      {ListingInfoSection}
      {FeesTaxesSection}
      {SizeSection}
      {AgeSection}
      {RenovationsSection}
      {BasementSection}
      {AmenitiesSection}
      {KeywordsSection}
      {LocatedNearSection}
      {LotSizeSection}
      {ParkingSection}
      {ProximitySection}
    </div>
  );

  const headerRow = showHeader ? (
    <div className="mb-3 flex items-center gap-2">
      <div className="flex-1 min-w-0">
        <div
          className="text-xs truncate"
          style={{ color: "#475569", fontFamily: "Inter, Nunito, ui-sans-serif" }}
        >
          {selectedSummary || "All Filters"}
        </div>
      </div>
      {useBottomSheet && (
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition border bg-white"
          style={{ borderColor: BORDER, color: BC_BLUE, fontFamily: "Inter, Nunito, ui-sans-serif" }}
          onClick={() => setOpen(true)}
        >
          <FilterIcon size={16} />
          Filters
        </button>
      )}
    </div>
  ) : null;

  if (useBottomSheet) {
    // Mobile bottom-sheet
    return (
      <div className={className}>
        {headerRow}
        {open && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label="All filters"
            className="fixed inset-0 z-50"
            style={{ fontFamily: "Inter, Nunito, ui-sans-serif" }}
          >
            <div
              className="absolute inset-0"
              style={{ background: "rgba(0,0,0,0.35)" }}
              onClick={() => setOpen(false)}
            />
            <div
              ref={modalRef}
              className="absolute left-0 right-0 bottom-0 max-h-[85%] rounded-t-2xl border shadow-2xl p-4 overflow-y-auto"
              style={{ borderColor: BORDER, background: "rgba(255,255,255,0.88)", backdropFilter: "blur(12px)" }}
            >
              <div className="flex items-center gap-2 mb-2">
                <FilterIcon style={{ color: BC_BLUE }} size={18} />
                <div className="font-semibold text-slate-900" style={{ fontSize: 16 }}>All Filters</div>
                <button
                  className="ml-auto rounded-full p-1 hover:bg-white"
                  aria-label="Close filters"
                  onClick={() => setOpen(false)}
                >
                  <X size={18} />
                </button>
              </div>

              {content}

              <div className="sticky bottom-0 pt-3 mt-4" style={{ background: "linear-gradient(180deg, rgba(255,255,255,0), rgba(255,255,255,0.9))", backdropFilter: "blur(8px)" }}>
                <div className="flex items-center gap-2">
                  <button
                    className="h-10 px-4 rounded-xl border bg-white transition text-sm inline-flex items-center gap-2"
                    style={{ borderColor: BORDER }}
                    onClick={reset}
                  >
                    <RotateCcw size={16} />
                    Reset
                  </button>
                  <button
                    className="h-10 px-4 rounded-xl text-white shadow text-sm ml-auto"
                    style={{ background: `linear-gradient(90deg, ${BC_GREEN}, ${BC_GREEN_DARK})` }}
                    onClick={() => {
                      apply();
                      setOpen(false);
                    }}
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Desktop / tablet sidebar
  return (
    <aside
      className={`${sticky ? "lg:sticky lg:top-20" : ""} ${className}`}
      aria-label="All filters sidebar"
      style={{ fontFamily: "Inter, Nunito, ui-sans-serif" }}
    >
      {headerRow}
      <div
        className="rounded-3xl border shadow-2xl p-4"
        style={{ borderColor: BORDER, background: "rgba(255,255,255,0.8)", backdropFilter: "blur(12px)" }}
      >
        {content}
        <div className="flex items-center gap-2 pt-4">
          <button
            className="h-10 px-4 rounded-xl border bg-white transition text-sm inline-flex items-center gap-2"
            style={{ borderColor: BORDER }}
            onClick={reset}
          >
            <RotateCcw size={16} />
            Reset
          </button>
          <button
            className="h-10 px-4 rounded-xl text-white shadow text-sm ml-auto"
            style={{ background: `linear-gradient(90deg, ${BC_GREEN}, ${BC_GREEN_DARK})` }}
            onClick={apply}
          >
            Apply Filters
          </button>
        </div>
      </div>

      {/* Palette & typography hooks (scoped) */}
      <style>{`
        a, .link, .bc-link { color: ${BC_BLUE}; }
        .bc-link:hover { text-decoration: underline; }
        h1 { font-weight: 800; font-size: 24px; }
        h2 { font-weight: 700; font-size: 20px; }
        h3 { font-weight: 700; font-size: 18px; }
        body, p, li, td, th { font-size: 15px; }
      `}</style>
    </aside>
  );
}
