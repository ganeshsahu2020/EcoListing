// ui/src/pages/Tour.tsx
import React, { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  CalendarIcon,
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  VideoCameraIcon,
  ClockIcon,
  ShieldCheckIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import { supabase } from "../utils/supabaseClient";
import { useAuth } from "../contexts/AuthContext";

/* ---------------- utils ---------------- */

function toLocalInputValue(d: Date) {
  // Convert Date -> yyyy-MM-ddTHH:mm for <input type="datetime-local">
  const tzOffset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function atTime(date: Date, hour: number, minute = 0) {
  const d = new Date(date);
  d.setHours(hour, minute, 0, 0);
  return d;
}

function BrandMarkPro() {
  return (
    <span className="inline-flex items-center gap-3">
      <span className="relative flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 via-emerald-400 to-green-500 shadow-lg">
        <SparklesIcon className="h-7 w-7 text-white drop-shadow-[0_2px_8px_rgba(16,185,129,0.32)] animate-pulse" />
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

/* ---------------- component ---------------- */

export default function Tour() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [sp] = useSearchParams();
  const listingRefFromUrl = sp.get("ref") || ""; // pass ?ref=<uuid> or ?ref=mls:123

  // sensible default slot: tomorrow 10:00
  const defaultSlot = useMemo(() => toLocalInputValue(atTime(addDays(new Date(), 1), 10)), []);

  const [form, setForm] = useState({
    listingRef: listingRefFromUrl,
    name: (user as any)?.user_metadata?.full_name || "",
    email: user?.email || "",
    phone: "",
    date: "",
    tourType: "in-person" as "in-person" | "virtual",
    notes: "",
    consent: true,
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const update = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((s) => ({ ...s, [k]: v }));

  const setQuick = (d: Date) => update("date", toLocalInputValue(d));

  const canSubmit =
    !!user && !!form.name.trim() && !!form.email.trim() && !!(form.date || defaultSlot);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setBusy(true);
    setErr(null);
    try {
      const { error } = await supabase.from("tour_requests").insert({
        user_uid: user?.id ?? null,
        listing_ref: (form.listingRef || listingRefFromUrl || null) ?? null,
        name: form.name.trim() || null,
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        desired_at: (form.date || defaultSlot)
          ? new Date(form.date || defaultSlot).toISOString()
          : null,
        // We don't have a tour_type column; include it at the top of notes:
        notes: `[Tour type: ${form.tourType}] ` + (form.notes?.trim() || ""),
        status: "new",
      });
      if (error) throw error;

      // 🔔 Also notify the lead-intake pipeline (non-blocking)
      try {
        await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/lead-intake`, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({
            event: "tour_request",
            name: form.name,
            email: form.email,
            phone: form.phone || null,
            listing_ref: form.listingRef || listingRefFromUrl || null,
            desired_at: (form.date || defaultSlot)
              ? new Date(form.date || defaultSlot).toISOString()
              : null,
            notes: form.notes || null,
            address: null, // pass real address if you have it
            property_id: null, // pass property_id if you have it
            visitor_id: localStorage.getItem("guest_chat_visitor_id") || null,
            meta: { page: window.location.pathname },
            text: `Tour requested${(form.listingRef || listingRefFromUrl) ? ` for ${form.listingRef || listingRefFromUrl}` : ""}`,
          }),
        });
      } catch {
        // Non-fatal – DB insert already succeeded.
      }

      // ⬇️ redirect to Thank-You page instead of /inbox
      nav("/thank-you");
    } catch (e: any) {
      setErr(e?.message || "Failed to request tour");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-tl from-blue-50 via-emerald-50 to-white">
      {/* Glassmorphism floating CTA */}
      <div className="fixed z-10 right-6 top-24 hidden xl:block">
        <div className="backdrop-blur-2xl bg-white/70 border border-blue-200/40 shadow-lg rounded-2xl px-6 py-4 flex flex-col items-center animate-fade-in-up transition-all duration-300">
          <span className="font-bold text-blue-700 text-lg mb-1 flex items-center gap-2">
            <CalendarIcon className="h-6 w-6 animate-spin-slow text-emerald-500" />
            Book instantly
          </span>
          <span className="text-xs text-slate-600 mb-3 text-center">
            Need help? Call us at <a href="tel:1800123456" className="underline text-emerald-700">1-800-ECO-TOUR</a>
          </span>
          {/* App store/trust badges - optional */}
          {/* <div className="flex gap-2 mt-2">
            <img src="/badges/appstore.svg" alt="App Store" className="h-7" />
            <img src="/badges/googleplay.svg" alt="Google Play" className="h-7" />
            <img src="/badges/trustpilot.svg" alt="Trustpilot" className="h-7" />
          </div> */}
        </div>
      </div>
      {/* Header */}
      <div className="border-b bg-gradient-to-b from-blue-50/50 to-white/80 shadow-sm backdrop-blur">
        <div className="container-7xl px-4 py-10 flex flex-col md:flex-row items-center gap-6 md:gap-10">
          <BrandMarkPro />
          <div className="flex-1">
            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 flex items-center gap-3 tracking-tight">
              <span>Schedule a Home Tour</span>
              <CalendarIcon className="h-8 w-8 text-emerald-500 animate-wiggle" />
            </h1>
            <p className="mt-2 text-base md:text-lg text-slate-600">
              Choose a time that fits your schedule. Our team will handle the details for a stress-free viewing experience.
            </p>
          </div>
        </div>
      </div>
      {/* Content */}
      <div className="container-7xl px-4 py-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Left: form */}
          <form
            onSubmit={submit}
            className="glass-card-pro lg:col-span-2 bg-white/80 rounded-2xl shadow-xl ring-1 ring-emerald-100 border border-slate-100 transition-all duration-300"
            aria-label="Schedule a tour form"
          >
            {/* form body */}
            <div className="p-6 md:p-8 space-y-6">
              {err && (
                <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-rose-800 transition-all">
                  {err}
                </div>
              )}

              {/* Listing Ref */}
              <div>
                <label className="hf-small mb-1.5 block font-medium text-slate-800">
                  Listing reference
                </label>
                <div className="relative">
                  <MapPinIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input
                    className="input w-full pl-10"
                    placeholder="MLS number (e.g. MLS:W123456) or internal ID"
                    value={form.listingRef}
                    onChange={(e) => update("listingRef", e.target.value)}
                    disabled={!!listingRefFromUrl}
                  />
                </div>
                {!form.listingRef && (
                  <p className="mt-1 text-xs text-slate-500">
                    If you don’t have it handy, leave blank—we’ll follow up.
                  </p>
                )}
              </div>

              {/* Contact grid */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="hf-small mb-1.5 block font-medium text-slate-800">
                    Full name
                  </label>
                  <div className="relative">
                    <UserIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <input
                      className="input w-full pl-10"
                      placeholder="Full name as on ID"
                      value={form.name}
                      onChange={(e) => update("name", e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="hf-small mb-1.5 block font-medium text-slate-800">
                    Email
                  </label>
                  <div className="relative">
                    <EnvelopeIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <input
                      type="email"
                      className="input w-full pl-10"
                      placeholder="you@company.com"
                      value={form.email}
                      onChange={(e) => update("email", e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="hf-small mb-1.5 block font-medium text-slate-800">
                    Phone (optional)
                  </label>
                  <div className="relative">
                    <PhoneIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <input
                      className="input w-full pl-10"
                      inputMode="tel"
                      placeholder="(555) 555-1234"
                      value={form.phone}
                      onChange={(e) => update("phone", e.target.value)}
                    />
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    We’ll text if we need quick confirmation.
                  </p>
                </div>
                <div>
                  <label className="hf-small mb-1.5 block font-medium text-slate-800">
                    Tour type
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { key: "in-person", label: "In-person", Icon: MapPinIcon, gradient: "from-emerald-400 to-blue-400" },
                      { key: "virtual", label: "Virtual", Icon: VideoCameraIcon, gradient: "from-blue-400 to-emerald-400" },
                    ].map(({ key, label, Icon, gradient }) => {
                      const active = form.tourType === (key as "in-person" | "virtual");
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => update("tourType", key as "in-person" | "virtual")}
                          className={[
                            "flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm transition-all duration-200",
                            active
                              ? `border-blue-600 bg-gradient-to-br ${gradient} text-white shadow-lg`
                              : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                          ].join(" ")}
                          aria-pressed={active}
                        >
                          <Icon className={`h-5 w-5 ${active ? "animate-wiggle" : ""}`} />
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Desired time */}
              <div>
                <label className="hf-small mb-1.5 block font-medium text-slate-800">
                  Desired date & time
                </label>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="relative">
                    <ClockIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <input
                      type="datetime-local"
                      className="input w-full pl-10"
                      value={form.date}
                      min={toLocalInputValue(new Date())}
                      onChange={(e) => update("date", e.target.value)}
                      placeholder={defaultSlot}
                    />
                  </div>
                  {/* quick picks */}
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition"
                      onClick={() => setQuick(atTime(new Date(), 17))}
                    >
                      Today 5:00 PM
                    </button>
                    <button
                      type="button"
                      className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition"
                      onClick={() => setQuick(atTime(addDays(new Date(), 1), 10))}
                    >
                      Tomorrow 10:00 AM
                    </button>
                    <button
                      type="button"
                      className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition"
                      onClick={() => setQuick(atTime(addDays(new Date(), 2), 12))}
                    >
                      {new Intl.DateTimeFormat(undefined, { weekday: "short" }).format(
                        addDays(new Date(), 2)
                      )}{" "}
                      12:00 PM
                    </button>
                  </div>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  We’ll confirm by email and propose alternatives if the time isn’t available.
                </p>
              </div>

              {/* Notes */}
              <div>
                <label className="hf-small mb-1.5 block font-medium text-slate-800">
                  Notes for your agent (optional)
                </label>
                <textarea
                  className="input h-28"
                  placeholder="Parking details, gate code, accessibility needs, favorite features to focus on, etc."
                  value={form.notes}
                  onChange={(e) => update("notes", e.target.value)}
                />
              </div>

              {/* Consent & auth note */}
              {!user && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900 transition-all">
                  Please <Link to="/auth/login" className="underline">sign in</Link> to submit a tour request.
                </div>
              )}
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  className="h-4 w-4"
                  checked={form.consent}
                  onChange={(e) => update("consent", e.target.checked)}
                />
                I agree to be contacted about this tour request.
              </label>
            </div>

            {/* actions */}
            <div className="flex items-center gap-3 border-t bg-gradient-to-r from-blue-50/80 to-emerald-50/80 px-6 py-4 md:px-8">
              <button
                className="btn-primary h-11 px-5 rounded-full shadow-md focus:ring-2 focus:ring-emerald-300 transition-all"
                disabled={busy || !canSubmit}
                type="submit"
              >
                {busy ? (
                  <span className="inline-flex items-center gap-2">
                    <CheckCircleIcon className="animate-spin h-6 w-6 text-emerald-400" />
                    Submitting…
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2">
                    <CalendarIcon className="h-6 w-6 text-blue-500 animate-wiggle" />
                    Request Tour
                  </span>
                )}
              </button>
              <button
                className="btn-outline h-11 px-5 rounded-full"
                type="button"
                onClick={() => nav(-1)}
              >
                Cancel
              </button>
              <span className="ml-auto text-xs text-slate-500">
                Confirmation email in minutes.
              </span>
            </div>
          </form>

          {/* Right: helpful panel */}
          <aside className="space-y-6">
            {(form.listingRef || listingRefFromUrl) && (
              <div className="glass-card-pro rounded-2xl border border-slate-200 bg-white/70 shadow-lg ring-1 ring-blue-100 p-5 flex flex-col gap-1 animate-fade-in-down transition-all duration-300">
                <div className="mb-2 text-sm font-semibold text-blue-800 flex items-center gap-2">
                  <MapPinIcon className="h-5 w-5 text-emerald-500 animate-pulse" />
                  Selected Listing
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-14 w-20 rounded-lg bg-slate-100 ring-1 ring-slate-200" />
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-slate-800">
                      Ref: {form.listingRef || listingRefFromUrl}
                    </div>
                    <div className="text-xs text-slate-500">
                      We’ll match this reference with the property and include details in your
                      confirmation.
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="glass-card-pro rounded-2xl border border-slate-200 bg-white/70 shadow-lg ring-1 ring-emerald-100 p-5 animate-fade-in-down transition-all duration-300">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
                <InformationCircleIcon className="h-5 w-5 text-blue-400 animate-wiggle" />
                What happens next
              </div>
              <ul className="space-y-2 text-sm text-slate-700">
                <li>• We confirm availability with the seller/tenant.</li>
                <li>• Your agent sends a calendar invite with directions.</li>
                <li>• You’ll get a reminder 24 hours and 2 hours before.</li>
              </ul>
            </div>

            <div className="glass-card-pro rounded-2xl border border-slate-200 bg-white/70 shadow-lg ring-1 ring-emerald-100 p-5 animate-fade-in-down transition-all duration-300">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-emerald-900">
                <ShieldCheckIcon className="h-5 w-5 text-emerald-600 animate-bounce" />
                Your privacy matters
              </div>
              <p className="text-sm text-slate-700">
                We only use your contact details to coordinate this tour. No spam. You can
                delete your request anytime in{" "}
                <Link to="/account" className="text-blue-700 hover:underline">
                  Account &gt; Activity
                </Link>.
              </p>
            </div>

            <div className="glass-card-pro rounded-2xl border border-slate-200 bg-white/70 shadow-lg ring-1 ring-blue-100 p-5 animate-fade-in-down transition-all duration-300">
              <div className="mb-3 text-sm font-semibold text-slate-900 flex items-center gap-2">
                <SparklesIcon className="h-5 w-5 text-blue-400 animate-spin-slow" />
                Pro tips for touring
              </div>
              <ul className="space-y-2 text-sm text-slate-700">
                <li>• Bring ID—some buildings require it for access.</li>
                <li>• Check water pressure, natural light, and noise levels.</li>
                <li>• Ask about recent renovations and utility costs.</li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
      {/* Animations */}
      <style>{`
        @keyframes wiggle {
          0%, 100% { transform: rotate(-7deg);}
          50% { transform: rotate(7deg);}
        }
        .animate-wiggle { animation: wiggle 1s infinite alternate; }
        .animate-fade-in-up { animation: fade-in-up 0.8s both; }
        .animate-fade-in-down { animation: fade-in-down 0.8s both; }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(16px);}
          to { opacity: 1; transform: translateY(0);}
        }
        @keyframes fade-in-down {
          from { opacity: 0; transform: translateY(-16px);}
          to { opacity: 1; transform: translateY(0);}
        }
        .glass-card-pro {
          backdrop-filter: blur(18px) saturate(1.5);
          background: rgba(255,255,255,0.8);
          box-shadow: 0 6px 24px 0 rgba(16, 185, 129, 0.08);
        }
        /* Slow spin for accent icons */
        .animate-spin-slow { animation: spin 5s linear infinite; }
      `}</style>
    </div>
  );
}
