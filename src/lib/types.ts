export type Intent = "buy" | "rent";

export type BedsOpt = "Any" | "Studio" | "1+" | "2+" | "3+" | "4+" | "5+";
export type BathsOpt = "Any" | "1+" | "1.5+" | "2+" | "2.5+" | "3+" | "4+";
export type PropType =
  | "All Types"
  | "House"
  | "Apartment/Condo"
  | "Townhouse"
  | "Multi-family"
  | "Land"
  | "Other";

export type ParkingType = "Garage" | "Carport" | "Street" | "None";
export type ListingStatus = "For Sale" | "Pending" | "Foreclosure" | "Auction";

export type QuickFlags = {
  energyEfficient?: boolean;
  petFriendly?: boolean;
  swimmingPool?: boolean;
  garage?: boolean;
  smartHome?: boolean;
  seniors?: boolean;
  waterfront?: boolean;
  newConstruction?: boolean;
  foreclosure?: boolean;
};

export type MoreFilters = {
  sqftMin?: number;
  sqftMax?: number;
  lotMin?: number;
  lotMax?: number;
  yearMin?: number;
  yearMax?: number;

  parking?: {
    Garage?: boolean;
    Carport?: boolean;
    Street?: boolean;
    None?: boolean;
  };

  amenities?: {
    ac?: boolean;
    heating?: boolean;
    dishwasher?: boolean;
    washerDryer?: boolean;
    fireplace?: boolean;
    fencedYard?: boolean;
  };

  eco?: {
    solar?: boolean;
    energyStar?: boolean;
    drought?: boolean;
    evCharger?: boolean;
  };

  accessibility?: {
    singleStory?: boolean;
    ramp?: boolean;
    wideDoorways?: boolean;
    grabBars?: boolean;
  };

  status?: {
    "For Sale"?: boolean;
    Pending?: boolean;
    Foreclosure?: boolean;
    Auction?: boolean;
  };
};

export type SearchFilters = {
  intent: Intent;
  q: string; // city, neighborhood, address
  beds: BedsOpt;
  baths: BathsOpt;
  type: PropType;
  priceMin?: number;
  priceMax?: number;
  quick: QuickFlags;
  more: MoreFilters;
};

export type Listing = {
  id: string;
  intent: Intent;
  title: string;
  address: string;
  city: string;
  neighborhood?: string;
  price: number;
  beds: number; // 0 = studio
  baths: number; // allow .5
  type: Exclude<PropType, "All Types">;
  sqft?: number;
  lotSqft?: number;
  yearBuilt?: number;
  status: ListingStatus;
  parking?: ParkingType;

  // quick flags:
  energyEfficient?: boolean;
  petFriendly?: boolean;
  swimmingPool?: boolean;
  garage?: boolean;
  smartHome?: boolean;
  seniors?: boolean;
  waterfront?: boolean;
  newConstruction?: boolean;
  foreclosure?: boolean;

  // amenities:
  ac?: boolean;
  heating?: boolean;
  dishwasher?: boolean;
  washerDryer?: boolean;
  fireplace?: boolean;
  fencedYard?: boolean;

  // eco:
  solar?: boolean;
  energyStar?: boolean;
  drought?: boolean;
  evCharger?: boolean;

  // accessibility:
  singleStory?: boolean;
  ramp?: boolean;
  wideDoorways?: boolean;
  grabBars?: boolean;
};
