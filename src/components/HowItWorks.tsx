import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

const iconClass =
  "h-12 w-12 drop-shadow-xl transition-all duration-500 group-hover:scale-110 group-hover:drop-shadow-2xl";

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" className={iconClass} fill="none" stroke="url(#searchGrad)">
      <defs>
        <linearGradient id="searchGrad" x1="0" y1="0" x2="24" y2="24" gradientTransform="rotate(25)">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#22d3ee" />
        </linearGradient>
      </defs>
      <circle cx="11" cy="11" r="6" strokeWidth="2" />
      <path d="M21 21l-4.3-4.3" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
function TourIcon() {
  return (
    <svg viewBox="0 0 24 24" className={iconClass} fill="none" stroke="url(#tourGrad)">
      <defs>
        <linearGradient id="tourGrad" x1="0" y1="0" x2="24" y2="24">
          <stop offset="0%" stopColor="#4f46e5" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
      </defs>
      <path d="M3 10.5 12 4l9 6.5v8.5a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-8.5Z" strokeWidth="2" />
      <path d="M9 21v-6h6v6" strokeWidth="2" />
    </svg>
  );
}
function OfferIcon() {
  return (
    <svg viewBox="0 0 24 24" className={iconClass} fill="none" stroke="url(#offerGrad)">
      <defs>
        <linearGradient id="offerGrad" x1="0" y1="0" x2="24" y2="24">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#2563eb" />
        </linearGradient>
      </defs>
      <path d="M12 20h9" strokeWidth="2" strokeLinecap="round" />
      <path
        d="M16.5 3.5a2.12 2.12 0 1 1 3 3L10 16l-4 1 1-4 9.5-9.5Z"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function MoveInIcon() {
  return (
    <svg viewBox="0 0 24 24" className={iconClass} fill="none" stroke="url(#moveGrad)">
      <defs>
        <linearGradient id="moveGrad" x1="0" y1="0" x2="24" y2="24">
          <stop offset="0%" stopColor="#06b6d4" />
          <stop offset="100%" stopColor="#16a34a" />
        </linearGradient>
      </defs>
      <path d="M7 7a5 5 0 1 1 9.9 1" strokeWidth="2" strokeLinecap="round" />
      <path d="M3 14a7 7 0 0 1 14 0v6H3v-6Z" strokeWidth="2" />
      <circle cx="17.5" cy="16.5" r="2.5" strokeWidth="2" />
      <path d="M20 18.5l1.8 1.8" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function BrandMarkPro() {
  return (
    <span className="inline-flex items-center gap-3 mb-2">
      <span className="relative flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 via-emerald-400 to-green-500 shadow-lg">
        <svg className="h-7 w-7 text-white drop-shadow-[0_2px_8px_rgba(16,185,129,0.32)] animate-pulse" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" fill="rgba(16,185,129,0.2)" />
          <circle cx="12" cy="12" r="5" fill="white" />
        </svg>
        <span
          className="absolute bottom-0 right-0 h-4 w-4 rounded-full bg-emerald-500 border-2 border-white animate-bounce"
          aria-hidden
        ></span>
      </span>
      <span className="text-2xl font-bold tracking-tight select-none bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-emerald-600 to-slate-800">
        Eco<span className="text-slate-800 bg-none">Listing</span>
      </span>
    </span>
  );
}

function useInView<T extends HTMLElement>(opts: IntersectionObserverInit = { threshold: 0.2 }) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new window.IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        setInView(true);
        obs.disconnect();
      }
    }, opts);
    obs.observe(el);
    return () => obs.disconnect();
  }, [opts]);
  return { ref, inView };
}

type Step = {
  n: number;
  title: string;
  desc: string;
  Icon: () => React.JSX.Element;
  to: string;
};

const STEPS: Step[] = [
  { n: 1, title: "Search", desc: "Find properties in your desired area.", Icon: SearchIcon, to: "/listings" },
  { n: 2, title: "Tour", desc: "Schedule virtual or in-person tours.", Icon: TourIcon, to: "/tour" },
  { n: 3, title: "Offer", desc: "Make offers with our agent network.", Icon: OfferIcon, to: "/offer" },
  { n: 4, title: "Close", desc: "Close and move into your new home.", Icon: MoveInIcon, to: "/close" },
];

export default function HowItWorks() {
  return (
    <section className="relative bg-gradient-to-br from-[#e0f7fa] via-[#f8fafc] to-white py-12 md:py-20">
      <div className="mx-auto max-w-[1280px] px-4">
        <header className="mb-12 flex flex-col items-center">
          <BrandMarkPro />
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900">
            How It Works
          </h2>
          <p className="text-lg text-slate-600 mt-2 text-center max-w-xl">
            Discover the effortless way to find, tour, and close on your next eco-friendly home with EcoListing’s streamlined process.
          </p>
        </header>

        {/* Trust/App badges - (optional, demo only) */}
        {/* <div className="flex justify-center gap-4 mb-12">
          <img src="/badges/appstore.svg" alt="App Store" className="h-8" />
          <img src="/badges/googleplay.svg" alt="Google Play" className="h-8" />
          <img src="/badges/trustpilot.svg" alt="Trustpilot" className="h-8" />
        </div> */}

        <div className="relative">
          {/* Decorative vertical or horizontal line */}
          <div className="absolute left-1/2 top-0 bottom-0 hidden -translate-x-1/2 border-l border-dashed border-slate-200 md:hidden" />
          <div className="absolute inset-x-0 top-[68px] hidden border-t border-dashed border-slate-200 md:block" />

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, idx) => (
              <StepCard key={s.n} step={s} idx={idx} total={STEPS.length} />
            ))}
          </div>
        </div>
      </div>
      {/* Glassmorphism floating CTA */}
      <div className="fixed z-10 right-6 top-24 hidden xl:block animate-fade-in-up">
        <div className="backdrop-blur-2xl bg-white/80 border border-blue-200/60 shadow-xl rounded-2xl px-7 py-5 flex flex-col items-center">
          <span className="font-bold text-blue-700 text-lg mb-1 flex items-center gap-2">
            <svg className="h-7 w-7 text-emerald-400 animate-bounce" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#34d399" opacity=".2"/><circle cx="12" cy="12" r="5" fill="#fff"/></svg>
            Start your journey
          </span>
          <span className="text-xs text-slate-600 mb-2 text-center">
            Call our concierge at <a href="tel:1800123456" className="underline text-emerald-700">1-800-ECO-TOUR</a>
          </span>
          {/* <div className="flex gap-2 mt-2">
            <img src="/badges/appstore.svg" alt="App Store" className="h-7" />
            <img src="/badges/googleplay.svg" alt="Google Play" className="h-7" />
            <img src="/badges/trustpilot.svg" alt="Trustpilot" className="h-7" />
          </div> */}
        </div>
      </div>
      {/* Animations */}
      <style>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(24px);}
          to { opacity: 1; transform: translateY(0);}
        }
        .animate-fade-in-up { animation: fade-in-up 0.8s both; }
      `}</style>
    </section>
  );
}

function StepCard({ step, idx, total }: { step: Step; idx: number; total: number }) {
  const { ref, inView } = useInView<HTMLDivElement>();
  const isLast = idx === total - 1;
  const isLastInLgRow = (idx + 1) % 4 === 0;
  const isLastInMdRow = (idx + 1) % 2 === 0;

  return (
    <Link
      to={step.to}
      ref={ref as any}
      className={[
        "relative focus:outline-none focus:ring-4 focus:ring-blue-200/60",
        "rounded-3xl border border-slate-100 bg-white/70 glass-card-pro shadow-lg p-7 md:p-8 transition-all",
        "opacity-0 translate-y-4 scale-95",
        inView && "opacity-100 translate-y-0 scale-100 duration-700",
        "hover:shadow-2xl hover:border-blue-300 hover:scale-105 group",
        "flex flex-col items-center text-center min-h-[260px]",
      ].filter(Boolean).join(" ")}
      tabIndex={0}
      aria-label={step.title}
    >
      <div
        className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-emerald-100 shadow"
        aria-hidden
      >
        <step.Icon />
      </div>
      <div className="text-xl font-semibold text-[#334155] mb-1">{step.title}</div>
      <p className="text-base text-[#334155]/85 mb-2">{step.desc}</p>
      <span className="mt-auto pt-3 text-xs text-slate-500 font-medium tracking-wide">
        Step {step.n}
      </span>
      {/* Step connectors */}
      {!isLast && <div className="absolute -bottom-3 left-1/2 hidden h-6 -translate-x-1/2 border-l border-dashed border-slate-200 md:hidden" />}
      {!isLastInMdRow && <div className="absolute right-[-12px] top-14 hidden w-6 border-t border-dashed border-slate-200 md:block lg:hidden" />}
      {!isLastInLgRow && <div className="absolute right-[-12px] top-14 hidden w-6 border-t border-dashed border-slate-200 lg:block" />}
    </Link>
  );
}