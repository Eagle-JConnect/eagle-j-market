import {supabase,supabaseConfigured} from './supabase.js';
import {nav,user,profile,bootGlobalUI} from './utils.js';

document.querySelector('#nav').innerHTML=nav();bootGlobalUI();
const msg=document.querySelector('#msg');
function show(t,ok=false){msg.textContent=t;msg.className='message show '+(ok?'ok':'');}
const form=document.querySelector('#form');

async function goAfterLogin(){
  const p=await profile();
  const next=new URLSearchParams(location.search).get('next');
  if(next) location.href=next;
  else location.href=p?.account_type==='admin'?'admin.html':p?.account_type==='business'?'business-dashboard.html':'dashboard.html';
}

if(location.pathname.endsWith('login.html')){
  form.addEventListener('submit',async e=>{
    e.preventDefault();
    if(!supabaseConfigured)return show('Supabase configuration is missing.');
    const {error}=await supabase.auth.signInWithPassword({email:email.value.trim(),password:password.value});
    if(error)return show(error.message);
    await goAfterLogin();
  });
  document.querySelector('#googleLogin')?.addEventListener('click',async()=>{
    if(!supabaseConfigured)return show('Supabase configuration is missing.');
    const {error}=await supabase.auth.signInWithOAuth({
      provider:'google',
      options:{redirectTo:`${location.origin}${location.pathname.replace('login.html','')}login.html`}
    });
    if(error)show(error.message);
  });
}else{
  const t=new URLSearchParams(location.search).get('type');
  if(t)document.querySelector('#type').value=t;
  form.addEventListener('submit',async e=>{
    e.preventDefault();
    if(!supabaseConfigured)return show('Supabase configuration is missing.');
    const {data,error}=await supabase.auth.signUp({
      email:email.value.trim(),password:password.value,
      options:{data:{first_name:first.value.trim(),last_name:last.value.trim(),phone:phone.value.trim(),account_type:type.value}}
    });
    if(error)return show(error.message);
    if(data.session) location.href=type.value==='business'?'business-dashboard.html':'dashboard.html';
    else show('Account created. Check your email to confirm your account, then log in.',true);
  });
}
