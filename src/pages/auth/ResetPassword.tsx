import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../utils/supabaseClient";
import { readHashParams } from "../../utils/auth";

export default function ResetPassword() {
  const [ready, setReady] = useState(false);
  const [ok, setOk] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [pwd1, setPwd1] = useState("");
  const [pwd2, setPwd2] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  // If the email link contains tokens in the URL hash, set a temporary session
  useEffect(() => {
    const params = readHashParams();
    const access = params["access_token"];
    const refresh = params["refresh_token"];
    (async () => {
      try {
        if (access && refresh) {
          const { error } = await supabase.auth.setSession({
            access_token: access,
            refresh_token: refresh,
          });
          if (error) throw error;
        }
      } catch (e: any) {
        setErr(e.message || "Could not establish session from reset link");
      } finally {
        setReady(true);
      }
    })();
  }, []);

  async function redirectByRole() {
    // Default after reset for regular users
    let dest = "/account";
    const { data: sess } = await supabase.auth.getSession();
    const uid = sess.session?.user?.id;

    if (uid) {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("auth_uid", uid)
        .maybeSingle();

      const r = data?.role as "user" | "agent" | "superadmin" | undefined;
      dest = r === "superadmin" ? "/admin/users" : r === "agent" ? "/agent/profile" : "/account";
    }
    navigate(dest, { replace: true });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setErr(null);

    if (pwd1.length < 8) return setErr("Password must be at least 8 characters");
    if (pwd1 !== pwd2) return setErr("Passwords do not match");

    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pwd1 });
    setBusy(false);

    if (error) {
      setErr(error.message);
      return;
    }

    // Show success briefly (optional) then route by role
    setOk(true);
    await redirectByRole();
  }

  return (
    <main className="container-7xl section-pad">
      <div className="mx-auto max-w-md card p-6">
        <h1 className="text-xl font-semibold">Set a new password</h1>

        {!ready ? (
          <div className="mt-3 text-slate-500">Validating reset link…</div>
        ) : ok ? (
          // This state is rarely visible because we immediately redirect by role
          <div className="mt-4 text-emerald-700">Password updated. Redirecting…</div>
        ) : (
          <form className="mt-4 space-y-3" onSubmit={submit}>
            <input
              className="input w-full rounded border border-slate-300 px-3 py-2"
              type="password"
              placeholder="New password"
              value={pwd1}
              onChange={(e) => setPwd1(e.target.value)}
              required
            />
            <input
              className="input w-full rounded border border-slate-300 px-3 py-2"
              type="password"
              placeholder="Confirm new password"
              value={pwd2}
              onChange={(e) => setPwd2(e.target.value)}
              required
            />
            {err && <div className="text-red-600 text-sm">{err}</div>}
            <button className="btn-primary w-full" disabled={busy}>
              {busy ? "Updating…" : "Update password"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
