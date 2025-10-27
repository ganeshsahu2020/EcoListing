// ui/src/components/CompsDrawer.tsx
import React from "react";

/** ─────────────────────────────────────────────────────────
 *  BC Design Tokens — visual alignment with other files
 *  Clean, modern, BC-focused interface:
 *  - Blue (#1E90FF) for active/links
 *  - Green (#1ABC9C) for primary CTAs
 *  - Whites & grays for balance
 *  Typography: Inter/Nunito; Headings bold 18–24pt; Body 14–16pt
 *  ───────────────────────────────────────────────────────── */
const BC_BLUE = "#1E90FF";
const BC_GREEN = "#1ABC9C";
const SURFACE = "rgba(255,255,255,0.92)";
const BORDER = "rgba(15,23,42,0.08)"; // slate-900 @ 8%
const SHADOW =
  "0 10px 30px rgba(2, 6, 23, 0.12), 0 4px 10px rgba(2, 6, 23, 0.06)"; // layered, soft luxury

// stringify anything that might be an address object or string
const toAddressLine = (v: any): string => {
  if (!v) return "";
  if (typeof v === "string") return v;
  if (typeof v === "object") {
    const {
      streetNumber,
      streetDirectionPrefix,
      streetDirection,
      streetName,
      streetSuffix,
      unitNumber,
      neighborhood,
      city,
      area,
      district,
      state,
      country,
      zip,
    } = v as Record<string, any>;
    const streetParts = [
      streetNumber,
      streetDirectionPrefix || streetDirection,
      streetName,
      streetSuffix,
      unitNumber ? `#${unitNumber}` : null,
    ]
      .filter(Boolean)
      .join(" ");
    const locality = [neighborhood, city || area || district, state, zip, country]
      .filter(Boolean)
      .join(", ");
    return [streetParts, locality].filter(Boolean).join(", ");
  }
  return "";
};

export default function CompsDrawer({
  open,
  onClose,
  rows,
}: {
  open: boolean;
  onClose: () => void;
  rows: any[];
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[110]"
      role="dialog"
      aria-modal="true"
      aria-label="Comparables drawer"
      style={{ fontFamily: "Inter, Nunito, ui-sans-serif" }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        onClick={onClose}
        style={{
          background:
            "linear-gradient(180deg, rgba(2,6,23,0.35), rgba(2,6,23,0.45))",
          backdropFilter: "blur(2px)",
        }}
      />

      {/* Panel */}
      <div
        className="absolute right-0 top-0 h-full w-full sm:w-[640px] flex flex-col border-l"
        style={{
          background: SURFACE,
          borderColor: BORDER,
          boxShadow: SHADOW,
          backdropFilter: "saturate(110%) blur(10px)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between h-16 px-5 border-b"
          style={{ borderColor: BORDER }}
        >
          <div
            className="flex items-center gap-3"
            style={{ color: "#0f172a" }}
          >
            <span
              aria-hidden
              className="inline-block h-6 w-1.5 rounded-full"
              style={{
                background: `linear-gradient(180deg, ${BC_BLUE}, ${BC_GREEN})`,
              }}
            />
            <div
              className="leading-none"
              style={{ fontWeight: 800, fontSize: 20 }}
            >
              Comparables
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* CTA feels premium but subtle */}
            <button
              onClick={onClose}
              className="h-9 px-4 rounded-xl text-white shadow transition focus:outline-none"
              style={{
                background: `linear-gradient(90deg, ${BC_GREEN}, #17a589)`,
                boxShadow: "0 6px 14px rgba(26,188,156,0.35)",
                borderColor: BORDER,
                fontFamily: "Inter, Nunito, ui-sans-serif",
              }}
              aria-label="Close comparables"
            >
              Close
            </button>
          </div>
        </div>

        {/* Filter line (stub) */}
        <div
          className="px-5 py-3 flex flex-wrap items-center gap-2 text-sm border-b"
          style={{ borderColor: BORDER, color: "#475569" }}
        >
          <span className="font-medium">Filter:</span>

          {[
            "Beds 3+",
            "Baths 2+",
            "Sqft 1200+",
            "Radius 1km",
          ].map((label) => (
            <button
              key={label}
              className="h-8 px-3 rounded-2xl border transition focus:outline-none"
              style={{
                borderColor: BORDER,
                background: "rgba(255,255,255,0.85)",
                color: "#0f172a",
                boxShadow: `0 0 0 3px ${BC_BLUE}2b`,
                fontFamily: "Inter, Nunito, ui-sans-serif",
              }}
            >
              <span
                className="inline-flex items-center gap-2"
                style={{ fontWeight: 600 }}
              >
                <span
                  aria-hidden
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: BC_BLUE }}
                />
                {label}
              </span>
            </button>
          ))}

          {/* Help link (active/link color) */}
          <a
            href="#"
            className="ml-auto underline-offset-4 hover:underline"
            style={{ color: BC_BLUE }}
            onClick={(e) => e.preventDefault()}
          >
            How filters are applied
          </a>
        </div>

        {/* Table container */}
        <div className="flex-1 overflow-auto">
          <table className="w-full">
            <thead
              className="sticky top-0 z-10"
              style={{ background: SURFACE, borderBottom: `1px solid ${BORDER}` }}
            >
              <tr
                className="[&>th]:px-4 [&>th]:py-3 text-left"
                style={{ color: "#334155", fontSize: 12, letterSpacing: 0.35 }}
              >
                <th className="font-semibold uppercase">Address</th>
                <th className="font-semibold uppercase">Beds</th>
                <th className="font-semibold uppercase">Baths</th>
                <th className="font-semibold uppercase">Sqft</th>
                <th className="font-semibold uppercase">Price</th>
                <th className="font-semibold uppercase">$/sqft</th>
              </tr>
            </thead>

            <tbody className="text-sm" style={{ color: "#0f172a" }}>
              {rows.map((r) => {
                const addr =
                  toAddressLine(r.address) ||
                  toAddressLine(r.full_address) ||
                  toAddressLine(r.street_address) ||
                  [toAddressLine(r.streetAddress), toAddressLine(r.city)]
                    .filter(Boolean)
                    .join(", ") ||
                  "—";

                const beds = Number.isFinite(r?.beds) ? r.beds : "—";
                const baths = Number.isFinite(r?.baths) ? r.baths : "—";
                const sqft = Number.isFinite(r?.sqft) ? r.sqft : "—";
                const price = Number.isFinite(r?.list_price) ? r.list_price : 0;
                const ppsf =
                  Number.isFinite(r?.sqft) && r.sqft > 0
                    ? Math.round(price / r.sqft)
                    : "—";

                return (
                  <tr
                    key={r.id ?? r.mls_id ?? addr}
                    className="border-t transition-colors"
                    style={{
                      borderColor: BORDER,
                      background:
                        "linear-gradient(0deg, rgba(255,255,255,0.0), rgba(255,255,255,0.0))",
                    }}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-start gap-3">
                        {/* Address pill for visual hierarchy */}
                        <span
                          aria-hidden
                          className="mt-1 h-2 w-2 rounded-full shrink-0"
                          style={{ background: BC_BLUE }}
                        />
                        <div className="min-w-0">
                          <div
                            className="truncate"
                            style={{ fontWeight: 700 }}
                            title={addr}
                          >
                            {addr}
                          </div>
                          {/* Secondary metadata row (optional fields if present) */}
                          <div
                            className="text-xs mt-0.5"
                            style={{ color: "#64748b" }}
                          >
                            {r?.neighborhood || r?.area || r?.district || ""}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top">{beds}</td>
                    <td className="px-4 py-3 align-top">{baths}</td>
                    <td className="px-4 py-3 align-top">
                      {typeof sqft === "number" ? sqft.toLocaleString() : "—"}
                    </td>
                    <td className="px-4 py-3 align-top">
                      {price ? `$${price.toLocaleString()}` : "—"}
                    </td>
                    <td className="px-4 py-3 align-top">
                      {typeof ppsf === "number" ? (
                        <span
                          className="inline-flex items-center rounded-lg px-2 py-0.5"
                          style={{
                            background: `${BC_GREEN}1a`,
                            color: "#065f46",
                            fontWeight: 700,
                          }}
                        >
                          ${ppsf}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                );
              })}

              {/* Empty state */}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12">
                    <div className="text-center">
                      <div
                        className="mb-2"
                        style={{ fontWeight: 800, fontSize: 18, color: "#0f172a" }}
                      >
                        No comparables found
                      </div>
                      <p
                        className="mx-auto max-w-[30ch]"
                        style={{ color: "#64748b", fontSize: 14, lineHeight: 1.5 }}
                      >
                        Try widening your filters or adjusting the radius to
                        discover similar properties in the vicinity.
                      </p>
                      <div className="mt-4">
                        <button
                          onClick={onClose}
                          className="h-10 px-4 rounded-xl text-white shadow transition focus:outline-none"
                          style={{
                            background: `linear-gradient(90deg, ${BC_GREEN}, #17a589)`,
                            boxShadow: "0 6px 14px rgba(26,188,156,0.35)",
                            borderColor: BORDER,
                            fontFamily: "Inter, Nunito, ui-sans-serif",
                          }}
                        >
                          Back
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>

            {/* Table footer summary (optional visual anchor) */}
            {rows.length > 0 && (
              <tfoot>
                <tr>
                  <td colSpan={6} className="px-4 py-3">
                    <div
                      className="rounded-xl border px-3 py-2 text-xs"
                      style={{
                        borderColor: BORDER,
                        background:
                          "linear-gradient(180deg, rgba(255,255,255,0.85), rgba(255,255,255,0.95))",
                        color: "#475569",
                      }}
                    >
                      <span className="font-semibold" style={{ color: "#0f172a" }}>
                        {rows.length.toLocaleString()}{" "}
                      </span>
                      results shown • Values are provided for reference only and
                      may be subject to change.
                      <a
                        href="#"
                        className="ml-2 underline-offset-4 hover:underline"
                        style={{ color: BC_BLUE }}
                        onClick={(e) => e.preventDefault()}
                      >
                        Learn more
                      </a>
                    </div>
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
