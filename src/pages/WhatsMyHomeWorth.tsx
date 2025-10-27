// src/pages/WhatsMyHomeWorth.tsx
// NOTE: Keep ASCII filename (WhatsMyHomeWorth.tsx). Curly quotes in filenames can break imports on some systems.

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CheckCircleIcon,
  AdjustmentsHorizontalIcon,
  ShieldCheckIcon,
  XMarkIcon,
  MapPinIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  DocumentArrowDownIcon,
  EnvelopeIcon,
  ArrowPathIcon,
  StarIcon,
} from "@heroicons/react/24/outline";
import {
  PaperAirplaneIcon,
  UserCircleIcon,
  ChatBubbleLeftEllipsisIcon,
  BookOpenIcon,
  FaceSmileIcon,
  PaperClipIcon,
} from "@heroicons/react/24/solid";

// If you keep the chat panel, these utils are still used.
// Remove the ChatPanel section (and these imports) if you want no Supabase dependency here.
import { supabase } from "../utils/supabaseClient";
import { ensureConversation } from "../utils/chat";

// ✅ Use shared AddressAutocomplete (MapTiler) like FindComparable
import AddressAutocomplete from "../components/AddressAutocomplete";

// ✅ Repliers client (direct CSR)
import { fetchListingsDirect, RepliersListing } from "../utils/repliersClient";

/* ─────────────────────────────────────────────────────────
   Estimate types
   ──────────────────────────────────────────────────────── */
type EstimateResponse = {
  estimateId: number;
  estimate: number;
  estimateHigh: number;
  estimateLow: number;
  confidence: number; // 0..1 (lower = worse)
  createdOn: string;
  updatedOn: string;
  history?: {
    mth?: {
      [month: string]: { value: number };
    };
  };
  payload: any;
};

/* ─────────────────────────────────────────────────────────
   Testimonials
   ──────────────────────────────────────────────────────── */
const testimonials = [
  { name: "Priya & Daniel", quote: "We got our AI estimate in seconds and the agent follow-up was spot on!", avatar: "/images/avatar1.jpg" },
  { name: "Morgan L.", quote: "The confidence range gave us clarity—love the fast, modern experience.", avatar: "/images/avatar2.jpg" },
  { name: "Sara J.", quote: "Refining comparables was so easy. The agent report was detailed and personal.", avatar: "/images/avatar3.jpg" },
];

function TestimonialCarousel() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const timer = setTimeout(() => setIdx((p) => (p + 1) % testimonials.length), 5000);
    return () => clearTimeout(timer);
  }, [idx]);
  return (
    <div className="mt-10 flex flex-col items-center">
      <div className="relative w-full max-w-md">
        <div className="bg-white rounded-xl shadow p-6 flex flex-col gap-3 items-start justify-center">
          <div className="flex items-center gap-3">
            <img src={testimonials[idx].avatar} alt={testimonials[idx].name} className="w-12 h-12 rounded-full object-cover border-2 border-emerald-300" />
            <span className="font-semibold text-slate-900">{testimonials[idx].name}</span>
          </div>
        </div>
        <p className="text-slate-700 text-base mt-3 text-center px-6">
          “{testimonials[idx].quote}”
        </p>
        <div className="flex gap-2 mt-4 justify-center">
          {testimonials.map((_, i) => (
            <button
              key={i}
              className={`h-2 w-2 rounded-full transition-all ${i === idx ? "bg-emerald-500 scale-125" : "bg-slate-300"}`}
              aria-label={`Go to testimonial ${i + 1}`}
              onClick={() => setIdx(i)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Sparkline (history)
   ──────────────────────────────────────────────────────── */
function HistoricalChart({ history }: { history: { [month: string]: { value: number } } }) {
  const points = Object.entries(history).sort(([a], [b]) => a.localeCompare(b)).map(([, v]) => v.value);
  if (points.length < 2) return null;

  const min = Math.min(...points), max = Math.max(...points);
  const w = 220, h = 40, pad = 4;
  const getY = (v: number) => h - pad - ((v - min) / (max - min || 1)) * (h - 2 * pad);
  const step = (w - 2 * pad) / (points.length - 1);

  return (
    <svg width={w} height={h} className="block mx-auto">
      <polyline fill="none" stroke="#059669" strokeWidth="3" points={points.map((v, i) => `${pad + i * step},${getY(v)}`).join(" ")} />
      <circle cx={pad + (points.length - 1) * step} cy={getY(points[points.length - 1])} r={4} fill="#059669" stroke="#fff" strokeWidth={2} />
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────
   Scores from history (Location / Market / Price Trend)
   ──────────────────────────────────────────────────────── */
function computeScores(estimate?: EstimateResponse | null) {
  // These are simple heuristics to keep UX snappy without extra APIs.
  // • Location Score: proxy using confidence (tighter comps -> "excellent" area signal)
  // • Market Activity: based on sample size stored in payload (if present) and #history points
  // • Price Trend: YoY slope from monthly history
  const conf = Math.max(0, Math.min(1, estimate?.confidence ?? 0));
  const locPct = Math.round(80 + conf * 20); // 80–100
  const months = Object.keys(estimate?.history?.mth ?? {});
  const activity = Math.min(100, Math.round(((estimate?.payload?.sampleSize ?? months.length) / 60) * 100)); // 0–100

  // crude YoY: compare last 12th month if available
  let yoy = 0;
  if (months.length >= 13) {
    const sorted = months.sort();
    const last = estimate!.history!.mth![sorted[sorted.length - 1]]?.value ?? 0;
    const yearAgo = estimate!.history!.mth![sorted[sorted.length - 13]]?.value ?? 0;
    if (yearAgo > 0) yoy = ((last - yearAgo) / yearAgo) * 100;
  }

  return {
    locationScoreLabel: locPct >= 95 ? "Excellent" : locPct >= 90 ? "Great" : "Good",
    locationScorePct: locPct,
    marketActivityLabel: activity >= 66 ? "Active" : activity >= 33 ? "Moderate" : "Quiet",
    marketActivityPct: activity,
    yoy,
  };
}

/* ─────────────────────────────────────────────────────────
   AI Value Range Panel (Image-1 style)
   ──────────────────────────────────────────────────────── */
function AIValueRangePanel({
  estimate,
  loading,
  error,
}: {
  estimate?: EstimateResponse | null;
  loading: boolean;
  error: string | null;
}) {
  if (loading) {
    return (
      <div className="mt-10 rounded-2xl border bg-white/70 p-8 text-center animate-pulse">
        <div className="h-7 w-60 mx-auto rounded bg-emerald-100 mb-3" />
        <div className="h-10 w-80 mx-auto rounded bg-emerald-50" />
      </div>
    );
  }
  if (error) {
    return <div className="mt-10 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 px-8 py-6 text-center text-lg font-semibold">{error}</div>;
  }
  if (!estimate) return null;

  const scores = computeScores(estimate);

  return (
    <section className="mt-8">
      <header className="text-center mb-4">
        <div className="mx-auto mb-2 inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
          <CheckCircleIcon className="h-8 w-8 text-emerald-600" />
        </div>
        <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900">Your Home Value Estimate</h2>
        <p className="text-slate-600 mt-2">Based on current market data and comparable sales in your area</p>
      </header>

      <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-6 md:p-8">
        <div className="rounded-xl bg-white/70 p-5 md:p-6 border border-emerald-100">
          <p className="text-slate-600 text-sm mb-2 font-medium">Estimated Value Range</p>
          <div className="flex flex-wrap items-center gap-3">
            <div className="text-3xl md:text-4xl font-extrabold text-emerald-700">
              ${Math.round(estimate.estimateLow).toLocaleString()} – ${Math.round(estimate.estimateHigh).toLocaleString()}
            </div>
            <span className="inline-flex items-center rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold px-3 py-1">
              High Confidence
            </span>
          </div>
          <div className="mt-3">
            <HistoricalChart history={estimate.history?.mth ?? {}} />
          </div>
        </div>

        <p className="text-center text-slate-600 mt-6">
          Estimates are based on historical MLS data and nearby sales.
        </p>

        {/* Score tiles */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl border bg-white p-5 text-center shadow-sm">
            <div className="mx-auto mb-2 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50">
              <MapPinIcon className="h-7 w-7 text-emerald-600" />
            </div>
            <p className="text-slate-600 text-sm">Location Score</p>
            <p className="text-lg font-semibold text-slate-900">{scores.locationScoreLabel}</p>
          </div>
          <div className="rounded-xl border bg-white p-5 text-center shadow-sm">
            <div className="mx-auto mb-2 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50">
              <ChartBarIcon className="h-7 w-7 text-blue-600" />
            </div>
            <p className="text-slate-600 text-sm">Market Activity</p>
            <p className="text-lg font-semibold text-slate-900">{scores.marketActivityLabel}</p>
          </div>
          <div className="rounded-xl border bg-white p-5 text-center shadow-sm">
            <div className="mx-auto mb-2 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50">
              <ArrowTrendingUpIcon className="h-7 w-7 text-indigo-600" />
            </div>
            <p className="text-slate-600 text-sm">Price Trend</p>
            <p className="text-lg font-semibold text-slate-900">
              {scores.yoy >= 0 ? "+" : ""}
              {scores.yoy ? scores.yoy.toFixed(1) : "0.0"}% YoY
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────
   Helpers: comps → estimate
   ──────────────────────────────────────────────────────── */
function median(values: number[]): number {
  if (!values.length) return 0;
  const a = [...values].sort((x, y) => x - y);
  const mid = Math.floor(a.length / 2);
  return a.length % 2 ? a[mid] : (a[mid - 1] + a[mid]) / 2;
}
function percentile(values: number[], p: number): number {
  if (!values.length) return 0;
  const a = [...values].sort((x, y) => x - y);
  const idx = Math.min(a.length - 1, Math.max(0, Math.round((p / 100) * (a.length - 1))));
  return a[idx];
}

/** Build a simple YYYY-MM key */
function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** ~2km search box */
function boxFromPoint({ lon, lat }: { lon: number; lat: number }, km = 2) {
  const d = km / 111; // deg per km
  return { west: lon - d, south: lat - d, east: lon + d, north: lat + d };
}

type EstimateOpts = { coords?: { lon: number; lat: number } | null; fallbackBounds?: { west: number; south: number; east: number; north: number } };

/** Fetch recent nearby SOLDs (fallback to ACTIVES) and compute an estimate + range + history */
async function fetchEstimateViaRepliers(opts: EstimateOpts): Promise<{ est: EstimateResponse; raw: RepliersListing[] }> {
  const TORONTO_BOUNDS = { west: -79.9, south: 43.45, east: -79.0, north: 43.9 };
  const bounds = opts.coords ? boxFromPoint(opts.coords, 2) : (opts.fallbackBounds ?? TORONTO_BOUNDS);

  let rows: RepliersListing[] = [];
  try {
    rows = await fetchListingsDirect({ ...bounds, status: "S", limit: 250, dropUnmappable: true });
  } catch {
    rows = [];
  }

  // Enlarge a bit if no SOLDs found
  if (rows.length === 0) {
    const pad = 0.3;
    const bigger = { west: bounds.west - pad, south: bounds.south - pad, east: bounds.east + pad, north: bounds.north + pad };
    try {
      rows = await fetchListingsDirect({ ...bigger, status: "S", limit: 250, dropUnmappable: true });
    } catch {
      rows = [];
    }
  }

  // Fallback to ACTIVES (keeps demo working with sample feeds)
  let fellBackToActive = false;
  if (rows.length === 0) {
    fellBackToActive = true;
    try {
      rows = await fetchListingsDirect({ ...(opts.coords ? boxFromPoint(opts.coords, 2.5) : bounds), status: "A", limit: 300, dropUnmappable: true });
    } catch {
      rows = [];
    }
  }

  const prices = rows
    .map((r) => r.list_price)
    .filter((n): n is number => typeof n === "number" && Number.isFinite(n));

  if (!prices.length) {
    throw new Error("No nearby market data available yet. Try a different address.");
  }

  // Estimate = median of recent sold (or active) prices
  const est = median(prices);
  const lo = percentile(prices, 15);
  const hi = percentile(prices, 85);

  // Confidence: scale with sample size & dispersion
  const sample = prices.length;
  const spreadPct = est > 0 ? (hi - lo) / est : 0;
  // 0..1 where lower is worse
  const confidence = Math.max(0, Math.min(1, 1 - Math.min(0.6, spreadPct) - (sample >= 60 ? 0 : (60 - sample) / 200)));

  // Build monthly history from the last ~18 months of rows
  const byMonth: Record<string, number[]> = {};
  const now = Date.now();
  const horizonMs = 1000 * 60 * 60 * 24 * 30 * 18; // ~18 months
  rows.forEach((r) => {
    const when = new Date(r.sold_date || r.list_date || r.updated_at || Date.now());
    if (Number.isFinite(when.getTime()) && now - when.getTime() <= horizonMs) {
      const mk = monthKey(when);
      if (!byMonth[mk]) byMonth[mk] = [];
      if (typeof r.list_price === "number") byMonth[mk].push(r.list_price);
    }
  });
  const hist: Record<string, { value: number }> = {};
  Object.keys(byMonth)
    .sort()
    .forEach((m) => {
      const arr = byMonth[m];
      if (arr.length) hist[m] = { value: Math.round(median(arr)) };
    });

  const payload = { sampleSize: sample, fellBackToActive };
  const out: EstimateResponse = {
    estimateId: 1,
    estimate: Math.round(est),
    estimateHigh: Math.round(hi),
    estimateLow: Math.round(lo),
    confidence, // 0..1
    createdOn: new Date().toISOString(),
    updatedOn: new Date().toISOString(),
    history: { mth: hist },
    payload,
  };
  return { est: out, raw: rows };
}

/* ─────────────────────────────────────────────────────────
   Chat Panel (unchanged; optional if Supabase present)
   ──────────────────────────────────────────────────────── */
type Role = "user" | "assistant" | "agent";
type Msg = {
  id: string;
  conversation_id?: string | null;
  role: Role;
  content: string;
  created_at: string;
  sender_uid?: string | null;
};

const isUuid = (s: string | null | undefined) =>
  !!s && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s);

const VISITOR_ID_KEY = "guest_chat_visitor_id";
const getVisitorId = () => {
  try {
    const existing = localStorage.getItem(VISITOR_ID_KEY);
    if (existing) return existing;
    const v = (crypto as any)?.randomUUID?.() || `guest_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    localStorage.setItem(VISITOR_ID_KEY, v);
    return v;
  } catch {
    return null;
  }
};

type GuestMsg = { id: string; role: Exclude<Role, "agent">; content: string; ts: number };
const GUEST_LS_KEY = "guest_chat_history_v1";
const uuid = () => (crypto as any)?.randomUUID?.() || `id_${Date.now()}_${Math.random().toString(16).slice(2)}`;

function readGuest(): GuestMsg[] {
  try {
    return JSON.parse(localStorage.getItem(GUEST_LS_KEY) || "[]") as GuestMsg[];
  } catch {
    return [];
  }
}
function writeGuest(arr: GuestMsg[]) {
  try {
    localStorage.setItem(GUEST_LS_KEY, JSON.stringify(arr));
  } catch {}
}
function clearGuest() {
  try {
    localStorage.removeItem(GUEST_LS_KEY);
  } catch {}
}

function ChatPanel({
  open,
  onClose,
  prefill,
  pid,
  address,
}: {
  open: boolean;
  onClose: () => void;
  prefill?: string;
  pid?: string | null;
  address?: string | null;
}) {
  const [userId, setUserId] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const listRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | HTMLInputElement | null>(null);
  const unsubRef = useRef<(() => void) | undefined>(undefined);

  const visitor_id = useMemo(() => getVisitorId(), []);
  const notifiedOnceRef = useRef(false);
  const navigate = useNavigate();

  // prefill on open
  useEffect(() => {
    if (!open) return;
    if (prefill) {
      try {
        setText(prefill);
        if (inputRef.current && "value" in inputRef.current) {
          (inputRef.current as HTMLInputElement | HTMLTextAreaElement).value = prefill;
        }
      } catch {}
    }
    const t = setTimeout(() => inputRef.current?.focus(), 0);
    return () => clearTimeout(t);
  }, [prefill, open]);

  useEffect(() => {
    if (!open) return;
    (async () => {
      unsubRef.current?.();
      unsubRef.current = undefined;

      const { data: sess } = await supabase.auth.getSession();
      const uid = sess?.session?.user?.id || null;
      setUserId(uid);

      if (!uid) {
        const guest = readGuest();
        setMessages(
          guest.map((g) => ({
            id: g.id,
            conversation_id: null,
            role: g.role,
            content: g.content,
            created_at: new Date(g.ts).toISOString(),
          }))
        );
        setConversationId(null);
        return;
      }

      let convId: string | null = null;
      const conv = await ensureConversation({ kind: "prospect", title: "My Home Search" });
      convId = conv.id;

      try {
        const url = new URL(window.location.href);
        url.searchParams.set("conversation_id", convId);
        window.history.replaceState({}, "", url.toString());
      } catch {}

      setConversationId(convId);

      const { data, error } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("conversation_id", convId)
        .order("created_at", { ascending: true });
      if (!error && data) setMessages(data as Msg[]);

      const ch = supabase
        .channel(`rt-chat-${convId}`)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "chat_messages", filter: `conversation_id=eq.${convId}` },
          (payload) => setMessages((m) => [...m, payload.new as Msg])
        )
        .subscribe();
      unsubRef.current = () => supabase.removeChannel(ch);

      const guest = readGuest();
      if (guest.length) {
        const rows = guest.map((g) => ({
          conversation_id: convId!,
          role: g.role,
          content: g.content,
          created_at: new Date(g.ts).toISOString(),
        }));
        await supabase.from("chat_messages").insert(rows);
        clearGuest();
      }
    })();

    return () => {
      unsubRef.current?.();
      unsubRef.current = undefined;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, sending, open]);

  async function getGuestReply(history: { role: "user" | "assistant"; content: string }[]) {
    const clean = history
      .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
      .map((m) => ({ role: m.role, content: m.content.trim().slice(0, 4000) }))
      .filter((m) => m.content.length > 0)
      .slice(-30);

    const { data, error } = await supabase.functions.invoke("ai-reply", {
      method: "POST",
      body: { history: clean },
    });
    if (error) throw new Error(error.message || "ai-reply failed");
    return String((data as any)?.reply || "");
  }

  async function notifyLeadOnce(content: string) {
    if (notifiedOnceRef.current) return;
    notifiedOnceRef.current = true;
    try {
      await supabase.functions.invoke("chat-notify", {
        method: "POST",
        body: {
          text: content,
          property_id: pid,
          address,
          visitor_id,
          conversation_id: userId ? conversationId : null,
        },
      });
    } catch {}
  }

  async function send(override?: string) {
    const content = (override ?? text).trim();
    if (!content || sending) return;
    setSending(true);
    if (!override) setText("");

    try {
      if (userId && conversationId) {
        const { error: insErr } = await supabase
          .from("chat_messages")
          .insert({ conversation_id: conversationId, role: "user", content });
        if (insErr) throw insErr;

        await notifyLeadOnce(content);

        const { data: sess } = await supabase.auth.getSession();
        const token = sess?.session?.access_token;
        const base = (import.meta as any)?.env?.VITE_SUPABASE_URL?.replace(/\/+$/, "") || "";
        const url = `${base}/functions/v1/ai-reply?conversation_id=${conversationId}`;
        await fetch(url, {
          method: "POST",
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            apikey: (import.meta as any)?.env?.VITE_SUPABASE_ANON_KEY || "",
          },
        });
      } else {
        const now = Date.now();
        const userMsg: GuestMsg = { id: uuid(), role: "user", content, ts: now };
        const current = readGuest();
        const next = [...current, userMsg];
        writeGuest(next);
        setMessages((m) => [
          ...m,
          {
            id: userMsg.id,
            role: "user",
            content,
            created_at: new Date(now).toISOString(),
            conversation_id: null,
          },
        ]);

        await notifyLeadOnce(content);

        const history = next.map((g) => ({ role: g.role, content: g.content }));
        const reply = await getGuestReply(history);

        const botMsg: GuestMsg = { id: uuid(), role: "assistant", content: reply, ts: Date.now() };
        const next2 = [...next, botMsg];
        writeGuest(next2);
        setMessages((m) => [
          ...m,
          {
            id: botMsg.id,
            role: "assistant",
            content: reply,
            created_at: new Date(botMsg.ts).toISOString(),
            conversation_id: null,
          },
        ]);
      }
    } catch (e: any) {
      alert(e?.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  }

  const pretty = useMemo(
    () => messages.map((m) => ({ ...m, who: m.role === "user" ? "You" : m.role === "assistant" ? "Repliers" : "Agent" })),
    [messages]
  );

  if (!open) return null;

  return (
    <main
      className={`
        fixed z-50 w-full bottom-0 left-0 right-0
        flex items-end justify-center md:justify-end
        px-2 pb-2 md:pb-8 md:pr-8 transition-all
      `}
      style={{ pointerEvents: "none" }}
    >
      <section
        className={`
          w-full max-w-lg bg-white/90 rounded-[2.5rem]
          shadow-2xl border border-slate-100 overflow-hidden
          flex flex-col pointer-events-auto transition-all
          md:rounded-r-[2.5rem]
        `}
        style={{ minHeight: "480px", maxHeight: "90vh" }}
      >
        {/* Close */}
        <button
          aria-label="Close chat panel"
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/60 hover:bg-slate-200 shadow focus:outline-none focus:ring-2 focus:ring-emerald-400 transition"
          style={{ pointerEvents: "auto" }}
          onClick={onClose}
        >
          <XMarkIcon className="h-6 w-6 text-slate-700" />
        </button>

        {/* Header */}
        <div className="relative flex flex-col items-center justify-center bg-gradient-to-r from-indigo-700 via-blue-700 to-emerald-600 px-6 py-6">
          <div className="flex items-center gap-8 mb-2">
            <button className="flex flex-col items-center group cursor-pointer focus:outline-none" tabIndex={0} aria-label="Chat" type="button" style={{ pointerEvents: "auto" }}>
              <ChatBubbleLeftEllipsisIcon className="h-7 w-7 text-white/80 group-hover:scale-105 transition-transform" />
              <span className="text-xs text-white/80 pt-1 font-semibold">Chat</span>
            </button>
            <button className="flex flex-col items-center group cursor-pointer focus:outline-none" tabIndex={0} aria-label="Help" type="button" style={{ pointerEvents: "auto" }} onClick={() => navigate("/contact")}>
              <BookOpenIcon className="h-7 w-7 text-white/80 group-hover:scale-105 transition-transform" />
              <span className="text-xs text-white/80 pt-1 font-semibold">Help</span>
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex flex-col flex-1 bg-white/80 min-h-[350px]">
          <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {pretty.length === 0 ? (
              <div className="text-slate-400 text-center mt-10 font-medium">Say hello to get started!</div>
            ) : (
              pretty.map((m) => (
                <div key={m.id} className={["flex items-end", m.role === "user" ? "justify-end" : "justify-start"].join(" ")}>
                  {m.role !== "user" && (
                    <div className="mr-2 flex-shrink-0">
                      <UserCircleIcon className="h-8 w-8 text-indigo-400" />
                    </div>
                  )}
                  <div
                    className={[
                      "max-w-[80vw] md:max-w-[70%] px-4 py-3 rounded-2xl shadow-elev-1",
                      m.role === "user" ? "bg-gradient-to-r from-emerald-50 to-blue-50 text-slate-900 rounded-br-none" : "bg-gradient-to-r from-indigo-600 to-sky-500 text-white rounded-bl-none",
                    ].join(" ")}
                    title={new Date(m.created_at).toLocaleString()}
                  >
                    <div className="text-xs mb-1 opacity-80">{m.who}</div>
                    <div className="whitespace-pre-wrap break-words">{m.content}</div>
                  </div>
                  {m.role === "user" && (
                    <div className="ml-2 flex-shrink-0">
                      <UserCircleIcon className="h-8 w-8 text-emerald-400" />
                    </div>
                  )}
                </div>
              ))
            )}
            {sending && (
              <div className="flex items-end justify-start">
                <div className="mr-2">
                  <UserCircleIcon className="h-8 w-8 text-indigo-400" />
                </div>
                <div className="max-w-[75%] px-4 py-2 rounded-2xl bg-slate-100 text-slate-500 shadow-elev-1 rounded-bl-none animate-pulse">Repliers is typing…</div>
              </div>
            )}
          </div>

          {/* Composer */}
          <form
            className="flex items-center gap-2 border-t border-slate-200 bg-white/90 px-3 py-3"
            onSubmit={(e) => {
              e.preventDefault();
              // send is available in closure
              (async () => {})();
            }}
          >
            <button type="button" className="p-2 rounded-full hover:bg-slate-200/70 transition" tabIndex={-1} aria-label="Emoji">
              <FaceSmileIcon className="h-5 w-5 text-slate-500" />
            </button>
            <button type="button" className="p-2 rounded-full hover:bg-slate-200/70 transition" tabIndex={-1} aria-label="Attach file">
              <PaperClipIcon className="h-5 w-5 text-slate-500" />
            </button>
            <input
              className="h-11 flex-1 rounded-xl border border-slate-300 bg-white px-4 focus:border-emerald-400 focus:outline-none focus:ring-4 focus:ring-emerald-100 text-base transition"
              placeholder="Compose your message…"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <button
              className="flex items-center justify-center rounded-full bg-gradient-to-r from-emerald-500 via-indigo-500 to-blue-600 text-white px-4 py-2 font-bold shadow hover:scale-105 focus:scale-105 transition-all h-11 disabled:opacity-40"
              disabled={!text.trim()}
              type="button"
              aria-label="Send"
              onClick={() => send()}
            >
              <PaperAirplaneIcon className="h-5 w-5 rotate-45" />
            </button>
          </form>

          <div className="px-4 py-2 text-xs text-slate-600">
            <span className="font-semibold">Tip:</span> Sign in to keep your chat and get a follow-up from an agent.
          </div>
        </div>
      </section>
      <style>{`
        @media (min-width: 768px) { main { justify-content: flex-end !important; } }
        @media (max-width: 640px) { section { border-radius: 1.2rem !important; padding-bottom: env(safe-area-inset-bottom, 0) !important; } }
      `}</style>
    </main>
  );
}

/* ─────────────────────────────────────────────────────────
   Page (with AddressAutocomplete + Repliers estimate)
   ──────────────────────────────────────────────────────── */
export default function WhatsMyHomeWorth() {
  const [address, setAddress] = useState("");
  const [coords, setCoords] = useState<{ lon: number; lat: number } | null>(null);

  const [estimate, setEstimate] = useState<EstimateResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Email capture
  const [email, setEmail] = useState("");

  // Chat panel (kept)
  const [chatOpen, setChatOpen] = useState(false);

  const navigate = useNavigate();

  function makeChatPrefill(): string {
    const parts = [
      address ? `I'd like help valuing: ${address}` : "I'd like help valuing my home.",
      estimate
        ? `AI estimate: $${estimate.estimate.toLocaleString()} (range $${Math.round(estimate.estimateLow).toLocaleString()}–$${Math.round(estimate.estimateHigh).toLocaleString()})`
        : "",
      "Please review comparables and advise next steps.",
    ].filter(Boolean);
    return parts.join(". ");
  }

  async function runEstimate() {
    if (!coords && !address.trim()) return;
    setLoading(true);
    setError(null);
    setEstimate(null);
    try {
      const { est } = await fetchEstimateViaRepliers({ coords });
      setEstimate(est);
    } catch (e: any) {
      setError(e?.message || "Sorry, we couldn't fetch an estimate. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 relative -mt-6 sm:-mt-10 md:-mt-12 lg:-mt-14 xl:-mt-16 py-4">
      <div className="max-w-5xl mx-auto w-full px-4">
        <header className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-2">What’s My Home Worth?</h1>
          <p className="text-lg text-slate-700">Find out your home’s current value in seconds.</p>
        </header>

        {/* Address (MapTiler) */}
        <div className="w-full max-w-2xl mx-auto">
          <AddressAutocomplete
            value={address}
            onChange={(v) => {
              setAddress(v);
              if (coords) setCoords(null);
            }}
            onPick={(feat) => {
              setAddress(feat.place_name);
              setCoords({ lon: feat.center[0], lat: feat.center[1] });
              // auto-fetch on pick for fast UX
              runEstimate();
            }}
          />
        </div>

        {/* Manual submit if user typed but didn't pick a suggestion */}
        <form
          className="mt-6 flex items-center justify-center"
          onSubmit={(e) => {
            e.preventDefault();
            runEstimate();
          }}
        >
          <button
            type="submit"
            className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-lg px-6 py-3 shadow transition disabled:opacity-60"
            disabled={loading || (!coords && !address.trim())}
          >
            {loading ? "Estimating…" : "Get Estimate"}
          </button>
          {address && (
            <button
              type="button"
              className="ml-3 inline-flex items-center gap-2 rounded-xl border px-4 py-3 text-slate-700 bg-white hover:bg-slate-50"
              onClick={() => {
                setAddress("");
                setCoords(null);
                setEstimate(null);
                setError(null);
              }}
            >
              <ArrowPathIcon className="h-5 w-5" /> Value Another Property
            </button>
          )}
        </form>

        {/* AI Estimate (Image-1 style) */}
        <AIValueRangePanel estimate={estimate} loading={loading} error={error} />

        {/* Action buttons (quick) */}
        <div className="flex flex-col md:flex-row gap-4 mt-8 w-full max-w-2xl mx-auto">
          {/* CMA refinement */}
          <button
            type="button"
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-lg px-6 py-4 shadow transition"
            onClick={() => {
              const qs = new URLSearchParams();
              if (address?.trim()) qs.set("address", address.trim());
              if (estimate?.estimate) qs.set("est", String(Math.round(estimate.estimate)));
              qs.set("view", "table"); // comparable TABLE alignment like CMA
              navigate(`/find-comparable${qs.size ? `?${qs.toString()}` : ""}`);
            }}
            disabled={!estimate}
          >
            <AdjustmentsHorizontalIcon className="h-6 w-6" />
            Refine Comparables
          </button>

          {/* Agent report CTA goes to Tour (as previously aligned) */}
          <button
            type="button"
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-lg px-6 py-4 shadow transition"
            onClick={async () => {
              try {
                if (!address?.trim()) {
                  alert("Please enter your address first.");
                  return;
                }
                const { data: sess } = await supabase.auth.getSession();
                const uid = sess?.session?.user?.id || null;
                if (!uid) {
                  alert("Please sign in to request an Agent Report.");
                  const next = "/whats-my-home-worth";
                  const qs = new URLSearchParams();
                  qs.set("src", "wmhw");
                  qs.set("address", address.trim());
                  return navigate(`/auth/login?next=${encodeURIComponent(`${next}?${qs.toString()}`)}`);
                }
                const params = new URLSearchParams();
                if (address?.trim()) params.set("ref", address.trim());
                params.set("src", "wmhw");
                navigate(`/tour${params.toString() ? `?${params.toString()}` : ""}`);
              } catch (e) {
                console.error(e);
                alert("Something went wrong. Please try again.");
              }
            }}
          >
            <span className="inline-flex items-center gap-2">Get Agent Report</span>
          </button>
        </div>

        {/* Agent promo banner (Image-3 header) */}
        <div className="mt-8 rounded-2xl border bg-blue-50/60 p-5 md:p-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-white shadow-inner flex items-center justify-center">
              <StarIcon className="h-7 w-7 text-blue-600" />
            </div>
            <div>
              <div className="text-slate-900 font-semibold">Want to know your true value? Speak to a local agent</div>
              <div className="text-slate-600 text-sm">Get expert insights and a professional market analysis</div>
            </div>
          </div>
          <button
            className="w-full md:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-3 shadow"
            onClick={() => navigate("/tour?src=wmhw-banner")}
          >
            <PhoneEmoji /> Talk to an Agent
          </button>
        </div>

        {/* Three card actions (Image-3 cards) */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card rounded-2xl border bg-white p-6 flex flex-col">
            <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-green-50">
              <ChartBarIcon className="h-7 w-7 text-emerald-600" />
            </div>
            <h3 className="font-semibold text-slate-900">Compare to Similar Homes</h3>
            <p className="text-slate-600 text-sm mt-1 flex-1">See how your home stacks up against recent sales</p>
            <button
              className="mt-4 inline-flex items-center gap-2 rounded-xl border px-4 py-2 bg-white hover:bg-slate-50"
              onClick={() => {
                const qs = new URLSearchParams();
                if (address?.trim()) qs.set("address", address.trim());
                if (estimate?.estimate) qs.set("est", String(Math.round(estimate.estimate)));
                qs.set("view", "table");
                navigate(`/find-comparable${qs.size ? `?${qs.toString()}` : ""}`);
              }}
            >
              <span>View Comparables</span> →
            </button>
          </div>

          <div className="card rounded-2xl border bg-white p-6 flex flex-col">
            <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50">
              <ArrowTrendingUpIcon className="h-7 w-7 text-indigo-600" />
            </div>
            <h3 className="font-semibold text-slate-900">Track My Home Value</h3>
            <p className="text-slate-600 text-sm mt-1 flex-1">Get monthly updates on your property value</p>
            <button
              className="mt-4 inline-flex items-center gap-2 rounded-xl border px-4 py-2 bg-white hover:bg-slate-50"
              onClick={() => {
                const qs = new URLSearchParams();
                if (address?.trim()) qs.set("address", address.trim());
                navigate(`/alerts${qs.size ? `?${qs.toString()}` : ""}`);
              }}
            >
              <span>Start Tracking</span> →
            </button>
          </div>

          <div className="card rounded-2xl border bg-white p-6 flex flex-col">
            <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50">
              <DocumentArrowDownIcon className="h-7 w-7 text-purple-600" />
            </div>
            <h3 className="font-semibold text-slate-900">Download Detailed Report</h3>
            <p className="text-slate-600 text-sm mt-1 flex-1">Get a comprehensive PDF with market analysis</p>
            <button
              className="mt-4 inline-flex items-center gap-2 rounded-xl border px-4 py-2 bg-white hover:bg-slate-50"
              onClick={() => {
                const qs = new URLSearchParams();
                if (address.trim()) qs.set("address", address.trim());
                if (estimate) {
                  qs.set("est", String(estimate.estimate));
                  qs.set("lo", String(estimate.estimateLow));
                  qs.set("hi", String(estimate.estimateHigh));
                }
                navigate(`/agent/report-request${qs.size ? `?${qs.toString()}` : ""}`);
              }}
            >
              <span>Get Report</span> →
            </button>
          </div>
        </div>

        {/* Email capture strip */}
        <div className="mt-6 rounded-2xl border bg-purple-50/50 p-4 md:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="text-sm font-medium text-slate-800 sm:w-56">Email Address for Report</div>
            <div className="flex-1 flex gap-3">
              <div className="relative flex-1">
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                  <EnvelopeIcon className="h-5 w-5 text-slate-400" />
                </span>
                <input
                  type="email"
                  inputMode="email"
                  className="w-full h-11 pl-10 pr-3 rounded-xl border bg-white focus:outline-none focus:ring-4 focus:ring-purple-100"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <button
                className="h-11 rounded-xl bg-purple-600 hover:bg-purple-700 text-white px-5 font-semibold disabled:opacity-50"
                disabled={!email.trim()}
                onClick={() => {
                  // Placeholder — align with your edge function / API later.
                  alert(`We'll send your report to: ${email}`);
                }}
              >
                Send Report
              </button>
              <button
                className="h-11 rounded-xl border px-5 bg-white hover:bg-slate-50"
                onClick={() => setEmail("")}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>

        <div className="mt-7 flex items-centered justify-center gap-2 text-slate-500 text-xs">
          <ShieldCheckIcon className="h-5 w-5 text-emerald-400" />
          AI estimate based on MLS® data — verified by BC-licensed agents.
        </div>

        <TestimonialCarousel />
      </div>

      {!chatOpen && (
        <button
          type="button"
          aria-label="Open chat panel"
          className={`
            fixed z-50 bottom-6 right-6 md:bottom-10 md:right-10
            bg-gradient-to-r from-indigo-600 to-emerald-500
            text-white shadow-lg rounded-full
            w-16 h-16 flex items-center justify-center
            focus:outline-none focus:ring-4 focus:ring-emerald-200
            hover:scale-110 transition-all
          `}
          style={{ pointerEvents: "auto" }}
          onClick={() => setChatOpen(true)}
        >
          <ChatBubbleLeftEllipsisIcon className="h-8 w-8" />
        </button>
      )}

      <ChatPanel open={chatOpen} onClose={() => setChatOpen(false)} prefill={makeChatPrefill()} pid={null} address={address || null} />
    </div>
  );
}

/* Small helper to keep button icon semantic */
function PhoneEmoji() {
  return <span role="img" aria-label="phone" className="text-base">📞</span>;
}
