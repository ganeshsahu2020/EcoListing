// src/pages/auth/Callback.tsx
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../../utils/supabaseClient";

export default function AuthCallback() {
  const nav = useNavigate();
  const loc = useLocation();
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const sp = new URLSearchParams(loc.search);
      const next = sp.get("next") || undefined;

      // If Supabase already established a session, just route.
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        // Very rare: show an error state if no session after redirect
        setErr("Could not complete sign-in.");
        return;
      }

      // Optional: fetch role to route (same rule you use elsewhere)
      let dest = next || "/account";
      const uid = data.session.user.id;
      const { data: roleRow } = await supabase
        .from("user_roles")
        .select("role")
        .eq("auth_uid", uid)
        .maybeSingle();
      const r = roleRow?.role as "user" | "agent" | "superadmin" | undefined;
      dest = next || (r === "superadmin" ? "/admin/users" : r === "agent" ? "/agent/profile" : "/account");

      nav(dest, { replace: true });
    })();
  }, [loc.search, nav]);

  return (
    <main className="container-7xl section-pad">
      <div className="mx-auto max-w-md card p-6">
        <h1 className="text-xl font-semibold">Finishing sign-in…</h1>
        {err && <div className="mt-3 text-red-600">{err}</div>}
      </div>
    </main>
  );
}
