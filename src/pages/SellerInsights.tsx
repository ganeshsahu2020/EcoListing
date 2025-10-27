import React from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowPathIcon,
  ArrowDownTrayIcon,
  ClipboardDocumentIcon,
  SparklesIcon,
  CalculatorIcon,
  BanknotesIcon,
  WrenchScrewdriverIcon,
  XMarkIcon,
  HomeModernIcon,
  ShareIcon,
} from "@heroicons/react/24/outline";

import AddressAutocomplete from "../components/AddressAutocomplete";
import MarketPositioningGuide from "../components/MarketPositioningGuide"; // ← NEW

const BLUE = "#1E40AF";   // Professional deep blue
const GREEN = "#059669";  // Elegant emerald green
const GOLD = "#D97706";   // Accent

function cx(...c: (string | false | null | undefined)[]) { return c.filter(Boolean).join(" "); }
const fmtMoney = (n: number) => n.toLocaleString("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 });
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

/* ----- Kill switch for portal suggestions (Mapbox/Maplibre) ----- */
const KILL_ID = "kill-geocoder-style";
function installKillSwitch() {
  if (document.getElementById(KILL_ID)) return;
  const style = document.createElement("style");
  style.id = KILL_ID;
  style.textContent = `
    .mapboxgl-ctrl-geocoder--suggestions,
    .maplibregl-ctrl-geocoder--suggestions,
    .suggestions { display: none !important; visibility: hidden !important; pointer-events: none !important; }
  `;
  document.head.appendChild(style);
}
function removeKillSwitch() { document.getElementById(KILL_ID)?.remove(); }

export default function SellerInsights() {
  const nav = useNavigate();

  // ----- Form state
  const [addr, setAddr] = React.useState("");
  const [coords, setCoords] = React.useState<{ lon: number; lat: number } | null>(null);
  const [isAddressCollapsed, setIsAddressCollapsed] = React.useState(false);
  const [isAcOpen, setIsAcOpen] = React.useState(false);

  const [beds, setBeds] = React.useState<number | "">("");
  const [baths, setBaths] = React.useState<number | "">("");
  const [sqft, setSqft] = React.useState<number | "">("");
  const [year, setYear] = React.useState<number | "">("");
  const [listPrice, setListPrice] = React.useState<number | "">("");
  const [mortgage, setMortgage] = React.useState<number | "">("");
  const [agentPct, setAgentPct] = React.useState<number>(5);
  const [otherCosts, setOtherCosts] = React.useState<number>(8000);
  const [renoBudget, setRenoBudget] = React.useState<number>(15000);
  const [renoUplift, setRenoUplift] = React.useState<number>(2.5);
  const [daysHorizon, setDaysHorizon] = React.useState<number>(30);

  // ----- AI output
  const [aiText, setAiText] = React.useState<string>("");
  const [loadingAI, setLoadingAI] = React.useState(false);
  const canGenerate = addr.trim().length > 4 && !!listPrice && !!sqft;

  const lastSigRef = React.useRef<string>("");
  const addrWrapRef = React.useRef<HTMLDivElement | null>(null);

  // NEW: Guide modal state
  const [guideOpen, setGuideOpen] = React.useState(false);
  const [guideAnchor, setGuideAnchor] = React.useState<string | null>(null);

  // Collapse helpers
  const collapseAddressUI = React.useCallback(() => {
    setIsAddressCollapsed(true);
    setIsAcOpen(false);
    installKillSwitch();
  }, []);
  const reopenAddressUI = React.useCallback(() => {
    setIsAddressCollapsed(false);
    setTimeout(() => setIsAcOpen(true), 0);
    removeKillSwitch();
  }, []);

  // Outside click -> collapse
  React.useEffect(() => {
    if (!isAcOpen || isAddressCollapsed) return;
    const onDocClick = (e: MouseEvent) => {
      const w = addrWrapRef.current;
      const t = e.target as Node;
      if (w && !w.contains(t)) collapseAddressUI();
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [isAcOpen, isAddressCollapsed, collapseAddressUI]);

  // ESC -> collapse
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isAddressCollapsed) collapseAddressUI();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isAddressCollapsed, collapseAddressUI]);

  React.useEffect(() => () => removeKillSwitch(), []);

  // Geocoder pick
  const handleAddressPick = (feat: any) => {
    setAddr(feat.place_name);
    setCoords({ lon: feat.center[0], lat: feat.center[1] });
    collapseAddressUI();
  };

  /* ----- Client-side AI narrative builder (fallback) ----- */
  function buildLocalAIStrategy(): string {
    const price = Number(listPrice) || 0;
    const payoff = Number(mortgage) || 0;
    const fees = (Number(agentPct) / 100) * price + (Number(otherCosts) || 0);
    const netProceeds = Math.max(0, price - payoff - fees);
    const uplift = Number(renoUplift) || 0;
    const valueAdd = Math.max(0, Math.round(price * (uplift / 100)));
    const roi = Number(renoBudget) > 0 ? Math.round(((valueAdd - Number(renoBudget)) / Number(renoBudget)) * 100) : 0;
    const dom = clamp(Math.round(35 - (price ? Math.log10(price) * 4 : 0) - uplift / 2), 5, 60);
    const domHi = dom + 6;

    const tag = [
      beds ? `${beds} bed` : null,
      baths ? `${baths} bath` : null,
      sqft ? `${(sqft as number).toLocaleString?.() || sqft} sqft` : null,
      year ? `built ${year}` : null,
    ].filter(Boolean).join(" · ");

    const where = addr || "Subject Property (BC)";
    const horizon = Number(daysHorizon) || 30;
    const neighborhood = where.split(",")[1]?.trim() || "this desirable neighborhood";

    return [
      `# Seller Strategy Report`,
      `**Address:** ${where}`,
      tag && `**Snapshot:** ${tag}`,
      `**Generated:** ${new Date().toLocaleDateString("en-CA", { year: "numeric", month: "long", day: "numeric" })}`,
      "",
      `## Market Positioning`,
      `• **Optimal List Price:** ${fmtMoney(price)}`,
      `• **Expected Days on Market:** ${dom}–${domHi} days`,
      `• **Competitive Positioning:** ${price > 1000000 ? "Premium" : "Mid-Market"} segment`,
      "",
      `## Financial Summary`,
      `• **Gross Proceeds:** ${fmtMoney(price)}`,
      `• **Total Fees (incl. commission):** ${fmtMoney(fees)}`,
      `• **Mortgage Payoff:** ${fmtMoney(payoff)}`,
      `• **Estimated Net to Seller:** ${fmtMoney(netProceeds)}`,
      "",
      `## Target Buyer Profile`,
      `• **Primary Segment:** ${beds && (beds as number) >= 4 ? "Growing Families" : "Young Professionals/Couples"}`,
      `• **Key Motivators:** ${neighborhood} location, modern amenities, ${year && (year as number) > 2010 ? "energy efficiency" : "character & potential"}`,
      "",
      `## 30-Day Launch Plan`,
      `• **Week 1:** Staging consult; pro photos/video; floor plan.`,
      `• **Week 2:** Go live Thu AM; social + broker preview.`,
      `• **Week 3:** Opens + private showings; follow-ups & adjust if needed.`,
      "",
      `## Value Enhancement`,
      `• **Recommended Budget:** ${fmtMoney(Number(renoBudget) || 0)}`,
      `• **Expected Uplift:** ${uplift}% (${fmtMoney(valueAdd)})`,
      `• **Projected ROI:** ${roi}%`,
      "",
      `## Narrative`,
      `“${beds ? beds + "-bedroom" : "Spacious"} ${sqft ? sqft + " sqft" : ""} home in ${neighborhood}${year ? " (built " + year + ")" : ""}. Thoughtful updates, everyday convenience, and strong value in today’s market.”`,
      "",
      `## Risks & Mitigation`,
      `• Re-price 2–3% if <15 qualified showings in 10 days.`,
      `• Encourage pre-inspection; cap inspection credits in counters.`,
      "",
      `## Next Steps (≤ ${horizon} days)`,
      `1) Confirm prep list. 2) Book media. 3) Thursday launch. 4) Review offers around ${fmtMoney(price)} ± 2%.`,
    ].filter(Boolean).join("\n");
  }

  /* ----- Generate AI Strategy (server first, fallback local) ----- */
  async function generateAI() {
    setLoadingAI(true);
    setAiText("");

    const local = buildLocalAIStrategy();

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);

    try {
      const payload = {
        address: addr, coords, beds, baths, sqft, year,
        listPrice: Number(listPrice) || 0,
        horizonDays: Number(daysHorizon) || 30,
        renoBudget: Number(renoBudget) || 0,
        renoUpliftPct: Number(renoUplift) || 0,
      };

      const res = await fetch("/api/ai/sell-strategy", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload), signal: controller.signal,
      });

      clearTimeout(timeout);
      if (res.ok) {
        const data = await res.json();
        setAiText((data && (data.summary || data.text)) || local);
      } else {
        setAiText(local);
      }
    } catch {
      clearTimeout(timeout);
      setAiText(local);
    } finally {
      setLoadingAI(false);
    }
  }

  /* ----- Auto-generate when ready (debounced) ----- */
  React.useEffect(() => {
    if (!canGenerate) return;
    const sig = JSON.stringify({ addr, sqft, listPrice, beds, baths, year, renoBudget, renoUplift, daysHorizon, agentPct, otherCosts, mortgage });
    if (sig === lastSigRef.current) return;
    const t = setTimeout(() => { lastSigRef.current = sig; generateAI(); }, 600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canGenerate, addr, sqft, listPrice, beds, baths, year, renoBudget, renoUplift, daysHorizon, agentPct, otherCosts, mortgage]);

  /* ----- Share like PropertyDetail.tsx ----- */
  function shareReport() {
    const title = addr || "Seller Strategy Report";
    const text = `${fmtMoney(Number(listPrice) || 0)} • ${(sqft || "—")} sqft • ${beds || "—"} bd · ${baths || "—"} ba`;
    const url = window.location.href;
    const ns: any = navigator;
    if (ns && typeof ns.share === "function") {
      ns.share({ title, url, text }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url).then(() => { alert("Link copied to clipboard"); }).catch(() => {});
    }
  }

  // Build TOC from headings in aiText (## ...)
  const toc = React.useMemo(() => {
    return aiText
      .split("\n")
      .filter((l) => l.startsWith("## "))
      .map((h) => {
        const label = h.replace(/^##\s+/, "").trim();
        const id = label.toLowerCase().replace(/[^a-z0-9]+/g, "-");
        return { id, label };
      });
  }, [aiText]);

  // open guide modal at an anchor id
  function openGuide(atId: string) {
    setGuideAnchor(atId);
    setGuideOpen(true);
    // Give modal time to mount, then jump to anchor inside it.
    setTimeout(() => {
      const target = document.getElementById(atId);
      if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  }

  // Inject IDs & align bullets when rendering
  function renderReportLines(text: string) {
    return text.split("\n").map((line, index) => {
      if (line.startsWith("# ")) return (<h1 key={index} className="text-2xl font-extrabold text-slate-900 mb-2">{line.replace("# ", "")}</h1>);
      if (line.startsWith("## ")) {
        const label = line.replace("## ", "").trim();
        const id = label.toLowerCase().replace(/[^a-z0-9]+/g, "-");
        return (<h2 id={id} key={index} className="text-xl font-bold text-slate-900 mt-6 mb-3 border-b pb-2">{label}</h2>);
      }
      if (line.startsWith("• **")) {
        const parts = line.split("**");
        return (
          <div key={index} className="flex items-start gap-2 mb-2">
            <span className="text-green-600 mt-1">•</span>
            <span className="text-slate-700 leading-relaxed">
              <strong>{parts[1]}</strong> {parts[2]}
            </span>
          </div>
        );
      }
      if (line.startsWith("• ")) {
        return (<p key={index} className="pl-5 relative text-slate-700 leading-relaxed"><span className="absolute left-0">•</span> {line.replace(/^•\s+/, "")}</p>);
      }
      if (line.startsWith("1) ") || /^\d+\)/.test(line)) return <p key={index} className="text-slate-700 leading-relaxed">{line}</p>;
      if (line.trim() === "") return <br key={index} />;
      if (line.startsWith("---")) return <hr key={index} className="my-6 border-slate-200" />;
      return <p key={index} className="text-slate-700 leading-relaxed">{line}</p>;
    });
  }

  return (
    <main className="font-sans min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 text-slate-900" style={{ marginTop: "calc(var(--app-header-h, 0px) * -1)" }}>
      {/* Header */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 pt-6 sm:pt-8 pb-4 sm:pb-6" style={{ paddingTop: "var(--app-header-h, 0px)" }}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6 mb-4">
          <div className="min-w-0">
            <h1 className="text-2xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-900 to-green-800 bg-clip-text text-transparent">
              Property Intelligence Studio
            </h1>
            <p className="mt-2 text-base md:text-lg text-slate-600 max-w-2xl">
              Advanced AI-powered selling strategy platform. Get instant market insights,
              personalized recommendations, and professional reports.
            </p>
          </div>
          <div className="flex flex-col xs:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
            <button
              onClick={() => window.print()}
              className="inline-flex justify-center items-center gap-2 rounded-xl border-2 px-4 py-3 text-sm font-semibold transition-all hover:shadow-lg w-full sm:w-auto"
              style={{ borderColor: BLUE, color: BLUE, background: "white" }}
              title="Export PDF"
            >
              <ArrowDownTrayIcon className="h-5 w-5" /> Export PDF
            </button>
            <button
              onClick={shareReport}
              className="inline-flex justify-center items-center gap-2 rounded-xl border-2 px-4 py-3 text-sm font-semibold transition-all hover:shadow-lg w-full sm:w-auto"
              style={{ borderColor: GREEN, color: GREEN, background: "white" }}
              title="Share Report"
            >
              <ShareIcon className="h-5 w-5" /> Share Report
            </button>
          </div>
        </div>
      </section>

      {/* Main Grid */}
      <section className="mx-auto max-w-7xl grid lg:grid-cols-12 gap-6 px-4 sm:px-6 pb-16">
        {/* Left: Inputs */}
        <div className="lg:col-span-5 space-y-6">
          <Card title="Property Details" icon={<HomeModernIcon className="h-5 w-5" style={{ color: BLUE }} />} gradient="from-blue-50 to-indigo-50">
            <div className="space-y-4">
              <label className="grid gap-2 text-sm">
                <span className="font-semibold text-slate-700 flex items-center gap-2">
                  Property Address <span className="text-xs font-normal text-slate-500">(Required)</span>
                </span>

                {!isAddressCollapsed && (
                  <div ref={addrWrapRef} className={cx("address-ac-light relative", isAcOpen && "ac-open")}>
                    {isAcOpen && (
                      <button
                        type="button"
                        onClick={collapseAddressUI}
                        className="absolute -top-2 right-0 z-[100000] inline-flex items-center gap-1 rounded-full border bg-white px-3 py-1 text-xs font-semibold shadow-lg"
                        style={{ borderColor: BLUE, color: BLUE }}
                        title="Close suggestions (Esc)"
                      >
                        <XMarkIcon className="h-3.5 w-3.5" /> Close
                      </button>
                    )}

                    <AddressAutocomplete
                      key="open"
                      value={addr}
                      onChange={(v) => {
                        setAddr(v);
                        if (coords) setCoords(null);
                        const open = !!v;
                        setIsAcOpen(open);
                        if (!open) installKillSwitch(); else removeKillSwitch();
                      }}
                      onPick={handleAddressPick}
                      onFocus={() => { setIsAcOpen(true); removeKillSwitch(); }}
                      className="h-12 w-full rounded-xl border-2 px-4 text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter full address or MLS® number..."
                    />
                  </div>
                )}

                {addr && coords && (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl border-2 bg-white px-4 py-3 border-green-200">
                    <span className="truncate font-medium text-slate-800">{addr}</span>
                    <button onClick={reopenAddressUI} className="text-sm font-semibold px-3 py-1 rounded-lg hover:bg-slate-50 self-start sm:self-auto" style={{ color: BLUE }} title="Edit address">Edit</button>
                  </div>
                )}

                {addr && !coords && (<span className="text-xs text-slate-500">💡 Pick a suggestion for precise location data</span>)}
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Bedrooms" type="number" value={beds} onChange={setBeds} placeholder="3" />
                <Input label="Bathrooms" type="number" value={baths} onChange={setBaths} placeholder="2" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Square Footage" type="number" value={sqft} onChange={setSqft} placeholder="1800" required />
                <Input label="Year Built" type="number" value={year} onChange={setYear} placeholder="1998" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Target List Price" type="number" value={listPrice} onChange={setListPrice} placeholder="850000" required />
                <Input label="Days on Market Target" type="number" value={daysHorizon} onChange={setDaysHorizon} placeholder="30" />
              </div>
            </div>
          </Card>

          <Card title="Financial Analysis" icon={<BanknotesIcon className="h-5 w-5" style={{ color: GREEN }} />} gradient="from-green-50 to-emerald-50">
            <div className="space-y-4">
              <Input label="Mortgage Balance" type="number" value={mortgage} onChange={setMortgage} placeholder="350000" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Agent Commission %" type="number" value={agentPct} onChange={setAgentPct} placeholder="5" />
                <Input label="Other Costs" type="number" value={otherCosts} onChange={setOtherCosts} placeholder="8000" />
              </div>

              <div className="space-y-3 p-4 rounded-lg bg-white border-2 border-slate-100">
                <SummaryRow label="Total Estimated Fees" value={fmtMoney((Number(agentPct) / 100) * (Number(listPrice) || 0) + (Number(otherCosts) || 0))} />
                <div className="border-t border-slate-200 pt-3">
                  <SummaryRow
                    big
                    label="Estimated Net Proceeds"
                    value={fmtMoney(Math.max(0, (Number(listPrice) || 0) - (Number(mortgage) || 0) - ((Number(agentPct) / 100) * (Number(listPrice) || 0) + (Number(otherCosts) || 0))))}
                    valueColor={GREEN}
                  />
                </div>
              </div>
            </div>
          </Card>

          <Card title="Value Enhancement" icon={<WrenchScrewdriverIcon className="h-5 w-5" style={{ color: GOLD }} />} gradient="from-amber-50 to-orange-50">
            <div className="space-y-4">
              <Input label="Renovation Budget" type="number" value={renoBudget} onChange={setRenoBudget} placeholder="15000" />
              <Input label="Expected Value Uplift %" type="number" step="0.1" value={renoUplift} onChange={setRenoUplift} placeholder="2.5" />
              <div className="space-y-3 p-4 rounded-lg bg-white border-2 border-slate-100">
                <SummaryRow label="Estimated Value Add" value={`+${fmtMoney(Math.max(0, Math.round((Number(listPrice) || 0) * (Number(renoUplift) / 100))))}`} />
                <SummaryRow
                  label="Projected ROI"
                  value={`${
                    Number(renoBudget) > 0
                      ? Math.round(((Math.max(0, Math.round((Number(listPrice) || 0) * (Number(renoUplift) / 100))) - Number(renoBudget)) / Number(renoBudget)) * 100)
                      : 0
                  }%`}
                  valueColor={
                    Number(renoBudget) > 0 &&
                    ((Math.max(0, Math.round((Number(listPrice) || 0) * (Number(renoUplift) / 100))) - Number(renoBudget)) / Number(renoBudget)) * 100 > 0
                      ? GREEN
                      : "#DC2626"
                  }
                />
                <SummaryRow
                  label="Days on Market Impact"
                  value={`${
                    Math.max(5, Math.round(35 - ((Number(listPrice) || 0) ? Math.log10(Number(listPrice)) * 4 : 0) - Number(renoUplift) / 2))
                  }–${
                    Math.max(5, Math.round(35 - ((Number(listPrice) || 0) ? Math.log10(Number(listPrice)) * 4 : 0) - Number(renoUplift) / 2)) + 6
                  } days`}
                />
              </div>
            </div>
          </Card>
        </div>

        {/* Right: AI Strategy */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="h-fit" title="AI Strategy & Market Analysis" icon={<SparklesIcon className="h-5 w-5" style={{ color: BLUE }} />} gradient="from-slate-50 to-blue-50">
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row flex-wrap sm:items-center sm:justify-between gap-3 p-4 rounded-xl bg-gradient-to-r from-blue-500 to-green-500 text-white">
                <div>
                  <h3 className="font-bold text-lg">Ready for Strategic Insights</h3>
                  <p className="text-blue-100 text-sm">{canGenerate ? "Complete analysis available — Generate your personalized strategy" : "Fill required fields to unlock AI analysis"}</p>
                </div>
                <button
                  disabled={!canGenerate || loadingAI}
                  onClick={generateAI}
                  className="inline-flex justify-center items-center gap-2 rounded-xl px-6 py-3 font-bold text-white shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                  style={{ background: canGenerate && !loadingAI ? "linear-gradient(135deg, #1E40AF, #059669)" : "#94A3B8" }}
                >
                  {loadingAI ? <ArrowPathIcon className="h-5 w-5 animate-spin" /> : <SparklesIcon className="h-5 w-5" />}
                  {loadingAI ? "Generating Strategy..." : "Generate AI Strategy"}
                </button>
              </div>

              {aiText ? (
                <div
                  id="report-print"
                  className={cx(
                    "bg-white rounded-xl border-2 border-slate-200 p-4 sm:p-6",
                    // Remove fixed max height on mobile so content can expand naturally
                    "max-h-none sm:max-h-[600px] overflow-y-visible sm:overflow-y-auto"
                  )}
                >
                  {/* Contents (auto-built TOC) */}
                  {toc.length > 0 && (
                    <div className="mb-4 rounded-lg bg-slate-50 border p-4">
                      <div className="text-sm font-semibold text-slate-700 mb-2">Contents</div>
                      <ul className="text-sm grid sm:grid-cols-2 gap-x-8 gap-y-1">
                        {toc.map((t) => (
                          <li key={t.id}>
                            <button
                              type="button"
                              onClick={() => openGuide(t.id)}
                              className="text-blue-700 hover:underline"
                              title="Open detailed guide"
                            >
                              {t.label}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div className="prose prose-slate max-w-none">{renderReportLines(aiText)}</div>
                </div>
              ) : (
                <div className="bg-white rounded-xl border-2 border-dashed border-slate-300 p-10 sm:p-12 text-center">
                  <SparklesIcon className="h-12 w-12 mx-auto mb-4 text-slate-400" />
                  <h3 className="text-lg font-semibold text-slate-600 mb-2">Your AI Strategy Awaits</h3>
                  <p className="text-slate-500 max-w-md mx-auto">
                    Complete the property details to generate a concise, professional report ready for PDF export or sharing.
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* Guidance */}
          <Card className="md:col-span-3" title="How to fill for the best AI report" icon={<ClipboardDocumentIcon className="h-5 w-5" style={{ color: BLUE }} />} gradient="from-white to-white">
            <ol className="list-decimal pl-5 space-y-2 text-sm text-slate-700">
              <li><span className="font-semibold">Address / MLS:</span> start typing and <span className="font-semibold">click a suggestion</span> to lock geolocation (Esc or “Close” hides the dropdown).</li>
              <li><span className="font-semibold">SqFt & List Price:</span> with Address, these auto-generate the strategy.</li>
              <li><span className="font-semibold">Beds, Baths, Year:</span> optional but sharpens buyer profile & narrative.</li>
              <li><span className="font-semibold">Net proceeds:</span> add payoff, agent %, and other costs to see your estimated net.</li>
              <li><span className="font-semibold">Refresh levers:</span> set a light-reno budget & uplift % to see value-add & ROI.</li>
              <li><span className="font-semibold">Days Horizon:</span> how far the plan should run (default 30 days).</li>
            </ol>
          </Card>

          {/* Quick actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button onClick={() => nav("/whats-my-home-worth")} className="flex items-center gap-3 rounded-xl border-2 bg-white p-4 text-left transition-all hover:shadow-lg hover:scale-105" style={{ borderColor: BLUE }}>
              <CalculatorIcon className="h-6 w-6 flex-shrink-0" style={{ color: BLUE }} />
              <div>
                <div className="font-semibold text-slate-900">Quick Valuation</div>
                <div className="text-sm text-slate-600">Instant price estimate</div>
              </div>
            </button>

            <button onClick={() => nav("/agent/report-request")} className="flex items-center gap-3 rounded-xl border-2 bg-white p-4 text-left transition-all hover:shadow-lg hover:scale-105" style={{ borderColor: GREEN }}>
              <ClipboardDocumentIcon className="h-6 w-6 flex-shrink-0" style={{ color: GREEN }} />
              <div>
                <div className="font-semibold text-slate-900">Full CMA</div>
                <div className="text-sm text-slate-600">Detailed market analysis</div>
              </div>
            </button>

            <button onClick={() => window.print()} className="flex items-center gap-3 rounded-xl border-2 bg-white p-4 text-left transition-all hover:shadow-lg hover:scale-105" style={{ borderColor: GOLD }}>
              <ArrowDownTrayIcon className="h-6 w-6 flex-shrink-0" style={{ color: GOLD }} />
              <div>
                <div className="font-semibold text-slate-900">Export Report</div>
                <div className="text-sm text-slate-600">PDF & print version</div>
              </div>
            </button>
          </div>
        </div>
      </section>

      {/* GUIDE MODAL (no Router dependency) */}
      {guideOpen && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm">
          <div className="absolute inset-0 lg:inset-8 bg-white rounded-none lg:rounded-2xl overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <div className="font-bold text-slate-900">Market Positioning Guide</div>
              <div className="flex items-center gap-2">
                <a
                  href={`#${guideAnchor || ""}`}
                  onClick={(e) => e.preventDefault()}
                  className="text-sm text-slate-500 hidden sm:block"
                >
                  {guideAnchor ? `#${guideAnchor}` : ""}
                </a>
                <button
                  onClick={() => setGuideOpen(false)}
                  className="rounded-lg border px-3 py-1.5 text-sm hover:bg-slate-50"
                  title="Close"
                >
                  Close
                </button>
              </div>
            </div>
            <div className="h-[calc(100%-48px)] overflow-y-auto">
              {/* anchor passthrough: set an element with that id near top so initial scroll works */}
              {guideAnchor && <div id={guideAnchor} className="h-0" />}
              <MarketPositioningGuide />
            </div>
          </div>
        </div>
      )}

      {/* Styles */}
      <style>{`
        :root { --blue:${BLUE}; --green:${GREEN}; --gold:${GOLD}; }
        .font-sans { font-family: Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial; }
        .card { border: 1px solid #E5E7EB; background: #fff; border-radius: 1.5rem; box-shadow: 0 4px 24px rgba(2,6,23,.08); transition: box-shadow .2s, transform .2s; }
        .card:hover { box-shadow: 0 8px 40px rgba(2,6,23,.12); transform: translateY(-2px); }
        .address-ac-light input { background:#fff!important; color:#0f172a!important; border:2px solid #E5E7EB!important; border-radius:1rem!important; height:48px!important; padding:0 1rem!important; outline:none!important; font-size:15px!important; transition:all .2s!important; }
        .address-ac-light input::placeholder { color:#94A3B8!important; }
        .address-ac-light input:focus { border-color: var(--blue)!important; box-shadow: 0 0 0 4px rgba(30,64,175,.15)!important; }
        .address-ac-light.ac-open { padding-bottom: 12rem; }
        .address-ac-light .mapboxgl-ctrl-geocoder--suggestions, .address-ac-light .suggestions, .mapboxgl-ctrl-geocoder--suggestions, .suggestions {
          position:absolute!important; left:0!important; right:0!important; top:calc(100% + .5rem)!important; z-index:99999!important; background:#fff!important; color:#0f172a!important;
          border:2px solid #E5E7EB!important; border-radius:1rem!important; box-shadow:0 20px 50px rgba(2,6,23,.15)!important; max-height:50vh!important; overflow-y:auto!important; padding:.5rem!important;
        }
        .address-ac-light .mapboxgl-ctrl-geocoder--suggestion, .address-ac-light .suggestions > *, .mapboxgl-ctrl-geocoder--suggestion, .suggestions > * {
          background:transparent!important; color:#0f172a!important; padding:.75rem 1rem!important; border-radius:.75rem!important; margin:.125rem 0!important; cursor:pointer!important; transition:.2s!important;
        }
        .address-ac-light .mapboxgl-ctrl-geocoder--suggestion:hover, .address-ac-light .suggestions > *:hover, .mapboxgl-ctrl-geocoder--suggestion:hover, .suggestions > *:hover {
          background: rgba(30,64,175,.08)!important; transform: translateX(2px);
        }
        .address-ac-light .mapboxgl-ctrl-geocoder--suggestion.active, .address-ac-light .suggestions > *.active, .mapboxgl-ctrl-geocoder--suggestion.active, .suggestions > *.active { background: rgba(30,64,175,.12)!important; }
        #report-print .prose p { margin:.45rem 0; }
        #report-print .prose h1 { margin-bottom:.35rem; }
        #report-print .prose h2 { border-bottom:1px solid #e5e7eb; padding-bottom:.35rem; }
        @media print {
          header, nav, .card:has(.address-ac-light), .print-exclude, .grid > .lg\\:col-span-5, section[aria-label], .grid [role="region"] { display: none !important; }
          body * { visibility: hidden; }
          #report-print, #report-print * { visibility: visible; }
          #report-print { position: absolute; left: 0; right: 0; top: 0; margin: 0 24px; }
          @page { margin: 16mm; }
        }
      `}</style>
    </main>
  );
}

/* ---------- Card ---------- */
function Card({
  title, icon, children, className = "", gradient = "from-white to-white",
}: { title: string; icon?: React.ReactNode; children: React.ReactNode; className?: string; gradient?: string; }) {
  return (
    <section className={cx(`card p-5 sm:p-6 bg-gradient-to-br ${gradient}`, className)}>
      <div className="mb-4 flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl shadow-sm" style={{ border: "1px solid #E5E7EB", background: "white" }}>
          {icon}
        </div>
        <h2 className="text-lg sm:text-xl font-bold text-slate-900">{title}</h2>
      </div>
      {children}
    </section>
  );
}

/* ---------- Input ---------- */
function Input<T extends string | number | "">({
  label, value, onChange, type = "text", step, placeholder, required = false,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  type?: React.HTMLInputTypeAttribute;
  step?: number | string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="grid gap-2 text-sm">
      <span className="font-semibold text-slate-700">{label} {required && <span className="text-red-500">*</span>}</span>
      <input
        className="h-12 rounded-xl border-2 bg-white px-4 outline-none text-slate-900 placeholder-slate-400 transition-all focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        style={{ borderColor: "#E5E7EB" }}
        value={(value ?? "") as any}
        onChange={(e) =>
          onChange(type === "number" ? ((e.target.value === "" ? "" : (Number(e.target.value) as any)) as T) : (e.target.value as any))
        }
        onFocus={(e) => { e.currentTarget.style.borderColor = BLUE; e.currentTarget.style.boxShadow = `0 0 0 4px rgba(30, 64, 175, 0.15)`; }}
        onBlur={(e) => { e.currentTarget.style.borderColor = "#E5E7EB"; e.currentTarget.style.boxShadow = "none"; }}
        type={type}
        step={step}
        placeholder={placeholder}
        required={required}
        inputMode={type === "number" ? "numeric" : undefined}
      />
    </label>
  );
}

/* ---------- Summary Row ---------- */
function SummaryRow({ label, value, big = false, valueColor }: { label: string; value: string; big?: boolean; valueColor?: string; }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <span className={cx("font-bold text-slate-900", big ? "text-xl" : "text-base")} style={valueColor ? { color: valueColor } : {}}>
        {value}
      </span>
    </div>
  );
}
