import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config.js";

const validUrl =
  typeof SUPABASE_URL === "string" &&
  /^https:\/\/[^\s]+\.supabase\.co\/?$/.test(SUPABASE_URL.trim());

const validKey =
  typeof SUPABASE_ANON_KEY === "string" &&
  (
    SUPABASE_ANON_KEY.startsWith("sb_publishable_") ||
    SUPABASE_ANON_KEY.startsWith("eyJ")
  );

export const supabaseConfigured = validUrl && validKey;

export const supabase = supabaseConfigured
  ? createClient(
      SUPABASE_URL.trim().replace(/\/$/, ""),
      SUPABASE_ANON_KEY.trim(),
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          storage: window.localStorage
        }
      }
    )
  : null;

console.log(
  "EAGLE-J MARKET Supabase:",
  supabaseConfigured ? "CONNECTED" : "NOT CONFIGURED"
);
