import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "../../utils/supabaseClient";
import Chat from "../Chat";

type Conversation = {
  id: string;
  title: string | null;
  last_message_at: string | null;
  last_message_preview: string | null;
  is_ai_enabled?: boolean | null;
  ai_snoozed_until?: string | null;
  created_at?: string | null;
};

type AgentLite = {
  auth_uid: string;
  full_name: string | null;
  email: string | null;
  is_active?: boolean | null;
};

export default function Messages() {
  const [params, setParams] = useSearchParams();

  const [convos, setConvos] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(
    (params.get("conversation_id") || "").trim() || null
  );

  const [collabs, setCollabs] = useState<AgentLite[]>([]);
  const [activeAgents, setActiveAgents] = useState<AgentLite[]>([]);

  const [addUid, setAddUid] = useState<string>("");
  const [addEmail, setAddEmail] = useState<string>("");

  const [busyAdd, setBusyAdd] = useState(false);
  const [busyAI, setBusyAI] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  // keep local selection synced with URL
  useEffect(() => {
    const q = (params.get("conversation_id") || "").trim();
    if (q && q !== selectedId) setSelectedId(q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  // fetch conversations for this agent (lean columns) + realtime refreshers
  useEffect(() => {
    let mounted = true;

    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const agentId = session?.user?.id;
      if (!agentId) return;

      const fetchConvos = async () => {
        const { data, error } = await supabase
          .from("chat_conversations")
          .select(
            "id,title,last_message_at,last_message_preview,is_ai_enabled,ai_snoozed_until"
          )
          .eq("agent_uid", agentId)
          .order("last_message_at", { ascending: false })
          .order("created_at", { ascending: false });

        if (error) {
          console.error("AgentMessages: conversations query failed", {
            message: error.message,
            details: (error as any).details,
            hint: (error as any).hint,
            code: error.code,
          });
        }

        if (!mounted) return;
        const rows = (data || []) as Conversation[];
        setConvos(rows);

        // Default selection: newest with messages, else newest
        if (!selectedId) {
          const withMsgs = rows.find((c) => !!c.last_message_at);
          const first = withMsgs?.id || rows?.[0]?.id || null;
          if (first) {
            const next = new URLSearchParams(params);
            next.set("conversation_id", first);
            setParams(next, { replace: true });
            setSelectedId(first);
          }
        } else if (!rows.some((c) => c.id === selectedId)) {
          const first = rows?.[0]?.id || null;
          const next = new URLSearchParams(params);
          if (first) next.set("conversation_id", first);
          else next.delete("conversation_id");
          setParams(next, { replace: true });
          setSelectedId(first);
        }
      };

      await fetchConvos();

      // when any new message arrives → refresh ordering + meta (last_message_*)
      const chMsgs = supabase
        .channel("rt-chat-messages")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "chat_messages" },
          fetchConvos
        )
        .subscribe();

      // also listen to conversation updates (AI toggles/snoozes/status)
      const chConvos = supabase
        .channel("rt-chat-conversations")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "chat_conversations" },
          fetchConvos
        )
        .subscribe();

      return () => {
        supabase.removeChannel(chMsgs);
        supabase.removeChannel(chConvos);
      };
    })();

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // list of active agents for "Add collaborator"
  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data, error } = await supabase
        .from("agents")
        .select("auth_uid, full_name, email, is_active")
        .eq("is_active", true)
        .order("full_name", { ascending: true });

      if (error) {
        console.warn("Agents list fetch failed (OK if RLS hides it).", error);
      }
      if (!mounted) return;
      setActiveAgents((data || []) as AgentLite[]);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // ---- collaborators (participants who are agents) --------------------------
  const loadCollaborators = async (conversationId: string) => {
    setErr(null);

    const { data: part, error: e1 } = await supabase
      .from("chat_participants")
      .select("user_uid")
      .eq("conversation_id", conversationId);

    if (e1) {
      console.error("participants fetch failed", e1);
      setCollabs([]);
      return;
    }
    const uids = Array.from(new Set((part || []).map((p: any) => p.user_uid))).filter(Boolean);
    if (uids.length === 0) {
      setCollabs([]);
      return;
    }

    const { data: agents, error: e2 } = await supabase
      .from("agents")
      .select("auth_uid, full_name, email, is_active")
      .in("auth_uid", uids);

    if (e2) {
      console.error("collab agents fetch failed", e2);
      setCollabs([]);
      return;
    }
    setCollabs((agents || []) as AgentLite[]);
  };

  useEffect(() => {
    if (!selectedId) return;
    (async () => {
      await loadCollaborators(selectedId!);

      const ch = supabase
        .channel(`rt-chat-participants-${selectedId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "chat_participants",
            filter: `conversation_id=eq.${selectedId}`,
          },
          () => loadCollaborators(selectedId)
        )
        .subscribe();

      return () => supabase.removeChannel(ch);
    })();
     
  }, [selectedId]);

  // UI helpers
  function handlePick(id: string) {
    const next = new URLSearchParams(params);
    next.set("conversation_id", id);
    setParams(next, { replace: true });
    setSelectedId(id);
    setErr(null);
    setNote(null);
  }

  const filteredAgentOptions = useMemo(() => {
    const existing = new Set(collabs.map((c) => c.auth_uid));
    return activeAgents.filter((a) => !existing.has(a.auth_uid));
  }, [activeAgents, collabs]);

  async function addByUid(uid: string) {
    if (!selectedId || !uid) return;
    setBusyAdd(true);
    setErr(null);
    setNote(null);
    try {
      const { error } = await supabase.rpc("add_agent_participant", {
        _conversation_id: selectedId,
        _agent_uid: uid,
      });
      if (error) throw error;
      setNote("Collaborator added.");
      setAddUid("");
      await loadCollaborators(selectedId);
    } catch (e: any) {
      console.error("add_agent_participant(uid) failed", e);
      setErr(e?.message || "Failed to add collaborator.");
    } finally {
      setBusyAdd(false);
    }
  }

  async function addByEmail(email: string) {
    if (!selectedId || !email) return;
    setBusyAdd(true);
    setErr(null);
    setNote(null);
    try {
      const { data: a, error: e1 } = await supabase
        .from("agents")
        .select("auth_uid, is_active")
        .eq("email", email.trim())
        .single();

      if (e1) throw e1;
      if (!a?.auth_uid) throw new Error("No agent with that email.");
      if (a?.is_active === false) throw new Error("That agent is not active.");

      const { error: e2 } = await supabase.rpc("add_agent_participant", {
        _conversation_id: selectedId,
        _agent_uid: a.auth_uid,
      });
      if (e2) throw e2;

      setNote("Collaborator added.");
      setAddEmail("");
      await loadCollaborators(selectedId);
    } catch (e: any) {
      console.error("add_agent_participant(email) failed", e);
      setErr(e?.message || "Failed to add collaborator.");
    } finally {
      setBusyAdd(false);
    }
  }

  // quick AI controls
  async function snooze15() {
    if (!selectedId) return;
    setBusyAI(true);
    try {
      const { error } = await supabase.rpc("snooze_ai", {
        _conversation_id: selectedId,
        _minutes: 15,
      });
      if (error) throw error;
    } catch (e) {
      console.error("snooze_ai failed", e);
    } finally {
      setBusyAI(false);
    }
  }
  async function setAI(enabled: boolean) {
    if (!selectedId) return;
    setBusyAI(true);
    try {
      const payload = enabled
        ? { is_ai_enabled: true, ai_snoozed_until: null }
        : { is_ai_enabled: false };
      const { error } = await supabase
        .from("chat_conversations")
        .update(payload)
        .eq("id", selectedId);
      if (error) throw error;
    } catch (e) {
      console.error("toggle AI failed", e);
    } finally {
      setBusyAI(false);
    }
  }

  const selectedConvo = convos.find((c) => c.id === selectedId) || null;

  return (
    <div className="min-h-[70vh] bg-gradient-to-tl from-blue-50 via-emerald-50 to-white flex flex-col md:flex-row">
      {/* Left: conversation list */}
      <aside className="md:w-1/3 px-4 py-8 border-r border-emerald-100 bg-white/80">
        <h2 className="text-xl font-bold text-slate-800 mb-4">Assigned Conversations</h2>
        <ul className="space-y-2">
          {convos.length === 0 && <li className="text-slate-400">No conversations assigned.</li>}
          {convos.map((c) => (
            <li
              key={c.id}
              className={`p-3 rounded-xl cursor-pointer transition ${
                selectedId === c.id
                  ? "bg-emerald-100/70 border-emerald-300 border"
                  : "hover:bg-emerald-50"
              }`}
              onClick={() => handlePick(c.id)}
              title={c.id}
            >
              <div className="font-semibold text-slate-900">
                {c.title || "Untitled"}
              </div>
              <div className="text-xs text-slate-600 truncate">
                {c.last_message_preview || ""}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                {c.last_message_at &&
                  new Date(c.last_message_at).toLocaleString(undefined, {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
              </div>
            </li>
          ))}
        </ul>
      </aside>

      {/* Right: Chat + controls */}
      <main className="flex-1 flex flex-col items-stretch px-2 py-8">
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-2">Messages</h1>
        <p className="text-slate-600">
          Chat with clients and prospects assigned to you.
        </p>

        {/* AI quick controls */}
        {selectedId && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              className="rounded-lg bg-emerald-600 text-white text-sm font-semibold px-3 py-2 disabled:opacity-50"
              onClick={snooze15}
              disabled={busyAI}
            >
              Snooze AI 15m
            </button>

            <button
              className="rounded-lg bg-slate-200 text-slate-800 text-sm font-semibold px-3 py-2 disabled:opacity-50"
              onClick={() => setAI(false)}
              disabled={busyAI}
            >
              Disable AI
            </button>

            <button
              className="rounded-lg bg-slate-200 text-slate-800 text-sm font-semibold px-3 py-2 disabled:opacity-50"
              onClick={() => setAI(true)}
              disabled={busyAI}
            >
              Enable AI
            </button>

            {selectedConvo?.ai_snoozed_until && (
              <span className="ml-2 text-xs text-slate-500">
                AI snoozed until{" "}
                {new Date(selectedConvo.ai_snoozed_until).toLocaleTimeString()}
              </span>
            )}
            {selectedConvo && selectedConvo.is_ai_enabled === false && (
              <span className="ml-2 text-xs rounded-full bg-slate-200 text-slate-700 px-2 py-1">
                AI disabled
              </span>
            )}
          </div>
        )}

        {/* Collaborators */}
        {selectedId && (
          <div className="mt-4 rounded-xl border border-emerald-100 bg-white/80 p-4 shadow">
            <div className="flex flex-col gap-3">
              <div className="font-semibold text-slate-900">Collaborators</div>

              {err && (
                <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                  {err}
                </div>
              )}
              {note && (
                <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                  {note}
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {collabs.length === 0 ? (
                  <div className="text-sm text-slate-500">No collaborators yet.</div>
                ) : (
                  collabs.map((a) => (
                    <span
                      key={a.auth_uid}
                      className="inline-flex items-center gap-2 rounded-full bg-emerald-100 text-emerald-800 px-3 py-1 text-sm"
                      title={a.email || ""}
                    >
                      <span className="font-medium">{a.full_name || a.email || a.auth_uid}</span>
                    </span>
                  ))
                )}
              </div>

              {/* Add from list */}
              <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                <label className="text-sm text-slate-600 w-40">Add from list</label>
                <div className="flex gap-2 items-center">
                  <select
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                    value={addUid}
                    onChange={(e) => setAddUid(e.target.value)}
                  >
                    <option value="">Select an active agent…</option>
                    {filteredAgentOptions.map((a) => (
                      <option key={a.auth_uid} value={a.auth_uid}>
                        {(a.full_name || a.email) ?? a.auth_uid}
                      </option>
                    ))}
                  </select>
                  <button
                    className="rounded-lg bg-emerald-600 text-white text-sm font-semibold px-3 py-2 disabled:opacity-50"
                    disabled={!addUid || busyAdd}
                    onClick={() => addByUid(addUid)}
                  >
                    {busyAdd ? "Adding…" : "Add"}
                  </button>
                </div>
              </div>

              {/* Add by email */}
              <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                <label className="text-sm text-slate-600 w-40">Add by email</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="email"
                    inputMode="email"
                    placeholder="agent@company.com"
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm w-64"
                    value={addEmail}
                    onChange={(e) => setAddEmail(e.target.value)}
                  />
                  <button
                    className="rounded-lg bg-emerald-600 text-white text-sm font-semibold px-3 py-2 disabled:opacity-50"
                    disabled={!addEmail || busyAdd}
                    onClick={() => addByEmail(addEmail)}
                  >
                    {busyAdd ? "Adding…" : "Add"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Chat panel */}
        <div className="mt-4">
          {selectedId ? (
            <Chat inline startOpen className="shadow-xl bg-white/80" key={selectedId} />
          ) : (
            <div className="text-slate-400 mt-10">Select a conversation to start chatting.</div>
          )}
        </div>
      </main>
    </div>
  );
}
