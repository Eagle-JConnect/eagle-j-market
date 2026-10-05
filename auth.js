import { supabase, supabaseConfigured, testSupabaseConnection } from "./supabase.js";

const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const msg = document.getElementById("authMessage");

function message(text, ok = false) {
  if (msg) {
    msg.textContent = text;
    msg.className = "message " + (ok ? "success" : "error");
  }
}

function explainError(error) {
  if (!error) return "Unknown error.";
  if (error instanceof TypeError && /fetch/i.test(error.message || "")) {
    return "Failed to fetch: your browser cannot reach the Supabase API. Verify the Supabase Project URL and that the project is online.";
  }
  return error.message || String(error);
}

async function verifyConnection() {
  const result = await testSupabaseConnection();
  if (!result.ok) {
    console.error("EAGLE-J MARKET Supabase connection test failed:", result);
    message(result.status ? `Supabase connection failed (HTTP ${result.status}). ${result.message}` : result.message);
    return false;
  }
  return true;
}

if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!supabaseConfigured) { message("Supabase configuration is missing or invalid."); return; }
    if (!(await verifyConnection())) return;
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) { message(explainError(error)); return; }
      window.location.href = "dashboard.html";
    } catch (error) {
      console.error(error);
      message(explainError(error));
    }
  });
}

if (registerForm) {
  const params = new URLSearchParams(location.search);
  if (params.get("type") === "business") document.getElementById("accountType").value = "business";

  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!supabaseConfigured) { message("Supabase configuration is missing or invalid."); return; }
    if (!(await verifyConnection())) return;

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const first_name = document.getElementById("firstName").value.trim();
    const last_name = document.getElementById("lastName").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const account_type = document.getElementById("accountType").value;

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${location.origin}${location.pathname.replace(/register\.html$/, "")}`,
          data: { first_name, last_name, phone, account_type }
        }
      });
      if (error) {
        message(explainError(error));
        return;
      }
      if (data?.session) {
        message("Account created successfully. You are now signed in.", true);
      } else {
        message("Account created. Check your email to confirm your account, then log in.", true);
      }
    } catch (error) {
      console.error(error);
      message(explainError(error));
    }
  });
}
