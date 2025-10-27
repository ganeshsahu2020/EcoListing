import React from "react";

export default function Transportation({ lat, lon }: { lat?: number | null; lon?: number | null }) {
  const hasCoords = typeof lat === "number" && typeof lon === "number";
  const driving = hasCoords ? `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}` : "#";
  const transit = hasCoords ? `https://www.google.com/maps/search/Transit/@${lat},${lon},15z` : "#";
  const bike = hasCoords ? `https://www.google.com/maps/search/Bike+lane/@${lat},${lon},15z` : "#";

  return (
    <section className="glass-card rounded-3xl border border-slate-200 p-6">
      <h2 className="text-xl font-bold text-slate-800 mb-3">Transportation</h2>
      <div className="flex flex-wrap gap-2">
        {["Challenging for Drivers", "No Transit Access", "Bike-Unfriendly", "Car Dependent"].map((label) => (
          <span key={label} className="px-3 py-1 rounded-full bg-white border border-slate-200 text-sm text-slate-700 shadow-sm">
            {label}
          </span>
        ))}
      </div>
      <div className="mt-4 grid sm:grid-cols-3 gap-4">
        <a className="block rounded-xl border border-slate-200 bg-white p-4 hover:bg-slate-50 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400" href={driving} target="_blank" rel="noreferrer">
          <div className="text-sm text-slate-500">Driving</div>
          <div className="font-semibold text-slate-800">Directions</div>
        </a>
        <a className="block rounded-xl border border-slate-200 bg-white p-4 hover:bg-slate-50 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400" href={transit} target="_blank" rel="noreferrer">
          <div className="text-sm text-slate-500">Transit</div>
          <div className="font-semibold text-slate-800">Nearby Stops</div>
        </a>
        <a className="block rounded-xl border border-slate-200 bg-white p-4 hover:bg-slate-50 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400" href={bike} target="_blank" rel="noreferrer">
          <div className="text-sm text-slate-500">Cycling</div>
          <div className="font-semibold text-slate-800">Bike Lanes</div>
        </a>
      </div>
      <p className="mt-3 text-xs text-slate-500">Scores are illustrative. Connect a provider for verified mobility scores.</p>
    </section>
  );
}
