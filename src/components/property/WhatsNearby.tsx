import React from "react";

const mapsSearch = (lat?: number | null, lon?: number | null, q?: string) =>
  typeof lat === "number" && typeof lon === "number"
    ? `https://www.google.com/maps/search/${encodeURIComponent(q || "points of interest")}/@${lat},${lon},15z`
    : "#";

export default function WhatsNearby({ lat, lon }: { lat?: number | null; lon?: number | null }) {
  return (
    <section className="glass-card rounded-3xl border border-slate-200 p-6">
      <h2 className="text-xl font-bold text-slate-800 mb-3">What’s Nearby</h2>
      <div className="grid sm:grid-cols-2 gap-6">
        <div>
          <div className="font-semibold text-slate-700 mb-2">Points of Interest</div>
          <div className="flex flex-wrap gap-2">
            {["Grocery", "Pharmacy", "Restaurant", "Cafe", "Gym", "Park"].map((q) => (
              <a
                key={q}
                className="px-3 py-1 rounded-full bg-white border border-slate-200 text-sm text-slate-700 hover:bg-slate-50 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                href={mapsSearch(lat, lon, `${q} near me`)}
                target="_blank"
                rel="noreferrer"
              >
                {q}
              </a>
            ))}
          </div>
        </div>
        <div>
          <div className="font-semibold text-slate-700 mb-2">Schools</div>
          <div className="flex flex-wrap gap-2">
            {["Elementary school", "Middle school", "High school", "Preschool"].map((q) => (
              <a
                key={q}
                className="px-3 py-1 rounded-full bg-white border border-slate-200 text-sm text-slate-700 hover:bg-slate-50 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                href={mapsSearch(lat, lon, q)}
                target="_blank"
                rel="noreferrer"
              >
                {q}
              </a>
            ))}
          </div>
        </div>
      </div>
      <p className="mt-3 text-xs text-slate-500">Quick links open Google Maps centered on the property.</p>
    </section>
  );
}
