// ui/src/components/mapsearch/index.ts

// Types & helpers
export * from "./types";
export * from "./utils"; // utils can be .tsx; barrel doesn't need JSX

// Core components
export { default as ListingCard } from "./ListingCard";
export { default as StatsChips } from "./StatsChips";

// Menus
export { default as MarketMenu } from "./MarketMenu";
export { default as PriceMenu } from "./PriceMenu";
export { default as BedsBathsMenu } from "./BedsBathsMenu";
export { default as PropertyTypeMenu } from "./PropertyTypeMenu";
export { default as HomeTypeMenu } from "./HomeTypeMenu";
export { default as MoreMenu } from "./MoreMenu";

// New features (customer-focused & data-rich)
export { default as InsightsBar } from "./InsightsBar";
export { default as CommuteMenu } from "./CommuteMenu";
export type { CommuteState } from "./CommuteMenu";
export { ensureCommuteLayers, setCommuteRings } from "./CommuteMenu";
export { default as LifestyleToggles } from "./LifestyleToggles";
export { default as MortgageMini } from "./MortgageMini";
export { default as SaveSearchDialog } from "./SaveSearchDialog";
export { default as CompsDrawer } from "./CompsDrawer";
export { default as SkipLink } from "./SkipLink";
