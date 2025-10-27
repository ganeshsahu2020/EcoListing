import type {
  SearchFilters,
  Listing,
  BathsOpt,
  BedsOpt,
  ParkingType,
  ListingStatus,
} from "./types";

const bedValue = (opt: BedsOpt) => (opt === "Any" ? -Infinity : opt === "Studio" ? 0 : Number(opt.replace("+", "")));
const bathValue = (opt: BathsOpt) => (opt === "Any" ? -Infinity : Number(opt.replace("+", "")));

export function countAdvancedActive(f: SearchFilters["more"] & SearchFilters["quick"]) {
  let c = 0;
  const { sqftMin, sqftMax, lotMin, lotMax, yearMin, yearMax, parking, amenities, eco, accessibility, status } = f as any;
  if (sqftMin || sqftMax) c++;
  if (lotMin || lotMax) c++;
  if (yearMin || yearMax) c++;
  if (parking && Object.values(parking).some(Boolean)) c++;
  if (amenities && Object.values(amenities).some(Boolean)) c++;
  if (eco && Object.values(eco).some(Boolean)) c++;
  if (accessibility && Object.values(accessibility).some(Boolean)) c++;
  if (status && Object.values(status).some(Boolean)) c++;
  // quick:
  const quickKeys = ["energyEfficient","petFriendly","swimmingPool","garage","smartHome","seniors","waterfront","newConstruction","foreclosure"];
  if (quickKeys.some((k) => (f as any)[k])) c++;
  return c;
}

export function applyFilters(data: Listing[], f: SearchFilters): Listing[] {
  const minBeds = bedValue(f.beds);
  const minBaths = bathValue(f.baths);

  return data.filter((l) => {
    if (f.intent !== l.intent) return false;

    // text match (city, neighborhood, address)
    const q = f.q.trim().toLowerCase();
    if (q) {
      const text = `${l.city} ${l.neighborhood ?? ""} ${l.address}`.toLowerCase();
      if (!text.includes(q)) return false;
    }

    // type
    if (f.type !== "All Types" && l.type !== f.type) return false;

    // beds/baths
    if (l.beds < minBeds) return false;
    if (l.baths < minBaths) return false;

    // price
    if (typeof f.priceMin === "number" && l.price < f.priceMin) return false;
    if (typeof f.priceMax === "number" && l.price > f.priceMax) return false;

    // quick flags
    const qf = f.quick;
    if (qf.energyEfficient && !l.energyEfficient) return false;
    if (qf.petFriendly && !l.petFriendly) return false;
    if (qf.swimmingPool && !l.swimmingPool) return false;
    if (qf.garage && !l.garage) return false;
    if (qf.smartHome && !l.smartHome) return false;
    if (qf.seniors && !(l.singleStory || l.ramp || l.wideDoorways || l.grabBars)) return false;
    if (qf.waterfront && !l.waterfront) return false;
    if (qf.newConstruction && !l.newConstruction) return false;
    if (qf.foreclosure && !l.foreclosure && l.status !== "Foreclosure") return false;

    // more: ranges
    const m = f.more;
    if (typeof m.sqftMin === "number" && (l.sqft ?? 0) < m.sqftMin) return false;
    if (typeof m.sqftMax === "number" && (l.sqft ?? 0) > m.sqftMax) return false;
    if (typeof m.lotMin === "number" && (l.lotSqft ?? 0) < m.lotMin) return false;
    if (typeof m.lotMax === "number" && (l.lotSqft ?? 0) > m.lotMax) return false;
    if (typeof m.yearMin === "number" && (l.yearBuilt ?? 0) < m.yearMin) return false;
    if (typeof m.yearMax === "number" && (l.yearBuilt ?? 0) > m.yearMax) return false;

    // parking
    const p = m.parking;
    if (p && Object.values(p).some(Boolean)) {
      const wanted: ParkingType[] = (Object.keys(p) as ParkingType[]).filter((k) => (p as any)[k]);
      if (!wanted.includes(l.parking ?? "None")) return false;
    }

    // amenities
    const a = m.amenities;
    if (a?.ac && !l.ac) return false;
    if (a?.heating && !l.heating) return false;
    if (a?.dishwasher && !l.dishwasher) return false;
    if (a?.washerDryer && !l.washerDryer) return false;
    if (a?.fireplace && !l.fireplace) return false;
    if (a?.fencedYard && !l.fencedYard) return false;

    // eco
    const e = m.eco;
    if (e?.solar && !l.solar) return false;
    if (e?.energyStar && !l.energyStar) return false;
    if (e?.drought && !l.drought) return false;
    if (e?.evCharger && !l.evCharger) return false;

    // accessibility
    const acc = m.accessibility;
    if (acc?.singleStory && !l.singleStory) return false;
    if (acc?.ramp && !l.ramp) return false;
    if (acc?.wideDoorways && !l.wideDoorways) return false;
    if (acc?.grabBars && !l.grabBars) return false;

    // status
    const s = m.status;
    if (s && Object.values(s).some(Boolean)) {
      const wanted: ListingStatus[] = (Object.keys(s) as ListingStatus[]).filter((k) => (s as any)[k]);
      if (!wanted.includes(l.status)) return false;
    }

    return true;
  });
}
