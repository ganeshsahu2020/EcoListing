import { supabase } from "./supabaseClient";

const VID_KEY = "ecolisting_vid";
const SID_KEY = "ecolisting_sid";
const SID_TS_KEY = "ecolisting_sid_ts";
const SESSION_TTL_MIN = 30;

function uuid(): string {
  // quick UUIDv4
  return crypto.randomUUID();
}

export function getVisitorId(): string {
  let id = localStorage.getItem(VID_KEY);
  if (!id) {
    id = uuid();
    localStorage.setItem(VID_KEY, id);
  }
  return id;
}

export function getSessionId(): string {
  const now = Date.now();
  const lastTs = Number(sessionStorage.getItem(SID_TS_KEY) || 0);
  let sid = sessionStorage.getItem(SID_KEY);

  const expired = !sid || (now - lastTs) / 60000 > SESSION_TTL_MIN;
  if (expired) {
    sid = uuid();
    sessionStorage.setItem(SID_KEY, sid);
  }
  sessionStorage.setItem(SID_TS_KEY, String(now));
  return sid!;
}

function parseUtm(): Record<string, string> | null {
  const qs = new URLSearchParams(location.search);
  const keys = ["utm_source","utm_medium","utm_campaign","utm_term","utm_content"];
  const obj: Record<string,string> = {};
  let any = false;
  keys.forEach(k => {
    const v = qs.get(k);
    if (v) { obj[k] = v; any = true; }
  });
  return any ? obj : null;
}

export async function logActivity(
  action: "pageview" | "view" | "favorite" | "share" | "contact" | "request_tour" | "message_open",
  opts?: {
    propertyId?: string | null;
    context?: Record<string, any>;
    pagePath?: string;
  }
) {
  const visitor_id = getVisitorId();
  const session_id = getSessionId();

  const page_path = opts?.pagePath ?? location.pathname + location.search;
  const context = opts?.context ?? {};
  const utm = parseUtm();
  const referrer = document.referrer || null;
  const user_agent = navigator.userAgent;

  await supabase.rpc("log_activity", {
    p_action: action,
    p_property_id: opts?.propertyId ?? null,
    p_page_path: page_path,
    p_context: context,
    p_visitor_id: visitor_id,
    p_session_id: session_id,
    p_user_agent: user_agent,
    p_referrer: referrer,
    p_utm: utm,
  });
}

/** Hook: auto log pageview on mount / route change */
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
export function usePageviews() {
  const loc = useLocation();
  useEffect(() => {
    logActivity("pageview", { pagePath: loc.pathname + loc.search });
     
  }, [loc.pathname, loc.search]);
}
