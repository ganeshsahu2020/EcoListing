import React, { useEffect, useState } from "react";
import { supabase } from "../../utils/supabaseClient";
import { useAuth } from "../../contexts/AuthContext";
import {
  EnvelopeIcon,
  PhoneIcon,
  UserIcon,
  GlobeAltIcon,
  LockClosedIcon,
  BellIcon,
  ShieldExclamationIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";

type Profile = {
  auth_uid: string;
  full_name: string | null;
  preferred_language: string | null;
  phone: string | null;
  avatar_url: string | null;
};

type Prefs = {
  auth_uid: string;
  saved_searches_alerts: boolean;
  saved_listings_alerts: boolean;
  market_updates: "off" | "weekly" | "monthly" | "3x_week";
  features_roundup: "off" | "weekly" | "monthly";
  co_buyer_alerts: boolean;
  unsubscribe_all: boolean;
};

export default function ProfileSetting() {
  const { user, updatePassword } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [prefs, setPrefs] = useState<Prefs | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [pwd1, setPwd1] = useState("");
  const [pwd2, setPwd2] = useState("");

  // ─────────────────────────────────────────────────────
  // Loader (scoped to the current user)
  // ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    (async () => {
      // profile (scoped to this user)
      const p = await supabase
        .from("user_profiles")
        .select("*")
        .eq("auth_uid", user.id)
        .maybeSingle();

      // prefs (scoped to this user)
      const pr = await supabase
        .from("notification_prefs")
        .select("*")
        .eq("auth_uid", user.id)
        .maybeSingle();

      setProfile(
        (p.data as any) || {
          auth_uid: user.id,
          full_name: "",
          preferred_language: "",
          phone: "",
          avatar_url: "",
        }
      );

      setPrefs(
        (pr.data as any) || {
          auth_uid: user.id,
          saved_searches_alerts: true,
          saved_listings_alerts: true,
          market_updates: "weekly",
          features_roundup: "weekly",
          co_buyer_alerts: false,
          unsubscribe_all: false,
        }
      );
    })();
  }, [user?.id]);

  // ─────────────────────────────────────────────────────
  // Save handlers (ensure auth_uid is present)
  // ─────────────────────────────────────────────────────
  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!profile || !user) return;
    setBusy(true);
    setMsg(null);

    const payload: Profile = { ...profile, auth_uid: user.id };
    const { error } = await supabase
      .from("user_profiles")
      .upsert(payload, { onConflict: "auth_uid" });

    setBusy(false);
    setMsg(error ? error.message : "Profile saved.");
  }

  async function savePrefs(e: React.FormEvent) {
    e.preventDefault();
    if (!prefs || !user) return;
    setBusy(true);
    setMsg(null);

    const base: Prefs = { ...prefs, auth_uid: user.id };
    const payload: Prefs = base.unsubscribe_all
      ? {
          ...base,
          saved_searches_alerts: false,
          saved_listings_alerts: false,
          market_updates: "off",
          features_roundup: "off",
          co_buyer_alerts: false,
        }
      : base;

    const { error } = await supabase
      .from("notification_prefs")
      .upsert(payload, { onConflict: "auth_uid" });

    setBusy(false);
    setMsg(error ? error.message : "Preferences saved.");
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (pwd1.length < 8) return setMsg("Password must be at least 8 characters");
    if (pwd1 !== pwd2) return setMsg("Passwords do not match");
    try {
      await updatePassword(pwd1);
      setPwd1("");
      setPwd2("");
      setMsg("Password updated.");
    } catch (e: any) {
      setMsg(e?.message || "Failed to update password");
    }
  }

  async function deleteAccount() {
    // Client-side cannot delete auth.users directly; invoke an Edge Function
    // that uses the service role to delete the user (and cascades).
    if (!confirm("This will permanently delete your account and data. Continue?")) return;
    setBusy(true);
    setMsg(null);
    try {
      const { error } = await supabase.functions.invoke("account-delete", {
        method: "POST",
        body: {},
      });
      if (error) throw error;
      setMsg("Deletion requested. You will be signed out.");
    } catch (e: any) {
      setMsg(e?.message || "Failed to request account deletion");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Profile */}
      <form
        onSubmit={saveProfile}
        className="rounded-2xl border border-white/40 bg-white/70 backdrop-blur-xl p-5 shadow"
      >
        <div className="mb-3 text-lg font-semibold">Personal Details</div>
        <div className="grid gap-3">
          <label className="text-sm text-slate-700">
            Full name
            <div className="relative">
              <UserIcon className="h-5 w-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                className="input w-full pl-10"
                value={profile?.full_name || ""}
                onChange={(e) =>
                  setProfile((s) => (s ? { ...s, full_name: e.target.value } : s))
                }
                placeholder="Your name"
              />
            </div>
          </label>
          <label className="text-sm text-slate-700">
            Preferred language
            <div className="relative">
              <GlobeAltIcon className="h-5 w-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                className="input w-full pl-10"
                value={profile?.preferred_language || ""}
                onChange={(e) =>
                  setProfile((s) =>
                    s ? { ...s, preferred_language: e.target.value } : s
                  )
                }
                placeholder="en, fr, es…"
              />
            </div>
          </label>
          <label className="text-sm text-slate-700">
            Phone
            <div className="relative">
              <PhoneIcon className="h-5 w-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                className="input w-full pl-10"
                value={profile?.phone || ""}
                onChange={(e) =>
                  setProfile((s) => (s ? { ...s, phone: e.target.value } : s))
                }
                placeholder="(555) 555-1234"
              />
            </div>
          </label>
        </div>
        <div className="mt-4 flex items-center gap-2">
          <button className="btn-primary rounded-full px-5" disabled={busy} type="submit">
            Save profile
          </button>
          {msg && <span className="text-sm text-slate-600">{msg}</span>}
        </div>
      </form>

      {/* Notification prefs */}
      <form
        onSubmit={savePrefs}
        className="rounded-2xl border border-white/40 bg-white/70 backdrop-blur-xl p-5 shadow"
      >
        <div className="mb-3 text-lg font-semibold flex items-center gap-2">
          <BellIcon className="h-5 w-5 text-emerald-600" />
          Email Notifications
        </div>

        <Toggle
          label="Saved Searches Alerts"
          checked={!!prefs?.saved_searches_alerts}
          onChange={(v) =>
            setPrefs((s) => (s ? { ...s, saved_searches_alerts: v } : s))
          }
        />
        <Toggle
          label="Saved Listings Alerts"
          checked={!!prefs?.saved_listings_alerts}
          onChange={(v) =>
            setPrefs((s) => (s ? { ...s, saved_listings_alerts: v } : s))
          }
        />
        <Select
          label="Market Updates"
          value={prefs?.market_updates || "weekly"}
          onChange={(v) =>
            setPrefs((s) => (s ? { ...s, market_updates: v as any } : s))
          }
          options={[
            { value: "off", label: "Off" },
            { value: "weekly", label: "Weekly" },
            { value: "3x_week", label: "Up to 3 per week" },
            { value: "monthly", label: "Monthly" },
          ]}
        />
        <Select
          label="Features Roundup"
          value={prefs?.features_roundup || "weekly"}
          onChange={(v) =>
            setPrefs((s) => (s ? { ...s, features_roundup: v as any } : s))
          }
          options={[
            { value: "off", label: "Off" },
            { value: "weekly", label: "Weekly" },
            { value: "monthly", label: "Monthly" },
          ]}
        />
        <Toggle
          label="Co-buyer Alerts"
          checked={!!prefs?.co_buyer_alerts}
          onChange={(v) =>
            setPrefs((s) => (s ? { ...s, co_buyer_alerts: v } : s))
          }
        />
        <Toggle
          label="Unsubscribe From All"
          checked={!!prefs?.unsubscribe_all}
          onChange={(v) =>
            setPrefs((s) => (s ? { ...s, unsubscribe_all: v } : s))
          }
          warn
        />

        <div className="mt-4">
          <button className="btn-primary rounded-full px-5" disabled={busy} type="submit">
            Save preferences
          </button>
        </div>
      </form>

      {/* Change password */}
      <form
        onSubmit={changePassword}
        className="rounded-2xl border border-white/40 bg-white/70 backdrop-blur-xl p-5 shadow"
      >
        <div className="mb-3 text-lg font-semibold flex items-center gap-2">
          <LockClosedIcon className="h-5 w-5 text-emerald-600" />
          Change Password
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            className="input"
            type="password"
            placeholder="New password"
            value={pwd1}
            onChange={(e) => setPwd1(e.target.value)}
            required
          />
          <input
            className="input"
            type="password"
            placeholder="Confirm new password"
            value={pwd2}
            onChange={(e) => setPwd2(e.target.value)}
            required
          />
        </div>
        <div className="mt-4 flex items-center gap-2">
          <button className="btn-primary rounded-full px-5" disabled={busy} type="submit">
            Update password
          </button>
          {msg && <span className="text-sm text-slate-600">{msg}</span>}
        </div>
      </form>

      {/* Delete account */}
      <div className="rounded-2xl border border-rose-200/60 bg-rose-50 p-5 shadow">
        <div className="mb-2 text-lg font-semibold text-rose-700 flex items-center gap-2">
          <TrashIcon className="h-5 w-5" />
          Delete Account
        </div>
        <p className="text-sm text-rose-900/90 flex items-start gap-2">
          <ShieldExclamationIcon className="h-5 w-5 mt-0.5" />
          Permanently delete your account and data. This action cannot be undone.
        </p>
        <button
          onClick={deleteAccount}
          className="mt-3 inline-flex items-center gap-2 rounded-full border border-rose-300 bg-white px-4 py-2 text-sm text-rose-700 hover:bg-rose-100"
        >
          <TrashIcon className="h-4 w-4" />
          Request deletion
        </button>
      </div>
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
  warn = false,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  warn?: boolean;
}) {
  return (
    <label className="mt-2 flex items-center justify-between rounded-xl border border-slate-200 bg-white/60 px-3 py-2">
      <span className={warn ? "text-rose-700 font-medium" : "text-slate-800"}>
        {label}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={
          "relative inline-flex h-6 w-11 items-center rounded-full transition " +
          (checked ? "bg-emerald-600" : "bg-slate-300")
        }
      >
        <span
          className={
            "inline-block h-5 w-5 transform rounded-full bg-white transition " +
            (checked ? "translate-x-5" : "translate-x-1")
          }
        />
      </button>
    </label>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="mt-2 block rounded-xl border border-slate-200 bg-white/60 px-3 py-2 text-slate-800">
      <div className="mb-1">{label}</div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
