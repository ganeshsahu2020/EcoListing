import type maplibregl from "maplibre-gl";

/** Basic listing row used by the map + list */
export type Listing = {
  id: string;
  mls_id: string;
  lat: number;
  lon: number;
  list_price: number;
  beds?: number | null;
  baths?: number | null;
  sqft?: number | null;
  price_per_sqft?: number | null;
  address?: string | null;
  city?: string | null;
  postal_code?: string | null;
  status: string; // "A" | "S" | etc.
  property_type?: string | null;
  list_date?: string | null;
  updated_at?: string | null;
  image_url?: string | null;
};

export type PropertyTypeState = {
  categories: {
    detached: boolean;
    semiDetached: boolean;
    condo: boolean;
    townhouse: boolean;
    land: boolean;
    other: boolean;
  };
  /** Selected subtypes by label text */
  subtypes: Record<string, boolean>;
};

export type MarketMode = "forSale" | "sold";
export type ForSaleDays = "all" | "24h" | "3d" | "7d" | "30d" | "60d" | "90d";
export type SoldWithin =
  | "24h" | "3d" | "7d" | "30d" | "90d" | "180d" | "365d"
  | "year-2025" | "year-2024" | "year-2023" | "year-2022" | "year-2021" | "year-2020"
  | "year-2019" | "year-2018" | "year-2017" | "year-2016" | "year-2015" | "year-2014"
  | "year-2013" | "year-2012" | "year-2011" | "year-2010" | "year-2009" | "year-2008"
  | "year-2007" | "year-2006" | "year-2005" | "year-2004" | "year-2003" | "year-2002"
  | "year-2001" | "year-2000-or-earlier";

export type UIMapFilters = {
  query: string;

  // Price or Payment
  mode: "list" | "payment";
  priceMin: number | null;
  priceMax: number | null;
  monthlyMin: number | null;
  monthlyMax: number | null;
  rate: number; // annual %
  termYears: number;
  downPct: number;

  // Beds & Baths
  bedsMin: number | null;
  bedsExact: boolean;
  bathsMin: number | null;

  // Legacy broad types
  homeTypes: {
    house: boolean;
    townhouse: boolean;
    multi: boolean;
    condo: boolean;
    land: boolean;
    apartment: boolean;
    manufactured: boolean;
  };

  // New: fine-grained Property Type + subtypes
  propertyType: PropertyTypeState;

  // Market (for sale / sold)
  market: {
    mode: MarketMode;
    forSaleDays: ForSaleDays;
    soldWithin: SoldWithin;
  };

  // More
  more: {
    has3DTour?: boolean;
    petFriendly?: boolean;
    parking?: boolean;
    pool?: boolean;
    garden?: boolean;
    sqftMin?: number | null;
    sqftMax?: number | null;
  };

  sort: "newest" | "price" | "priceAsc" | "days";
};

export const INITIAL_UI_FILTERS: UIMapFilters = {
  query: "",
  mode: "list",
  priceMin: null,
  priceMax: null,
  monthlyMin: null,
  monthlyMax: null,
  rate: 5.5,
  termYears: 25,
  downPct: 20,

  bedsMin: null,
  bedsExact: false,
  bathsMin: null,

  homeTypes: {
    house: true,
    townhouse: true,
    multi: true,
    condo: true,
    land: true,
    apartment: true,
    manufactured: true,
  },

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

  market: {
    mode: "forSale",
    forSaleDays: "all",
    soldWithin: "30d",
  },

  more: {},
  sort: "newest",
};

export type LngLatBounds = maplibregl.LngLatBounds;
