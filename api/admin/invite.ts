// Vercel Edge/Node function example
import { createClient } from "@supabase/supabase-js";

export default async function handler(req:any, res:any) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const { email, full_name } = req.body || {};
  if (!email) return res.status(400).json({ error: "email required" });

  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const redirectTo = process.env.INVITE_REDIRECT_URL || "http://localhost:5173/auth/reset";

  const admin = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

  // Create (or get) the user
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    email_confirm: false,
    user_metadata: { full_name: full_name || undefined },
  });
  if (createErr && !createErr.message?.includes("already registered")) {
    return res.status(400).json({ error: createErr.message });
  }
  const auth_uid = created?.user?.id;

  // Send an invite link
  const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
    type: "invite",
    email,
    options: { redirectTo },
  });
  if (linkErr) return res.status(400).json({ error: linkErr.message });

  return res.status(200).json({ email, auth_uid: auth_uid ?? null, invite_url: linkData.properties?.action_link ?? null });
}
