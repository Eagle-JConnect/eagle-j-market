import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config.js";

const url = String(SUPABASE_URL || "").trim().replace(/\/$/, "");
const key = String(SUPABASE_ANON_KEY || "").trim();

export const supabaseConfigured =
  /^https:\/\/[^\s]+\.supabase\.co$/.test(url) &&
  key.startsWith("sb_publishable_");

export const supabase = supabaseConfigured
  ? createClient(url, key, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      },
      global: {
        fetch: (...args) => fetch(...args)
      }
    })
  : null;

export async function testSupabaseConnection() {
  if (!supabaseConfigured) {
    return { ok: false, message: "Supabase configuration is missing or invalid." };
  }
  try {
    const response = await fetch(`${url}/auth/v1/settings`, {
      method: "GET",
      headers: { apikey: key },
      cache: "no-store"
    });
    if (!response.ok) {
      const body = await response.text().catch(() => "");
      return { ok: false, status: response.status, message: body || `Supabase returned HTTP ${response.status}.` };
    }
    return { ok: true, status: response.status };
  } catch (error) {
    return {
      ok: false,
      message: "The browser could not reach Supabase. Check the Project URL, internet connection, or Supabase project network restrictions.",
      detail: error?.message || String(error)
    };
  }
}
