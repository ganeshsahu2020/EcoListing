// src/components/ListingsSkeleton.tsx
import React from "react";

export default function ListingsSkeleton() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="overflow-hidden rounded-2xl border bg-white shadow-card animate-pulse"
        >
          <div className="aspect-[16/10] bg-slate-200" />
          <div className="p-4 space-y-2">
            <div className="h-4 w-24 rounded bg-slate-200" />
            <div className="h-4 w-40 rounded bg-slate-200" />
            <div className="h-4 w-32 rounded bg-slate-200" />
          </div>
        </div>
      ))}
    </div>
  );
}
