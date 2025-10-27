import React from "react";

export default function StructuredMedia({
  virtualTourUrl,
  photos = [],
}: {
  virtualTourUrl?: string | null;
  photos?: string[];
}) {
  const planPhotos = (photos || []).filter((p) => /floor|plan|fp/i.test(p)).slice(0, 6);
  if (!virtualTourUrl && !planPhotos.length) return null;

  return (
    <section className="mt-6 grid md:grid-cols-2 gap-6" aria-label="Structured media">
      {virtualTourUrl && (
        <div className="glass-card rounded-3xl border border-slate-200 p-3">
          <h2 className="text-lg font-bold text-slate-800 mb-2">3D / Virtual Tour</h2>
          <div className="aspect-video w-full overflow-hidden rounded-2xl border border-slate-200">
            <iframe title="Virtual tour" src={virtualTourUrl} className="w-full h-full" allow="xr-spatial-tracking; gyroscope; accelerometer; fullscreen" />
          </div>
        </div>
      )}
      {planPhotos.length > 0 && (
        <div className="glass-card rounded-3xl border border-slate-200 p-3">
          <h2 className="text-lg font-bold text-slate-800 mb-2">Floor Plans</h2>
          <div className="grid grid-cols-2 gap-3">
            {planPhotos.map((p, i) => (
              <img key={i} src={p} alt={`Floor plan ${i + 1}`} className="w-full aspect-[4/3] object-contain rounded-xl border border-slate-200 bg-white" loading="lazy" />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
