import { supabase } from "./supabase.js";
export const $=(s,r=document)=>r.querySelector(s); export const $$=(s,r=document)=>[...r.querySelectorAll(s)];
export function esc(v){return String(v??"").replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
export function money(v,c='USD'){return v==null||v===''?'—':new Intl.NumberFormat('en-US',{style:'currency',currency:c}).format(Number(v));}
export function slugify(s){return String(s||'').toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');}
export async function user(){if(!supabase)return null; const {data}=await supabase.auth.getUser(); return data.user||null;}
export async function profile(){const u=await user(); if(!u)return null; const {data}=await supabase.from('profiles').select('*').eq('user_id',u.id).maybeSingle(); return data||null;}
export function toast(msg,ok=false){let el=$('#toast');if(!el){el=document.createElement('div');el.id='toast';document.body.appendChild(el)}el.textContent=msg;el.className='toast '+(ok?'ok':'');setTimeout(()=>el.classList.remove('show'),2500);el.classList.add('show');}
export async function requireAuth(){const u=await user();if(!u){location.href='login.html?next='+encodeURIComponent(location.pathname+location.search);return null}return u;}
export async function logout(){await supabase.auth.signOut();location.href='index.html';}
export function img(url,alt=''){return url?`<img src="${esc(url)}" alt="${esc(alt)}" loading="lazy">`:`<div class="img-placeholder">🦅</div>`}
export function nav(active=''){return `<header class="header"><a class="brand" href="index.html">🦅 <span>EAGLE-J MARKET</span></a><nav class="nav"><a class="${active==='home'?'active':''}" href="index.html">Home</a><a class="${active==='businesses'?'active':''}" href="businesses.html">Businesses</a><a class="${active==='products'?'active':''}" href="products.html">Products</a><a class="${active==='deals'?'active':''}" href="deals.html">Deals</a><a class="${active==='pricing'?'active':''}" href="pricing.html">Plans</a><a class="${active==='dashboard'?'active':''}" href="dashboard.html">My Account</a></nav><button class="menu" onclick="document.querySelector('.nav').classList.toggle('open')">☰</button></header>`}
