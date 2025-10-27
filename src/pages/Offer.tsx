// src/pages/Offer.tsx
import React, { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  BanknotesIcon,
  CalendarDaysIcon,
  ClipboardDocumentListIcon,
  DocumentCheckIcon,
  InformationCircleIcon,
  LinkIcon,
  MapPinIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import { supabase } from "../utils/supabaseClient";
import { useAuth } from "../contexts/AuthContext";

/* ------------- utils ------------- */

function toLocalDateValue(d: Date) {
  // yyyy-MM-dd for <input type="date">
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 10);
}

function addDays(d: Date, days: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

/* ------------- component ------------- */

const CONTINGENCY_PRESETS = [
  "Inspection",
  "Financing",
  "Appraisal",
  "Sale of current home",
] as const;

export default function Offer() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [sp] = useSearchParams();
  const listingRefFromUrl = sp.get("ref") || "";

  // sensible defaults: 30-day close, standard contingencies
  const defaultClose = useMemo(
    () => toLocalDateValue(addDays(new Date(), 30)),
    []
  );

  const [form, setForm] = useState({
    listingRef: listingRefFromUrl,
    price: "",
    contingencies: new Set<typeof CONTINGENCY_PRESETS[number]>([
      "Inspection",
      "Financing",
    ]),
    extraContingency: "",
    preapproval_url: "",
    earnestMoney: "",
    closingDate: defaultClose,
    notes: "",
    consent: true,
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const update = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((s) => ({ ...s, [k]: v }));

  const toggleCont = (c: typeof CONTINGENCY_PRESETS[number]) =>
    setForm((s) => {
      const next = new Set(s.contingencies);
      if (next.has(c)) next.delete(c);
      else next.add(c);
      return { ...s, contingencies: next };
    });

  const canSubmit =
    !!user && !!form.price && Number(form.price) > 0 && form.consent;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setBusy(true);
    setErr(null);
    try {
      const allConts = [
        ...Array.from(form.contingencies),
        ...(form.extraContingency.trim() ? [form.extraContingency.trim()] : []),
      ].join(", ");

      // Extra structured bits go at the top of notes so you don’t need new columns
      const composedNotes =
        [
          form.earnestMoney && `[Earnest: $${form.earnestMoney}]`,
          form.closingDate && `[Closing: ${form.closingDate}]`,
        ]
          .filter(Boolean)
          .join(" ") +
        (form.notes ? ` ${form.notes}` : "");

      const { error } = await supabase.from("offers").insert({
        user_uid: user?.id ?? null,
        listing_ref: (form.listingRef || listingRefFromUrl || null) ?? null,
        offer_price: Number(form.price || 0) || null,
        contingencies: allConts || null,
        preapproval_url: form.preapproval_url.trim() || null,
        notes: composedNotes || null,
        status: "submitted",
      });

      if (error) {
        // surface more context if RLS/enum/constraint fails
        throw new Error(error.message || (error as any)?.details || "Insert failed");
      }

      nav("/thank-you?type=offer");
    } catch (e: any) {
      setErr(e?.message || "Failed to submit offer");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-white">
      {/* Header */}
      <div className="border-b bg-gradient-to-b from-slate-50 to-white">
        <div className="container-7xl px-4 py-10">
          <div className="flex items-center gap-3">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 ring-1 ring-emerald-200/60">
              <DocumentCheckIcon className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">
                Make an Offer
              </h1>
              <p className="text-sm text-slate-600">
                Submit price & terms securely. Your agent will review and
                present the offer.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container-7xl px-4 py-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Left: form */}
          <form
            onSubmit={submit}
            className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white shadow-sm"
          >
            <div className="p-6 md:p-8 space-y-6">
              {err && (
                <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-rose-800">
                  {err}
                </div>
              )}

              {/* Listing reference */}
              <div>
                <label className="hf-small mb-1.5 block font-medium text-slate-800">
                  Listing reference
                </label>
                <div className="relative">
                  <ClipboardDocumentListIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
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
                    If you don’t have it handy, leave blank—we’ll match it up.
                  </p>
                )}
              </div>

              {/* Price & Earnest */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="hf-small mb-1.5 block font-medium text-slate-800">
                    Offer price (USD)
                  </label>
                  <div className="relative">
                    <BanknotesIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <input
                      type="number"
                      inputMode="numeric"
                      min={0}
                      className="input w-full pl-10"
                      placeholder="e.g. 949000"
                      value={form.price}
                      onChange={(e) => update("price", e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="hf-small mb-1.5 block font-medium text-slate-800">
                    Earnest money (optional)
                  </label>
                  <div className="relative">
                    <BanknotesIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <input
                      type="number"
                      inputMode="numeric"
                      min={0}
                      className="input w-full pl-10"
                      placeholder="e.g. 20000"
                      value={form.earnestMoney}
                      onChange={(e) => update("earnestMoney", e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Closing & Pre-approval */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="hf-small mb-1.5 block font-medium text-slate-800">
                    Desired closing date
                  </label>
                  <div className="relative">
                    <CalendarDaysIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <input
                      type="date"
                      className="input w-full pl-10"
                      value={form.closingDate}
                      min={toLocalDateValue(addDays(new Date(), 7))}
                      onChange={(e) => update("closingDate", e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="hf-small mb-1.5 block font-medium text-slate-800">
                    Pre-approval link (optional)
                  </label>
                  <div className="relative">
                    <LinkIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <input
                      type="url"
                      className="input w-full pl-10"
                      placeholder="https://bank.com/your-preapproval.pdf"
                      value={form.preapproval_url}
                      onChange={(e) => update("preapproval_url", e.target.value)}
                    />
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    Uploading a lender letter can speed up acceptance.
                  </p>
                </div>
              </div>

              {/* Contingencies */}
              <div>
                <label className="hf-small mb-1.5 block font-medium text-slate-800">
                  Contingencies
                </label>
                <div className="flex flex-wrap gap-2">
                  {CONTINGENCY_PRESETS.map((c) => {
                    const active = form.contingencies.has(c);
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => toggleCont(c)}
                        className={[
                          "rounded-full px-3 py-1 text-sm",
                          active
                            ? "bg-emerald-600 text-white"
                            : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                        ].join(" ")}
                        aria-pressed={active}
                      >
                        {c}
                      </button>
                    );
                  })}
                </div>
                <input
                  className="input mt-3"
                  placeholder="Add another (e.g. Title review, Condo docs)"
                  value={form.extraContingency}
                  onChange={(e) => update("extraContingency", e.target.value)}
                />
              </div>

              {/* Notes */}
              <div>
                <label className="hf-small mb-1.5 block font-medium text-slate-800">
                  Notes to seller/agent (optional)
                </label>
                <textarea
                  className="input h-28"
                  placeholder="Context for your price, flexibility on closing, items to include/exclude, etc."
                  value={form.notes}
                  onChange={(e) => update("notes", e.target.value)}
                />
              </div>

              {/* Auth / Consent */}
              {!user && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900">
                  Please <Link to="/auth/login" className="underline">sign in</Link> to submit an offer.
                </div>
              )}
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  className="h-4 w-4"
                  checked={form.consent}
                  onChange={(e) => update("consent", e.target.checked)}
                />
                I agree to be contacted about this offer and next steps.
              </label>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 border-t bg-slate-50/60 px-6 py-4 md:px-8">
              <button
                className="btn-primary h-11 px-5"
                disabled={busy || !canSubmit}
                type="submit"
              >
                {busy ? "Submitting…" : "Submit Offer"}
              </button>
              <button
                className="btn-outline h-11 px-5"
                type="button"
                onClick={() => nav(-1)}
              >
                Cancel
              </button>
              <span className="ml-auto text-xs text-slate-500">
                Your agent will confirm submission and next steps.
              </span>
            </div>
          </form>

          {/* Right: info panel */}
          <aside className="space-y-6">
            {(form.listingRef || listingRefFromUrl) && (
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-3 text-sm font-medium text-slate-900">
                  Selected Listing
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-14 w-20 rounded-lg bg-slate-100 ring-1 ring-slate-200" />
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-slate-800">
                      Ref: {form.listingRef || listingRefFromUrl}
                    </div>
                    <div className="text-xs text-slate-500">
                      We’ll match this reference to the property in your
                      confirmation.
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-900">
                <InformationCircleIcon className="h-5 w-5 text-slate-500" />
                What happens next
              </div>
              <ul className="space-y-2 text-sm text-slate-700">
                <li>• Your agent reviews terms and sends for e-signature.</li>
                <li>• Offer is presented to the seller with proof of funds.</li>
                <li>• We’ll update you on counters or acceptance quickly.</li>
              </ul>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-900">
                <ShieldCheckIcon className="h-5 w-5 text-emerald-600" />
                Strong offer tips
              </div>
              <ul className="space-y-2 text-sm text-slate-700">
                <li>• Include a fresh pre-approval or proof of funds.</li>
                <li>• Reasonable closing date (30–45 days is common).</li>
                <li>• Limit contingencies where you’re comfortable.</li>
              </ul>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-900">
                <MapPinIcon className="h-5 w-5 text-blue-600" />
                Need to see it again?
              </div>
              <p className="text-sm text-slate-700">
                Book a quick{" "}
                <Link to="/tour" className="text-blue-700 hover:underline">
                  second tour
                </Link>{" "}
                before you submit. We’ll accommodate asap.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
