import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

export type AppRole = "user" | "agent" | "superadmin";

export function useMyRole() {
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: sess } = await supabase.auth.getSession();
      const uid = sess?.session?.user?.id;
      if (!uid) {
        if (mounted) { setRole(null); setLoading(false); }
        return;
      }
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("auth_uid", uid)
        .maybeSingle();

      if (!mounted) return;
      if (error || !data?.role) {
        // default to user if unreadable/missing
        setRole("user");
      } else {
        setRole((data.role as AppRole) || "user");
      }
      setLoading(false);
    })();
    return () => { mounted = false; };
  }, []);

  return { role, loading };
}
