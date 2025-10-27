// ui/src/pages/Chat.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "../utils/supabaseClient";
import {
  ensureConversation as ensureConvUtil,
  ensureParticipant as joinConvUtil,
  validateChatConversationId,
} from "../utils/chat";
import {
  PaperAirplaneIcon,
  UserCircleIcon,
  ChatBubbleLeftEllipsisIcon,
  BookOpenIcon,
  PaperClipIcon,
  FaceSmileIcon,
  XMarkIcon,
} from "@heroicons/react/24/solid";

/* ─────────────────────────────────────────────────────────
   Types & helpers
   ──────────────────────────────────────────────────────── */
// DB-layer roles/messages (may include "agent")
type Role = "user" | "assistant" | "agent";
type Msg = {
  id: string;
  conversation_id?: string | null;
  role: Role;
  content: string;
  created_at: string;
  sender_uid?: string | null;
};

// ✅ UI-layer roles/messages: strict union that the component renders against
export type ChatRole = "assistant" | "user";
export type ChatMsg = {
  id: string;
  conversation_id?: string | null;
  role: ChatRole;
  content: string;
  created_at: string;
  sender_uid?: string | null;
  who?: string; // convenience label used in UI
};

type Props = {
  inline?: boolean;
  startOpen?: boolean;
  className?: string;
};

const isUuid = (s: string | null | undefined) =>
  !!s &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s);

const VISITOR_ID_KEY = "guest_chat_visitor_id";
const getVisitorId = () => {
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
};

// Guest/local storage message
type GuestMsg = { id: string; role: Exclude<Role, "agent">; content: string; ts: number };
const GUEST_LS_KEY = "guest_chat_history_v1";
const uuid =
  () =>
    (crypto as any)?.randomUUID?.() ||
    `id_${Date.now()}_${Math.random().toString(16).slice(2)}`;

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

// Normalize any DB Msg into a UI ChatMsg (treat "agent" as "assistant" for bubbles)
function toChatMsg(m: Msg): ChatMsg {
  const role: ChatRole = m.role === "user" ? "user" : "assistant";
  return { ...m, role };
}

/* ─────────────────────────────────────────────────────────
   Component
   ──────────────────────────────────────────────────────── */
export default function Chat({ inline = false, startOpen, className = "" }: Props) {
  const [params] = useSearchParams();
  const prefill = params.get("prefill") || "";
  const pid = (params.get("pid") || "").trim() || null;
  const address = (params.get("address") || "").trim() || null;
  const rawConv = (params.get("conversation_id") || "").trim();
  const queryConvId = isUuid(rawConv) ? rawConv : null;

  const [userId, setUserId] = useState<string | null>(null);
  const [myRole, setMyRole] = useState<"user" | "agent" | "superadmin">("user");
  const [conversationId, setConversationId] = useState<string | null>(null);

  // ✅ Messages are now strictly ChatMsg with role: 'assistant' | 'user'
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const initialOpen = !!queryConvId || !!startOpen;
  const [open, setOpen] = useState<boolean>(inline ? initialOpen : initialOpen);

  const listRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | HTMLInputElement | null>(null);
  const unsubRef = useRef<(() => void) | undefined>(undefined);

  const visitor_id = useMemo(() => getVisitorId(), []);
  const lastAssistantNotifiedRef = useRef<string | null>(null);
  const navigate = useNavigate();

  /* ─────────────────────────────────────────────────────────
     Canonical wrappers (single path via utils/chat)
     ──────────────────────────────────────────────────────── */
  async function safeEnsureConversation(opts: { kind?: string; title?: string }) {
    return await ensureConvUtil(opts);
  }
  async function safeJoinConversation(convId: string) {
    await joinConvUtil(convId);
  }

  /* ─────────────────────────────────────────────────────────
     Staff notify + conv touch
     ──────────────────────────────────────────────────────── */
  async function staffNotify(
    event: "user_message" | "assistant_replied",
    payload: Record<string, any>
  ) {
    const body = { event, ...payload, text: payload.text ?? payload.excerpt ?? "" };

    if (event === "user_message") {
      try {
        await supabase.functions.invoke("chat-notify", { method: "POST", body });
      } catch {
        // ignore; UI broadcast still happens
      }
    }

    try {
      await supabase
        .channel("staff-alerts", { config: { broadcast: { self: true } } })
        .send({ type: "broadcast", event, payload: body });
    } catch {}

    try {
      if (payload.conversation_id) {
        await supabase
          .from("chat_conversations")
          .update({
            last_message_at: new Date().toISOString(),
            last_message_role: event === "user_message" ? "user" : "assistant",
            last_message_preview: String(body.text || "").slice(0, 160),
            status: "open",
          })
          .eq("id", payload.conversation_id);
      }
    } catch {}
  }

  /* ─────────────────────────────────────────────────────────
     Prefill focus
     ──────────────────────────────────────────────────────── */
  useEffect(() => {
    if (prefill) {
      setText(prefill);
      if (inputRef.current && "value" in inputRef.current) {
        (inputRef.current as HTMLInputElement | HTMLTextAreaElement).value = prefill;
      }
    }
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 0);
      return () => clearTimeout(t);
    }
  }, [prefill, open]);

  /* ─────────────────────────────────────────────────────────
     Load role, ensure/join conversation, load messages, subscribe
     ──────────────────────────────────────────────────────── */
  useEffect(() => {
    if (!open) return;

    (async () => {
      // cleanup any old subscription first
      unsubRef.current?.();
      unsubRef.current = undefined;

      const { data: sess } = await supabase.auth.getSession();
      const uid = sess?.session?.user?.id || null;
      setUserId(uid);

      if (uid) {
        const { data: r } = await supabase
          .from("user_roles")
          .select("role")
          .eq("auth_uid", uid)
          .maybeSingle();
        const role = (r?.role as any) || "user";
        setMyRole(role === "superadmin" ? "superadmin" : role === "agent" ? "agent" : "user");
      } else {
        setMyRole("user");
      }

      // Guest mode: show local history and bail
      if (!uid) {
        const guest = readGuest();
        setMessages(
          guest.map<ChatMsg>((g) => ({
            id: g.id,
            conversation_id: null,
            role: g.role, // already 'user' | 'assistant'
            content: g.content,
            created_at: new Date(g.ts).toISOString(),
          }))
        );
        setConversationId(null);
        return;
      }

      // Ensure we have/join a conversation (validate query id first)
      let convId: string | null = null;

      if (queryConvId) {
        const exists = await validateChatConversationId(queryConvId);
        if (exists) {
          await safeJoinConversation(exists);
          convId = exists;
        } else {
          const conv = await safeEnsureConversation({ kind: "prospect", title: "My Home Search" });
          convId = conv.id;
          await safeJoinConversation(convId);
          try {
            const url = new URL(window.location.href);
            url.searchParams.set("conversation_id", convId);
            window.history.replaceState({}, "", url.toString());
          } catch {}
        }
      } else {
        const conv = await safeEnsureConversation({ kind: "prospect", title: "My Home Search" });
        convId = conv.id;
        await safeJoinConversation(convId);
        try {
          const url = new URL(window.location.href);
          url.searchParams.set("conversation_id", convId);
          window.history.replaceState({}, "", url.toString());
        } catch {}
      }

      setConversationId(convId);

      // Load messages (DB -> normalize -> UI state)
      const { data, error } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("conversation_id", convId)
        .order("created_at", { ascending: true });

      setMessages(error ? [] : ((data || []) as Msg[]).map(toChatMsg));

      // Realtime subscribe
      const ch = supabase
        .channel(`rt-chat-${convId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "chat_messages",
            filter: `conversation_id=eq.${convId}`,
          },
          (payload) => setMessages((m) => [...m, toChatMsg(payload.new as Msg)])
        )
        .subscribe();
      unsubRef.current = () => supabase.removeChannel(ch);

      // If we had guest-local messages, backfill them now
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
  }, [queryConvId, open]);

  /* ─────────────────────────────────────────────────────────
     Auto-scroll
     ──────────────────────────────────────────────────────── */
  useEffect(() => {
    if (!open) return;
    listRef.current?.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages.length, sending, open]);

  /* ─────────────────────────────────────────────────────────
     Notify staff for assistant replies
     ──────────────────────────────────────────────────────── */
  useEffect(() => {
    if (!messages.length) return;
    const last = messages[messages.length - 1];
    if (last.role === "assistant" && last.id !== lastAssistantNotifiedRef.current) {
      lastAssistantNotifiedRef.current = last.id;
      staffNotify("assistant_replied", {
        conversation_id: conversationId,
        from_uid: null,
        visitor_id,
        property_id: pid,
        address,
        excerpt: last.content.slice(0, 200),
        source: "ai_reply",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length]);

  /* ─────────────────────────────────────────────────────────
     AI guest reply (Edge function)
     ──────────────────────────────────────────────────────── */
  async function getGuestReply(
    history: { role: "user" | "assistant"; content: string }[]
  ) {
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

  // Ask Postgres whether AI should reply (snooze / disable / recent agent lookback)
  async function shouldAiReplyDB(convId: string, lookbackSecs = 120): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc("should_ai_reply", {
        _conversation_id: convId,
        _lookback_seconds: lookbackSecs,
      });
      if (error) {
        console.warn("should_ai_reply RPC error", error);
        return false;
      }
      return !!data;
    } catch (e) {
      console.warn("should_ai_reply call failed", e);
      return false;
    }
  }

  /* ─────────────────────────────────────────────────────────
     Send
     ──────────────────────────────────────────────────────── */
  async function send(override?: string) {
    const content = (override ?? text).trim();
    if (!content || sending) return;
    setSending(true);
    if (!override) setText("");

    try {
      // Authenticated user/agent
      if (userId && conversationId) {
        await safeJoinConversation(conversationId);

        const roleToSend: Role = myRole === "agent" || myRole === "superadmin" ? "agent" : "user";

        const { error: insErr } = await supabase
          .from("chat_messages")
          .insert({ conversation_id: conversationId, role: roleToSend, content });
        if (insErr) throw insErr;

        // Always notify
        await staffNotify("user_message", {
          conversation_id: conversationId,
          from_uid: userId,
          visitor_id,
          property_id: pid,
          address,
          text: content,
          excerpt: content.slice(0, 200),
          source: "chat_panel",
        });

        // Agents never trigger the bot
        if (roleToSend === "agent") {
          setSending(false);
          return;
        }

        // Users: ask DB if AI should reply
        const ok = await shouldAiReplyDB(conversationId, 120);
        if (!ok) {
          setSending(false);
          return;
        }

        // Trigger AI reply (Edge Function)
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
        }); // ← semicolon needed
      } else {
        // Guest path: keep local history
        const now = Date.now();
        const userMsg: GuestMsg = { id: uuid(), role: "user", content, ts: now };
        const current = readGuest();
        const next = [...current, userMsg];
        writeGuest(next);
        setMessages((m) => [
          ...m,
          { id: userMsg.id, role: "user", content, created_at: new Date(now).toISOString(), conversation_id: null },
        ]);

        // Notify (lead capture)
        await staffNotify("user_message", {
          conversation_id: null,
          from_uid: null,
          visitor_id,
          property_id: pid,
          address,
          text: content,
          excerpt: content.slice(0, 200),
          source: "chat_panel_guest",
        });

        // Try to promote to a DB conversation via Edge Function
        try {
          const { data: created } = await supabase.functions.invoke("chat-notify", {
            method: "POST",
            body: {
              event: "user_message",
              text: content,
              visitor_id,
              property_id: pid,
              address,
            },
          });
          const newId = (created as any)?.conversation_id as string | undefined;
          if (newId) {
            await safeJoinConversation(newId);
            setConversationId(newId);

            // subscribe to realtime for that conversation
            const ch = supabase
              .channel(`rt-chat-${newId}`)
              .on(
                "postgres_changes",
                { event: "INSERT", schema: "public", table: "chat_messages", filter: `conversation_id=eq.${newId}` },
                (payload) => setMessages((m) => [...m, toChatMsg(payload.new as Msg)])
              )
              .subscribe();
            unsubRef.current = () => supabase.removeChannel(ch);

            // Ask DB if AI should reply now that it's a real conversation
            const ok = await shouldAiReplyDB(newId, 120);
            if (ok) {
              const base = (import.meta as any)?.env?.VITE_SUPABASE_URL?.replace(/\/+$/, "") || "";
              const { data: sess } = await supabase.auth.getSession();
              const token = sess?.session?.access_token;
              const url = `${base}/functions/v1/ai-reply?conversation_id=${newId}`;
              await fetch(url, {
                method: "POST",
                headers: {
                  ...(token ? { Authorization: `Bearer ${token}` } : {}),
                  apikey: (import.meta as any)?.env?.VITE_SUPABASE_ANON_KEY || "",
                },
              }); // ← semicolon here too
            }

            setSending(false);
            return; // skip guest AI; we're in DB now
          }
        } catch {
          // fall-through to guest AI
        }

        // Guest AI reply (stays local)
        const history = next.map((g) => ({ role: g.role, content: g.content }));
        const reply = await getGuestReply(history);

        const botMsg: GuestMsg = { id: uuid(), role: "assistant", content: reply, ts: Date.now() };
        const next2 = [...next, botMsg];
        writeGuest(next2);
        setMessages((m) => [
          ...m,
          { id: botMsg.id, role: "assistant", content: reply, created_at: new Date(botMsg.ts).toISOString(), conversation_id: null },
        ]);
      }
    } catch (e: any) {
      alert(e?.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  }

  /* ─────────────────────────────────────────────────────────
     Presentation helpers
     ──────────────────────────────────────────────────────── */
  const pretty = useMemo(
    () =>
      messages.map((m) => ({
        ...m,
        who: m.role === "user" ? "You" : "Repliers",
      })),
    [messages]
  );

  const isGuest = !userId;

  const supportAvatars = [
    "/avatars/support1.png",
    "/avatars/support2.png",
    "/avatars/support3.png",
    "/avatars/bot.png",
  ];

  /* ─────────────────────────────────────────────────────────
     Render
     ──────────────────────────────────────────────────────── */
  if (inline) {
    return (
      <section className={`relative w-full ${className}`}>
        {!open && (
          <button
            type="button"
            aria-label="Open chat"
            className="
              absolute -top-4 right-0 z-10
              bg-gradient-to-r from-indigo-600 to-emerald-500
              text-white shadow-lg rounded-full
              w-12 h-12 flex items-center justify-center
              focus:outline-none focus:ring-4 focus:ring-emerald-200
              hover:scale-110 transition-all
            "
            onClick={() => setOpen(true)}
          >
            <ChatBubbleLeftEllipsisIcon className="h-6 w-6" />
          </button>
        )}

        {open && (
          <div
            className="
              w-full rounded-2xl border border-emerald-100/60 bg-white/70
              shadow flex flex-col overflow-hidden
            "
          >
            {/* Header */}
            <div className="relative flex items-center justify-between bg-gradient-to-r from-indigo-700 via-blue-700 to-emerald-600 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex -space-x-3">
                  {supportAvatars.map((src, i) => (
                    <img
                      key={src}
                      src={src}
                      className="w-8 h-8 rounded-full border-2 border-white ring-1 ring-indigo-400 bg-white object-cover shadow"
                      style={{ zIndex: supportAvatars.length - i }}
                      alt="Support"
                    />
                  ))}
                </div>
                <div className="text-white font-semibold">
                  {myRole === "agent" || myRole === "superadmin" ? "You’re replying as Agent" : "Chat with us"}
                </div>
              </div>
              <button
                aria-label="Close embedded chat"
                className="p-2 rounded-full bg-white/60 hover:bg-slate-200 shadow focus:outline-none focus:ring-2 focus:ring-emerald-400 transition"
                onClick={() => setOpen(false)}
              >
                <XMarkIcon className="h-5 w-5 text-slate-700" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4" ref={listRef}>
              {pretty.length === 0 ? (
                <div className="text-slate-400 text-center mt-10 font-medium">Say hello to get started!</div>
              ) : (
                pretty.map((m) => (
                  <div
                    key={m.id}
                    className={[
                      "flex items-end",
                      m.role === "user" ? "justify-end" : "justify-start",
                    ].join(" ")}
                  >
                    {m.role !== "user" && (
                      <div className="mr-2 flex-shrink-0">
                        <UserCircleIcon className="h-8 w-8 text-indigo-400" />
                      </div>
                    )}
                    <div
                      className={[
                        "max-w-[80vw] md:max-w-[70%] px-4 py-3 rounded-2xl shadow",
                        m.role === "user"
                          ? "bg-gradient-to-r from-emerald-50 to-blue-50 text-slate-900 rounded-br-none"
                          : "bg-gradient-to-r from-indigo-600 to-sky-500 text-white rounded-bl-none",
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
                  <div className="max-w-[75%] px-4 py-2 rounded-2xl bg-slate-100 text-slate-500 shadow rounded-bl-none animate-pulse">
                    Repliers is typing…
                  </div>
                </div>
              )}
            </div>

            {/* Composer */}
            <form
              className="flex items-center gap-2 border-t border-slate-200 bg-white/90 px-3 py-3"
              onSubmit={(e) => {
                e.preventDefault();
                send();
              }}
            >
              <button type="button" className="p-2 rounded-full hover:bg-slate-200/70 transition" tabIndex={-1} aria-label="Emoji">
                <FaceSmileIcon className="h-5 w-5 text-slate-500" />
              </button>
              <button type="button" className="p-2 rounded-full hover:bg-slate-200/70 transition" tabIndex={-1} aria-label="Attach file">
                <PaperClipIcon className="h-5 w-5 text-slate-500" />
              </button>
              <input
                ref={inputRef as React.RefObject<HTMLInputElement>}
                className="h-11 flex-1 rounded-xl border border-slate-300 bg-white px-4 focus:border-emerald-400 focus:outline-none focus:ring-4 focus:ring-emerald-100 text-base transition"
                placeholder="Compose your message…"
                value={text}
                onChange={(e) => setText(e.target.value)}
                disabled={sending}
              />
              <button
                className="flex items-center justify-center rounded-full bg-gradient-to-r from-emerald-500 via-indigo-500 to-blue-600 text-white px-4 py-2 font-bold shadow hover:scale-105 focus:scale-105 transition-all h-11"
                disabled={sending || !text.trim()}
                type="submit"
                aria-label="Send"
              >
                <PaperAirplaneIcon className="h-5 w-5 rotate-45" />
              </button>
            </form>

            {isGuest && (
              <div className="px-4 py-2 text-xs text-slate-600">
                <span className="font-semibold">Tip:</span> Sign in to keep your chat and get a follow-up from an agent.
              </div>
            )}
          </div>
        )}
      </section>
    );
  }

  // Floating FAB + overlay layout (non-inline mode)
  return (
    <>
      {/* Chat FAB */}
      <button
        type="button"
        aria-label={open ? "Close chat panel" : "Open chat panel"}
        className={`
          fixed z-50 bottom-6 right-6 md:bottom-10 md:right-10
          bg-gradient-to-r from-indigo-600 to-emerald-500
          text-white shadow-lg rounded-full
          w-16 h-16 flex items-center justify-center
          focus:outline-none focus:ring-4 focus:ring-emerald-200
          hover:scale-110 transition-all
          ${open ? "hidden" : ""}
        `}
        style={{ pointerEvents: "auto" }}
        onClick={() => setOpen(true)}
      >
        <ChatBubbleLeftEllipsisIcon className="h-8 w-8" />
      </button>

      {/* Chat Panel */}
      {open && (
        <main
          className="
            fixed z-50 w-full bottom-0 left-0 right-0
            flex items-end justify-center md:justify-end px-2 pb-2 md:pb-8 md:pr-8
            transition-all
          "
          style={{ pointerEvents: "none" }}
        >
          <section
            className="
              w-full max-w-lg bg-white/90 rounded-[2.5rem]
              shadow-2xl border border-slate-100 overflow-hidden
              flex flex-col pointer-events-auto transition-all
              md:rounded-r-[2.5rem]
            "
            style={{ minHeight: "480px", maxHeight: "90vh" }}
          >
            {/* Close Button */}
            <button
              aria-label="Close chat panel"
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/60 hover:bg-slate-200 shadow focus:outline-none focus:ring-2 focus:ring-emerald-400 transition"
              style={{ pointerEvents: "auto" }}
              onClick={() => setOpen(false)}
            >
              <XMarkIcon className="h-6 w-6 text-slate-700" />
            </button>

            {/* Header */}
            <div className="relative flex flex-col items-center justify-center bg-gradient-to-r from-indigo-700 via-blue-700 to-emerald-600 px-6 py-6">
              <div className="flex items-center gap-8 mb-2">
                <button
                  className="flex flex-col items-center group cursor-pointer focus:outline-none"
                  tabIndex={0}
                  aria-label="Chat"
                  type="button"
                  style={{ pointerEvents: "auto" }}
                >
                  <ChatBubbleLeftEllipsisIcon className="h-7 w-7 text-white/80 group-hover:scale-105 transition-transform" />
                  <span className="text-xs text-white/80 pt-1 font-semibold">Chat</span>
                </button>
                <button
                  className="flex flex-col items-center group cursor-pointer focus:outline-none"
                  tabIndex={0}
                  aria-label="Help"
                  type="button"
                  style={{ pointerEvents: "auto" }}
                  onClick={() => navigate("/contact")}
                >
                  <BookOpenIcon className="h-7 w-7 text-white/80 group-hover:scale-105 transition-transform" />
                  <span className="text-xs text-white/80 pt-1 font-semibold">Help</span>
                </button>
              </div>
              {/* Avatar group */}
              <div className="flex items-center -space-x-4 mb-2">
                {["/avatars/support1.png","/avatars/support2.png","/avatars/support3.png","/avatars/bot.png"].map((src, i, arr) => (
                  <img
                    key={src}
                    src={src}
                    className="w-11 h-11 rounded-full border-4 border-white ring-2 ring-indigo-400 bg-white object-cover shadow-lg transition-all"
                    style={{ zIndex: arr.length - i }}
                    alt="Support"
                  />
                ))}
              </div>
              <div className="text-white font-semibold text-lg flex items-center gap-2">
                Questions? Chat with us!
              </div>
              <div className="flex items-center gap-2 text-green-200 text-xs mt-1">
                <span className="flex h-2 w-2 rounded-full bg-green-400 animate-pulse" /> Support is online
              </div>
            </div>

            {/* Chat area */}
            <div className="flex flex-col flex-1 bg-white/80 min-h-[350px]">
              {/* Messages */}
              <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
                {pretty.length === 0 ? (
                  <div className="text-slate-400 text-center mt-10 font-medium">Say hello to get started!</div>
                ) : (
                  pretty.map((m) => (
                    <div
                      key={m.id}
                      className={[
                        "flex items-end",
                        m.role === "user" ? "justify-end" : "justify-start",
                      ].join(" ")}
                    >
                      {m.role !== "user" && (
                        <div className="mr-2 flex-shrink-0">
                          <UserCircleIcon className="h-8 w-8 text-indigo-400" />
                        </div>
                      )}
                      <div
                        className={[
                          "max-w-[80vw] md:max-w-[70%] px-4 py-3 rounded-2xl shadow",
                          m.role === "user"
                            ? "bg-gradient-to-r from-emerald-50 to-blue-50 text-slate-900 rounded-br-none"
                            : "bg-gradient-to-r from-indigo-600 to-sky-500 text-white rounded-bl-none",
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
                    <div className="max-w-[75%] px-4 py-2 rounded-2xl bg-slate-100 text-slate-500 shadow rounded-bl-none animate-pulse">
                      Repliers is typing…
                    </div>
                  </div>
                )}
              </div>

              {/* Composer */}
              <form
                className="flex items-center gap-2 border-t border-slate-200 bg-white/90 px-3 py-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  send();
                }}
              >
                <button
                  type="button"
                  className="p-2 rounded-full hover:bg-slate-200/70 transition"
                  tabIndex={-1}
                  aria-label="Emoji"
                >
                  <FaceSmileIcon className="h-5 w-5 text-slate-500" />
                </button>
                <button
                  type="button"
                  className="p-2 rounded-full hover:bg-slate-200/70 transition"
                  tabIndex={-1}
                  aria-label="Attach file"
                >
                  <PaperClipIcon className="h-5 w-5 text-slate-500" />
                </button>
                <input
                  ref={inputRef as React.RefObject<HTMLInputElement>}
                  className="h-11 flex-1 rounded-xl border border-slate-300 bg-white px-4 focus:border-emerald-400 focus:outline-none focus:ring-4 focus:ring-emerald-100 text-base transition"
                  placeholder="Compose your message…"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  disabled={sending}
                />
                <button
                  className="flex items-center justify-center rounded-full bg-gradient-to-r from-emerald-500 via-indigo-500 to-blue-600 text-white px-4 py-2 font-bold shadow hover:scale-105 focus:scale-105 transition-all h-11"
                  disabled={sending || !text.trim()}
                  type="submit"
                  aria-label="Send"
                >
                  <PaperAirplaneIcon className="h-5 w-5 rotate-45" />
                </button>
              </form>

              {isGuest && (
                <div className="px-4 py-2 text-xs text-slate-600">
                  <span className="font-semibold">Tip:</span> Sign in to keep your chat and get a follow-up from an agent.
                </div>
              )}
            </div>
          </section>

          <style>{`
            @media (min-width: 768px) {
              main { justify-content: flex-end !important; }
            }
            @media (max-width: 640px) {
              section {
                border-radius: 1.2rem !important;
                padding-bottom: env(safe-area-inset-bottom, 0) !important;
              }
            }
          `}</style>
        </main>
      )}
    </>
  );
}
