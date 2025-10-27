import React, { useEffect, useState } from "react";
import { supabase } from "../utils/supabaseClient";
import { ChatBubbleLeftRightIcon, CheckIcon } from "@heroicons/react/24/outline";

type ContactMessage = {
  id: string;
  name: string;
  email: string;
  topic: string;
  subject: string | null;
  message: string;
  created_at: string;
  handled?: boolean | null;
};

function Badge({
  color = "slate",
  children,
}: {
  color?: "slate" | "emerald" | "blue" | "rose" | "amber";
  children: React.ReactNode;
}) {
  const map = {
    slate: "bg-slate-100 text-slate-700",
    emerald: "bg-emerald-50 text-emerald-700",
    blue: "bg-blue-50 text-blue-700",
    rose: "bg-rose-50 text-rose-700",
    amber: "bg-amber-50 text-amber-700",
  } as const;
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${map[color]}`}>
      {children}
    </span>
  );
}

export default function AdminContactMessages() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "new" | "handled">("all");

  useEffect(() => {
    fetchMessages();
  }, []);

  async function fetchMessages() {
    setLoading(true);
    const { data, error } = await supabase
      .from("contact_messages")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    setLoading(false);
    if (error) {
      setMessages([]);
      return;
    }
    setMessages(data as ContactMessage[]);
  }

  async function markHandled(id: string) {
    const { error } = await supabase.from("contact_messages").update({ handled: true }).eq("id", id);
    if (!error) {
      setMessages((prev) =>
        prev.map((m) => (m.id === id ? { ...m, handled: true } : m))
      );
    }
  }

  const filteredMessages = filter === "all"
    ? messages
    : filter === "new"
    ? messages.filter((m) => !m.handled)
    : messages.filter((m) => m.handled);

  return (
    <main className="container-7xl section-pad">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="hf-subheadline font-semibold flex items-center gap-2">
            <ChatBubbleLeftRightIcon className="h-6 w-6 inline" /> Contact Messages
          </h1>
          <p className="hf-body text-text-soft mt-1">
            View and manage all messages submitted via the customer contact form.
          </p>
        </div>
        <button className="btn-outline" onClick={fetchMessages}>Refresh</button>
      </header>
      <div className="mb-4 flex gap-2">
        <button
          className={`btn-outline ${filter === "all" ? "border-emerald-500 text-emerald-700" : ""}`}
          onClick={() => setFilter("all")}
        >
          All
        </button>
        <button
          className={`btn-outline ${filter === "new" ? "border-emerald-500 text-emerald-700" : ""}`}
          onClick={() => setFilter("new")}
        >
          New
        </button>
        <button
          className={`btn-outline ${filter === "handled" ? "border-emerald-500 text-emerald-700" : ""}`}
          onClick={() => setFilter("handled")}
        >
          Handled
        </button>
      </div>
      <div className="card overflow-x-auto">
        {loading ? (
          <div className="text-slate-500 py-10 text-center">Loading messages…</div>
        ) : filteredMessages.length === 0 ? (
          <div className="text-slate-500 py-10 text-center">No messages found.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500">
                <th className="py-2 pr-2">Date</th>
                <th className="py-2 pr-2">Name</th>
                <th className="py-2 pr-2">Email</th>
                <th className="py-2 pr-2">Topic</th>
                <th className="py-2 pr-2">Subject</th>
                <th className="py-2 pr-2">Message</th>
                <th className="py-2 pr-2">Status</th>
                <th className="py-2 pr-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredMessages.map((msg) => (
                <tr key={msg.id} className="border-t">
                  <td className="py-2 pr-2">{new Date(msg.created_at).toLocaleString()}</td>
                  <td className="py-2 pr-2">{msg.name}</td>
                  <td className="py-2 pr-2">{msg.email}</td>
                  <td className="py-2 pr-2">{msg.topic}</td>
                  <td className="py-2 pr-2">{msg.subject || "—"}</td>
                  <td className="py-2 pr-2" style={{ maxWidth: 320, wordBreak: "break-word" }}>{msg.message}</td>
                  <td className="py-2 pr-2">
                    {msg.handled ? (
                      <Badge color="emerald">Handled <CheckIcon className="h-4 w-4 ml-1" /></Badge>
                    ) : (
                      <Badge color="amber">New</Badge>
                    )}
                  </td>
                  <td className="py-2 pr-2 flex gap-2 flex-wrap">
                    {!msg.handled && (
                      <button
                        className="btn-outline h-8 px-3 text-xs"
                        onClick={() => markHandled(msg.id)}
                      >
                        Mark as handled
                      </button>
                    )}
                    <a
                      href={`mailto:${msg.email}`}
                      className="btn-primary h-8 px-3 text-xs"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Reply
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
}