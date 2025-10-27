// src/pages/auth/Login.tsx
import React, { useMemo, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import type { Location } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../utils/supabaseClient";

type Mode = "login" | "signup";

export default function Login() {
  const { signInWithPassword, signUp } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const nav = useNavigate();
  const loc = useLocation() as any;

  const params = new URLSearchParams(loc.search ?? "");
  const nextParamRaw = params.get("next") || undefined;
  const nextParam = nextParamRaw && nextParamRaw.startsWith("/") ? nextParamRaw : undefined;
  const startInSignup = params.get("signup") === "1";

  const [mode, setMode] = useState<Mode>(startInSignup ? "signup" : "login");

  const isChatFlow =
    (nextParam && nextParam.startsWith("/chat")) ||
    (loc.state?.from?.pathname && String(loc.state.from.pathname).startsWith("/chat"));

  const title =
    mode === "signup"
      ? "Create your account"
      : isChatFlow
      ? "Sign in to save your chat"
      : "Agent / Admin Login";

  const subtitle =
    mode === "signup"
      ? "Create an EcoListing account to access your agent profile and tools."
      : isChatFlow
      ? "Sign in to save your conversation and let an agent follow up — or continue as a guest."
      : "Agents and admins can sign in below.";

  const guestDestination = useMemo(() => nextParam ?? "/chat", [nextParam]);

  async function redirectPostLogin() {
    const fromLoc = (loc.state?.from as Location | undefined);
    if (fromLoc?.pathname) {
      const dest = `${fromLoc.pathname}${fromLoc.search || ""}${fromLoc.hash || ""}`;
      nav(dest, { replace: true });
      return;
    }
    if (nextParam) {
      nav(nextParam, { replace: true });
      return;
    }
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
    nav(dest, { replace: true });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setErr(null);
    setInfo(null);

    try {
      if (mode === "login") {
        const res = await signInWithPassword(email.trim(), password);
        if ((res as any)?.error) throw new Error((res as any).error);
        await redirectPostLogin();
      } else {
        const res = await (signUp
          ? signUp(email.trim(), password)
          : supabase.auth.signUp({ email: email.trim(), password }));
        const supaErr = (res as any)?.error || (res as any)?.error_message;
        if (supaErr) throw new Error(String(supaErr));

        const { data: sess } = await supabase.auth.getSession();
        if (sess.session?.user?.id) {
          await redirectPostLogin();
        } else {
          setInfo("Check your email to confirm your account. You’ll be redirected after confirming.");
        }
      }
    } catch (e: any) {
      setErr(e?.message || "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  /** NEW: Google OAuth */
  async function continueWithGoogle() {
    setErr(null);
    const origin = window.location.origin;
    const redirectTo = nextParam
      ? `${origin}/auth/callback?next=${encodeURIComponent(nextParam)}`
      : `${origin}/auth/callback`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
        queryParams: {
          // Optional but nice UX:
          prompt: "select_account",
          access_type: "offline",
        },
      },
    });
    if (error) setErr(error.message || "Google sign-in failed");
  }

  return (
    <main className="container-7xl section-pad">
      <div className="mx-auto max-w-md card p-6">
        {/* mode switch */}
        <div className="mb-3 flex items-center justify-between">
          <h1 className="text-xl font-semibold">{title}</h1>
          <button
            type="button"
            onClick={() => { setMode(m => (m === "login" ? "signup" : "login")); setErr(null); setInfo(null); }}
            className="text-sm text-blue-600 hover:underline"
          >
            {mode === "login" ? "Create account" : "Have an account? Sign in"}
          </button>
        </div>
        <p className="text-sm text-slate-600">{subtitle}</p>

        {/* Google OAuth */}
        <button
          type="button"
          onClick={continueWithGoogle}
          className="mt-4 w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 font-medium hover:bg-slate-50"
          aria-label="Continue with Google"
        >
          Continue with Google
        </button>

        <div className="my-3 flex items-center gap-4 text-slate-400">
          <span className="h-px flex-1 bg-slate-200" />
          <span className="text-xs">or</span>
          <span className="h-px flex-1 bg-slate-200" />
        </div>

        {mode === "login" && isChatFlow && (
          <div className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
            Prefer not to create an account right now?{" "}
            <Link to={guestDestination} className="font-medium underline" title="Continue to chat as a guest">
              Continue to chat as a guest
            </Link>
            . Your messages will be saved to your account if you sign in later.
          </div>
        )}

        <form className="mt-4 space-y-3" onSubmit={onSubmit}>
          <input
            className="input w-full rounded border border-slate-300 px-3 py-2"
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="username"
          />
          <input
            className="input w-full rounded border border-slate-300 px-3 py-2"
            placeholder={mode === "login" ? "Password" : "Create a password"}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete={mode === "login" ? "current-password" : "new-password"}
          />

          {err && <div className="text-red-600 text-sm">{err}</div>}
          {info && <div className="text-emerald-700 text-sm">{info}</div>}

          <button className="btn-primary w-full" disabled={busy}>
            {busy ? (mode === "login" ? "Signing in…" : "Creating…") : mode === "login" ? "Sign in" : "Create account"}
          </button>
        </form>

        {mode === "login" && (
          <div className="mt-3 flex items-center justify-between text-sm">
            <Link to="/auth/forgot" className="text-blue-600 hover:underline">
              Forgot your password?
            </Link>
            {!isChatFlow && (
              <Link to="/chat" className="text-emerald-700 hover:underline">
                Or continue to chat as a guest
              </Link>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
