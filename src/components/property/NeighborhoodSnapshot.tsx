import React, { useMemo } from "react";

type ListingLike = {
  dom?: number | null;
  price?: number | null;
  sqft?: number | null;
  price_per_sqft?: number | null;
};
type BuildingLike = {
  parking_total?: number | null;
  cooling?: string | null;
  heating_type?: string | null;
};
type CompLike = { price?: number | null; sqft?: number | null; price_per_sqft?: number | null };

export default function NeighborhoodSnapshot({
  listing,
  building,
  comps,
  radiusKm,
}: {
  listing: ListingLike;
  building?: BuildingLike | null;
  comps: CompLike[];
  radiusKm: number;
}) {
  const summary = useMemo(() => {
    const count = comps.length;
    const avgPpsf =
      comps.reduce((a, c) => {
        const v = typeof c.price_per_sqft === "number" ? c.price_per_sqft : c.price && c.sqft ? c.price / c.sqft : 0;
        return a + (v || 0);
      }, 0) / Math.max(1, count);

    const subjectPpsf =
      typeof listing.price_per_sqft === "number"
        ? listing.price_per_sqft
        : listing.price && listing.sqft
        ? listing.price / listing.sqft
        : null;

    const loves: string[] = [];
    const watchouts: string[] = [];

    if (count >= 10) loves.push(`Plenty of comparable homes (${count} within ${radiusKm} km).`);
    if (building?.parking_total && building.parking_total > 0) loves.push("Off-street parking available.");
    if (building?.cooling) loves.push(`Cooling: ${building.cooling}.`);
    loves.push("Nearby parks, cafés, groceries and more (see quick links below).");

    if (typeof listing.dom === "number" && listing.dom >= 30) watchouts.push(`Days on market (${listing.dom}) are above average.`);
    if (subjectPpsf && avgPpsf && subjectPpsf > avgPpsf * 1.1) watchouts.push("Priced above area average on a $/sqft basis.");
    if (!building?.heating_type) watchouts.push("Verify heating type and utility efficiency during inspection.");

    return { loves, watchouts };
  }, [listing.dom, listing.price, listing.sqft, listing.price_per_sqft, building?.parking_total, building?.cooling, building?.heating_type, comps, radiusKm]);

  return (
    <section className="glass-card rounded-3xl border border-slate-200 p-6">
      <h2 className="text-xl font-bold text-slate-800 mb-3">Neighborhood Snapshot</h2>
      <div className="grid sm:grid-cols-2 gap-6">
        <div>
          <div className="font-semibold text-slate-700 mb-2">What buyers love</div>
          <ul className="list-disc pl-5 space-y-1 text-slate-700">
            {summary.loves.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
        <div>
          <div className="font-semibold text-slate-700 mb-2">Watchouts</div>
          <ul className="list-disc pl-5 space-y-1 text-slate-700">
            {summary.watchouts.length ? summary.watchouts.map((s, i) => <li key={i}>{s}</li>) : <li>None apparent — verify during inspection.</li>}
          </ul>
        </div>
      </div>
      <p className="mt-3 text-xs text-slate-500">Heuristic summary from local comps & listing details. Connect a provider for verified AI insights.</p>
    </section>
  );
}
