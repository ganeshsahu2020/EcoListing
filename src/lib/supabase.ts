import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL!;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY!;

// Reuse across HMR to avoid multiple GoTrue instances
const g = globalThis as unknown as { __supabase?: SupabaseClient };

export const supabase: SupabaseClient =
  g.__supabase ??
  createClient(url, key, {
    // we’re not doing interactive auth — keep it simple and avoid storage collisions
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      storageKey: "eco-anon", // unique key in case another client exists on the page
    },
    db: { schema: "public" },
  });

if (process.env.NODE_ENV !== "production") g.__supabase = supabase;
