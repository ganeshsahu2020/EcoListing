import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL!;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
    const email = String(req.query.email || "").toLowerCase();
    if (!email || !email.includes("@")) return res.status(400).json({ error: "email is required" });

    const admin = createClient(url, service);

    // Caller must be superadmin
    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
    if (!token) return res.status(401).json({ error: "Missing bearer token" });

    const { data: userData, error: getUserErr } = await admin.auth.getUser(token);
    if (getUserErr || !userData.user) return res.status(401).json({ error: "Invalid token" });

    const callerId = userData.user.id;
    const { data: roleRow, error: roleErr } = await admin
      .from("user_roles")
      .select("role")
      .eq("auth_uid", callerId)
      .maybeSingle();

    if (roleErr) return res.status(500).json({ error: roleErr.message });
    if (!roleRow || roleRow.role !== "superadmin") return res.status(403).json({ error: "Forbidden" });

    // Now resolve target user by email
    const { data: target, error: lookupErr } = await admin.auth.admin.getUserByEmail(email);
    if (lookupErr) return res.status(500).json({ error: lookupErr.message });
    if (!target?.user?.id) return res.status(404).json({ error: "User not found" });

    return res.status(200).json({ email, auth_uid: target.user.id });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message ?? "Server error" });
  }
}
