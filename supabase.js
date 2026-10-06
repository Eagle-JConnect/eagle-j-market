import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config.js";
export const supabaseConfigured = /^https:\/\/[^\s]+\.supabase\.co$/.test(SUPABASE_URL) && SUPABASE_ANON_KEY.startsWith("sb_publishable_");
export const supabase = supabaseConfigured ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth:{ persistSession:true, autoRefreshToken:true, detectSessionInUrl:true } }) : null;
