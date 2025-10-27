// ui/src/pages/listings/Listings.tsx
import React, { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import ListingCard from "../../components/ListingCard";
import ListingsSkeleton from "../../components/ListingsSkeleton";
import { fetchListingsDirect } from "../../utils/repliersClient";
import {
  BuildingOffice2Icon,
  SparklesIcon,
  ChatBubbleOvalLeftEllipsisIcon,
} from "@heroicons/react/24/outline";
import { PaperAirplaneIcon, XMarkIcon } from "@heroicons/react/24/solid";

/* ─────────────────────────────────────────────────────────
   Chat types (fix: allow both 'assistant' and 'user')
   ──────────────────────────────────────────────────────── */
type ChatRole = "assistant" | "user";
type ChatMsg = {
  who: string;
  content: string;
  role: ChatRole;
  created_at: string;
  id: string;
};

/* ─────────────────────────────────────────────────────────
   BC Design Tokens
   ──────────────────────────────────────────────────────── */
const BC_BLUE = "#1E90FF";   // Active/links
const BC_GREEN = "#1ABC9C";  // CTAs
const BC_GREEN_DARK = "#12997F";

/* ─────────────────────────────────────────────────────────
   Region defaults (BC-wide bounds)
   ──────────────────────────────────────────────────────── */
// Rough provincial bounding box (tweak to your needs or swap for geocoded bounds per city)
const BC_BOUNDS = {
  west: -139.06,
  south: 48.30,
  east: -114.03,
  north: 60.00,
};

/* ---- CDN helpers ---- */
const CDN = "https://cdn.repliers.io";
const toCdn = (
  path?: string | null,
  klass: "small" | "medium" | "large" = "medium"
) =>
  path
    ? /^https?:\/\//i.test(path)
      ? path
      : `${CDN}/${path}?class=${klass}`
    : null;

/* ---- Tiny helpers ---- */
const toNum = (v: any): number | null => {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim()) {
    const n = Number(v.replace(/[^\d.-]/g, ""));
    return Number.isFinite(n) ? n : null;
  }
  return null;
};
const pickMLS = (x: any): string | null =>
  (x?.mls_id && String(x.mls_id)) ||
  (x?.mlsId && String(x.mlsId)) ||
  (x?.mlsNumber && String(x.mlsNumber)) ||
  null;
const pickPrice = (x: any): number | null =>
  toNum(x?.price) ?? toNum(x?.list_price) ?? toNum(x?.listPrice) ?? null;
const pickBeds = (x: any): number | null => toNum(x?.beds) ?? toNum(x?.bedrooms);
const pickBaths = (x: any): number | null =>
  toNum(x?.baths) ?? toNum(x?.bathrooms);
const pickSqft = (x: any): number | null =>
  toNum(x?.sqft) ?? toNum(x?.sqFt) ?? toNum(x?.square_feet) ?? null;
const pickAddress = (x: any) =>
  typeof x?.address === "string"
    ? { line: x.address, city: x?.city ?? null }
    : {
        line: x?.address?.line1 ?? x?.full_address ?? null,
        city: x?.city ?? x?.address?.city ?? null,
      };
const unwrapListings = (raw: any): any[] => {
  // fetchListingsDirect returns an array; keep this util for safety
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.listings)) return raw.listings;
  if (Array.isArray(raw?.items)) return raw.items;
  if (Array.isArray(raw?.results)) return raw.results;
  if (Array.isArray(raw?.detail?.listings)) return raw.detail.listings;
  return [];
};
const hrefFor = (mls?: string | null, id?: string | null) =>
  mls
    ? `/property/mls:${encodeURIComponent(mls)}`
    : `/property/${encodeURIComponent(String(id || ""))}`;
const QUALS = [
  "",
  "poor",
  "below average",
  "average",
  "above average",
  "excellent",
];
const titleize = (s?: string | null) =>
  (s ?? "").replace(/\b\w/g, (ch) => ch.toUpperCase());

type Row = {
  id: string;
  mls_id?: string | null;
  price: number;
  beds?: number | null;
  baths?: number | null;
  sqft?: number | null;
  address?: string | null;
  city?: string | null;
  image_url?: string | null;
  images?: string[];
  // Quality fields are optional; fetchListingsDirect may not provide image insights
  qualityOverall?: string | null;
  qualityOverallScore?: number | null;
  qualityFeatures?: Record<string, string>;
  qualityFeatureScores?: Record<string, number>;
  status?: "for-sale" | "for-lease" | "sold" | "unknown" | string;
};

type SearchFilters = {
  city: string;
  minBeds?: number;
  maxPrice?: number;
  overallQuality?: string;
  minQuality?: number;
  maxQuality?: number;
};

type SortBy = "relevance" | "quality_desc" | "quality_asc";

/* ─────────────────────────────────────────────────────────
   Chat Panel & FAB (BC palette + accessible typography)
   ──────────────────────────────────────────────────────── */
function ChatPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const supportAvatars = [
    "/avatars/support1.png",
    "/avatars/support2.png",
    "/avatars/support3.png",
    "/avatars/bot.png",
  ];
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      who: "Repliers",
      content:
        "Hello! How can I assist you today with your real estate needs?",
      role: "assistant",
      created_at: new Date().toISOString(),
      id: "init",
    },
  ]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (open) {
      listRef.current?.scrollTo({
        top: listRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages.length, sending, open]);

  function send(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    setMessages((msgs) => [
      ...msgs,
      {
        who: "You",
        content: text,
        role: "user",
        created_at: new Date().toISOString(),
        id: Math.random().toString(36).slice(2),
      },
    ]);
    setText("");
    setTimeout(() => {
      setMessages((msgs) => [
        ...msgs,
        {
          who: "Repliers",
          content: "Thank you for reaching out! We'll get back to you soon.",
          role: "assistant",
          created_at: new Date().toISOString(),
          id: Math.random().toString(36).slice(2),
        },
      ]);
      setSending(false);
    }, 900);
  }

  if (!open) return null;
  return (
    <main
      className="fixed z-50 w-full bottom-0 left-0 right-0 flex items-end justify-center md:justify-end px-2 pb-2 md:pb-8 md:pr-8 transition-all"
      style={{ pointerEvents: "none" }}
    >
      <section
        className="w-full max-w-lg bg-white rounded-[2rem] shadow-2xl border overflow-hidden flex flex-col pointer-events-auto transition-all"
        style={{
          minHeight: "420px",
          maxHeight: "90vh",
          borderColor: "rgba(30,144,255,0.18)",
          fontFamily: "Inter, Nunito, sans-serif",
        }}
      >
        {/* Close Button */}
        <button
          aria-label="Close chat panel"
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white hover:bg-slate-100 shadow focus-visible:outline-none"
          onClick={onClose}
          style={{
            borderColor: "transparent",
            boxShadow: `0 0 0 3px ${BC_BLUE}33`,
            fontFamily: "Inter, Nunito, sans-serif",
          }}
        >
          <XMarkIcon className="h-6 w-6 text-slate-700" />
        </button>

        {/* Header */}
        <div
          className="relative flex flex-col items-center justify-center px-6 py-6"
          style={{
            background: `linear-gradient(90deg, ${BC_BLUE}, ${BC_GREEN})`,
          }}
        >
          <div className="flex items-center gap-3 mb-2">
            <ChatBubbleOvalLeftEllipsisIcon className="h-7 w-7 text-white/90" />
            <span
              className="text-white font-bold"
              style={{ fontSize: 18, fontFamily: "Inter, Nunito, sans-serif" }}
            >
              Chat
            </span>
          </div>
          <div className="flex items-center -space-x-4 mb-2">
            {supportAvatars.map((src, i) => (
              <img
                key={src}
                src={src}
                className="w-10 h-10 rounded-full border-4 border-white bg-white object-cover shadow"
                style={{
                  zIndex: supportAvatars.length - i,
                  borderColor: "#fff",
                  boxShadow: `0 0 0 3px ${BC_BLUE}35`,
                  fontFamily: "Inter, Nunito, sans-serif",
                }}
                alt="Support"
              />
            ))}
          </div>
          <div
            className="text-white font-semibold flex items-center gap-2"
            style={{ fontSize: 16 }}
          >
            Questions? We’re here.
          </div>
          <div className="flex items-center gap-2 text-white/90 text-xs mt-1">
            <span className="flex h-2 w-2 rounded-full bg-emerald-300 animate-pulse" />{" "}
            Online
          </div>
        </div>

        {/* Chat area */}
        <div className="flex flex-col flex-1 bg-white">
          {/* Messages */}
          <div
            ref={listRef}
            className="flex-1 overflow-y-auto px-4 py-4 space-y-4"
          >
            {messages.map((m) => (
              <div
                key={m.id}
                className={[
                  "flex items-end",
                  m.role === "user" ? "justify-end" : "justify-start",
                ].join(" ")}
              >
                {m.role !== "user" && (
                  <div className="mr-2 flex-shrink-0">
                    <span
                      className="inline-flex w-8 h-8 rounded-full items-center justify-center"
                      style={{ background: BC_BLUE, color: "#fff" }}
                    >
                      <ChatBubbleOvalLeftEllipsisIcon className="h-5 w-5" />
                    </span>
                  </div>
                )}
                <div
                  className={[
                    "max-w-[80vw] md:max-w-[70%] px-4 py-3 rounded-2xl shadow",
                    m.role === "user"
                      ? "bg-slate-50 text-slate-900 rounded-br-none"
                      : "text-white rounded-bl-none",
                  ].join(" ")}
                  style={{
                    background:
                      m.role === "user"
                        ? undefined
                        : `linear-gradient(90deg, ${BC_BLUE}, ${BC_GREEN})`,
                    fontSize: 15,
                    fontFamily: "Inter, Nunito, sans-serif",
                  }}
                  title={new Date(m.created_at).toLocaleString()}
                >
                  <div className="text-xs mb-1 opacity-80">{m.who}</div>
                  <div className="whitespace-pre-wrap break-words">
                    {m.content}
                  </div>
                </div>
                {m.role === "user" && (
                  <div className="ml-2 flex-shrink-0">
                    <span
                      className="inline-flex w-8 h-8 rounded-full items-center justify-center"
                      style={{ background: BC_GREEN, color: "#fff" }}
                    >
                      <ChatBubbleOvalLeftEllipsisIcon className="h-5 w-5" />
                    </span>
                  </div>
                )}
              </div>
            ))}
            {sending && (
              <div className="flex items-end justify-start">
                <div className="mr-2">
                  <span
                    className="inline-flex w-8 h-8 rounded-full items-center justify-center"
                    style={{ background: BC_BLUE, color: "#fff" }}
                  >
                    <ChatBubbleOvalLeftEllipsisIcon className="h-5 w-5" />
                  </span>
                </div>
                <div className="max-w-[75%] px-4 py-2 rounded-2xl bg-slate-100 text-slate-500 shadow rounded-bl-none animate-pulse">
                  Repliers is typing…
                </div>
              </div>
            )}
          </div>

          {/* Composer */}
          <form
            className="flex items-center gap-2 border-t bg-white px-3 py-3"
            style={{ borderColor: "rgba(0,0,0,0.06)" }}
            onSubmit={send}
          >
            <input
              className="h-11 flex-1 rounded-xl border bg-white px-4 focus:outline-none transition"
              style={{
                borderColor: "rgba(0,0,0,0.15)",
                boxShadow: `0 0 0 3px ${BC_BLUE}33`,
                fontSize: 15,
                fontFamily: "Inter, Nunito, sans-serif",
              }}
              placeholder="Compose your message…"
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={sending}
            />
            <button
              className="flex items-center justify-center rounded-full text-white px-4 py-2 font-bold shadow hover:scale-105 focus:scale-105 transition-all h-11"
              disabled={sending || !text.trim()}
              type="submit"
              aria-label="Send"
              style={{
                background: `linear-gradient(90deg, ${BC_GREEN}, ${BC_GREEN_DARK})`,
                fontFamily: "Inter, Nunito, sans-serif",
              }}
            >
              <PaperAirplaneIcon className="h-5 w-5 rotate-45" />
            </button>
          </form>
        </div>
      </section>

      <style>{`
        @media (min-width: 768px) {
          main { justify-content: flex-end !important; }
        }
        @media (max-width: 640px) {
          section {
            border-radius: 1.2rem !important;
            padding-bottom: env(safe-area-inset-bottom, 0) !important;
          }
        }
      `}</style>
    </main>
  );
}

/* ─────────────────────────────────────────────────────────
   BrandMark — refined, BC-focused
   ──────────────────────────────────────────────────────── */
function BrandMarkPro() {
  return (
    <span className="inline-flex items-center gap-3 select-none">
      <span
        className="relative flex h-10 w-10 items-center justify-center rounded-full shadow-lg"
        style={{
          background: `conic-gradient(from 180deg at 50% 50%, ${BC_BLUE}, ${BC_GREEN})`,
        }}
      >
        <SparklesIcon className="h-7 w-7 text-white drop-shadow" />
        <span
          className="absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 animate-pulse"
          style={{ background: BC_GREEN, borderColor: "#fff" }}
          aria-hidden
        />
      </span>
      <span
        className="text-2xl font-extrabold tracking-tight bg-clip-text text-transparent"
        style={{
          backgroundImage: `linear-gradient(90deg, ${BC_BLUE}, ${BC_GREEN})`,
          fontFamily: "Inter, Nunito, sans-serif",
        }}
      >
        Eco<span className="text-slate-800">Listing</span>
      </span>
    </span>
  );
}

/* ─────────────────────────────────────────────────────────
   Listings — aligned to PropertyDetails data source
   ──────────────────────────────────────────────────────── */
export default function Listings() {
  const [filters, setFilters] = useState<SearchFilters>({
    city: "",
    minBeds: undefined,
    maxPrice: undefined,
  });
  const [formCity, setFormCity] = useState(filters.city ?? "");
  const [formMinBeds, setFormMinBeds] = useState<string>(
    filters.minBeds != null ? String(filters.minBeds) : ""
  );
  const [formMaxPrice, setFormMaxPrice] = useState<string>(
    filters.maxPrice != null ? String(filters.maxPrice) : ""
  );
  const [formOverallQual, setFormOverallQual] = useState<string>(
    filters.overallQuality ?? ""
  );
  const [formMinQ, setFormMinQ] = useState<string>(
    filters.minQuality != null ? String(filters.minQuality) : ""
  );
  const [formMaxQ, setFormMaxQ] = useState<string>(
    filters.maxQuality != null ? String(filters.maxQuality) : ""
  );
  const [sortBy, setSortBy] = useState<SortBy>("relevance");
  const pageSize = 24;
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rawCount, setRawCount] = useState<number | null>(null);

  // Chat panel state for footer chat
  const [chatOpen, setChatOpen] = useState(false);

  const navigate = useNavigate();

  const applyFilters = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setFilters({
      city: formCity.trim(),
      minBeds: formMinBeds ? Number(formMinBeds) : undefined,
      maxPrice: formMaxPrice ? Number(formMaxPrice) : undefined,
      overallQuality: formOverallQual || undefined,
      minQuality: formMinQ ? Number(formMinQ) : undefined,
      maxQuality: formMaxQ ? Number(formMaxQ) : undefined,
    });
  };

  useEffect(() => {
    let cancel = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        // Base query aligned with PropertyDetails.tsx approach
        const baseQuery: any = {
          ...BC_BOUNDS,
          status: "A",           // active
          limit: 500,            // pull a healthy set; paginate client-side
          dropUnmappable: true,  // same safety flag used in details
        };

        // NOTE: If your backend supports passing city/minBeds/maxPrice directly,
        // you can add them to baseQuery here.

        const data = await fetchListingsDirect(baseQuery);
        if (cancel) return;

        const arr = unwrapListings(data);

        // Map fields same way as PropertyDetails.tsx does for comps
        const mapped: Row[] = arr.map((s: any, i: number) => {
          const { line, city } = pickAddress(s);
          const statusRaw = String(s?.status ?? "").toLowerCase();
          return {
            id: s.id ? String(s.id) : `row-${i}`,
            mls_id: s.mls_id ?? null,
            price: pickPrice(s) ?? toNum(s?.list_price) ?? 0,
            beds: pickBeds(s),
            baths: pickBaths(s),
            sqft: pickSqft(s),
            address: line ?? null,
            city: city ?? null,
            image_url: s.image_url ?? s?.primaryPhoto?.url ?? null,
            // these "quality" fields are optional — fetchListingsDirect may not include imageInsights
            qualityOverall: s?.imageInsights?.summary?.quality?.qualitative?.overall ?? null,
            qualityOverallScore:
              typeof s?.imageInsights?.summary?.quality?.quantitative?.overall === "number"
                ? s.imageInsights.summary.quality.quantitative.overall
                : null,
            qualityFeatures: s?.imageInsights?.summary?.quality?.qualitative?.features ?? {},
            qualityFeatureScores: s?.imageInsights?.summary?.quality?.quantitative?.features ?? {},
            status: ["for-sale", "for-lease", "sold"].includes(statusRaw)
              ? statusRaw
              : "for-sale",
          };
        });

        // Client-side filtering to mirror query params the old list used
        const filtered = mapped.filter((r) => {
          if (filters.city && (r.city || "").toLowerCase() !== filters.city.toLowerCase()) {
            return false;
          }
          if (filters.minBeds != null && (r.beds ?? 0) < filters.minBeds) {
            return false;
          }
          if (filters.maxPrice != null && (r.price ?? 0) > filters.maxPrice) {
            return false;
          }
          // If you rely on quality fields, gate them when present
          if (filters.overallQuality && (r.qualityOverall || "").toLowerCase() !== filters.overallQuality.toLowerCase()) {
            return false;
          }
          if (filters.minQuality != null && (r.qualityOverallScore ?? -Infinity) < filters.minQuality) {
            return false;
          }
          if (filters.maxQuality != null && (r.qualityOverallScore ?? Infinity) > filters.maxQuality) {
            return false;
          }
          return true;
        });

        // Sorting (quality fields may be missing — guard accordingly)
        const sorted = [...filtered];
        if (sortBy === "quality_desc") {
          sorted.sort(
            (a, b) =>
              (b.qualityOverallScore ?? -Infinity) -
              (a.qualityOverallScore ?? -Infinity)
          );
        } else if (sortBy === "quality_asc") {
          sorted.sort(
            (a, b) =>
              (a.qualityOverallScore ?? Infinity) -
              (b.qualityOverallScore ?? Infinity)
          );
        }
        setRawCount(sorted.length);
        setRows(sorted);
      } catch (e: any) {
        if (!cancel) {
          setError(e?.message || String(e));
          setRows([]);
          setRawCount(null);
        }
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [
    filters.city,
    filters.minBeds,
    filters.maxPrice,
    filters.overallQuality,
    filters.minQuality,
    filters.maxQuality,
    sortBy,
  ]);

  const pageSizeNum = pageSize;
  const numPages = Math.max(1, Math.ceil((rows.length || 1) / pageSizeNum));
  const pageSafe = Math.max(1, Math.min(page, numPages));
  const pageRows = useMemo(() => {
    const start = (pageSafe - 1) * pageSizeNum;
    return rows.slice(start, start + pageSizeNum);
  }, [rows, pageSafe]);

  // Responsive grid with refined BC style
  const [chatOpenState, setChatOpenState] = useState(false);
  const grid = useMemo(() => {
    if (!pageRows.length) return null;
    return (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {pageRows.map((r) => {
          const href = hrefFor(r.mls_id, r.id);
          const price =
            typeof r.price === "number"
              ? `$${r.price.toLocaleString()}`
              : "$—";
          const sqft = typeof r.sqft === "number" ? String(r.sqft) : "—";
          const city = r.city || "";
          const firstCdn = Array.isArray(r.images)
            ? toCdn(r.images[0], "medium")
            : null;
          const fallbackCdn = toCdn(r.image_url, "medium");
          const img = firstCdn || fallbackCdn || "/placeholder-house.jpg";
          const qualitySubtitle =
            r.qualityOverall && typeof r.qualityOverallScore === "number"
              ? `Overall: ${titleize(r.qualityOverall)} (${r.qualityOverallScore.toFixed(2)})`
              : r.qualityOverall
              ? `Overall: ${titleize(r.qualityOverall)}`
              : undefined;

          return (
            <div
              key={r.id}
              className="group relative flex flex-col transition-transform duration-200 hover:-translate-y-1"
            >
              <button
                className="absolute top-3 right-3 z-10 rounded-full p-2 shadow-sm transition"
                aria-label="Chat about this property"
                onClick={(e) => {
                  e.stopPropagation();
                  setChatOpenState(true);
                }}
                style={{ background: "#fff" }}
                tabIndex={0}
              >
                <ChatBubbleOvalLeftEllipsisIcon
                  className="h-6 w-6"
                  style={{ color: BC_GREEN }}
                />
              </button>

              {/* Card wrapper */}
              <div
                className="rounded-2xl border bg-white overflow-hidden shadow-sm hover:shadow-lg focus-within:outline-none"
                style={{
                  borderColor: "rgba(0,0,0,0.08)",
                  boxShadow: `0 0 0 3px ${BC_BLUE}33`,
                  fontFamily: "Inter, Nunito, ui-sans-serif",
                }}
              >
                <ListingCard
                  id={r.mls_id ?? r.id}
                  href={href}
                  image={img}
                  price={price}
                  beds={r.beds || 0}
                  baths={r.baths || 0}
                  sqft={sqft}
                  address={
                    (r.address || "—") +
                    (qualitySubtitle ? ` · ${qualitySubtitle}` : "")
                  }
                  hood={city}
                  status={(r.status as any) || "for-sale"}
                  agent={""}
                  saved={false}
                  canSave={false}
                />
              </div>
            </div>
          );
        })}
      </div>
    );
  }, [pageRows]);

  const canPrev = pageSafe > 1;
  const canNext = pageSafe < numPages;

  return (
    <div
      className="relative min-h-screen -mt-6 sm:-mt-10 md:-mt-12 lg:-mt-14 xl:-mt-16"
      style={{
        background:
          "linear-gradient(135deg, #f7fafc 0%, #ffffff 50%, #f0f7ff 100%)",
        fontFamily: "Inter, Nunito, ui-sans-serif, system-ui",
      }}
    >
      {/* Header */}
      <div
        className="border-b shadow-sm backdrop-blur"
        style={{
          background: "linear-gradient(180deg, #ffffff 0%, #f7fbff 100%)",
          borderColor: "rgba(0,0,0,0.06)",
        }}
      >
        <div className="container-7xl px-4 py-4 flex flex-col md:flex-row items-center gap-6 md:gap-10">
          <BrandMarkPro />
          <div className="flex-1">
            <h1
              className="text-slate-900 flex items-center gap-3 tracking-tight"
              style={{ fontWeight: 800, fontSize: 24 }}
            >
              <span>Listings</span>
              <BuildingOffice2Icon
                className="h-7 w-7"
                style={{ color: BC_BLUE }}
              />
            </h1>
            <p className="mt-2 text-slate-600" style={{ fontSize: 15 }}>
              Browse available homes. Use advanced filters and quality insights.
            </p>
          </div>
        </div>
      </div>

      <div className="container-7xl px-4 py-4">
        {/* Filters & Sort */}
        <form
          onSubmit={applyFilters}
          className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-6 p-4 rounded-2xl border bg-white shadow-sm"
          style={{ borderColor: "rgba(0,0,0,0.08)" }}
        >
          <div className="flex flex-col">
            <label className="mb-1 text-slate-600" style={{ fontSize: 14 }}>
              City
            </label>
            <input
              value={formCity}
              onChange={(e) => setFormCity(e.target.value)}
              className="h-10 rounded-lg border px-3 focus:outline-none"
              style={{
                borderColor: "rgba(0,0,0,0.15)",
                boxShadow: `0 0 0 3px ${BC_BLUE}33`,
                fontSize: 15,
                fontFamily: "Inter, Nunito, ui-sans-serif",
              }}
              placeholder="e.g., Vancouver"
            />
          </div>

          <div className="flex flex-col">
            <label className="mb-1 text-slate-600" style={{ fontSize: 14 }}>
              Min Bedrooms
            </label>
            <input
              type="number"
              min={0}
              value={formMinBeds}
              onChange={(e) => setFormMinBeds(e.target.value)}
              className="h-10 rounded-lg border px-3 focus:outline-none"
              style={{
                borderColor: "rgba(0,0,0,0.15)",
                boxShadow: `0 0 0 3px ${BC_BLUE}33`,
                fontSize: 15,
                fontFamily: "Inter, Nunito, ui-sans-serif",
              }}
              placeholder="e.g., 3"
            />
          </div>

          <div className="flex flex-col">
            <label className="mb-1 text-slate-600" style={{ fontSize: 14 }}>
              Max Price
            </label>
            <input
              type="number"
              min={0}
              value={formMaxPrice}
              onChange={(e) => setFormMaxPrice(e.target.value)}
              className="h-10 rounded-lg border px-3 focus:outline-none"
              style={{
                borderColor: "rgba(0,0,0,0.15)",
                boxShadow: `0 0 0 3px ${BC_BLUE}33`,
                fontSize: 15,
                fontFamily: "Inter, Nunito, ui-sans-serif",
              }}
              placeholder="e.g., 1250000"
            />
          </div>

          <div className="flex flex-col">
            <label className="mb-1 text-slate-600" style={{ fontSize: 14 }}>
              Overall Quality
            </label>
            <select
              className="h-10 rounded-lg border px-3 bg-white focus:outline-none"
              style={{
                borderColor: "rgba(0,0,0,0.15)",
                boxShadow: `0 0 0 3px ${BC_BLUE}33`,
                fontSize: 15,
                fontFamily: "Inter, Nunito, ui-sans-serif",
              }}
              value={formOverallQual}
              onChange={(e) => setFormOverallQual(e.target.value)}
            >
              {QUALS.map((q) => (
                <option key={q} value={q}>
                  {q || "— any —"}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col">
            <label className="mb-1 text-slate-600" style={{ fontSize: 14 }}>
              Min Quality (1–6)
            </label>
            <input
              type="number"
              step="0.1"
              min={1}
              max={6}
              value={formMinQ}
              onChange={(e) => setFormMinQ(e.target.value)}
              className="h-10 rounded-lg border px-3 focus:outline-none"
              style={{
                borderColor: "rgba(0,0,0,0.15)",
                boxShadow: `0 0 0 3px ${BC_BLUE}33`,
                fontSize: 15,
                fontFamily: "Inter, Nunito, ui-sans-serif",
              }}
            />
          </div>

          <div className="flex items-end">
            <div className="flex w-full gap-3">
              <div className="flex-1">
                <label className="sr-only">Max Quality</label>
                <input
                  type="number"
                  step="0.1"
                  min={1}
                  max={6}
                  value={formMaxQ}
                  onChange={(e) => setFormMaxQ(e.target.value)}
                  className="h-10 w-full rounded-lg border px-3 focus:outline-none"
                  style={{
                    borderColor: "rgba(0,0,0,0.15)",
                    boxShadow: `0 0 0 3px ${BC_BLUE}33`,
                    fontSize: 15,
                    fontFamily: "Inter, Nunito, ui-sans-serif",
                  }}
                  placeholder="Max Quality (1–6)"
                />
              </div>
              <button
                type="submit"
                className="h-10 shrink-0 rounded-lg text-white px-4 font-semibold shadow hover:shadow-md transition-transform hover:-translate-y-0.5"
                style={{
                  background: `linear-gradient(90deg, ${BC_GREEN}, ${BC_GREEN_DARK})`,
                  fontSize: 14,
                  fontFamily: "Inter, Nunito, ui-sans-serif",
                }}
              >
                Apply
              </button>
            </div>
          </div>
        </form>

        {/* Sort */}
        <div className="mb-6 flex items-end gap-2">
          <label className="text-slate-600" style={{ fontSize: 14 }}>
            Sort
          </label>
          <select
            className="h-10 rounded-lg border px-3 bg-white focus:outline-none"
            style={{
              borderColor: "rgba(0,0,0,0.15)",
              boxShadow: `0 0 0 3px ${BC_BLUE}33`,
              fontSize: 15,
              fontFamily: "Inter, Nunito, ui-sans-serif",
            }}
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortBy)}
          >
            <option value="relevance">Relevance (no sort)</option>
            <option value="quality_desc">Overall Quality (desc)</option>
            <option value="quality_asc">Overall Quality (asc)</option>
          </select>
        </div>

        {/* Summary / errors */}
        <div className="mb-3 text-slate-600" style={{ fontSize: 14 }}>
          {error ? (
            <span className="text-rose-600">Error: {error}</span>
          ) : (
            <>
              Page <strong>{pageSafe}</strong> of <strong>{numPages}</strong>
              {typeof rawCount === "number" ? (
                <>
                  {" "}
                  — total fetched: <strong>{rawCount.toLocaleString()}</strong>
                </>
              ) : null}
            </>
          )}
        </div>

        {/* Grid */}
        {loading ? (
          <ListingsSkeleton />
        ) : (
          grid || (
            <div className="text-slate-500" style={{ fontSize: 15 }}>
              No listings match your criteria.
            </div>
          )
        )}

        {/* Pager */}
        <div className="mt-8 flex items-center justify-center gap-3">
          <button
            className="rounded-lg border px-3 py-2 disabled:opacity-50"
            style={{ borderColor: "rgba(0,0,0,0.15)", color: BC_BLUE, fontFamily: "Inter, Nunito, ui-sans-serif" }}
            disabled={!canPrev || loading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            ← Prev
          </button>
          <span className="text-slate-600" style={{ fontSize: 14 }}>
            Page {pageSafe} / {numPages}
          </span>
          <button
            className="rounded-lg border px-3 py-2 disabled:opacity-50"
            style={{ borderColor: "rgba(0,0,0,0.15)", color: BC_BLUE, fontFamily: "Inter, Nunito, ui-sans-serif" }}
            disabled={!canNext || loading}
            onClick={() => setPage((p) => p + 1)}
          >
            Next →
          </button>
        </div>
      </div>

      {/* Chat FAB in footer */}
      {!chatOpen && (
        <button
          aria-label="Open chat"
          type="button"
          className="fixed z-50 bottom-6 right-6 md:bottom-10 md:right-10 text-white shadow-lg rounded-full w-16 h-16 flex items-center justify-center hover:scale-110 transition-all"
          style={{
            pointerEvents: "auto",
            background: `linear-gradient(135deg, ${BC_BLUE}, ${BC_GREEN})`,
            boxShadow: `0 0 0 3px ${BC_BLUE}55`,
            fontFamily: "Inter, Nunito, ui-sans-serif",
          }}
          onClick={() => setChatOpen(true)}
        >
          <ChatBubbleOvalLeftEllipsisIcon className="h-8 w-8" />
        </button>
      )}
      <ChatPanel open={chatOpen} onClose={() => setChatOpen(false)} />

      {/* Animations & small style hooks */}
      <style>{`
        .glass-card-pro {
          backdrop-filter: blur(18px) saturate(1.5);
          background: rgba(255,255,255,0.82);
          box-shadow: 0 6px 24px 0 rgba(30, 144, 255, 0.10);
          border-radius: 1.25rem;
          border: 1px solid rgba(30, 144, 255, 0.15);
          transition: box-shadow 0.25s, transform 0.18s;
        }
        a, .link, .bc-link { color: ${BC_BLUE}; }
        a:hover { text-decoration: underline; }
        h1 { font-weight: 800; }
        h2 { font-weight: 700; }
        h3 { font-weight: 700; }
      `}</style>
    </div>
  );
}
