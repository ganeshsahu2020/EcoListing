import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../../utils/supabaseClient";
import { CheckCircleIcon } from "@heroicons/react/24/solid";

/* Reuse the same visitor id approach as chat so you can tie events together */
const VISITOR_ID_KEY = "guest_chat_visitor_id";
function getVisitorId() {
  try {
    const existing = localStorage.getItem(VISITOR_ID_KEY);
    if (existing) return existing;
    const v =
      (crypto as any)?.randomUUID?.() ||
      `guest_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    localStorage.setItem(VISITOR_ID_KEY, v);
    return v;
  } catch {
    return null;
  }
}

type Prefill = {
  address?: string | null;
  estimate?: number | null;
  range_low?: number | null;
  range_high?: number | null;
  confidence?: number | null; // 0..1
};

export default function AgentReportRequest() {
  const nav = useNavigate();
  const [qs] = useSearchParams();

  // Prefill from query string (e.g., ?address=...&est=... etc.)
  const prefill: Prefill = useMemo(() => {
    const est = Number(qs.get("est") || "");
    const lo = Number(qs.get("lo") || "");
    const hi = Number(qs.get("hi") || "");
    const conf = Number(qs.get("conf") || "");
    return {
      address: qs.get("address"),
      estimate: Number.isFinite(est) ? est : null,
      range_low: Number.isFinite(lo) ? lo : null,
      range_high: Number.isFinite(hi) ? hi : null,
      confidence: Number.isFinite(conf) ? conf : null,
    };
  }, [qs]);

  /* Form state */
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState(prefill.address || "");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (prefill.address && !address) setAddress(prefill.address);
  }, [prefill.address]);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Please provide your full name.");
      return;
    }
    if (!address.trim()) {
      setError("Please enter your property address.");
      return;
    }
    if (!phone.trim()) {
      setError("Please enter a mobile number so an agent can reach you.");
      return;
    }

    setBusy(true);
    try {
      // If a user IS signed in, attach; otherwise keep null
      const { data: sess } = await supabase.auth.getSession();
      const uid = sess?.session?.user?.id || null;

      // Build a safe row for agent_reports.
      // We only use columns that likely exist. Extra guest data goes into `notes`.
      const safeNotes =
        `Guest: ${name} | Phone: ${phone}${email ? ` | Email: ${email}` : ""}` +
        (notes.trim() ? `\nNotes: ${notes.trim()}` : "");

      const row: any = {
        status: "requested",               // agent can open/convert to draft/submitted later
        source: "wmhw_guest",
        customer_uid: uid,                 // null for guests
        address: address.trim(),
        estimate: prefill.estimate ?? null,
        range_low: prefill.range_low ?? null,
        range_high: prefill.range_high ?? null,
        confidence: prefill.confidence ?? null,
        notes: safeNotes,                  // keep guest info retrievable by agents
      };

      // Try to include a visitor_id / metadata if your table has it; harmless if ignored by RLS
      const visitor_id = getVisitorId();
      if (visitor_id) row.visitor_id = visitor_id;

      let reportId: string | null = null;

      // Try to insert into agent_reports first
      const { data: rep, error: repErr } = await supabase
        .from("agent_reports")
        .insert([row])
        .select("id")
        .single();

      if (repErr) {
        // Fallback: log this as a contact message so nothing is lost
        await supabase.from("contact_messages").insert([
          {
            name,
            email: email || null,
            topic: "Agent Report Request",
            subject: address,
            message:
              `Mobile: ${phone}\n` +
              (notes ? `Notes: ${notes}\n` : "") +
              (prefill.estimate
                ? `Estimate: $${prefill.estimate.toLocaleString()} (low: ${prefill.range_low}, high: ${prefill.range_high}, conf: ${prefill.confidence})\n`
                : ""),
          },
        ]);
      } else {
        reportId = rep?.id || null;
      }

      // Optional: notify your staff (if you use an edge function already)
      // try { await supabase.functions.invoke("chat-notify", { body: { text: "New guest agent report request", address, phone, report_id: reportId } }); } catch {}

      setDone(true);
    } catch (e: any) {
      console.error(e);
      setError("Sorry, we couldn’t send your request. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 shadow-lg">
          <div className="flex items-start gap-3">
            <CheckCircleIcon className="h-7 w-7 text-emerald-600 shrink-0" />
            <div>
              <h1 className="text-2xl font-bold text-emerald-900">Thanks! Your request was sent. 🎉</h1>
              <p className="mt-2 text-slate-700">
                A licensed agent will prepare your report and reach out by phone or email.
                You can close this page or{" "}
                <button
                  onClick={() => nav("/")}
                  className="underline text-emerald-700 hover:text-emerald-900"
                >
                  return to Home
                </button>
                .
              </p>
            </div>
          </div>
        </div>
        <div className="mt-8 text-sm text-slate-500">
          Tip: Creating an account later will let you view the finished report in your dashboard.
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <header className="mb-6">
        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900">Request an Agent Report</h1>
        <p className="text-slate-600 mt-2">
          Prefer not to sign in? Leave your details and an agent will prepare a valuation report.
        </p>
      </header>

      <form onSubmit={submit} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg grid gap-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="name" className="block text-sm font-medium text-slate-700">
              Full Name <span className="text-emerald-600">*</span>
            </label>
            <input
              id="name"
              className="mt-1 h-11 w-full rounded-lg border border-slate-300 px-3 focus:border-emerald-500 focus:ring-emerald-500 transition"
              placeholder="Your full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-slate-700">
              Mobile No. <span className="text-emerald-600">*</span>
            </label>
            <input
              id="phone"
              inputMode="tel"
              pattern="^[0-9+()\-.\s]{7,}$"
              className="mt-1 h-11 w-full rounded-lg border border-slate-300 px-3 focus:border-emerald-500 focus:ring-emerald-500 transition"
              placeholder="+1 (555) 123-4567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700">
              Email (optional)
            </label>
            <input
              id="email"
              type="email"
              className="mt-1 h-11 w-full rounded-lg border border-slate-300 px-3 focus:border-emerald-500 focus:ring-emerald-500 transition"
              placeholder="you@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label htmlFor="address" className="block text-sm font-medium text-slate-700">
            Property Address <span className="text-emerald-600">*</span>
          </label>
          <input
            id="address"
            className="mt-1 h-11 w-full rounded-lg border border-slate-300 px-3 focus:border-emerald-500 focus:ring-emerald-500 transition"
            placeholder="123 Green Ave, City"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            required
          />
          {/* Optional: show the estimate if passed in */}
          {(prefill.estimate ?? null) && (
            <p className="mt-1 text-xs text-slate-500">
              Prefilled from estimate: ${prefill.estimate!.toLocaleString()}{" "}
              {prefill.range_low && prefill.range_high
                ? `(Range $${Math.round(prefill.range_low).toLocaleString()} – $${Math.round(prefill.range_high).toLocaleString()})`
                : ""}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-slate-700">
            Notes (optional)
          </label>
          <textarea
            id="notes"
            className="mt-1 min-h-[100px] w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-emerald-500 focus:ring-emerald-500 transition"
            placeholder="Anything else the agent should know?"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            By submitting, you consent to be contacted about this request.
          </div>
          <button
            type="submit"
            disabled={busy}
            className="rounded-lg bg-emerald-600 px-6 py-2.5 font-semibold text-white shadow hover:bg-emerald-700 transition disabled:opacity-60"
          >
            {busy ? "Sending…" : "Send Request"}
          </button>
        </div>

        {error && <div className="text-red-600 text-sm">{error}</div>}
      </form>

      <div className="mt-6 text-sm text-slate-500">
        Have an account?{" "}
        <button
          onClick={() =>
            nav(`/auth/login?next=${encodeURIComponent(`/agent/report-request?${qs.toString()}`)}`)
          }
          className="text-emerald-700 underline hover:text-emerald-900"
        >
          Sign in
        </button>{" "}
        to save this in your dashboard automatically.
      </div>
    </div>
  );
}
