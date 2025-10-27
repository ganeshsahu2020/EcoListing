import React from "react";
import FieldRow from "../shared/FieldRow";

type Listing = { address?: any; property_type?: string | null; beds?: number | null; baths?: number | null; sqft?: number | null; };
type Building = { building_type?: string | null; parking_total?: number | null; };

function fmtAddress(addr: any): string | undefined {
  if (!addr) return undefined;
  if (typeof addr === "string") return addr;
  const unit = addr.unitNumber || addr.UnitNumber || "";
  const bits = [addr.streetNumber || addr.StreetNumber, addr.streetDirectionPrefix || addr.streetDirection || addr.StreetDirection || "", addr.streetName || addr.StreetName, addr.streetSuffix || addr.StreetSuffix || ""].filter(Boolean).join(" ");
  const city = addr.city || addr.City;
  return [unit && `#${unit}`, bits, city].filter(Boolean).join(", ") || addr.addressKey || undefined;
}

type Props = { listing: Listing; building?: Building; className?: string; children?: React.ReactNode; };

export default function KeyFeatures({ listing, building, className = "", children }: Props) {
  return (
    <section className={`glass-card rounded-3xl border border-slate-200 p-6 ${className}`}>
      <h2 className="text-xl font-bold text-slate-800 mb-4">Key Features</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <FieldRow label="Address" value={fmtAddress(listing.address)} />
        <FieldRow label="Property Type" value={building?.building_type || listing.property_type || "—"} />
        <FieldRow label="Bedrooms" value={listing.beds ?? "—"} />
        <FieldRow label="Bathrooms" value={listing.baths ?? "—"} />
        <FieldRow label="Garage / Parking" value={building?.parking_total ?? "—"} />
        <FieldRow label="SqFt" value={typeof listing.sqft === "number" ? listing.sqft.toLocaleString() : (listing.sqft ?? "—")} />
      </div>
      {children && <div className="mt-6">{children}</div>}
    </section>
  );
}
