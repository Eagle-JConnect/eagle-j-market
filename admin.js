import { supabase, supabaseConfigured } from "./supabase.js";
async function count(table,id){const {count,error}=await supabase.from(table).select(id||"id",{count:"exact",head:true});return error?"—":count;}
async function load(){if(!supabaseConfigured)return;document.getElementById("usersCount").textContent=await count("profiles","id");document.getElementById("businessCount").textContent=await count("businesses","id");document.getElementById("dealCount").textContent=await count("deals","id");}
load();
