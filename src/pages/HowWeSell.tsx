// ui/src/pages/HowWeSell.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  CheckCircleIcon,
  ArrowRightIcon,
  ChatBubbleLeftRightIcon,
  MapPinIcon,
  ShieldCheckIcon,
  PlayCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";

/** Debug toggle */
const SHORT_CIRCUIT = false;
const log = (...a: any[]) => console.log("%c[HowWeSell]", "color:#10b981;font-weight:700", ...a);

/** Design tokens */
const BC_BLUE = "#1E90FF";
const BC_GREEN = "#1ABC9C";

/* ─────────────────────────────────────────────────────────
   Types
   ──────────────────────────────────────────────────────── */
type Step = {
  id: number;
  title: string;
  body: React.ReactNode;
  cta?: { label: string; to: string };
  img: { src: string; alt: string };
};

type MediaItem =
  | { type: "image"; src: string; alt: string }
  | { type: "video"; src: string; poster?: string; alt?: string };

/* ─────────────────────────────────────────────────────────
   Safe <img> (fallback styles on error)
   ──────────────────────────────────────────────────────── */
function ImgSafe(props: React.ImgHTMLAttributes<HTMLImageElement>) {
  const onError: React.ReactEventHandler<HTMLImageElement> = (e) => {
    const el = e.currentTarget;
    el.style.opacity = "0.15";
    el.style.background = "#eef2ff";
    el.alt = (props.alt ?? "image") + " (failed to load)";
  };
  return <img {...props} onError={onError} />;
}

/* ─────────────────────────────────────────────────────────
   Steps content (images from /public/images/how-we-sell)
   ──────────────────────────────────────────────────────── */
const STEPS: Step[] = [
  {
    id: 1,
    title: "Personalized Consultation",
    body: (
      <>
        Our expert agents guide you through the entire selling process with a personalized
        consultation. We present how our <strong>3D Live Tours</strong> elevate your property’s
        visibility and help you set the right price using a comprehensive{" "}
        <strong>Comparative Market Analysis (CMA)</strong>.
      </>
    ),
    cta: { label: "Get Your Free Home Evaluation Report", to: "/find-comparable" },
    img: {
      src: "/images/how-we-sell/consultation.jpg",
      alt: "Agent discussing pricing strategy during consultation",
    },
  },
  {
    id: 2,
    title: "Professional 3D Marketing",
    body: (
      <>
        Our dedicated marketing team visits your property to create a high-quality{" "}
        <strong>3D digital model</strong>, highlighting its best features to attract serious buyers.
        Your listing launches across major real-estate platforms, fully equipped with{" "}
        <strong>3D Live Tours</strong>.
      </>
    ),
    img: {
      src: "/images/how-we-sell/marketing-3d.jpg",
      alt: "3D floor plan marketing render",
    },
  },
  {
    id: 3,
    title: "Virtual Showings & Buyer Screening",
    body: (
      <>
        We conduct preliminary <strong>virtual showings</strong>, answer buyer inquiries, and
        identify those who are genuinely interested. Only qualified buyers move forward to an
        in-person visit—saving you time and effort.
      </>
    ),
    img: {
      src: "/images/how-we-sell/virtual-showing.jpg",
      alt: "Virtual showing in progress on a phone",
    },
  },
  {
    id: 4,
    title: "In-Person Walkthroughs",
    body: (
      <>
        For buyers ready to take the next step, our agents facilitate fair and professional{" "}
        <strong>in-person showings</strong>.
      </>
    ),
    img: {
      src: "/images/how-we-sell/walkthrough.jpg",
      alt: "Agent greeting a family for a home tour",
    },
  },
  {
    id: 5,
    title: "Offers, Negotiations & Closing",
    body: (
      <>
        Our agents work closely with you to review and negotiate offers based on market data and
        contract terms, ensuring a successful sale with<strong> full transparency</strong>.
      </>
    ),
    img: {
      src: "/images/how-we-sell/closing.jpg",
      alt: "Accepted offer and sold sign outside a home",
    },
  },
];

/* ─────────────────────────────────────────────────────────
   Number bubble
   ──────────────────────────────────────────────────────── */
function NumberBubble({ n }: { n: number }) {
  return (
    <div
      className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold shadow-sm md:h-10 md:w-10"
      style={{ background: "white", color: BC_BLUE, border: "1px solid rgba(2,6,23,.12)" }}
      aria-hidden
    >
      {n}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Step row
   ──────────────────────────────────────────────────────── */
function StepRow({ step, flip = false }: { step: Step; flip?: boolean }) {
  return (
    <section className="relative">
      <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-12">
        <div className={flip ? "md:order-2 md:col-span-6" : "md:col-span-6"}>
          <div className="flex items-start gap-4">
            <NumberBubble n={step.id} />
            <div>
              <h3 className="text-2xl font-bold text-slate-800 md:text-[26px]">{step.title}</h3>
              <p className="mt-2 text-[16px] leading-7 text-slate-600 md:text-[17px]">{step.body}</p>
              {step.cta && (
                <Link
                  to={step.cta.to}
                  className="mt-4 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold shadow-sm"
                  style={{ background: BC_BLUE, color: "white" }}
                >
                  {step.cta.label}
                  <ArrowRightIcon className="h-4 w-4" aria-hidden />
                </Link>
              )}
            </div>
          </div>
        </div>

        <div className={flip ? "md:order-1 md:col-span-6" : "md:col-span-6"}>
          <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
            <ImgSafe
              src={step.img.src}
              alt={step.img.alt}
              className="h-[280px] w-full object-cover md:h-[340px]"
              loading="lazy"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────
   Media Rotator (images + videos, auto-advance, loop)
   ──────────────────────────────────────────────────────── */
function MediaRotator({
  items,
  imageDurationMs = 4500,
  className = "",
}: {
  items: MediaItem[];
  imageDurationMs?: number;
  className?: string;
}) {
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const vidRef = useRef<HTMLVideoElement | null>(null);
  const active = items[idx];

  // advance helper
  const next = (manual = false) => {
    if (manual) setPaused(true);
    setIdx((i) => (i + 1) % items.length);
  };
  const prev = (manual = false) => {
    if (manual) setPaused(true);
    setIdx((i) => (i - 1 + items.length) % items.length);
  };

  // image timer
  useEffect(() => {
    if (active.type === "image" && !paused) {
      const t = setTimeout(() => next(), imageDurationMs);
      return () => clearTimeout(t);
    }
  }, [idx, paused, imageDurationMs, active]);

  // video autoplay & advance on end
  useEffect(() => {
    const v = vidRef.current;
    if (!v) return;
    if (active.type === "video") {
      const onEnded = () => next();
      v.addEventListener("ended", onEnded);
      // try to autoplay
      v.play().catch(() => {
        // if blocked, fall back to timer
        const t = setTimeout(() => next(), imageDurationMs);
        const cleanup = () => clearTimeout(t);
        v.addEventListener("play", cleanup, { once: true });
        return cleanup;
      });
      return () => v.removeEventListener("ended", onEnded);
    }
  }, [idx, active, imageDurationMs]);

  // keyboard support
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") next(true);
      else if (e.key === "ArrowLeft") prev(true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // 16:9 responsive wrapper (safe for object-cover)
  return (
    <div
      className={["relative select-none", className].join(" ")}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carousel"
    >
      {/* Aspect box */}
      <div className="relative w-full overflow-hidden rounded-2xl border border-slate-200 shadow-sm" style={{ paddingTop: "56.25%" }}>
        {/* slide */}
        <div className="absolute inset-0">
          {active.type === "image" ? (
            <ImgSafe
              src={active.src}
              alt={active.alt}
              className="h-full w-full object-cover transition-opacity duration-300"
            />
          ) : (
            <video
              ref={vidRef}
              className="h-full w-full object-cover"
              src={active.src}
              poster={active.poster}
              muted
              playsInline
              controls={false}
            />
          )}
        </div>

        {/* gradient for overlay safety (optional subtle) */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/10 via-transparent to-transparent" />

        {/* controls */}
        <button
          type="button"
          aria-label="Previous"
          onClick={() => prev(true)}
          className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 shadow hover:bg-white"
        >
          <ChevronLeftIcon className="h-5 w-5 text-slate-700" />
        </button>
        <button
          type="button"
          aria-label="Next"
          onClick={() => next(true)}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 shadow hover:bg-white"
        >
          <ChevronRightIcon className="h-5 w-5 text-slate-700" />
        </button>

        {/* dots */}
        <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2">
          {items.map((_, i) => (
            <button
              key={i}
              aria-label={`Go to slide ${i + 1}`}
              className={[
                "h-2.5 w-2.5 rounded-full",
                i === idx ? "bg-white" : "bg-white/50 hover:bg-white/80",
              ].join(" ")}
              onClick={() => {
                setPaused(true);
                setIdx(i);
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Page
   ──────────────────────────────────────────────────────── */
export default function HowWeSell() {
  const { pathname, search } = useLocation();
  log("render start", { path: pathname + search });

  useEffect(() => {
    log("mounted");
    return () => log("unmounted");
  }, []);

  const PLAYLIST: MediaItem[] = useMemo(
    () => [
      { type: "image", src: "/images/how-we-sell/consultation.jpg", alt: "Consultation" },
      { type: "image", src: "/images/how-we-sell/marketing-3d.jpg", alt: "3D Marketing" },
      { type: "video", src: "/videos/how-we-sell/walkthrough.mp4", poster: "/images/how-we-sell/walkthrough.jpg" },
      { type: "image", src: "/images/how-we-sell/virtual-showing.jpg", alt: "Virtual showing" },
      { type: "image", src: "/images/how-we-sell/closing.jpg", alt: "Offers and closing" },
      { type: "image", src: "/images/how-we-sell/ready.jpg", alt: "Exterior hero" },
    ],
    []
  );

  if (SHORT_CIRCUIT) {
    return (
      <div
        style={{
          padding: 16,
          margin: 16,
          background: "#fde68a",
          border: "3px dashed #b45309",
          borderRadius: 12,
          fontWeight: 700,
        }}
      >
        HWS MARKER — component mounted
      </div>
    );
  }

  return (
    <main
      className="relative min-h-screen bg-gradient-to-b from-white to-slate-50 overflow-x-hidden"
      style={{
        // Pull page up by header+insights height, then add same as top padding
        marginTop: "calc((var(--app-header-h, 0px) + var(--seller-insights-h, 64px)) * -1)",
        paddingTop: "calc(var(--app-header-h, 0px) + var(--seller-insights-h, 64px))",
      }}
    >
      {/* faint blueprint grid */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.06]"
        style={{
          backgroundImage:
            "linear-gradient(to right, #0b10200a 1px, transparent 1px), linear-gradient(to bottom, #0b10200a 1px, transparent 1px)",
          backgroundSize: "22px 22px",
        }}
      />

      <div className="container mx-auto px-4">
        {/* HERO */}
        <header className="mx-auto max-w-5xl pt-0 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm md:text-base">
            <MapPinIcon className="h-5 w-5 md:h-6 md:w-6" style={{ color: BC_BLUE }} />
            How We Sell
          </div>

          <h1 className="mt-5 text-[32px] font-extrabold leading-tight text-slate-900 sm:text-5xl md:text-6xl">
            Your Selling Journey with <span style={{ color: BC_BLUE }}>EcoListing</span>
          </h1>

          <p className="mx-auto mt-4 max-w-3xl text-[16px] leading-7 text-slate-600 md:text-[18px]">
            A seamless, five-step journey designed to save you time, attract serious buyers, and maximize your home’s value.
          </p>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-3 md:gap-4">
            <Link
              to="/tour"
              className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm md:text-base font-semibold shadow-sm"
              style={{ background: BC_GREEN, color: "white" }}
            >
              Book Your Free Consultation
              <PlayCircleIcon className="h-5 w-5" aria-hidden />
            </Link>
            <Link
              to="/chat"
              className="inline-flex items-center gap-2 rounded-full border px-6 py-3 text-sm md:text-base font-semibold"
              style={{ color: BC_BLUE, borderColor: "rgba(2,6,23,.12)" }}
            >
              Chat with an Agent
              <ChatBubbleLeftRightIcon className="h-5 w-5" aria-hidden />
            </Link>
          </div>
        </header>

        {/* MEDIA SHOWCASE (continuous image/video rotation) */}
        <section className="mx-auto mt-10 max-w-5xl">
          <MediaRotator items={PLAYLIST} imageDurationMs={5000} />
        </section>

        {/* STEPS */}
        <div className="relative mt-12 md:mt-14">
          <div
            aria-hidden
            className="absolute left-3 top-0 hidden h-full md:block"
            style={{ width: 2, background: "linear-gradient(#e2e8f0, #f1f5f9)" }}
          />
          <div className="space-y-12 md:space-y-16">
            {STEPS.map((s, i) => (
              <StepRow key={s.id} step={s} flip={i % 2 === 1} />
            ))}
          </div>
        </div>

        {/* READY SECTION */}
        <section className="mt-16 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-10">
          <div className="grid items-center gap-8 md:grid-cols-12">
            <div className="md:col-span-7">
              <h2 className="text-2xl md:text-3xl font-bold text-slate-900">Ready to get started?</h2>
              <p className="mt-2 text-[16px] md:text-[17px] leading-7 text-slate-600">
                From pricing to closing, we blend technology and expert representation to deliver a luxury-grade selling experience.
              </p>

              <ul className="mt-4 space-y-2 text-sm md:text-[15px] text-slate-700">
                <li className="flex items-center gap-2">
                  <CheckCircleIcon className="h-5 w-5" style={{ color: BC_GREEN }} />
                  Pro photography, 3D tours & multi-channel syndication
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircleIcon className="h-5 w-5" style={{ color: BC_GREEN }} />
                  Buyer qualification & hosted in-person showings
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircleIcon className="h-5 w-5" style={{ color: BC_GREEN }} />
                  Data-driven negotiation & transparent updates
                </li>
              </ul>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  to="/tour"
                  className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm md:text-base font-semibold shadow-sm"
                  style={{ background: BC_GREEN, color: "white" }}
                >
                  Book Your Free Consultation
                  <ArrowRightIcon className="h-4 w-4" aria-hidden />
                </Link>
                <Link
                  to="/find-comparable"
                  className="inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm md:text-base font-semibold"
                  style={{ color: BC_BLUE, borderColor: "rgba(2,6,23,.12)" }}
                >
                  Get a Home Value Estimate
                </Link>
              </div>
            </div>

            <div className="md:col-span-5">
              <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
                <ImgSafe
                  src="/images/how-we-sell/ready.jpg"
                  alt="Elegant condo exterior at dusk"
                  className="h-[260px] w-full object-cover md:h-[320px]"
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        </section>

        {/* COMPLIANCE */}
        <section className="mx-auto mt-14 max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm">
            <ShieldCheckIcon className="h-5 w-5" style={{ color: BC_GREEN }} />
            Ensuring Compliance & Legal Assurance
          </div>
          <p className="mx-auto mt-3 max-w-3xl text-[16px] md:text-[17px] leading-7 text-slate-600">
            EcoListing follows all contracts mandated under the Real Estate Services Act. Our trusted legal partners,{" "}
            <strong>TerraFirma</strong> and <strong>ReallyTrusted</strong>, keep us up to date with regulatory changes.
          </p>
        </section>

        <footer className="mt-16 mb-28 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} EcoListing. All rights reserved.
        </footer>
      </div>

      {/* Floating action dock */}
      <div className="fixed inset-x-0 bottom-4 z-40 flex justify-center px-4">
        <div className="flex w-full max-w-3xl items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/90 p-3 shadow-lg backdrop-blur">
          <div className="hidden items-center gap-2 md:flex">
            <span className="h-2 w-2 rounded-full" style={{ background: BC_GREEN }} />
            <span className="text-sm font-medium text-slate-700">
              Ready to sell? Chat or book a free consult.
            </span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Link
              to="/chat"
              className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold"
              style={{ color: BC_BLUE, borderColor: "rgba(2,6,23,.12)" }}
              aria-label="Open chat"
            >
              <ChatBubbleLeftRightIcon className="h-5 w-5" aria-hidden />
              Chat Now
            </Link>
            <Link
              to="/tour"
              className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold shadow-sm"
              style={{ background: BC_GREEN, color: "white" }}
              aria-label="Book your free consultation"
            >
              Book Consultation
              <ArrowRightIcon className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
