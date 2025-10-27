import React, { useEffect, useState } from "react";
import { supabase } from "../../utils/supabaseClient";
import Chat from "../Chat"; // reuse your FAB + inline panel

type Convo = {
  id: string;
  title: string | null;
  kind: string | null;
  created_at: string;
};

export default function MessagesChat() {
  const [rows, setRows] = useState<Convo[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setErr(null);
    setLoading(true);
    const { data, error } = await supabase
      .from("chat_conversations")
      .select("id, title, kind, created_at")
      .order("created_at", { ascending: false });
    if (error) setErr(error.message);
    setRows((data as any) || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-emerald-100/60 bg-white/70 backdrop-blur-xl p-4 shadow-lg">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Messages</h2>
          <button className="text-sm rounded-full border px-3 py-1.5 hover:bg-emerald-50" onClick={load}>
            Refresh
          </button>
        </div>
        <p className="text-slate-600 text-sm mt-1">
          Your conversations with EcoListing and agents. Use the chat button to open the panel.
        </p>
      </div>

      {err && <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-rose-800">{err}</div>}

      {loading ? (
        <div className="grid gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 rounded-2xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white/70 p-6 text-slate-600">
          No conversations yet. Tap the chat bubble to start!
        </div>
      ) : (
        <div className="grid gap-3">
          {rows.map((r) => (
            <div
              key={r.id}
              className="rounded-2xl border border-white/40 bg-white/70 backdrop-blur-xl p-4 shadow hover:shadow-md transition-all"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-900">{r.title || "My Home Search"}</div>
                  <div className="text-xs text-slate-500">
                    {r.kind || "prospect"} · {new Date(r.created_at).toLocaleString()}
                  </div>
                </div>
                <a
                  href={`/chat?conversation_id=${r.id}`}
                  className="rounded-full border px-3 py-2 text-sm hover:bg-slate-50"
                >
                  Open chat
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Embed the FAB / Panel so it’s available on this page */}
      <Chat />
    </div>
  );
}
