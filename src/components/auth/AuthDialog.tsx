import React, { useEffect, useState } from "react";
import { XMarkIcon, EyeIcon, EyeSlashIcon, ShieldCheckIcon } from "@heroicons/react/24/outline";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../utils/supabaseClient";

type Mode = "login" | "signup" | "reset";

export interface AuthDialogProps {
  open: boolean;
  initialMode?: Mode;
  onClose: () => void;
}

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className = "", ...props }, ref) => (
    <input
      ref={ref}
      className={
        "w-full h-12 rounded-xl border border-slate-300 bg-white px-4 text-slate-900 " +
        "placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400 " +
        className
      }
      {...props}
    />
  )
);
Input.displayName = "Input";

export default function AuthDialog({ open, initialMode = "login", onClose }: AuthDialogProps) {
  const { signIn, signUp, signInWithGoogle } = useAuth();

  const [mode, setMode] = useState<Mode>(initialMode);
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [showPwd, setShowPwd] = useState(false);

  useEffect(() => {
    if (open) {
      setMode(initialMode);
      setEmail("");
      setPwd("");
      setMsg(null);
      setBusy(false);
      setShowPwd(false);
    }
  }, [open, initialMode]);

  async function handleGoogle() {
    try {
      setBusy(true);
      setMsg(null);
      await signInWithGoogle();
      // OAuth redirects away; no close needed here
    } catch (e: any) {
      setMsg(e?.message ?? "Google sign-in failed.");
    } finally {
      setBusy(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);

    try {
      if (!email || !email.includes("@")) throw new Error("Please enter a valid email.");
      if (mode !== "reset" && (!pwd || pwd.length < 6)) {
        throw new Error("Password must be at least 6 characters.");
      }

      if (mode === "login") {
        const { error } = await signIn(email, pwd);
        if (error) {
          // H. normalize AuthError/string
          throw new Error(typeof error === "string" ? error : (error as any)?.message || "Unknown error");
        }
        setMsg("Welcome back!");
        setTimeout(onClose, 600);
      } else if (mode === "signup") {
        const { error } = await signUp(email, pwd);
        if (error) {
          throw new Error(typeof error === "string" ? error : (error as any)?.message || "Unknown error");
        }
        setMsg("Check your inbox to confirm your account.");
      } else {
        // RESET PASSWORD via Supabase
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/reset`,
        });
        if (error) {
          // H. normalize AuthError/string
          throw new Error(typeof error === "string" ? error : error.message);
        }
        setMsg("If an account exists, a reset link has been sent.");
      }
    } catch (err: any) {
      setMsg(err?.message ?? "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-title"
    >
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl ring-1 ring-black/5">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="flex gap-2">
            {(["login", "signup"] as const).map((tab) => {
              const active = mode === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setMode(tab)}
                  className={
                    "h-9 rounded-full px-4 text-sm font-medium transition-all " +
                    (active ? "bg-blue-600 text-white shadow-sm" : "bg-slate-100 text-slate-700 hover:bg-slate-200")
                  }
                >
                  {tab === "login" ? "Log in" : "Sign up"}
                </button>
              );
            })}
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100" aria-label="Close">
            <XMarkIcon className="h-5 w-5 text-slate-600" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          <p id="auth-title" className="hf-body text-slate-600 mb-4">
            {mode === "login"
              ? "Welcome back to EcoListing."
              : mode === "signup"
              ? "Create your EcoListing account."
              : "Reset your password."}
          </p>

          {mode !== "reset" && (
            <>
              <button
                onClick={handleGoogle}
                disabled={busy}
                className="w-full h-11 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 flex items-center justify-center gap-3"
              >
                <img
                  alt=""
                  className="h-5 w-5"
                  src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                />
                Continue with Google
              </button>

              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-white px-3 text-slate-400 text-sm">or</span>
                </div>
              </div>
            </>
          )}

          <form onSubmit={submit} className="space-y-3">
            <div>
              <label className="hf-small text-slate-700">Email address</label>
              <Input
                type="email"
                autoComplete="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {mode !== "reset" && (
              <div>
                <label className="hf-small text-slate-700">Password</label>
                <div className="relative">
                  <Input
                    type={showPwd ? "text" : "password"}
                    autoComplete={mode === "signup" ? "new-password" : "current-password"}
                    placeholder="Enter your password"
                    value={pwd}
                    onChange={(e) => setPwd(e.target.value)}
                    className="pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd((s) => !s)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-md text-slate-500 hover:bg-slate-100"
                    aria-label={showPwd ? "Hide password" : "Show password"}
                  >
                    {showPwd ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            )}

            {mode === "login" && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setMode("reset")}
                  className="text-sm text-blue-600 hover:underline"
                >
                  Forgot password?
                </button>
              </div>
            )}

            {msg && (
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                {msg}
              </div>
            )}

            <button
              type="submit"
              disabled={busy}
              className={
                "w-full h-11 rounded-xl font-semibold text-white transition-all " +
                (busy ? "bg-blue-500/70" : "bg-blue-600 hover:bg-blue-700 shadow-elev-2")
              }
            >
              {mode === "login" ? "Sign in" : mode === "signup" ? "Create account" : "Send reset link"}
            </button>

            <p className="hf-micro text-slate-500 text-center">
              <ShieldCheckIcon className="inline-block h-4 w-4 align-middle mr-1" />
              By continuing you agree to our Terms and Privacy Policy.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
