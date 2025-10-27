import React, { useEffect, useState } from "react";
import { supabase } from "../../utils/supabaseClient";
import toast from "react-hot-toast";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => setCooldown((s) => s - 1), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (busy || cooldown > 0) return;

    setBusy(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset`,
      });

      if (error) {
        const msg = error.message || "Could not send reset email";
        if (/For security purposes/i.test(msg)) {
          // Already requested recently — treat as success
          setSent(true);
          setCooldown(60);
          toast.success("We already sent you a reset link. Try again shortly.");
        } else {
          throw error;
        }
      } else {
        setSent(true);
        setCooldown(60); // prevent spam-clicks
        toast.success("Check your inbox for a reset link.");
      }
    } catch (e: any) {
      setErr(e.message || "Could not send reset email");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="container-7xl section-pad">
      <div className="mx-auto max-w-md card p-6">
        <h1 className="text-xl font-semibold">Reset your password</h1>
        {sent ? (
          <div className="mt-3 text-green-700">
            Check your inbox for a reset link.
            {cooldown > 0 && <div className="text-slate-500 text-sm">You can request another link in {cooldown}s.</div>}
          </div>
        ) : (
          <form className="mt-4 space-y-3" onSubmit={onSubmit}>
            <input
              className="input w-full rounded border border-slate-300 px-3 py-2"
              placeholder="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            {err && <div className="text-red-600 text-sm">{err}</div>}
            <button className="btn-primary w-full" disabled={busy || cooldown > 0}>
              {busy ? "Sending…" : `Send reset link${cooldown > 0 ? ` (${cooldown})` : ""}`}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
