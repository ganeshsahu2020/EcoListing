// ui/src/utils/supabaseClient.ts
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL as string) || "";
const SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || "";

// Use a global slot so Vite HMR doesn't create multiple clients during module reloads.
const g = globalThis as unknown as {
  __EL_SUPABASE__?: SupabaseClient | null;
};

if (!g.__EL_SUPABASE__) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || SUPABASE_URL.includes("your-project")) {
    console.warn(
      "[supabase] Missing/placeholder VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY — features disabled."
    );
    g.__EL_SUPABASE__ = null;
  } else {
    g.__EL_SUPABASE__ = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        // Keep a single storage key; HMR-safe singleton prevents multiple GoTrueClient instances.
        storageKey: "el.auth",
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }
}

export const supabase = g.__EL_SUPABASE__ ?? null;
export const supabaseIsReady = !!g.__EL_SUPABASE__;
