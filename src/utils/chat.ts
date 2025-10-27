// 12) ui/src/utils/chat.ts
import { supabase } from "./supabaseClient";

/* ─────────────────────────────────────────────────────────
   Types
   ──────────────────────────────────────────────────────── */
export type ChatRole = "user" | "assistant" | "agent";

export type ChatConversation = {
  id: string;
  owner_uid: string;
  kind: string;              // e.g. 'prospect'
  title: string | null;
  agent_uid: string | null;
  created_at: string;
};

export type ChatMessage = {
  id: string;
  conversation_id: string;
  role: ChatRole;
  content: string;
  created_at: string;
  sender_uid?: string | null;
};

type EnsureOpts = {
  kind?: string;
  title?: string | null;
  member_uids?: string[];
};

/* ─────────────────────────────────────────────────────────
   Session util
   ──────────────────────────────────────────────────────── */
async function requireUid() {
  const { data: sess } = await supabase.auth.getSession();
  const uid = sess?.session?.user?.id;
  if (!uid) throw new Error("Not signed in");
  return uid;
}

/* ─────────────────────────────────────────────────────────
   Conversation validation
   ──────────────────────────────────────────────────────── */
export async function validateChatConversationId(candidate?: string | null) {
  if (!candidate) return null;
  const { data } = await supabase
    .from("chat_conversations")
    .select("id")
    .eq("id", candidate)
    .maybeSingle();
  return data?.id ?? null;
}

/* ─────────────────────────────────────────────────────────
   Participants (UPSERT + tolerate 409/23505)
   ──────────────────────────────────────────────────────── */
async function upsertSelfAsParticipant(conversationId: string) {
  const uid = await requireUid();
  const { error } = await supabase
    .from("chat_participants")
    .upsert(
      { conversation_id: conversationId, user_uid: uid },
      { onConflict: "conversation_id,user_uid", ignoreDuplicates: true }
    );

  // PostgREST may still return 409 or PG 23505 on conflict; those are fine.
  if (error && (error as any)?.status !== 409 && (error as any)?.code !== "23505") throw error;
}

export async function ensureParticipant(conversation_id: string) {
  await upsertSelfAsParticipant(conversation_id);
}

export async function joinConversation(conversationId: string) {
  await upsertSelfAsParticipant(conversationId);
  return true;
}

/* ─────────────────────────────────────────────────────────
   Ensure conversation (RPC first, then table)
   ──────────────────────────────────────────────────────── */
export async function ensureConversation(opts: EnsureOpts = {}) {
  const uid = await requireUid();

  // Try RPC for back-compat
  try {
    const { data, error } = await supabase.rpc("create_conversation", {
      _kind: (opts.kind ?? "prospect") as any,
      _member_uids: Array.isArray(opts.member_uids) ? opts.member_uids : [],
      _title: typeof opts.title === "string" ? opts.title : null,
    });
    if (error) throw error;
    const id = (data as unknown as string) || null;
    if (!id) throw new Error("create_conversation returned no id");
    await upsertSelfAsParticipant(id);
    return { id };
  } catch {
    // fall through
  }

  // Reuse newest open convo
  const { data: existing } = await supabase
    .from("chat_conversations")
    .select("id")
    .eq("owner_uid", uid)
    .eq("status", "open")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let id = existing?.id as string | undefined;

  // Create if none
  if (!id) {
    const { data: created, error: insertErr } = await supabase
      .from("chat_conversations")
      .insert({
        owner_uid: uid,
        kind: opts.kind ?? "prospect",
        title: typeof opts.title === "string" ? opts.title : "My Home Search",
        status: "open",
      })
      .select("id")
      .single();
    if (insertErr) throw insertErr;
    id = created!.id as string;
  }

  await upsertSelfAsParticipant(id);

  // Best-effort enroll extra members (if RLS allows)
  if (Array.isArray(opts.member_uids) && opts.member_uids.length > 0) {
    try {
      const rows = opts.member_uids
        .filter((m) => typeof m === "string" && m && m !== uid)
        .map((m) => ({ conversation_id: id!, user_uid: m }));
      if (rows.length) {
        const { error } = await supabase
          .from("chat_participants")
          .upsert(rows, { onConflict: "conversation_id,user_uid", ignoreDuplicates: true });
        if (error && (error as any)?.status !== 409 && (error as any)?.code !== "23505") throw error;
      }
    } catch {
      // ignore
    }
  }

  return { id: id! };
}

/* ─────────────────────────────────────────────────────────
   Messages helpers
   ──────────────────────────────────────────────────────── */
export async function fetchMessages(conversationId: string, limit = 200) {
  const { data, error } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .limit(limit);
  if (error) throw error;
  return (data || []) as ChatMessage[];
}

export function subscribeToMessages(
  conversationId: string,
  onInsert: (msg: ChatMessage) => void
) {
  const channel = supabase
    .channel(`rt-chat-${conversationId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "chat_messages",
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => onInsert(payload.new as ChatMessage)
    )
    .subscribe();
  return () => supabase.removeChannel(channel);
}

/* ─────────────────────────────────────────────────────────
   AI reply trigger
   ──────────────────────────────────────────────────────── */
function getFunctionsBase() {
  const url = (import.meta as any)?.env?.VITE_SUPABASE_URL || "";
  return String(url).replace(/\/+$/, "");
}

export async function triggerAiReply(conversationId: string) {
  const { data: sess } = await supabase.auth.getSession();
  const token = sess?.session?.access_token;
  const base = getFunctionsBase();
  const url = `${base}/functions/v1/ai-reply?conversation_id=${encodeURIComponent(
    conversationId
  )}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      apikey: (import.meta as any)?.env?.VITE_SUPABASE_ANON_KEY || "",
    },
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`ai-reply failed: ${res.status} ${txt}`);
  }
  return true;
}
