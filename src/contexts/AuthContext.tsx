// ui/src/contexts/AuthContext.tsx
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase, supabaseIsReady } from "@/utils/supabaseClient";

type Role = "user" | "agent" | "superadmin" | null;

type AuthCtx = {
  user: User | null;
  role: Role;
  loading: boolean;

  // auth actions
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signInWithPassword: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;

  // helpers
  sendPasswordReset: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  refreshRole: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role>(null);
  const [loading, setLoading] = useState(true);

  // Fetch role from your table (guards if supabase is not ready)
  async function loadRole(uid: string) {
    if (!supabaseIsReady || !supabase) {
      // Fall back to a sane default when Supabase isn’t configured in dev
      setRole("user");
      return;
    }
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("auth_uid", uid)
      .maybeSingle();

    if (error) {
      console.warn("[auth] role fetch error:", error.message);
      setRole("user");
      return;
    }
    setRole((data?.role as Role) ?? "user");
  }

  async function refreshRole() {
    if (user?.id) await loadRole(user.id);
  }

  // Initialize session + listener (only when supabase client exists)
  useEffect(() => {
    let unsub: (() => void) | undefined;

    (async () => {
      if (!supabaseIsReady || !supabase) {
        console.warn("[auth] Supabase not configured — auth disabled in this environment.");
        setUser(null);
        setRole("user");
        setLoading(false);
        return;
      }

      const { data } = await supabase.auth.getSession();
      const u = data.session?.user ?? null;
      setUser(u);
      if (u) await loadRole(u.id);
      setLoading(false);

      const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
        const next = session?.user ?? null;
        setUser(next);
        if (next) loadRole(next.id);
        else setRole(null);
      });
      unsub = () => sub.subscription.unsubscribe();
    })();

    return () => {
      if (unsub) unsub();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabaseIsReady]); // re-run if env changes between reloads (rare)
  // ─────────────────────────────────────────────────────────

  // ---- Auth actions (all guarded for non-ready supabase) ----
  async function signIn(email: string, password: string) {
    if (!supabaseIsReady || !supabase) return { error: "Auth is not configured." };
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return {};
  }
  const signInWithPassword = signIn;

  async function signUp(email: string, password: string) {
    if (!supabaseIsReady || !supabase) return { error: "Auth is not configured." };
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) return { error: error.message };
    return {};
  }

  async function signOut() {
    if (!supabaseIsReady || !supabase) return;
    await supabase.auth.signOut();
    setRole(null);
  }

  async function signInWithGoogle() {
    if (!supabaseIsReady || !supabase) return;
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
  }

  // ---- Helpers ----
  async function sendPasswordReset(email: string) {
    if (!supabaseIsReady || !supabase) return;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset`,
    });
    if (error) {
      const msg = error.message || "";
      if ((error as any).status === 429 || /For security purposes/i.test(msg)) return; // soft-success on throttle
      throw error;
    }
  }

  async function updatePassword(newPassword: string) {
    if (!supabaseIsReady || !supabase) return;
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
  }

  const value = useMemo(
    () => ({
      user,
      role,
      loading,
      signIn,
      signInWithPassword,
      signUp,
      signOut,
      signInWithGoogle,
      sendPasswordReset,
      updatePassword,
      refreshRole,
    }),
    [user, role, loading]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
