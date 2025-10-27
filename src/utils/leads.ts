// src/utils/leads.ts
import { supabase } from '../utils/supabaseClient';

type ContactForm = { name?:string; email?:string; phone?:string; notes?:string };
type Options = { assignToAgentId?: string | null; extraNotes?: string };

export async function createLeadFromContact(property_id: string, form: ContactForm, opts: Options = {}) {
  const { data: sess } = await supabase.auth.getSession();
  const prospect_uid = sess?.session?.user?.id ?? null;

  const combinedNotes = [form.notes?.trim(), opts.extraNotes?.trim()].filter(Boolean).join(' | ');

  const { data: lead, error } = await supabase
    .from('leads')
    .insert({
      prospect_uid,
      prospect_name: form.name ?? null,
      prospect_email: form.email ?? null,
      prospect_phone: form.phone ?? null,
      property_id,
      status: 'new',
      source: 'property_page',
      notes: combinedNotes || null,
      first_contact_at: new Date().toISOString()
    })
    .select('*')
    .single();
  if (error) throw error;

  if (opts.assignToAgentId) {
    const { error: upErr } = await supabase
      .from('leads')
      .update({ assigned_agent_id: opts.assignToAgentId })
      .eq('lead_id', lead.lead_id);
    if (upErr) throw upErr;
  } else {
    const { error: rrErr } = await supabase.rpc('assign_lead_round_robin', { p_lead_id: lead.lead_id });
    if (rrErr) throw rrErr;
  }

  const { data: finalLead, error: reErr } = await supabase
    .from('leads')
    .select('*')
    .eq('lead_id', lead.lead_id)
    .single();
  if (reErr) throw reErr;

  return finalLead;
}
