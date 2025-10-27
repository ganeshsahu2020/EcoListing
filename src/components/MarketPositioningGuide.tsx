// ui/src/components/MarketPositioningGuide.tsx
import React from "react";
import {
  ChartBarIcon,
  CurrencyDollarIcon,
  HomeIcon,
  MapPinIcon,
  SparklesIcon,
  PresentationChartLineIcon,
  ArrowRightIcon,
  ShieldCheckIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  LightBulbIcon,
  PhotoIcon,
} from "@heroicons/react/24/outline";

const BLUE = "#1E40AF";
const GREEN = "#059669";
const GOLD = "#D97706";

type TocItem = { id: string; label: string };

const TOC: TocItem[] = [
  { id: "market-positioning", label: "Market Positioning" },
  { id: "financial-summary", label: "Financial Summary" },
  { id: "target-buyer-profile", label: "Target Buyer Profile" },
  { id: "launch-plan", label: "30-Day Launch Plan" },
  { id: "value-enhancement", label: "Value Enhancement" },
  { id: "narrative", label: "Narrative" },
  { id: "risks-mitigation", label: "Risks & Mitigation" },
  { id: "next-steps", label: "Next Steps (≤ 30 days)" },
];

/* ─────────────────────────────────────────────────────────
   Smooth scroll + ScrollSpy helpers
   ──────────────────────────────────────────────────────── */
const HEADER_OFFSET_PX = 88; // adjust if your sticky header is taller/shorter

function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (!el) return;

  // Native smooth scroll with CSS offset via scroll-margin-top
  el.scrollIntoView({ behavior: "smooth", block: "start" });

  // Keep the URL hash in sync without adding history entries
  const url = new URL(window.location.href);
  url.hash = id;
  window.history.replaceState(null, "", url.toString());
}

function useScrollSpy(sectionIds: string[], rootMarginTop = HEADER_OFFSET_PX) {
  const [active, setActive] = React.useState<string | null>(null);
  React.useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) setActive((visible[0].target as HTMLElement).id);
      },
      {
        root: null,
        rootMargin: `-${rootMarginTop + 6}px 0px -60% 0px`,
        threshold: [0, 0.2, 0.4, 0.6, 0.8, 1],
      }
    );

    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) obs.observe(el);
    });

    return () => obs.disconnect();
  }, [sectionIds, rootMarginTop]);

  return active;
}

/* ─────────────────────────────────────────────────────────
   Page
   ──────────────────────────────────────────────────────── */
export default function MarketPositioningGuide() {
  // Enable smooth scrolling while mounted
  React.useEffect(() => {
    const prev = document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior = "smooth";
    return () => {
      document.documentElement.style.scrollBehavior = prev;
    };
  }, []);

  // Deep-link support: jump to hash on load / change
  React.useEffect(() => {
    const go = () => {
      const id = (window.location.hash || "").replace(/^#/, "");
      if (id) requestAnimationFrame(() => scrollToId(id));
    };
    go(); // initial
    window.addEventListener("hashchange", go);
    return () => window.removeEventListener("hashchange", go);
  }, []);

  const activeId = useScrollSpy(TOC.map((t) => t.id), HEADER_OFFSET_PX);

  return (
    <main
      className="font-sans min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900"
      aria-label="Market Positioning Guide for Home Sellers"
    >
      {/* Header */}
      <section className="mx-auto max-w-7xl px-6 pt-10 pb-4">
        <div className="flex items-start justify-between gap-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              <span className="bg-gradient-to-r from-blue-900 to-green-700 bg-clip-text text-transparent">
                Market Positioning Guide for Home Sellers
              </span>
            </h1>
            <p className="mt-3 max-w-3xl text-slate-600">
              Create a compelling identity for your property, speak to the right buyers, and launch with
              confidence. This guide turns strategy into practical steps you can act on today.
            </p>
          </div>
          <div className="hidden lg:block">
            <span
              className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-semibold"
              style={{ borderColor: "#D1D5DB", color: "#334155", background: "white" }}
            >
              <SparklesIcon className="h-4 w-4" /> Professional Playbook
            </span>
          </div>
        </div>
      </section>

      {/* Body */}
      <section className="mx-auto max-w-7xl px-6 pb-20 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main */}
        <div className="lg:col-span-8 space-y-8">
          <ContentsCard
            items={TOC}
            activeId={activeId}
            onJump={(id) => scrollToId(id)}
          />

          {/* Sections */}
          <Section id="market-positioning" icon={<ChartBarIcon className="h-6 w-6" />} title="Understanding Market Positioning">
            <p>
              Market positioning is the strategic process of establishing your property’s unique identity and
              value proposition within a competitive landscape. It aligns pricing, features, visuals, and messaging
              to resonate with a precise buyer segment.
            </p>

            <div className="grid md:grid-cols-3 gap-4 mt-4">
              <Pill title="Clarity" subtitle="What makes this home different?" />
              <Pill title="Consistency" subtitle="Same message across all channels" />
              <Pill title="Confidence" subtitle="Backed by comps & buyer data" />
            </div>

            <h3 className="mt-5 mb-2 font-bold text-slate-900 text-lg">Key Positioning Strategies</h3>
            <div className="space-y-6">
              <StrategyBlock
                title="Price-Based Positioning"
                bullets={[
                  { label: "Premium/Luxury", detail: "Top 10% of local price band; emphasize exclusivity, craftsmanship, rare features." },
                  { label: "Value", detail: "Competitive price with superior features; ‘more home for your money’ narrative." },
                  { label: "Competitive", detail: "Aligned with recent comps; meet standard market expectations cleanly." },
                ]}
                accent={BLUE}
                icon={<CurrencyDollarIcon className="h-5 w-5" />}
              />
              <StrategyBlock
                title="Feature-Based Positioning"
                bullets={[
                  { label: "Lifestyle", detail: "Waterfront, views, golf—sell the experience over raw square footage." },
                  { label: "Character Homes", detail: "Heritage detail, story, and craftsmanship take center stage." },
                  { label: "Modern & Efficient", detail: "New builds, smart tech, energy performance, low maintenance." },
                ]}
                accent={GREEN}
                icon={<HomeIcon className="h-5 w-5" />}
              />
              <StrategyBlock
                title="Location-Based Positioning"
                bullets={[
                  { label: "Urban Core", detail: "Walkability, culture, convenience—appeal to professionals/downsizers." },
                  { label: "Family Suburbs", detail: "Schools, parks, safety—position on family utility and growth." },
                  { label: "Rural/Estate", detail: "Privacy, acreage, retreat feel—space and customizability." },
                ]}
                accent={GOLD}
                icon={<MapPinIcon className="h-5 w-5" />}
              />
            </div>

            <h3 className="mt-5 mb-2 font-bold text-slate-900 text-lg">The Positioning Process</h3>
            <OrderedSteps
              items={[
                { label: "Market Analysis", detail: "Study comps, competing actives, absorption, buyer preferences." },
                { label: "Property Assessment", detail: "Inventory features, identify USPs, condition & seasonality." },
                { label: "Target Buyer Identification", detail: "Primary/secondary profiles, motivations, preferred channels." },
                { label: "Competitive Differentiation", detail: "Find market gaps, emphasize advantages, craft value props." },
              ]}
            />

            <Callout
              icon={<InformationCircleIcon className="h-5 w-5" />}
              title="Pro Tip"
              body="Position first, price second. The same home can justify different price bands depending on how you frame and present it."
            />
          </Section>

          <Section id="financial-summary" icon={<PresentationChartLineIcon className="h-6 w-6" />} title="Pricing Strategies by Position">
            <div className="grid md:grid-cols-3 gap-4">
              <PricingCard
                label="Premium (+5–15% over comps)"
                points={["Unique, irreplaceable features", "Immaculate presentation", "Expect longer DOM", "Heavier marketing lift"]}
              />
              <PricingCard
                label="Market (Aligned with comps)"
                points={["Recent sales anchored", "Competitive with similar homes", "Standard exposure", "Typical DOM"]}
              />
              <PricingCard
                label="Aggressive (−5–10% to comps)"
                points={["Immediate attention", "Higher offer velocity", "Faster timeline", "Potential bidding dynamics"]}
              />
            </div>
          </Section>

          <Section id="target-buyer-profile" icon={<SparklesIcon className="h-6 w-6" />} title="Positioning Statements (Examples)">
            <Statement title="Premium Urban Condo" text="Sophisticated downtown living with panoramic views, luxury amenities, and walkable access to dining and culture." />
            <Statement title="Family Suburban Home" text="Spacious family sanctuary in a top school catchment—modern updates, big backyard, near parks and community." />
            <Statement title="Character Heritage Home" text="Beautifully preserved charm blended with modern comfort—original craftsmanship in a prized historic enclave." />
          </Section>

          <Section id="launch-plan" icon={<ClockIcon className="h-6 w-6" />} title="30-Day Launch Plan (High Level)">
            <div className="grid md:grid-cols-3 gap-4">
              <Checklist title="Week 1 — Prep" items={["Designer staging consult", "Pro photo/video + floorplan", "Pre-inspection (optional)"]} />
              <Checklist title="Week 2 — Go Live" items={["Thu AM launch window", "Agent network & socials", "Targeted digital ads"]} />
              <Checklist title="Week 3–4 — Momentum" items={["Opens + private showings", "Feedback loops", "Adjust price/terms if required"]} />
            </div>
          </Section>

          <Section id="value-enhancement" icon={<LightBulbIcon className="h-6 w-6" />} title="Visual Positioning & Value Add">
            <div className="grid md:grid-cols-3 gap-4">
              <ValueTile icon={<PhotoIcon className="h-6 w-6" />} title="Photography" lines={["Luxury: editorial detail shots", "Family: warm lifestyle scenes", "Modern: crisp architectural angles"]} />
              <ValueTile icon={<SparklesIcon className="h-6 w-6" />} title="Staging" lines={["Premium: curated designer pieces", "Value: neutral, maximize space", "Lifestyle: reflect buyer aspirations"]} />
              <ValueTile icon={<ChartBarIcon className="h-6 w-6" />} title="Marketing" lines={["Tone matches position", "Consistent imagery system", "Feature benefits that fit strategy"]} />
            </div>
          </Section>

          <Section id="narrative" icon={<SparklesIcon className="h-6 w-6" />} title="Narrative Matters">
            <Quote who="Marketing Expert" text="Positioning isn’t just about price — it’s about creating an emotional connection. The right position makes buyers feel ‘this is the one’." />
            <Quote who="Real Estate Agent" text="Top listings pick a lane and own it. Trying to be everything to everyone usually means you resonate with no one." />
            <Quote who="Home Stager" text="Staging must reinforce your chosen position. Luxury needs curation; a family home should feel warm and functional." />
          </Section>

          <Section id="risks-mitigation" icon={<ShieldCheckIcon className="h-6 w-6" />} title="Common Mistakes & Mitigation">
            <div className="grid md:grid-cols-2 gap-6">
              <DoList title="Do" items={["Align price, visuals, and copy to a single strategy.", "Use clear buyer personas to guide creative choices.", "Refresh media after updates or price changes."]} />
              <DontList title="Avoid" items={["Mixed messages across channels.", "Claiming ‘luxury’ without proof.", "Ignoring comps or buyer feedback."]} />
            </div>
          </Section>

          <Section id="next-steps" icon={<ArrowRightIcon className="h-6 w-6" />} title="Measuring & Adapting (Next Steps)">
            <div className="grid md:grid-cols-3 gap-4">
              <KpiCard title="DOM vs. Area" value="Track weekly" />
              <KpiCard title="Showings / Week" value="Benchmark against comps" />
              <KpiCard title="Offer Quality" value="Price perception & terms" />
            </div>
            <Callout
              icon={<ExclamationTriangleIcon className="h-5 w-5" />}
              title="When to Reposition"
              body="After 2–3 weeks with limited showings, if new competition appears, or if you see consistent feedback on price/feature gaps."
            />
          </Section>
        </div>

        {/* Right rail */}
        <aside className="lg:col-span-4 lg:pt-2">
          <nav aria-label="On this page" className="lg:sticky lg:top-6">
            <div className="rounded-2xl border bg-white p-4">
              <div className="text-sm font-semibold text-slate-700 mb-2">On this page</div>
              <ul className="space-y-1 text-sm">
                {TOC.map((t) => {
                  const active = activeId === t.id;
                  return (
                    <li key={t.id}>
                      <button
                        type="button"
                        onClick={() => scrollToId(t.id)}
                        className={`w-full text-left inline-flex items-center gap-2 rounded-md px-2 py-1 hover:bg-slate-50 ${
                          active ? "font-semibold text-blue-900" : "text-blue-700"
                        }`}
                        aria-current={active ? "true" : undefined}
                      >
                        <span
                          className="h-1.5 w-1.5 rounded-full"
                          style={{ background: active ? BLUE : "#93c5fd" }}
                        />
                        {t.label}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </nav>
        </aside>
      </section>

      <style>{`
        .font-sans { font-family: Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial; }
        /* Ensure native anchor jumps land below sticky header */
        section[id] { scroll-margin-top: ${HEADER_OFFSET_PX + 8}px; }
        @media print {
          nav, aside { display: none !important; }
          .rounded-2xl, .rounded-xl { box-shadow: none !important; }
          @page { margin: 14mm; }
        }
      `}</style>
    </main>
  );
}

/* ─────────────────────────────────────────────────────────
   Reusable bits (unchanged visuals)
   ──────────────────────────────────────────────────────── */
function ContentsCard({
  items,
  activeId,
  onJump,
}: {
  items: TocItem[];
  activeId?: string | null;
  onJump?: (id: string) => void;
}) {
  return (
    <div className="rounded-2xl border bg-slate-50 p-5">
      <div className="font-semibold text-slate-700 mb-2">Contents</div>
      <div className="grid sm:grid-cols-2 gap-x-10 gap-y-1">
        {items.map((i) => {
          const active = activeId === i.id;
          return (
            <button
              key={i.id}
              type="button"
              onClick={() => onJump?.(i.id)}
              className={`text-left hover:underline ${
                active ? "font-semibold text-blue-900" : "text-blue-700"
              }`}
            >
              {i.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Section({
  id,
  title,
  icon,
  children,
}: {
  id: string;
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <div className="flex items-center gap-2 mb-2">
        <div className="grid h-9 w-9 place-items-center rounded-lg" style={{ border: "1px solid #E5E7EB", background: "white" }}>
          {icon}
        </div>
        <h2 className="text-xl font-bold text-slate-900">{title}</h2>
      </div>
      <div className="rounded-xl border bg-white p-5 leading-relaxed text-slate-700">{children}</div>
    </section>
  );
}

function Pill({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="rounded-xl border bg-white p-4">
      <div className="text-sm font-bold text-slate-900">{title}</div>
      <div className="text-sm text-slate-600">{subtitle}</div>
    </div>
  );
}

function StrategyBlock({
  title,
  bullets,
  accent,
  icon,
}: {
  title: string;
  bullets: { label: string; detail: string }[];
  accent: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border bg-white">
      <div className="flex items-center justify-between px-5 py-3 border-b">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-md" style={{ background: `${accent}16`, color: accent }}>
            {icon}
          </span>
          <div className="font-semibold text-slate-900">{title}</div>
        </div>
      </div>
      <ul className="p-5 space-y-2">
        {bullets.map((b, i) => (
          <li key={i} className="flex gap-3">
            <span className="mt-1 h-1.5 w-1.5 rounded-full" style={{ background: accent }} />
            <div>
              <div className="font-medium text-slate-900">{b.label}</div>
              <div className="text-slate-600">{b.detail}</div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function OrderedSteps({ items }: { items: { label: string; detail: string }[] }) {
  return (
    <ol className="grid md:grid-cols-2 gap-4 mt-2">
      {items.map((s, i) => (
        <li key={i} className="rounded-xl border bg-white p-4">
          <div className="text-xs font-bold text-slate-500">STEP {i + 1}</div>
          <div className="font-semibold text-slate-900">{s.label}</div>
          <div className="text-slate-600">{s.detail}</div>
        </li>
      ))}
    </ol>
  );
}

function Callout({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="mt-4 rounded-xl border bg-slate-50 p-4 flex gap-3">
      <div className="text-blue-700">{icon}</div>
      <div>
        <div className="font-semibold text-slate-900">{title}</div>
        <p className="text-slate-700">{body}</p>
      </div>
    </div>
  );
}

function PricingCard({ label, points }: { label: string; points: string[] }) {
  return (
    <div className="rounded-xl border bg-white p-4">
      <div className="font-semibold text-slate-900 mb-2">{label}</div>
      <ul className="space-y-1 text-slate-700">
        {points.map((p, i) => (
          <li key={i} className="flex gap-2">
            <CheckCircleIcon className="h-4 w-4 mt-0.5 text-emerald-600" />
            <span>{p}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Statement({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-xl border bg-white p-4 mb-3">
      <div className="font-semibold text-slate-900">{title}</div>
      <div className="text-slate-700">{text}</div>
    </div>
  );
}

function Checklist({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-xl border bg-white p-4">
      <div className="font-semibold text-slate-900 mb-2">{title}</div>
      <ul className="space-y-1 text-slate-700">
        {items.map((p, i) => (
          <li key={i} className="flex gap-2">
            <ArrowRightIcon className="h-4 w-4 mt-0.5 text-slate-400" />
            <span>{p}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ValueTile({ icon, title, lines }: { icon: React.ReactNode; title: string; lines: string[] }) {
  return (
    <div className="rounded-xl border bg-white p-4">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-slate-700">{icon}</span>
        <div className="font-semibold text-slate-900">{title}</div>
      </div>
      <ul className="text-slate-700 text-sm list-disc pl-5">
        {lines.map((l, i) => (
          <li key={i}>{l}</li>
        ))}
      </ul>
    </div>
  );
}

function DoList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-xl border bg-white p-4">
      <div className="font-semibold text-emerald-700">{title}</div>
      <ul className="mt-1 space-y-1 text-slate-700">
        {items.map((it, i) => (
          <li key={i} className="flex gap-2">
            <CheckCircleIcon className="h-4 w-4 mt-0.5 text-emerald-600" />
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function DontList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-xl border bg-white p-4">
      <div className="font-semibold text-rose-700">{title}</div>
      <ul className="mt-1 space-y-1 text-slate-700">
        {items.map((it, i) => (
          <li key={i} className="flex gap-2">
            <ExclamationTriangleIcon className="h-4 w-4 mt-0.5 text-rose-500" />
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function KpiCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-xl border bg-white p-4">
      <div className="text-xs font-bold text-slate-500">KPI</div>
      <div className="font-semibold text-slate-900">{title}</div>
      <div className="text-slate-700">{value}</div>
    </div>
  );
}

function Quote({ who, text }: { who: string; text: string }) {
  return (
    <figure className="rounded-xl border bg-white p-4">
      <blockquote className="italic text-slate-800">“{text}”</blockquote>
      <figcaption className="mt-2 text-sm text-slate-500">— {who}</figcaption>
    </figure>
  );
}
