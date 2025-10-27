import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { supabase } from "../utils/supabaseClient";
import { uploadAgentHeadshot } from "../utils/storage";

type Agent = {
  agent_id: string;
  auth_uid: string | null;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  brokerage: string | null;
  license_no: string | null;
  jurisdiction_country?: string | null; // "US" | "CA"
  jurisdiction_region?: string | null;  // e.g., "CA" or "ON"
  headshot_url: string | null;
  bio?: string | null;
  specialties?: string[] | null;        // jsonb/text[] in DB
  is_active?: boolean | null;
};

const SPECIALTIES = [
  "First-Time Buyers",
  "Luxury Homes",
  "Relocation",
  "Investment Properties",
  "Commercial",
  "New Construction",
  "Eco-Friendly / Energy Efficient",
] as const;

function Chip({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-sm ${
        active
          ? "border-emerald-500 bg-emerald-50 text-emerald-700"
          : "border-slate-300 text-slate-700 hover:bg-slate-50"
      }`}
    >
      {children}
    </button>
  );
}

export default function AgentProfile() {
  const [row, setRow] = useState<Agent | null>(null);
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [showAll, setShowAll] = useState(false);
  const [busy, setBusy] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  // Load or create a stub agent row for the logged-in user
  useEffect(() => {
    (async () => {
      const { data: sess } = await supabase.auth.getSession();
      const uid = sess.session?.user?.id;
      const email = sess.session?.user?.email ?? null;
      if (!uid) return;

      const { data, error } = await supabase
        .from("agents")
        .select("*")
        .eq("auth_uid", uid)
        .maybeSingle();

      if (error) {
        toast.error(error.message);
        return;
      }

      if (data) {
        setRow(data as Agent);
      } else {
        // create minimal stub so the agent can edit & save
        const { data: inserted, error: insErr } = await supabase
          .from("agents")
          .insert({ auth_uid: uid, email, full_name: null, is_active: true })
          .select("*")
          .single();
        if (insErr) toast.error(insErr.message);
        else setRow(inserted as Agent);
      }
    })();
  }, []);

  function update<K extends keyof Agent>(key: K, value: Agent[K]) {
    if (!row) return;
    setRow({ ...row, [key]: value });
  }

  const canNext = useMemo(() => {
    if (!row) return false;
    if (step === 1) return !!row.full_name && !!row.email && !!row.phone;
    if (step === 2)
      return (
        !!row.license_no &&
        !!row.jurisdiction_country &&
        !!row.jurisdiction_region &&
        !!row.brokerage
      );
    return true;
  }, [row, step]);

  async function savePatch(patch: Partial<Agent>, success = "Saved") {
    if (!row) return;
    setBusy(true);
    const { error } = await supabase
      .from("agents")
      .update(patch)
      .eq("agent_id", row.agent_id);
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return false;
    } else {
      setRow({ ...row, ...patch });
      toast.success(success);
      return true;
    }
  }

  async function handleNext() {
    if (!row) return;

    try {
      if (step === 1) {
        await savePatch(
          { full_name: row.full_name, phone: row.phone, email: row.email },
          "Saved personal details"
        );
      } else if (step === 2) {
        await savePatch(
          {
            license_no: row.license_no,
            jurisdiction_country: row.jurisdiction_country,
            jurisdiction_region: row.jurisdiction_region,
            brokerage: row.brokerage,
          },
          "Saved licensing & brokerage"
        );
      } else if (step === 3) {
        // Upload headshot if chosen
        if (file) {
          const url = await uploadAgentHeadshot(file, row.agent_id);
          await savePatch({ headshot_url: url }, "Photo updated");
          setFile(null);
        }
        await savePatch(
          { bio: row.bio ?? null, specialties: row.specialties ?? [] },
          "Saved bio & specialties"
        );
      }
    } catch (e: any) {
      // We still allow stepping forward so the UI doesn't feel stuck
      toast.error(e?.message || "Save failed");
    } finally {
      setStep((s) => (s < 4 ? ((s + 1) as 1 | 2 | 3 | 4) : s));
    }
  }

  function handleBack() {
    setStep((s) => (s > 1 ? ((s - 1) as 1 | 2 | 3 | 4) : s));
  }

  if (!row) return <div className="p-6">Loading…</div>;

  const StepDot = ({ n, label }: { n: 1 | 2 | 3 | 4; label: string }) => (
    <button
      type="button"
      onClick={() => setStep(n)}
      className={`flex min-w-[120px] items-center gap-2 rounded-full px-3 py-1 text-xs ${
        step >= n ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"
      }`}
      title={label}
    >
      <span
        className={`inline-block h-2 w-2 rounded-full ${
          step >= n ? "bg-emerald-500" : "bg-slate-400"
        }`}
      />
      {label}
    </button>
  );

  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-2 flex items-center justify-between">
        <h1 className="text-xl font-semibold">My Agent Profile</h1>
        <label className="inline-flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={showAll}
            onChange={(e) => setShowAll(e.target.checked)}
          />
          Show all sections
        </label>
      </div>

      {/* Clickable stepper */}
      <div className="mb-4 flex flex-wrap gap-2">
        <StepDot n={1} label="Personal" />
        <StepDot n={2} label="Licensing & Brokerage" />
        <StepDot n={3} label="Photo, Bio & Specialties" />
        <StepDot n={4} label="Finish" />
      </div>

      {/* STEP 1 — Personal */}
      {(showAll || step === 1) && (
        <section className="card p-4 mb-4">
          <h2 className="font-semibold mb-3">Personal details</h2>
          <div className="grid gap-3 md:grid-cols-2">
            <input
              className="input border rounded px-3 py-2"
              placeholder="Full name"
              value={row.full_name ?? ""}
              onChange={(e) => update("full_name", e.target.value)}
            />
            <input
              className="input border rounded px-3 py-2"
              placeholder="Phone"
              value={row.phone ?? ""}
              onChange={(e) => update("phone", e.target.value)}
            />
            <input
              className="input border rounded px-3 py-2 md:col-span-2"
              placeholder="Email"
              type="email"
              value={row.email ?? ""}
              onChange={(e) => update("email", e.target.value)}
            />
          </div>

          {!showAll && (
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                className="btn-primary"
                onClick={handleNext}
                disabled={!canNext || busy}
              >
                Save & continue
              </button>
            </div>
          )}
        </section>
      )}

      {/* STEP 2 — Licensing & Brokerage */}
      {(showAll || step === 2) && (
        <section className="card p-4 mb-4">
          <h2 className="font-semibold mb-3">Licensing & Brokerage</h2>
          <div className="grid gap-3 md:grid-cols-3">
            <input
              className="input border rounded px-3 py-2 md:col-span-2"
              placeholder="License #"
              value={row.license_no ?? ""}
              onChange={(e) => update("license_no", e.target.value)}
            />
            <select
              className="input border rounded px-3 py-2"
              value={row.jurisdiction_country ?? ""}
              onChange={(e) => update("jurisdiction_country", e.target.value || null)}
            >
              <option value="">Country</option>
              <option value="US">United States</option>
              <option value="CA">Canada</option>
            </select>

            <input
              className="input border rounded px-3 py-2"
              placeholder={
                row.jurisdiction_country === "CA"
                  ? "Province (e.g., ON)"
                  : "State (e.g., CA)"
              }
              value={row.jurisdiction_region ?? ""}
              onChange={(e) => update("jurisdiction_region", e.target.value)}
            />
            <input
              className="input border rounded px-3 py-2 md:col-span-3"
              placeholder="Brokerage"
              value={row.brokerage ?? ""}
              onChange={(e) => update("brokerage", e.target.value)}
            />
          </div>

          {!showAll && (
            <div className="mt-4 flex gap-2">
              <button type="button" className="btn-outline" onClick={handleBack}>
                Back
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={handleNext}
                disabled={!canNext || busy}
              >
                Save & continue
              </button>
            </div>
          )}
        </section>
      )}

      {/* STEP 3 — Photo, Bio & Specialties */}
      {(showAll || step === 3) && (
        <section className="card p-4 mb-4">
          <h2 className="font-semibold mb-3">Photo, Bio & Specialties</h2>
          <div className="grid gap-3 md:grid-cols-[140px_1fr]">
            <div>
              {row.headshot_url ? (
                <img
                  src={row.headshot_url}
                  className="h-28 w-28 rounded-full object-cover"
                  alt="Agent headshot"
                />
              ) : (
                <div className="h-28 w-28 rounded-full bg-slate-200" />
              )}
              <input
                type="file"
                accept="image/*"
                className="mt-2 text-sm"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </div>

            <div className="grid gap-3">
              <textarea
                className="input border rounded px-3 py-2 min-h-[120px]"
                placeholder="Short bio"
                value={row.bio ?? ""}
                onChange={(e) => update("bio", e.target.value)}
              />
              <div>
                <div className="mb-2 text-sm text-slate-700">Specialties</div>
                <div className="flex flex-wrap gap-2">
                  {SPECIALTIES.map((s) => {
                    const active = (row.specialties ?? []).includes(s);
                    return (
                      <Chip
                        key={s}
                        active={active}
                        onClick={() => {
                          const set = new Set(row.specialties ?? []);
                          if (set.has(s)) set.delete(s);
                          else set.add(s);
                          update("specialties", Array.from(set));
                        }}
                      >
                        {s}
                      </Chip>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {!showAll && (
            <div className="mt-4 flex gap-2">
              <button type="button" className="btn-outline" onClick={handleBack}>
                Back
              </button>
              <button type="button" className="btn-primary" onClick={handleNext} disabled={busy}>
                Save & continue
              </button>
            </div>
          )}
        </section>
      )}

      {/* STEP 4 — Done */}
      {(showAll || step === 4) && (
        <section className="card p-4">
          <h2 className="font-semibold mb-2">Done</h2>
          <p className="text-slate-600">
            Your agent profile is ready. You can update it any time.
          </p>
          {!showAll && (
            <div className="mt-3">
              <button
                type="button"
                className="btn-primary"
                onClick={() => toast.success("All set!")}
              >
                Finish
              </button>
            </div>
          )}
        </section>
      )}

      {/* Quick “Save changes now” (always visible) */}
      <div className="mt-6">
        <button
          type="button"
          className="btn-outline"
          onClick={async () => {
            if (!row) return;
            if (file) {
              const url = await uploadAgentHeadshot(file, row.agent_id);
              await savePatch({ headshot_url: url }, "Photo updated");
              setFile(null);
            } else {
              await savePatch({
                full_name: row.full_name ?? null,
                phone: row.phone ?? null,
                email: row.email ?? null,
                license_no: row.license_no ?? null,
                jurisdiction_country: row.jurisdiction_country ?? null,
                jurisdiction_region: row.jurisdiction_region ?? null,
                brokerage: row.brokerage ?? null,
                bio: row.bio ?? null,
                specialties: row.specialties ?? [],
              });
            }
          }}
          disabled={busy}
        >
          {busy ? "Saving…" : "Save changes now"}
        </button>
      </div>
    </div>
  );
}
