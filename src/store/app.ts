import { create } from 'zustand';

export type Property = {
  id: string;
  image: string;
  price: string;
  beds: number;
  baths: number;
  sqft?: string;
  address: string;
  hood?: string;
};

export type SearchFilters = {
  location: string;
  priceRange: [number, number];
  propertyType: string[];
  bedrooms: number;
  bathrooms: number;
  amenities: string[];
};

type AppState = {
  filters: SearchFilters;
  favorites: string[];
  listings: Property[];
  setFilters: (f: Partial<SearchFilters>) => void;
  toggleFavorite: (id: string) => void;
  setListings: (rows: Property[]) => void;
};

export const useAppStore = create<AppState>((set, get) => ({
  filters: {
    location: '',
    priceRange: [0, 3_000_000],
    propertyType: [],
    bedrooms: 0,
    bathrooms: 0,
    amenities: [],
  },
  favorites: [],
  listings: [],
  setFilters: (f) => set({ filters: { ...get().filters, ...f } }),
  toggleFavorite: (id) =>
    set((s) => ({
      favorites: s.favorites.includes(id)
        ? s.favorites.filter((x) => x !== id)
        : [...s.favorites, id],
    })),
  setListings: (rows) => set({ listings: rows }),
}));
