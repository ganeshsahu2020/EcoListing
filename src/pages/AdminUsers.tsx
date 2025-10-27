// src/pages/AdminUsers.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { supabase } from "../utils/supabaseClient";
import {
  ArrowPathIcon,
  AtSymbolIcon,
  CheckIcon,
  ClipboardIcon,
  EnvelopeOpenIcon,
  InformationCircleIcon,
  KeyIcon,
  MagnifyingGlassIcon,
  UserPlusIcon,
  UserIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

/* ─────────────────────────────────────────────────────────
   Small helpers
   ──────────────────────────────────────────────────────── */
function cx(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

function unwrapFn<T>(p: Promise<{ data: T | null; error: any }>) {
  return p.then(({ data, error }) => {
    if (error) {
      const body = (error as any).context?.body;
      const status = (error as any).context?.response?.status;
      const msg =
        body?.error ||
        body?.message ||
        (typeof body === "string" ? body : undefined) ||
        error.message ||
        `HTTP ${status || "400"}`;
      throw new Error(msg);
    }
    return data as T;
  });
}

function humanIdFromUid(uid: string) {
  // Friendly, stable code from UUID (no DB change required)
  const hex = uid.replace(/-/g, "").slice(0, 10);
  const num = parseInt(hex || "0", 16);
  return `USR-${num.toString(36).toUpperCase().padStart(7, "0")}`;
}

/* ─────────────────────────────────────────────────────────
   UI atoms
   ──────────────────────────────────────────────────────── */
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
    <span className={cx("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", map[color])}>
      {children}
    </span>
  );
}

function Copy({ value, small }: { value: string; small?: boolean }) {
  const [ok, setOk] = useState(false);
  return (
    <button
      type="button"
      title="Copy"
      onClick={async () => {
        await navigator.clipboard.writeText(value);
        setOk(true);
        setTimeout(() => setOk(false), 1200);
      }}
      className={cx(
        "inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs hover:bg-slate-50",
        small ? "border-slate-200" : "border-slate-300"
      )}
    >
      {ok ? <CheckIcon className="h-4 w-4 text-emerald-600" /> : <ClipboardIcon className="h-4 w-4 text-slate-600" />}
      {ok ? "Copied" : "Copy"}
    </button>
  );
}

function Field({
  label,
  hint,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) {
  return (
    <label className="grid gap-1">
      <span className="hf-small text-slate-700">{label}</span>
      <input
        {...props}
        className={cx(
          "h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-slate-900 placeholder:text-slate-400 focus:border-emerald-400 focus:outline-none focus:ring-4 focus:ring-emerald-100",
          props.className
        )}
      />
      {hint && <span className="hf-micro text-slate-500">{hint}</span>}
    </label>
  );
}

function Card({ title, right, children }: { title: string; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="card overflow-x-hidden p-4 md:p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold text-text-darkest">{title}</h3>
        {right}
      </div>
      {children}
    </section>
  );
}

/* ─────────────────────────────────────────────────────────
   Types
   ──────────────────────────────────────────────────────── */
type Role = "user" | "agent" | "superadmin";
type RoleRow = { auth_uid: string; role: Role; created_at: string };

type Agent = {
  agent_id: string;
  auth_uid: string | null;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  brokerage: string | null;
  headshot_url: string | null;
  is_active: boolean | null;
  updated_at: string | null;
};

type OverrideRow = {
  id: string;
  market_code: string | null;
  listing_id: string | null;
  always_internal: boolean;
  active: boolean;
  created_at: string;
};

type Person = {
  uid: string;
  role: Role;
  created_at: string;
  name: string | null;
  email: string | null;
  avatar_url: string | null;
  agent_id?: string | null;
  human_id: string;
  source: "agent" | "auth" | "unknown";
};

/* ─────────────────────────────────────────────────────────
   Main Page
   ──────────────────────────────────────────────────────── */
export default function AdminUsers() {
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [q, setQ] = useState("");
  const [bulkOpen, setBulkOpen] = useState(false);

  // Overrides
  const [overrides, setOverrides] = useState<OverrideRow[]>([]);
  const [ovForm, setOvForm] = useState<{ market_code?: string; listing_id?: string; always_internal?: boolean }>({
    always_internal: true,
  });

  // simple cache for lookup results
  const lookupCache = useRef<Record<string, { email?: string | null; full_name?: string | null; avatar_url?: string | null }>>({});

  useEffect(() => {
    (async () => {
      await Promise.all([refreshRoles(), refreshAgents(), refreshOverrides()]);
      await buildPeople();
      setLoading(false);
    })();
  }, []);

  // Realtime example kept (optional)
  useEffect(() => {
    const ch = supabase
      .channel("rt-activity")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "property_activity" },
        (payload) => console.log("New activity", payload.new)
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, []);

  async function refreshRoles() {
    const { data, error } = await supabase.from("user_roles").select("*").order("created_at", { ascending: false });
    if (error) console.error(error);
    setRoles((data || []) as RoleRow[]);
  }

  async function refreshAgents() {
    const { data, error } = await supabase
      .from("agents")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(500);
    if (error) console.error(error);
    setAgents((data || []) as Agent[]);
  }

  async function refreshOverrides() {
    const { data, error } = await supabase
      .from("agent_display_overrides")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      console.warn("agent_display_overrides not found (optional):", (error as any).message);
      setOverrides([]);
      return;
    }
    setOverrides((data || []) as OverrideRow[]);
  }

  async function adminLookupByUid(uid: string) {
    if (lookupCache.current[uid]) return lookupCache.current[uid];
    const payload = await unwrapFn<{ auth_uid: string | null; email?: string | null; full_name?: string | null; avatar_url?: string | null }>(
      supabase.functions.invoke("admin-lookup", { body: { uid } })
    );
    lookupCache.current[uid] = { email: payload?.email ?? null, full_name: payload?.full_name ?? null, avatar_url: payload?.avatar_url ?? null };
    return lookupCache.current[uid];
  }

  async function buildPeople() {
    // join roles → agents first, then fill gaps via admin-lookup
    const byUidAgent = new Map(
      agents
        .filter((a) => a.auth_uid)
        .map((a) => [
          String(a.auth_uid),
          {
            name: a.full_name,
            email: a.email,
            avatar_url: a.headshot_url,
            agent_id: a.agent_id,
          },
        ])
    );

    const enriched: Person[] = [];
    for (const r of roles) {
      const aid = byUidAgent.get(r.auth_uid);
      if (aid) {
        enriched.push({
          uid: r.auth_uid,
          role: r.role,
          created_at: r.created_at,
          name: aid.name ?? null,
          email: aid.email ?? null,
          avatar_url: aid.avatar_url ?? null,
          agent_id: aid.agent_id,
          human_id: humanIdFromUid(r.auth_uid),
          source: "agent",
        });
        continue;
      }
      // fallback lookup
      try {
        const lk = await adminLookupByUid(r.auth_uid);
        enriched.push({
          uid: r.auth_uid,
          role: r.role,
          created_at: r.created_at,
          name: lk.full_name ?? null,
          email: lk.email ?? null,
          avatar_url: lk.avatar_url ?? null,
          agent_id: undefined,
          human_id: humanIdFromUid(r.auth_uid),
          source: "auth",
        });
      } catch {
        enriched.push({
          uid: r.auth_uid,
          role: r.role,
          created_at: r.created_at,
          name: null,
          email: null,
          avatar_url: null,
          agent_id: undefined,
          human_id: humanIdFromUid(r.auth_uid),
          source: "unknown",
        });
      }
    }

    setPeople(enriched);
  }

  const filteredPeople = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return people;
    return people.filter((p) =>
      [p.name || "", p.email || "", p.human_id, p.uid].join(" ").toLowerCase().includes(needle)
    );
  }, [people, q]);

  /* ───────── Invite / Recovery ───────── */
  async function inviteSingle(email: string, full_name?: string) {
    if (!email.includes("@")) return toast.error("Enter a valid email.");
    await toast.promise(unwrapFn(supabase.functions.invoke("admin-invite", { body: { email, full_name } })), {
      loading: "Sending invite...",
      success: `Invite sent to ${email}`,
      error: (e: any) => String(e?.message || e),
    });
  }

  async function sendRecovery(email: string) {
    if (!email.includes("@")) return toast.error("Enter a valid email.");
    await toast.promise(unwrapFn(supabase.functions.invoke("admin-recovery", { body: { email } })), {
      loading: "Sending recovery email...",
      success: `Recovery email sent to ${email}`,
      error: (e: any) => String(e?.message || e),
    });
  }

  /* ───────── Roles ───────── */
  const setRole = async (uid: string, role: Role): Promise<void> => {
    if (!uid) {
      toast.error("auth_uid is required");
      return;
    }
    const { error } = await supabase
      .from("user_roles")
      .upsert({ auth_uid: uid, role })
      .eq("auth_uid", uid);
    if (error) {
      toast.error(error.message);
      return;
    }
    await refreshRoles();
    await buildPeople();
    toast.success("Role updated");
  };

  const removeRole = async (uid: string): Promise<void> => {
    if (!confirm("Remove this role?")) return;
    const { error } = await supabase
      .from("user_roles")
      .delete()
      .eq("auth_uid", uid);
    if (error) {
      toast.error(error.message);
      return;
    }
    await refreshRoles();
    await buildPeople();
    toast.success("Role removed");
  };

  /* ───────── Overrides ───────── */
  async function addOverride() {
    const payload = {
      market_code: ovForm.market_code || null,
      listing_id: ovForm.listing_id || null,
      always_internal: !!ovForm.always_internal,
      active: true,
    };
    await toast.promise(
      supabase.from("agent_display_overrides").insert(payload) as unknown as Promise<any>,
      {
        loading: "Saving override...",
        success: "Override saved",
        error: (e: any) => e.message,
      }
    );
    setOvForm({ always_internal: true });
    await refreshOverrides();
  }

  async function toggleOverride(row: OverrideRow) {
    await toast.promise(
      (supabase
        .from("agent_display_overrides")
        .update({ active: !row.active })
        .eq("id", row.id)) as unknown as Promise<any>,
      {
        loading: "Updating...",
        success: "Updated",
        error: (e: any) => e.message,
      }
    );
    await refreshOverrides();
  }

  async function deleteOverride(id: string) {
    if (!confirm("Delete this override?")) return;
    await toast.promise(
      (supabase
        .from("agent_display_overrides")
        .delete()
        .eq("id", id)) as unknown as Promise<any>,
      {
        loading: "Deleting...",
        success: "Deleted",
        error: (e: any) => e.message,
      }
    );
    await refreshOverrides();
  }

  /* ───────── Bulk invite ───────── */
  async function bulkInvite(list: string) {
    const emails = list
      .split(/[\n,;\s]+/g)
      .map((e) => e.trim())
      .filter(Boolean);
    if (!emails.length) return toast.error("Paste at least one email.");

    const p = (async () => {
      let ok = 0,
        fail = 0;
      for (const email of emails) {
        try {
          await unwrapFn(supabase.functions.invoke("admin-invite", { body: { email } }));
          ok++;
        } catch {
          fail++;
        }
      }
      return { ok, fail };
    })();

    await toast.promise(p, {
      loading: "Sending invites…",
      success: (r) => `Invites sent: ${r.ok}. Failed: ${r.fail}.`,
      error: "Failed to send invites.",
    });
  }

  /* ───────── NEW: Start chat (per person) using EXACT helper ───────── */
  async function startChatWith(uids: string[], title?: string) {
    const { data, error } = await supabase.rpc("create_conversation", {
      _kind: "internal",
      _title: title ?? null,
      _member_uids: uids,
    });
    if (error) throw error;
    const id = String(data);
    window.location.href = `/chat?conversation_id=${id}`;
  }

  if (loading) {
    return (
      <main className="container-7xl section-pad">
        <div className="skeleton h-8 w-48 rounded-lg" />
        <div className="mt-4 grid gap-5 md:grid-cols-2">
          <div className="skeleton h-56 rounded-xl" />
          <div className="skeleton h-56 rounded-xl" />
        </div>
        <div className="mt-6 space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="skeleton h-14 rounded-xl" />
          ))}
        </div>
      </main>
    );
  }

  return (
    <main className="container-7xl section-pad">
      <header className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="hf-subheadline font-semibold text-text-darkest">User Management</h1>
          <p className="hf-body text-text-soft">
            Invite agents, manage roles, send recovery emails, and control which agent is shown on listings.
          </p>
        </div>
        <Link to="/agents" className="btn-primary">
          <UserPlusIcon className="mr-2 h-5 w-5" /> Manage Agents
        </Link>
      </header>

      {/* Top grid */}
      <div className="grid gap-5 md:grid-cols-2">
        <InviteCard onInvite={inviteSingle} onOpenBulk={() => setBulkOpen(true)} />
        <QuickActions onRecovery={sendRecovery} />
      </div>

      {/* People (roles enriched) */}
      <div className="mt-6 grid gap-5 lg:grid-cols-[2fr_1fr]">
        <PeopleCard
          people={filteredPeople}
          q={q}
          onQ={setQ}
          onSetRole={setRole}
          onRemoveRole={removeRole}
          onStartChat={(uid, displayName) => startChatWith([uid], displayName ? `Chat with ${displayName}` : "Direct chat")}
        />
        <RawRolesCard roles={roles} />
      </div>

      {/* Overrides */}
      <div className="mt-6">
        <Card
          title="Agent Display Overrides"
          right={
            <div className="text-slate-500 hf-small flex items-center gap-2">
              <InformationCircleIcon className="h-4 w-4" />
              Force “internal agent” for a market or specific listing.
            </div>
          }
        >
          <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
            <Field
              label="Market code"
              placeholder="ex: SFO, NYC (optional)"
              value={ovForm.market_code || ""}
              onChange={(e) => setOvForm((s) => ({ ...s, market_code: e.target.value }))}
              hint="Leave blank to target a single listing below."
            />
            <Field
              label="Listing ID"
              placeholder="ex: MLS-12345 (optional)"
              value={ovForm.listing_id || ""}
              onChange={(e) => setOvForm((s) => ({ ...s, listing_id: e.target.value }))}
              hint="Leave blank to target an entire market."
            />
            <label className="mt-6 inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={!!ovForm.always_internal}
                onChange={(e) => setOvForm((s) => ({ ...s, always_internal: e.target.checked }))}
              />
              Always show internal agent
            </label>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <button className="btn-primary" onClick={addOverride}>
              Save override
            </button>
            <div className="hf-small text-slate-500">
              At least one of <code className="font-mono">market_code</code> or <code className="font-mono">listing_id</code> must be
              set.
            </div>
          </div>

          <div className="mt-4 overflow-x-auto">
            {overrides.length === 0 ? (
              <div className="text-slate-500">No overrides yet.</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500">
                    <th className="py-2 pr-2">Market</th>
                    <th className="py-2 pr-2">Listing</th>
                    <th className="py-2 pr-2">Mode</th>
                    <th className="py-2 pr-2">Status</th>
                    <th className="py-2 pr-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {overrides.map((o) => (
                    <tr key={o.id} className="border-t">
                      <td className="py-2 pr-2">{o.market_code || "—"}</td>
                      <td className="py-2 pr-2">{o.listing_id || "—"}</td>
                      <td className="py-2 pr-2">
                        <Badge color={o.always_internal ? "blue" : "slate"}>
                          {o.always_internal ? "always-internal" : "default"}
                        </Badge>
                      </td>
                      <td className="py-2 pr-2">
                        <Badge color={o.active ? "emerald" : "slate"}>{o.active ? "active" : "inactive"}</Badge>
                      </td>
                      <td className="py-2 pr-2">
                        <div className="flex gap-2">
                          <button className="btn-outline h-8 px-3 text-xs" onClick={() => toggleOverride(o)}>
                            {o.active ? "Disable" : "Enable"}
                          </button>
                          <button className="btn-outline h-8 px-3 text-xs" onClick={() => deleteOverride(o.id)}>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </Card>
      </div>

      {bulkOpen && <BulkInviteModal onClose={() => setBulkOpen(false)} onInvite={bulkInvite} />}
    </main>
  );
}

/* ─────────────────────────────────────────────────────────
   Subcomponents (Aesthetic People view)
   ──────────────────────────────────────────────────────── */

function InviteCard({
  onInvite,
  onOpenBulk,
}: {
  onInvite: (email: string, name?: string) => void;
  onOpenBulk: () => void;
}) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");

  return (
    <Card title="Invite Agent" right={<button className="btn-outline h-10 px-3" onClick={onOpenBulk}>Bulk invite</button>}>
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Agent email" placeholder="agent@brokerage.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Field label="Full name (optional)" placeholder="Jane Agent" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="mt-3 flex items-center gap-2">
        <button className="btn-primary" onClick={() => onInvite(email.trim(), name.trim() || undefined)}>
          <UserPlusIcon className="mr-2 h-5 w-5" /> Send Invite
        </button>
        <p className="hf-small text-slate-500">We’ll email them a secure link to set a password.</p>
      </div>
    </Card>
  );
}

function QuickActions({ onRecovery }: { onRecovery: (email: string) => void }) {
  const [email, setEmail] = useState("");
  return (
    <Card title="Quick actions">
      <div className="grid gap-3 md:grid-cols-[1fr_auto]">
        <Field label="User email" placeholder="user@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        <button className="btn-outline h-11 whitespace-nowrap" onClick={() => onRecovery(email.trim())}>
          <EnvelopeOpenIcon className="mr-2 h-5 w-5" />
          Send recovery email
        </button>
      </div>

      <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
        <div className="flex gap-2">
          <KeyIcon className="h-4 w-4 flex-none text-slate-500" />
          <div>
            If a user can’t log in, send a recovery email so they can set a new password (must have verified email).
          </div>
        </div>
      </div>
    </Card>
  );
}

function PeopleCard({
  people,
  q,
  onQ,
  onSetRole,
  onRemoveRole,
  onStartChat,
}: {
  people: Person[];
  q: string;
  onQ: (v: string) => void;
  onSetRole: (uid: string, role: Role) => Promise<void>;
  onRemoveRole: (uid: string) => Promise<void>;
  onStartChat: (uid: string, displayName?: string | null) => void;
}) {
  return (
    <Card
      title="People (enriched)"
      right={
        <div className="flex items-center gap-2">
          <div className="relative">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={q}
              onChange={(e) => onQ(e.target.value)}
              placeholder="Search by name, email, UID…"
              className="h-10 w-72 rounded-lg border border-slate-300 pl-7 pr-3 text-sm focus:border-emerald-400 focus:outline-none focus:ring-4 focus:ring-emerald-100"
            />
          </div>
          <Link to="/agents" className="btn-outline h-10 px-3">
            Open Agents
          </Link>
        </div>
      }
    >
      {people.length === 0 ? (
        <div className="text-slate-500">No users match your search.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500">
                <th className="py-2 pr-2">Person</th>
                <th className="py-2 pr-2">Contact</th>
                <th className="py-2 pr-2">Role</th>
                <th className="py-2 pr-2">UID</th>
                <th className="py-2 pr-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {people.map((p) => (
                <tr key={p.uid} className="border-t">
                  <td className="py-3 pr-2">
                    <div className="flex items-center gap-3">
                      {p.avatar_url ? (
                        <img src={p.avatar_url} className="h-10 w-10 rounded-full object-cover" />
                      ) : (
                        <div className="grid h-10 w-10 place-items-center rounded-full bg-emerald-100 text-emerald-800">
                          <UserIcon className="h-5 w-5" />
                        </div>
                      )}
                      <div>
                        <div className="font-medium">{p.name || "Unknown user"}</div>
                        <div className="hf-micro text-slate-500">
                          {p.source === "agent" ? "from agents" : p.source === "auth" ? "from auth" : "unresolved"}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 pr-2">
                    <div>{p.email || "—"}</div>
                    <div className="hf-micro text-slate-500">{p.human_id}</div>
                  </td>
                  <td className="py-3 pr-2">
                    <select
                      className="h-9 rounded-lg border border-slate-300 bg-white px-2 text-sm focus:border-emerald-400 focus:outline-none focus:ring-4 focus:ring-emerald-100"
                      value={p.role}
                      onChange={(e) => onSetRole(p.uid, e.target.value as Role)}
                    >
                      <option value="user">User</option>
                      <option value="agent">Agent</option>
                      <option value="superadmin">Superadmin</option>
                    </select>
                  </td>
                  <td className="py-3 pr-2">
                    <div className="font-mono text-xs break-all">{p.uid}</div>
                  </td>
                  <td className="py-3 pr-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Copy value={p.uid} small />
                      <button
                        className="btn-outline h-8 px-3 text-xs"
                        onClick={() => onRemoveRole(p.uid)}
                      >
                        Remove role
                      </button>
                      {/* NEW: direct message */}
                      <button
                        className="btn-primary h-8 px-3 text-xs"
                        onClick={() => onStartChat(p.uid, p.name)}
                        title="Start a direct chat"
                      >
                        Message
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

function RawRolesCard({ roles }: { roles: RoleRow[] }) {
  return (
    <Card
      title="Raw roles"
      right={<div className="hf-small text-slate-500">Underlying entries in <code className="font-mono">public.user_roles</code></div>}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500">
              <th className="py-2 pr-2">auth_uid</th>
              <th className="py-2 pr-2">role</th>
              <th className="py-2 pr-2">created</th>
            </tr>
          </thead>
          <tbody>
            {roles.map((r) => (
              <tr key={r.auth_uid} className="border-t">
                <td className="py-2 pr-2 font-mono text-xs break-all">{r.auth_uid}</td>
                <td className="py-2 pr-2">
                  <Badge color={r.role === "superadmin" ? "amber" : r.role === "agent" ? "blue" : "slate"}>{r.role}</Badge>
                </td>
                <td className="py-2 pr-2">{new Date(r.created_at).toLocaleString()}</td>
              </tr>
            ))}
            {roles.length === 0 && (
              <tr>
                <td colSpan={3} className="py-3 text-slate-500">No roles yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function BulkInviteModal({ onClose, onInvite }: { onClose: () => void; onInvite: (list: string) => void }) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-5 shadow-2xl ring-1 ring-black/5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Bulk Invite</h3>
          <button className="btn-outline" onClick={onClose}>
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        <p className="hf-body text-slate-600">Paste emails (comma, space, or newline separated). Each will receive an invite.</p>
        <textarea
          className="mt-3 min-h-[160px] w-full rounded-xl border border-slate-300 p-3 font-mono text-sm focus:border-emerald-400 focus:outline-none focus:ring-4 focus:ring-emerald-100"
          placeholder={`jane@broker.com, john@agency.com\nalex@firm.com`}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <div className="mt-3 flex items-center gap-2">
          <button
            className="btn-primary"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await onInvite(text);
                onClose();
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy ? <ArrowPathIcon className="mr-2 h-5 w-5 animate-spin" /> : <UserPlusIcon className="mr-2 h-5 w-5" />}
            Send Invites
          </button>
          <div className="hf-small text-slate-500 flex items-center gap-2">
            <AtSymbolIcon className="h-4 w-4" />
            You can resend invites later from your email provider if needed.
          </div>
        </div>
      </div>
    </div>
  );
}
