// ui/src/pages/Agents.tsx
import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { supabase } from "../utils/supabaseClient";
import { uploadAgentHeadshot } from "../utils/storage";
import { fetchJson } from "../utils/http";

type Agent = {
  agent_id: string;
  auth_uid: string | null;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  headshot_url: string | null;
  brokerage: string | null;
  license_no: string | null;
  is_active: boolean | null;
  lat: number | null;
  lng: number | null;
  updated_at?: string | null;
};

type NewAgent = Partial<Agent> & { full_name: string; email?: string };
type EditState = { [id: string]: boolean };
type SelectedMap = { [agent_id: string]: boolean };

export default function Agents() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [openNew, setOpenNew] = useState(false);
  const [edit, setEdit] = useState<EditState>({});
  const [selected, setSelected] = useState<SelectedMap>({});

  useEffect(() => {
    (async () => {
      await refresh();
      setLoading(false);
    })();
  }, []);

  async function refresh() {
    const { data, error } = await supabase
      .from("agents")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(200);
    if (error) {
      toast.error(error.message);
      return;
    }
    setAgents((data || []) as Agent[]);
  }

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return agents;
    return agents.filter((a) =>
      [(a.full_name || ""), (a.brokerage || ""), (a.email || ""), (a.phone || "")]
        .join(" ")
        .toLowerCase()
        .includes(needle)
    );
  }, [agents, q]);

  const selectableCount = useMemo(
    () => filtered.filter((a) => !!a.auth_uid).length,
    [filtered]
  );

  const selectedUids = useMemo(
    () =>
      agents
        .filter((a) => selected[a.agent_id] && !!a.auth_uid)
        .map((a) => a.auth_uid!) as string[],
    [agents, selected]
  );

  function toggleSelect(agent: Agent) {
    if (!agent.auth_uid) {
      toast.error("This agent has no linked login (auth_uid).");
      return;
    }
    setSelected((m) => ({ ...m, [agent.agent_id]: !m[agent.agent_id] }));
  }

  function toggleSelectAll() {
    const allSelected = filtered
      .filter((a) => !!a.auth_uid)
      .every((a) => selected[a.agent_id]);
    const next: SelectedMap = { ...selected };
    if (allSelected) {
      filtered.forEach((a) => {
        if (a.auth_uid) delete next[a.agent_id];
      });
    } else {
      filtered.forEach((a) => {
        if (a.auth_uid) next[a.agent_id] = true;
      });
    }
    setSelected(next);
  }

  async function ensureSignedIn() {
    const { data } = await supabase.auth.getSession();
    if (!data.session?.user?.id) {
      toast.error("You must be signed in to start a chat.");
      throw new Error("Not signed in");
    }
    return data.session.user.id as string;
  }

  async function startChatWith(uids: string[], title?: string | null) {
    if (!uids.length) {
      toast.error("Pick at least one agent with a login to start a chat.");
      return;
    }
    await ensureSignedIn(); // caller must be logged in; Edge function adds caller as a member

    type CreateConvoResp = { id: string };
    const res = await toast.promise(
      supabase.functions.invoke<CreateConvoResp>("create-conversation", {
        method: "POST",
        body: { kind: "internal", title: title ?? null, member_uids: uids },
      }),
      { loading: "Starting chat…", success: "Chat created", error: (e) => String((e as any)?.message || e) }
    );

    const id = (res.data as any)?.id;
    if (!id) return toast.error("No conversation id returned");
    window.location.href = `/chat?conversation_id=${id}`;
  }

  async function handleStartChatBulk() {
    if (!selectedUids.length) {
      return toast.error("Select at least one agent (with login).");
    }
    const title = window.prompt("Chat title (optional):", "Team Chat");
    await startChatWith(selectedUids, title ?? null);
  }

  async function toggleActive(a: Agent) {
    await toast.promise(
      (async () => {
        const { error } = await supabase
          .from("agents")
          .update({ is_active: !a.is_active })
          .eq("agent_id", a.agent_id);
        if (error) throw error;
        setAgents((list) =>
          list.map((x) => (x.agent_id === a.agent_id ? { ...x, is_active: !a.is_active } : x))
        );
      })(),
      { loading: "Updating status...", success: "Status updated", error: (e) => String((e as any).message || e) }
    );
  }

  async function removeAgent(a: Agent) {
    if (!confirm(`Delete agent "${a.full_name || ""}"? This won’t remove their auth user.`)) return;
    await toast.promise(
      (async () => {
        const { error } = await supabase.from("agents").delete().eq("agent_id", a.agent_id);
        if (error) throw error;
        setAgents((list) => list.filter((x) => x.agent_id !== a.agent_id));
      })(),
      { loading: "Deleting agent...", success: "Deleted", error: (e) => String((e as any).message || e) }
    );
  }

  if (loading) {
    return (
      <div className="p-4 md:p-6">
        <div className="skeleton h-8 w-36 rounded-md" />
        <div className="mt-4 space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="skeleton h-14 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-xl font-semibold">Agents</h2>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name, brokerage, email, phone"
          className="input w-80 rounded border px-3 py-2"
        />
        <div className="ml-auto flex items-center gap-2">
          <button
            className="btn-outline"
            disabled={!selectableCount}
            onClick={toggleSelectAll}
            title={selectableCount ? "Toggle select all (only agents with login)" : "No selectable agents in view"}
          >
            {filtered.filter((a) => !!a.auth_uid).every((a) => selected[a.agent_id]) && selectableCount
              ? "Unselect all"
              : "Select all"}
          </button>
          <button
            className="btn-primary"
            onClick={handleStartChatBulk}
            disabled={selectedUids.length === 0}
            title="Start a chat with selected agents"
          >
            Start chat ({selectedUids.length})
          </button>
          <button className="btn-primary" onClick={() => setOpenNew(true)}>
            + Add Agent
          </button>
        </div>
      </div>

      {/* List */}
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500">
              <th className="py-2 pr-2 w-10">Sel</th>
              <th className="py-2 pr-2">Agent</th>
              <th className="py-2 pr-2">Contact</th>
              <th className="py-2 pr-2">Brokerage</th>
              <th className="py-2 pr-2">Login</th>
              <th className="py-2 pr-2">Status</th>
              <th className="py-2 pr-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((a) => (
              <Row
                key={a.agent_id}
                a={a}
                selected={!!selected[a.agent_id]}
                onToggleSelect={() => toggleSelect(a)}
                onStartDirectChat={() =>
                  a.auth_uid
                    ? startChatWith([a.auth_uid], `Chat with ${a.full_name || "Agent"}`)
                    : toast.error("This agent has no linked login")
                }
                editing={!!edit[a.agent_id]}
                onEditToggle={() => setEdit((s) => ({ ...s, [a.agent_id]: !s[a.agent_id] }))}
                onSaved={async (patch) => {
                  setAgents((list) => list.map((x) => (x.agent_id === a.agent_id ? { ...x, ...patch } : x)));
                  setEdit((s) => ({ ...s, [a.agent_id]: false }));
                }}
                onRefresh={refresh}
                onToggleActive={() => toggleActive(a)}
                onDelete={() => removeAgent(a)}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Create modal */}
      {openNew && (
        <NewAgentModal
          onClose={() => setOpenNew(false)}
          onCreated={(row) => {
            setAgents((prev) => [row, ...prev]);
            setOpenNew(false);
          }}
        />
      )}
    </div>
  );
}

function Row({
  a,
  selected,
  onToggleSelect,
  onStartDirectChat,
  editing,
  onEditToggle,
  onSaved,
  onRefresh,
  onToggleActive,
  onDelete,
}: {
  a: Agent;
  selected: boolean;
  onToggleSelect: () => void;
  onStartDirectChat: () => void;
  editing: boolean;
  onEditToggle: () => void;
  onSaved: (patch: Partial<Agent>) => void;
  onRefresh: () => void;
  onToggleActive: () => void;
  onDelete: () => void;
}) {
  const [local, setLocal] = useState<Partial<Agent>>(a);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => setLocal(a), [a.agent_id]); // reset upon switching rows

  async function save() {
    setBusy(true);
    try {
      const patch = {
        full_name: local.full_name ?? null,
        email: local.email ?? null,
        phone: local.phone ?? null,
        brokerage: local.brokerage ?? null,
        license_no: local.license_no ?? null,
        lat: local.lat ?? null,
        lng: local.lng ?? null,
        auth_uid: local.auth_uid ?? null,
      };

      await toast.promise(
        (async () => {
          const { error } = await supabase.from("agents").update(patch).eq("agent_id", a.agent_id);
          if (error) throw error;
        })(),
        { loading: "Saving changes...", success: "Saved", error: (e) => String((e as any).message || e) }
      );

      let headshot_url: string | undefined;
      if (file) {
        headshot_url = await toast.promise(
          (async () => {
            const url = await uploadAgentHeadshot(file, a.agent_id);
            const { error } = await supabase.from("agents").update({ headshot_url: url }).eq("agent_id", a.agent_id);
            if (error) throw error;
            return url;
          })(),
          { loading: "Uploading photo...", success: "Photo updated", error: (e) => String((e as any).message || e) }
        );
      }

      onSaved({ ...patch, ...(headshot_url ? { headshot_url } : {}) });
    } finally {
      setBusy(false);
    }
  }

  async function inviteAndLink() {
    if (!local.email) return toast.error("Email is required to invite");
    const res = await toast.promise(
      fetchJson(`/functions/v1/admin-invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: local.email, full_name: local.full_name || undefined }),
      }),
      { loading: "Sending invite...", success: "Invite sent", error: (e) => String((e as any).message || e) }
    );

    if (res?.auth_uid) {
      await toast.promise(
        (async () => {
          const { error } = await supabase
            .from("agents")
            .update({ auth_uid: res.auth_uid as string })
            .eq("agent_id", a.agent_id);
          if (error) throw error;
          onRefresh();
        })(),
        { loading: "Linking account...", success: "Linked", error: (e) => String((e as any).message || e) }
      );
    }
  }

  async function sendRecovery() {
    if (!local.email) return toast.error("Email required");
    await toast.promise(
      fetchJson(`/functions/v1/admin-recovery`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: local.email }),
      }),
      { loading: "Sending reset email...", success: "Reset email sent", error: (e) => String((e as any).message || e) }
    );
  }

  return (
    <tr className="border-t align-top">
      <td className="py-3 pr-2">
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggleSelect}
          disabled={!a.auth_uid}
          title={a.auth_uid ? "Select for chat" : "Agent has no login"}
        />
      </td>

      <td className="py-3 pr-2">
        <div className="flex items-center gap-3">
          {a.headshot_url ? (
            <img src={a.headshot_url} alt="" className="h-10 w-10 rounded-full object-cover" />
          ) : (
            <div className="h-10 w-10 rounded-full bg-slate-200" />
          )}
          {editing ? (
            <div className="grid gap-2">
              <input
                className="input rounded border px-2 py-1"
                value={local.full_name || ""}
                onChange={(e) => setLocal((s) => ({ ...s, full_name: e.target.value }))}
                placeholder="Full name"
              />
              <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            </div>
          ) : (
            <div>
              <div className="font-medium">{a.full_name || "Unnamed"}</div>
              <div className="text-xs text-slate-500">{a.license_no || ""}</div>
            </div>
          )}
        </div>
      </td>

      <td className="py-3 pr-2">
        {editing ? (
          <div className="grid gap-2">
            <input
              className="input rounded border px-2 py-1"
              value={local.email || ""}
              onChange={(e) => setLocal((s) => ({ ...s, email: e.target.value }))}
              placeholder="email"
            />
            <input
              className="input rounded border px-2 py-1"
              value={local.phone || ""}
              onChange={(e) => setLocal((s) => ({ ...s, phone: e.target.value }))}
              placeholder="phone"
            />
          </div>
        ) : (
          <>
            <div>{a.email || "—"}</div>
            <div className="text-slate-500">{a.phone || "—"}</div>
          </>
        )}
      </td>

      <td className="py-3 pr-2">
        {editing ? (
          <div className="grid gap-2">
            <input
              className="input rounded border px-2 py-1"
              value={local.brokerage || ""}
              onChange={(e) => setLocal((s) => ({ ...s, brokerage: e.target.value }))}
              placeholder="brokerage"
            />
            <input
              className="input rounded border px-2 py-1"
              value={local.license_no || ""}
              onChange={(e) => setLocal((s) => ({ ...s, license_no: e.target.value }))}
              placeholder="license no"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                className="input rounded border px-2 py-1"
                value={local.lat ?? ""}
                onChange={(e) =>
                  setLocal((s) => ({ ...s, lat: e.target.value === "" ? null : Number(e.target.value) }))
                }
                placeholder="lat"
              />
              <input
                className="input rounded border px-2 py-1"
                value={local.lng ?? ""}
                onChange={(e) =>
                  setLocal((s) => ({ ...s, lng: e.target.value === "" ? null : Number(e.target.value) }))
                }
                placeholder="lng"
              />
            </div>
          </div>
        ) : (
          <>
            <div>{a.brokerage || "—"}</div>
            <div className="text-xs text-slate-500">
              {a.lat != null && a.lng != null ? `(${a.lat}, ${a.lng})` : "—"}
            </div>
          </>
        )}
      </td>

      <td className="py-3 pr-2">
        {editing ? (
          <div className="grid gap-2">
            <input
              className="input rounded border px-2 py-1 font-mono text-xs"
              value={local.auth_uid || ""}
              onChange={(e) => setLocal((s) => ({ ...s, auth_uid: e.target.value || null }))}
              placeholder="auth_uid (optional)"
            />
            <div className="flex gap-2">
              <button className="btn-outline text-xs" onClick={inviteAndLink}>
                Invite & Link
              </button>
              <button className="btn-outline text-xs" onClick={sendRecovery} disabled={!local.email}>
                Send Reset
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs">{a.auth_uid || "—"}</span>
            <button className="btn-outline text-xs" onClick={onStartDirectChat} disabled={!a.auth_uid}>
              Message
            </button>
          </div>
        )}
      </td>

      <td className="py-3 pr-2">
        <span
          className={`inline-flex rounded-full px-2 py-0.5 text-xs ${
            a.is_active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"
          }`}
        >
          {a.is_active ? "active" : "inactive"}
        </span>
      </td>

      <td className="py-3 pr-2">
        {editing ? (
          <div className="flex gap-2">
            <button className="btn-primary" onClick={save} disabled={busy}>
              {busy ? "Saving…" : "Save"}
            </button>
            <button className="btn-outline" onClick={onEditToggle} disabled={busy}>
              Cancel
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            <button className="btn-outline" onClick={onEditToggle}>
              Edit
            </button>
            <button className="btn-outline" onClick={onToggleActive}>
              {a.is_active ? "Deactivate" : "Activate"}
            </button>
            <button className="btn-outline" onClick={onDelete}>
              Delete
            </button>
          </div>
        )}
      </td>
    </tr>
  );
}

function NewAgentModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (row: Agent) => void;
}) {
  const [form, setForm] = useState<NewAgent>({ full_name: "" });
  const [file, setFile] = useState<File | null>(null);
  const [invite, setInvite] = useState(true);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const inserted = await toast.promise(
        (async () => {
          const { data, error } = await supabase
            .from("agents")
            .insert({
              full_name: form.full_name,
              email: form.email ?? null,
              phone: form.phone ?? null,
              brokerage: form.brokerage ?? null,
              license_no: form.license_no ?? null,
              is_active: true,
              lat: form.lat ?? null,
              lng: form.lng ?? null,
            })
            .select("*")
            .single();
          if (error) throw error;
          return data as Agent;
        })(),
        { loading: "Creating agent...", success: "Agent created", error: (e) => String((e as any).message || e) }
      );

      let headshot_url: string | undefined;
      if (file) {
        headshot_url = await toast.promise(
          (async () => {
            const url = await uploadAgentHeadshot(file, inserted.agent_id);
            const { error } = await supabase.from("agents").update({ headshot_url: url }).eq("agent_id", inserted.agent_id);
            if (error) throw error;
            return url;
          })(),
          { loading: "Uploading photo...", success: "Photo uploaded", error: (e) => String((e as any).message || e) }
        );
      }

      if (invite && form.email) {
        const res = await toast.promise(
          fetchJson(`/functions/v1/admin-invite`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: form.email, full_name: form.full_name }),
          }),
          { loading: "Sending invite...", success: "Invite sent", error: (e) => String((e as any).message || e) }
        );

        if (res?.auth_uid) {
          await toast.promise(
            (async () => {
              const { error } = await supabase
                .from("agents")
                .update({ auth_uid: res.auth_uid as string })
                .eq("agent_id", inserted.agent_id);
              if (error) throw error;
            })(),
            { loading: "Linking account...", success: "Linked", error: (e) => String((e as any).message || e) }
          );
        }
      }

      onCreated({ ...inserted, ...(headshot_url ? { headshot_url } : {}) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4">
      <div className="w-full max-w-2xl rounded-lg bg-white p-5 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Add Agent</h3>
          <button onClick={onClose} className="btn-outline">Close</button>
        </div>

        <form className="mt-4 grid gap-3" onSubmit={submit}>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <input
              className="input rounded border px-3 py-2"
              placeholder="Full name *"
              required
              value={form.full_name}
              onChange={(e) => setForm((s) => ({ ...s, full_name: e.target.value }))}
            />
            <input
              className="input rounded border px-3 py-2"
              placeholder="Email"
              value={form.email || ""}
              onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))}
            />
            <input
              className="input rounded border px-3 py-2"
              placeholder="Phone"
              value={form.phone || ""}
              onChange={(e) => setForm((s) => ({ ...s, phone: e.target.value }))}
            />
            <input
              className="input rounded border px-3 py-2"
              placeholder="Brokerage"
              value={form.brokerage || ""}
              onChange={(e) => setForm((s) => ({ ...s, brokerage: e.target.value }))}
            />
            <input
              className="input rounded border px-3 py-2"
              placeholder="License #"
              value={form.license_no || ""}
              onChange={(e) => setForm((s) => ({ ...s, license_no: e.target.value }))}
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                className="input rounded border px-3 py-2"
                placeholder="Lat"
                value={form.lat ?? ""}
                onChange={(e) =>
                  setForm((s) => ({ ...s, lat: e.target.value === "" ? null : Number(e.target.value) }))
                }
              />
              <input
                className="input rounded border px-3 py-2"
                placeholder="Lng"
                value={form.lng ?? ""}
                onChange={(e) =>
                  setForm((s) => ({ ...s, lng: e.target.value === "" ? null : Number(e.target.value) }))
                }
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            <label className="inline-flex items-center gap-2 text-sm">
              <input type="checkbox" checked={invite} onChange={(e) => setInvite(e.target.checked)} />
              Invite to create login & link automatically
            </label>
          </div>

          <div className="mt-2 flex items-center gap-2">
            <button className="btn-primary" disabled={busy}>
              {busy ? "Saving…" : "Create agent"}
            </button>
            <button className="btn-outline" type="button" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
