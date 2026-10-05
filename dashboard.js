import { supabase, supabaseConfigured } from "./supabase.js";
async function load(){if(!supabaseConfigured){document.getElementById("userEmail").textContent="Demo mode — configure Supabase to enable accounts.";return;}const {data:{user}}=await supabase.auth.getUser();if(!user){location.href="login.html";return;}document.getElementById("userEmail").textContent=user.email;}
load();
