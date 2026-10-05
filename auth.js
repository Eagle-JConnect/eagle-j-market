import { supabase, supabaseConfigured } from "./supabase.js";

const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const msg = document.getElementById("authMessage");

function message(text, ok=false){ if(msg){ msg.textContent=text; msg.className="message "+(ok?"success":"error"); } }

if(loginForm){
  loginForm.addEventListener("submit", async e=>{
    e.preventDefault();
    if(!supabaseConfigured){ message("Supabase is not configured yet. Add your URL and anon key in config.js."); return; }
    const email=document.getElementById("email").value.trim();
    const password=document.getElementById("password").value;
    const {error}=await supabase.auth.signInWithPassword({email,password});
    if(error){ message(error.message); return; }
    window.location.href="dashboard.html";
  });
}

if(registerForm){
  const params=new URLSearchParams(location.search);
  if(params.get("type")==="business") document.getElementById("accountType").value="business";
  registerForm.addEventListener("submit", async e=>{
    e.preventDefault();
    if(!supabaseConfigured){ message("Supabase is not configured yet. Add your URL and anon key in config.js."); return; }
    const email=document.getElementById("email").value.trim();
    const password=document.getElementById("password").value;
    const first_name=document.getElementById("firstName").value.trim();
    const last_name=document.getElementById("lastName").value.trim();
    const phone=document.getElementById("phone").value.trim();
    const account_type=document.getElementById("accountType").value;
    const {data,error}=await supabase.auth.signUp({email,password,options:{data:{first_name,last_name,phone,account_type}}});
    if(error){ message(error.message); return; }
    message("Account created. Check your email if email confirmation is enabled.", true);
  });
}
