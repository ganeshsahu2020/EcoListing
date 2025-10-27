import { createClient } from "@supabase/supabase-js";

export default async function handler(req:any, res:any) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const { email } = req.body || {};
  if (!email) return res.status(400).json({ error: "email required" });

  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const redirectTo = process.env.INVITE_REDIRECT_URL || "http://localhost:5173/auth/reset";

  const admin = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
  const { error } = await admin.auth.admin.generateLink({ type: "recovery", email, options: { redirectTo } });
  if (error) return res.status(400).json({ error: error.message });

  return res.status(200).json({ email, ok: true });
}
