// src/pages/inbox/LeadInbox.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../../utils/supabaseClient";
import {
  ArrowLeftIcon,
  MagnifyingGlassIcon,
  ChatBubbleLeftRightIcon,
  BellAlertIcon,
} from "@heroicons/react/24/outline";
import Chat from "../Chat";

/* ─────────────────────────────────────────────────────────
   Types
   ──────────────────────────────────────────────────────── */
type Role = "user" | "assistant" | "agent";
type ConversationRow = {
  id: string;
  title?: string | null;
  owner_uid?: string | null;
  agent_uid?: string | null;
  // optional columns (use if present)
  status?: string | null;
  last_message_at?: string | null;
  last_message_role?: Role | null;
  last_message_preview?: string | null;
  customer_name?: string | null;
  address?: string | null;
  meta?: Record<string, any> | null;
  // timestamps (fallbacks)
  created_at?: string | null;
  updated_at?: string | null;
};

type ConversationView = {
  id: string;
  label: string;
  updated_at: string;
  preview: string;
  role_label?: string | null;
  raw: ConversationRow;
};

/* ─────────────────────────────────────────────────────────
   Utils
   ──────────────────────────────────────────────────────── */
function cx(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(" ");
}
const toMs = (iso?: string | null) => (iso ? new Date(iso).getTime() : 0);
function firstNonEmpty(...vals: Array<string | null | undefined>) {
  for (const v of vals) {
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return null;
}

/* ─────────────────────────────────────────────────────────
   Component
   ──────────────────────────────────────────────────────── */
export default function LeadInbox() {
  const nav = useNavigate();
  const [params, setParams] = useSearchParams();
  const selectedId = params.get("conversation_id");

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<ConversationView[]>([]);
  const [q, setQ] = useState("");

  // ✅ Correctly initialized cleanup ref
  const unsubRef = useRef<(() => void) | null>(null);

  // ✅ Split input ref so it's only used on <input>
  const inputRef = useRef<HTMLInputElement>(null);

  // Toast
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<number | null>(null);
  function showToast(s: string) {
    setToast(s);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 3500);
  }

  // Load conversations for this agent:
  // - assigned to me (agent_uid = me)
  // - owned by me (owner_uid = me)  [optional for agents]
  // - OR I’m a participant (chat_participants)
  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);

      const { data: sess } = await supabase.auth.getSession();
      const uid = sess?.session?.user?.id;
      if (!uid) {
        if (mounted) {
          setRows([]);
          setLoading(false);
        }
        return;
      }

      // 1) Participant conversation ids
      const { data: partRows } = await supabase
        .from("chat_participants")
        .select("conversation_id")
        .eq("user_uid", uid);

      const participantIds = (partRows || []).map((r: any) => r.conversation_id);

      // 2) Conversations directly visible by assignment/ownership
      const { data: directConvos } = await supabase
        .from("chat_conversations")
        .select("*")
        .or(`agent_uid.eq.${uid},owner_uid.eq.${uid}`);

      // 3) Conversations by participant list (if any)
      let participantConvos: ConversationRow[] = [];
      if (participantIds.length > 0) {
        const { data: partConvos } = await supabase
          .from("chat_conversations")
          .select("*")
          .in("id", participantIds);
        participantConvos = (partConvos || []) as any;
      }

      // Merge unique by id
      const map = new Map<string, ConversationRow>();
      for (const r of (directConvos || []) as ConversationRow[]) map.set(r.id, r);
      for (const r of participantConvos) map.set(r.id, r);
      const merged = [...map.values()];

      // Optional: enrich owner name from user_profiles if missing customer_name
      const needOwnerName = merged.filter((c) => !c.customer_name && c.owner_uid);
      const ownerIds = Array.from(new Set(needOwnerName.map((c) => c.owner_uid!)));
      const nameByOwner: Record<string, string | undefined> = {};
      if (ownerIds.length > 0) {
        const { data: profs } = await supabase
          .from("user_profiles")
          .select("auth_uid, full_name")
          .in("auth_uid", ownerIds);
        (profs || []).forEach(
          (p: any) => (nameByOwner[p.auth_uid] = p.full_name || undefined)
        );
      }

      // Build view rows
      const views: ConversationView[] = merged.map((c) => {
        const updated =
          c.last_message_at ??
          c.updated_at ??
          c.created_at ??
          new Date(0).toISOString();

        const fallbackName = (c.owner_uid && nameByOwner[c.owner_uid]) || null;
        const label =
          firstNonEmpty(
            c.customer_name,
            (c.meta as any)?.customer_name,
            (c.meta as any)?.full_name,
            (c.meta as any)?.name,
            c.address,
            (c.meta as any)?.address,
            fallbackName,
            c.title
          ) || `Conversation ${c.id.slice(0, 8)}`;

        const preview =
          c.last_message_preview ||
          (c.meta as any)?.address ||
          c.address ||
          "";

        return {
          id: c.id,
          label,
          updated_at: updated,
          preview,
          role_label: c.last_message_role || null,
          raw: c,
        };
      });

      // Sort newest first
      views.sort((a, b) => toMs(b.updated_at) - toMs(a.updated_at));

      if (mounted) {
        setRows(views);
        setLoading(false);

        // If none selected, auto-select newest (and write to URL so Chat joins)
        if (!params.get("conversation_id") && views.length > 0) {
          const next = new URLSearchParams(params);
          next.set("conversation_id", views[0].id);
          setParams(next, { replace: true });
        }
      }
    }

    load();

    // Realtime refresh on new messages and conversation updates
    const ch = supabase
      .channel("rt-inbox")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages" },
        () => setTimeout(load, 200)
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "chat_conversations" },
        () => setTimeout(load, 200)
      )
      .subscribe();

    // Also listen to staff broadcast (from Chat.tsx staffNotify fallback)
    const staff = supabase
      .channel("staff-alerts", { config: { broadcast: { self: true } } })
      .on("broadcast", { event: "user_message" }, ({ payload }) => {
        showToast("New customer message");
        setTimeout(load, 120);
        const cid = (payload as any)?.conversation_id;
        if (cid && (!selectedId || selectedId === cid)) {
          const next = new URLSearchParams(params);
          next.set("conversation_id", cid);
          setParams(next, { replace: true });
        }
      })
      .on("broadcast", { event: "assistant_replied" }, () => {
        showToast("AI replied. You can follow up now.");
        setTimeout(load, 120);
      })
      .subscribe();

    unsubRef.current = () => {
      supabase.removeChannel(ch);
      supabase.removeChannel(staff);
    };

    return () => {
      mounted = false;
      // ✅ Safe cleanup
      unsubRef.current?.();
      unsubRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Search filter (by label + preview)
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter((r) =>
      `${r.label} ${r.preview}`.toLowerCase().includes(needle)
    );
  }, [rows, q]);

  function openConversation(id: string) {
    const next = new URLSearchParams(params);
    next.set("conversation_id", id);
    setParams(next, { replace: true });
  }

  return (
    <div className="min-h-[70vh] bg-gradient-to-br from-emerald-50 via-white to-blue-50">
      {/* Top bar */}
      <div className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => nav("/agent/dashboard")}
            className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 transition"
            aria-label="Back to Agent Dashboard"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Back
          </button>
          <div className="flex items-center gap-2 text-slate-700">
            <ChatBubbleLeftRightIcon className="h-5 w-5 text-emerald-600" />
            <h1 className="text-lg font-semibold">Lead Inbox</h1>
          </div>
          <div className="ml-auto relative">
            <MagnifyingGlassIcon className="h-4 w-4 text-slate-400 absolute left-2 top-1/2 -translate-y-1/2" />
            <input
              ref={inputRef} // ✅ input-only ref
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by name or address…"
              className="pl-7 pr-3 py-1.5 rounded-lg border border-slate-200 text-sm bg-white"
            />
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="mx-auto max-w-7xl px-4 py-6 grid grid-cols-1 md:grid-cols-[380px_1fr] gap-5">
        {/* Left: My Leads */}
        <div className="rounded-2xl border border-emerald-100 bg-white/70 backdrop-blur p-0 shadow">
          <div className="px-4 py-3 border-b bg-white/70 rounded-t-2xl">
            <h2 className="text-base font-semibold text-slate-800">My Leads</h2>
          </div>

          <div className="max-h-[70vh] overflow-y-auto">
            {loading ? (
              <div className="p-4 text-slate-400">Loading…</div>
            ) : filtered.length === 0 ? (
              <div className="p-6 text-slate-500">
                No leads yet. New chat leads will appear here.
              </div>
            ) : (
              <ul className="divide-y divide-emerald-50">
                {filtered.map((c) => {
                  const recent =
                    c.updated_at &&
                    Date.now() - Date.parse(c.updated_at) < 3 * 60 * 1000; // 3 min
                  return (
                    <li key={c.id}>
                      <button
                        onClick={() => openConversation(c.id)}
                        className={cx(
                          "w-full text-left px-4 py-3 hover:bg-emerald-50/40 transition grid grid-cols-[1fr_auto] gap-2",
                          selectedId === c.id && "bg-emerald-50/60"
                        )}
                        aria-label={`Open conversation ${c.label}`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-800">
                              {c.label}
                            </span>
                            {recent && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                New
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                            {c.preview || "—"}
                          </div>
                        </div>
                        <div className="ml-2 text-right">
                          <div className="text-[11px] text-slate-400">
                            {c.updated_at
                              ? new Date(c.updated_at).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : ""}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {c.role_label ? `by ${c.role_label}` : ""}
                          </div>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        {/* Right: thread (embed Chat inline) */}
        <section className="relative min-h-[70vh] lg:min-h-[78vh]">
          {selectedId ? (
            <Chat inline />
          ) : (
            <div className="h-full grid place-items-center rounded-2xl border border-emerald-100/60 bg-white/60">
              <div className="text-slate-500">
                Select a lead on the left to open the thread.
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Toast */}
      <div
        className={cx(
          "fixed right-4 top-4 z-[60] transform transition-all",
          toast ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2 pointer-events-none"
        )}
      >
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-white/90 backdrop-blur px-3 py-2 shadow">
          <BellAlertIcon className="h-5 w-5 text-emerald-600" />
          <span className="text-sm font-semibold text-slate-800">{toast}</span>
        </div>
      </div>
    </div>
  );
}
