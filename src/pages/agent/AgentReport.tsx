// ui/src/pages/agent/AgentReport.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams, Link } from "react-router-dom";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  CloudArrowUpIcon,
  PaperClipIcon,
} from "@heroicons/react/24/outline";
import { supabase } from "../../utils/supabaseClient";

type AgentReportRow = {
  id: string;
  created_at: string;
  updated_at: string;
  status: "draft" | "submitted" | "shared";
  agent_uid: string;
  customer_uid: string | null;
  address: string | null;
  estimate: number | null;
  range_low: number | null;
  range_high: number | null;
  confidence: number | null;
  notes_md: string | null;
  comps_md: string | null;
  attachments: { name: string; path: string; size?: number }[] | null;
  conversation_id: string | null;
  submitted_at: string | null;
  shared_at: string | null;
};

function cx(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(" ");
}

export default function AgentReport() {
  const { id } = useParams<{ id?: string }>();
  const [params] = useSearchParams();
  const nav = useNavigate();

  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [me, setMe] = useState<{ id: string } | null>(null);

  // Form state
  const [customerUid, setCustomerUid] = useState<string>(params.get("customer_uid") || "");
  const [customerEmail, setCustomerEmail] = useState<string>("");
  const [address, setAddress] = useState<string>(params.get("address") || "");
  const [estimate, setEstimate] = useState<string>("");
  const [rangeLow, setRangeLow] = useState<string>("");
  const [rangeHigh, setRangeHigh] = useState<string>("");
  const [confidence, setConfidence] = useState<string>(""); // 0..100 (%)
  const [notes, setNotes] = useState<string>("");
  const [comps, setComps] = useState<string>("");
  const [attachments, setAttachments] = useState<{ name: string; path: string; size?: number }[]>([]);
  const [conversationId, setConversationId] = useState<string>(params.get("conversation_id") || "");

  // Load current user (agent id)
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) setMe({ id: data.user.id });
    })();
  }, []);

  // If editing, load existing report
  useEffect(() => {
    if (!id) return;
    setBusy(true);
    setError(null);
    (async () => {
      const { data, error } = await supabase
        .from("agent_reports")
        .select("*")
        .eq("id", id)
        .single<AgentReportRow>();
      setBusy(false);
      if (error) {
        setError(error.message || "Failed to load report.");
        return;
      }
      if (data) {
        setCustomerUid(data.customer_uid || "");
        setAddress(data.address || "");
        setEstimate(data.estimate?.toString() || "");
        setRangeLow(data.range_low?.toString() || "");
        setRangeHigh(data.range_high?.toString() || "");
        setConfidence(
          data.confidence != null ? Math.round((1 - data.confidence) * 100).toString() : ""
        ); // if you store model error, convert to % confidence
        setNotes(data.notes_md || "");
        setComps(data.comps_md || "");
        setAttachments(Array.isArray(data.attachments) ? data.attachments : []);
        setConversationId(data.conversation_id || "");
      }
    })();
  }, [id]);

  const canSubmit = useMemo(() => {
    const est = Number(estimate);
    const lo = Number(rangeLow);
    const hi = Number(rangeHigh);
    return (
      !!me?.id &&
      (!!customerUid || !!customerEmail) &&
      !!address &&
      Number.isFinite(est) &&
      Number.isFinite(lo) &&
      Number.isFinite(hi)
    );
  }, [me?.id, customerUid, customerEmail, address, estimate, rangeLow, rangeHigh]);

  async function resolveCustomerUidByEmail(email: string) {
    // Expect a "profiles" view/table with id = auth.uid()
    const { data, error } = await supabase
      .from("profiles")
      .select("id, email")
      .ilike("email", email)
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data?.id || null;
    // If you don't have profiles, switch to:
    // const { data: users } = await supabase.rpc("admin_get_user_by_email", { p_email: email });
  }

  async function uploadToStorage(file: File) {
    const bucket = "agent-reports";
    const path = `${me?.id}/${Date.now()}_${file.name.replace(/\s+/g, "_")}`;
    const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: false });
    if (error) throw error;
    return { name: file.name, path, size: file.size };
  }

  async function handleAttach(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setSaving(true);
    setError(null);
    try {
      const meta = await uploadToStorage(file);
      setAttachments((arr) => [...arr, meta]);
    } catch (err: any) {
      setError(err?.message || "Failed to upload file.");
    } finally {
      setSaving(false);
      e.currentTarget.value = "";
    }
  }

  async function save(status: AgentReportRow["status"]) {
    if (!me?.id) return;
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      let custUid = customerUid || null;
      if (!custUid && customerEmail) {
        custUid = await resolveCustomerUidByEmail(customerEmail);
        if (!custUid) {
          throw new Error("Customer not found for that email.");
        }
        setCustomerUid(custUid);
      }

      const body = {
        id: id || undefined,
        status,
        agent_uid: me.id,
        customer_uid: custUid,
        address: address || null,
        estimate: estimate ? Number(estimate) : null,
        range_low: rangeLow ? Number(rangeLow) : null,
        range_high: rangeHigh ? Number(rangeHigh) : null,
        // Store model *error* 0..1 if you'd like; here we keep confidence % for UX and convert back:
        confidence:
          confidence && Number(confidence) >= 0
            ? Math.max(0, Math.min(1, 1 - Number(confidence) / 100))
            : null,
        notes_md: notes || null,
        comps_md: comps || null,
        attachments: attachments.length ? attachments : null,
        conversation_id: conversationId || null,
        submitted_at: status !== "draft" ? new Date().toISOString() : null,
        shared_at: status === "shared" ? new Date().toISOString() : null,
      };

      const { data, error } = await supabase
        .from("agent_reports")
        .upsert(body)
        .select("*")
        .single<AgentReportRow>();
      if (error) throw error;

      // Notify the user in chat if we have a conversation_id and the report was submitted/shared
      if (data.conversation_id && status !== "draft") {
        const linkText = `A new valuation report is ready for ${data.address || "your home"}.`;
        await supabase.from("chat_messages").insert({
          conversation_id: data.conversation_id,
          role: "agent",
          content: `${linkText}\n\nOpen Dashboard → Agent Reports to view.`,
        });
      }

      setSuccess(status === "draft" ? "Draft saved." : "Report submitted!");
      if (!id) {
        nav(`/agent/reports/${data.id}`, { replace: true });
      }
    } catch (err: any) {
      setError(err?.message || "Failed to save report.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-[70vh] bg-gradient-to-br from-emerald-50 via-white to-blue-50">
      <div className="container-7xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-4">
          <Link
            to="/agent/dashboard"
            className="inline-flex items-center gap-2 text-slate-600 hover:text-emerald-700"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Back to Agent Dashboard
          </Link>
        </div>

        <div className="rounded-2xl border border-emerald-100/70 bg-white/80 backdrop-blur-xl p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">
              {id ? "Edit Agent Report" : "New Agent Report"}
            </h1>
            <div className="text-xs text-slate-500">
              {id ? <span>ID: {id}</span> : <span>Unsaved</span>}
            </div>
          </div>

          <div className="grid gap-5 mt-6 md:grid-cols-2">
            {/* Customer */}
            <div className="grid gap-2">
              <label className="text-sm font-medium text-slate-700">Customer</label>
              <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                <input
                  className="h-11 w-full rounded-lg border border-slate-300 px-3 focus:border-emerald-500 focus:ring-emerald-500 transition"
                  placeholder="Customer UID (preferred)"
                  value={customerUid}
                  onChange={(e) => setCustomerUid(e.target.value)}
                />
                <span className="self-center text-xs text-slate-400 px-1">or</span>
              </div>
              <input
                className="h-11 w-full rounded-lg border border-slate-300 px-3 focus:border-emerald-500 focus:ring-emerald-500 transition"
                placeholder="Customer email (we'll resolve UID)"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
              />
              <p className="text-xs text-slate-500">
                Provide either a <b>customer_uid</b> or an email we can resolve to a profile.
              </p>
            </div>

            {/* Conversation */}
            <div className="grid gap-2">
              <label className="text-sm font-medium text-slate-700">Conversation (optional)</label>
              <input
                className="h-11 w-full rounded-lg border border-slate-300 px-3 focus:border-emerald-500 focus:ring-emerald-500 transition"
                placeholder="conversation_id (to notify via chat)"
                value={conversationId}
                onChange={(e) => setConversationId(e.target.value)}
              />
              <p className="text-xs text-slate-500">
                If present, the customer will get a chat message when you submit.
              </p>
            </div>

            {/* Address */}
            <div className="grid gap-2">
              <label className="text-sm font-medium text-slate-700">Property Address</label>
              <input
                className="h-11 w-full rounded-lg border border-slate-300 px-3 focus:border-emerald-500 focus:ring-emerald-500 transition"
                placeholder="123 Green Ave, City, ST"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>

            {/* Estimate / Range */}
            <div className="grid gap-2">
              <label className="text-sm font-medium text-slate-700">Estimate & Range</label>
              <div className="grid grid-cols-3 gap-2">
                <input
                  className="h-11 rounded-lg border border-slate-300 px-3 focus:border-emerald-500 focus:ring-emerald-500 transition"
                  placeholder="Estimate"
                  value={estimate}
                  onChange={(e) => setEstimate(e.target.value)}
                  inputMode="numeric"
                />
                <input
                  className="h-11 rounded-lg border border-slate-300 px-3 focus:border-emerald-500 focus:ring-emerald-500 transition"
                  placeholder="Low"
                  value={rangeLow}
                  onChange={(e) => setRangeLow(e.target.value)}
                  inputMode="numeric"
                />
                <input
                  className="h-11 rounded-lg border border-slate-300 px-3 focus:border-emerald-500 focus:ring-emerald-500 transition"
                  placeholder="High"
                  value={rangeHigh}
                  onChange={(e) => setRangeHigh(e.target.value)}
                  inputMode="numeric"
                />
              </div>
              <div className="grid grid-cols-[1fr_auto] gap-2">
                <div className="text-xs text-slate-500">
                  Numbers are plain dollars (e.g., <code>975000</code>).
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-700">Confidence</span>
                  <input
                    className="h-9 w-20 rounded-lg border border-slate-300 px-2 text-right focus:border-emerald-500 focus:ring-emerald-500 transition"
                    placeholder="%"
                    value={confidence}
                    onChange={(e) => setConfidence(e.target.value)}
                    inputMode="numeric"
                  />
                  <span className="text-xs text-slate-400">%</span>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="grid gap-2 md:col-span-2">
              <label className="text-sm font-medium text-slate-700">Notes to Client (Markdown)</label>
              <textarea
                className="min-h-[120px] w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-emerald-500 focus:ring-emerald-500 transition"
                placeholder="Explain your valuation logic, timing, prep suggestions, etc."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            {/* Comparables */}
            <div className="grid gap-2 md:col-span-2">
              <label className="text-sm font-medium text-slate-700">Comparables (Markdown)</label>
              <textarea
                className="min-h-[120px] w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-emerald-500 focus:ring-emerald-500 transition"
                placeholder="- 123 4th St — 3bd/2ba — Sold $X — DOM N
- 456 Fir Ct — ..."
                value={comps}
                onChange={(e) => setComps(e.target.value)}
              />
            </div>

            {/* Attachments */}
            <div className="grid gap-2 md:col-span-2">
              <label className="text-sm font-medium text-slate-700">Attachments</label>
              <div className="flex items-center gap-3">
                <label className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 bg-white shadow-sm cursor-pointer hover:bg-slate-50">
                  <PaperClipIcon className="h-5 w-5 text-slate-500" />
                  <span>Upload PDF / file</span>
                  <input type="file" className="hidden" onChange={handleAttach} />
                </label>
                {saving && (
                  <span className="inline-flex items-center text-slate-500 text-sm">
                    <CloudArrowUpIcon className="h-4 w-4 mr-1" />
                    Uploading…
                  </span>
                )}
              </div>
              {!!attachments.length && (
                <ul className="mt-2 grid gap-1 rounded-lg border border-slate-200 bg-slate-50 p-2">
                  {attachments.map((a, i) => (
                    <li key={`${a.path}-${i}`} className="text-sm text-slate-700 flex items-center justify-between">
                      <span className="truncate">{a.name}</span>
                      <span className="text-xs text-slate-400">{a.size ? `${Math.round(a.size / 1024)} KB` : ""}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Footer actions */}
          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-slate-500">
              Status updates are pushed to the client dashboard automatically.
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 font-medium text-slate-700 hover:bg-slate-50 transition disabled:opacity-60"
                disabled={saving}
                onClick={() => save("draft")}
              >
                Save Draft
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 font-semibold text-white shadow hover:bg-emerald-700 transition disabled:opacity-60"
                disabled={saving || !canSubmit}
                onClick={() => save("submitted")}
              >
                <CheckCircleIcon className="h-5 w-5" />
                Submit & Share
              </button>
            </div>
          </div>

          {error && <div className="mt-4 text-rose-600 text-sm">{error}</div>}
          {success && <div className="mt-4 text-emerald-700 text-sm">{success}</div>}
        </div>

        {/* Quick links */}
        {id && (
          <div className="mt-4 flex items-center justify-between">
            <div className="text-xs text-slate-500">
              Need to send the client a link? They’ll see it in <b>Dashboard → Agent Reports</b>.
            </div>
            <Link
              to="/dashboard/agent-reports"
              className="inline-flex items-center gap-2 text-emerald-700 hover:text-emerald-900"
            >
              View as client
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
