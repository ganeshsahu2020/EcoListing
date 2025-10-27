// src/utils/storage.ts
import { supabase } from "./supabaseClient";

export async function uploadAgentHeadshot(file: File, agentId: string): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `heads/${agentId}.${ext}`;

  const { error: upErr } = await supabase
    .storage
    .from("agent-headshots")
    .upload(path, file, { upsert: true });

  if (upErr) throw upErr;

  const { data } = supabase.storage.from("agent-headshots").getPublicUrl(path);
  return data.publicUrl;
}
