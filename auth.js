import {supabase,supabaseConfigured} from './supabase.js';
import {nav,user,profile,bootGlobalUI} from './utils.js';

if(!document.querySelector("#nav")?.querySelector(".header")){document.querySelector("#nav").innerHTML=nav();}bootGlobalUI();
const msg=document.querySelector('#msg');
function show(t,ok=false){msg.textContent=t;msg.className='message show '+(ok?'ok':'');}
const form=document.querySelector('#form');
const emailInput=document.querySelector('#email');
const passwordInput=document.querySelector('#password');
const submitButton=form?.querySelector('button[type=submit]');

async function goAfterLogin(){
  const p=await profile();
  const next=new URLSearchParams(location.search).get('next');
  if(next) location.href=next;
  else location.href=p?.account_type==='admin'?'admin.html':p?.account_type==='business'?'business-dashboard.html':'dashboard.html';
}

if(location.pathname.endsWith('login.html')){
  form?.addEventListener('submit',async e=>{
    e.preventDefault();
    if(!supabaseConfigured)return show('Supabase configuration is missing.');
    if(!emailInput?.value.trim() || !passwordInput?.value){return show('Enter your email and password.');}
    if(submitButton){submitButton.disabled=true; submitButton.textContent='Logging in…';}
    try{
      const {error}=await supabase.auth.signInWithPassword({email:emailInput.value.trim(),password:passwordInput.value});
      if(error)return show(error.message);
      show('Login successful. Redirecting…',true);
      await goAfterLogin();
    }catch(error){
      console.error('Login exception:',error);
      show(error?.message||'Login failed. Please try again.');
    }finally{
      if(submitButton){submitButton.disabled=false; submitButton.textContent='Login';}
    }
  });
  document.querySelector('#googleLogin')?.addEventListener('click',async()=>{
    if(!supabaseConfigured)return show('Supabase configuration is missing.');
    try{
      const redirectTo=`${location.origin}${location.pathname.replace(/[^/]*$/, '')}login.html`;
      const {error}=await supabase.auth.signInWithOAuth({provider:'google',options:{redirectTo}});
      if(error)show(error.message);
    }catch(error){
      console.error('Google login exception:',error);
      show(error?.message||'Google login failed.');
    }
  });
}else{
  const t=new URLSearchParams(location.search).get('type');
  const firstInput=document.querySelector('#first');
  const lastInput=document.querySelector('#last');
  const phoneInput=document.querySelector('#phone');
  const typeInput=document.querySelector('#type');
  if(t && typeInput)typeInput.value=t;
  form?.addEventListener('submit',async e=>{
    e.preventDefault();
    if(!supabaseConfigured)return show('Supabase configuration is missing.');
    const {data,error}=await supabase.auth.signUp({
      email:emailInput.value.trim(),password:passwordInput.value,
      options:{data:{first_name:firstInput?.value.trim()||'',last_name:lastInput?.value.trim()||'',phone:phoneInput?.value.trim()||'',account_type:typeInput?.value||'customer'}}
    });
    if(error)return show(error.message);
    if(data.session) location.href=typeInput?.value==='business'?'business-dashboard.html':'dashboard.html';
    else show('Account created. Check your email to confirm your account, then log in.',true);
  });
}
