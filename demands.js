import {supabase} from './supabase.js';
import {esc,profile,user,toast,bootGlobalUI} from './utils.js';

bootGlobalUI();
const list=document.querySelector('#demandList');
const accessPanel=document.querySelector('#accessPanel');
const search=document.querySelector('#search');

function card(d){
  return `<article class="card"><div class="card-body"><span class="badge">${esc(d.categories?.name||'Demand')}</span><h3>${esc(d.title)}</h3><p>${esc(d.description)}</p><p class="muted">📍 ${esc(d.location||d.country||'Worldwide')} ${d.budget!=null?`• Budget: ${esc(d.currency)} ${Number(d.budget).toFixed(2)}`:''}</p><div class="actions"><button class="btn small secondary" data-view="${d.id}">View / Respond</button></div></div></article>`;
}

async function renderAccess(){
  const u=await user();
  if(!u){
    accessPanel.innerHTML='<h3>Want to post a demand?</h3><p class="muted">Create an account first. Posting and responding are controlled by Admin approval.</p><a class="btn" href="login.html">Login</a> <a class="btn secondary" href="register.html">Create account</a>';
    return;
  }
  const p=await profile();
  accessPanel.innerHTML=`<div style="display:flex;justify-content:space-between;gap:16px;align-items:center;flex-wrap:wrap"><div><h3>Your demand access</h3><p class="muted">Post access: <b>${p?.can_post_demand?'Granted':'Not granted'}</b> · Response access: <b>${p?.can_respond_demand?'Granted':'Not granted'}</b></p></div>${p?.can_post_demand?'<button class="btn" id="newDemand">Post a demand</button>':'<span class="badge">Admin approval required to post</span>'}</div>`;
  document.querySelector('#newDemand')?.addEventListener('click',showForm);
}

function showForm(){
  accessPanel.innerHTML=`<h3>Post a demand</h3><form id="demandForm"><div class="form-grid"><div class="field full"><label>What do you need?</label><input id="dTitle" required maxlength="160"></div><div class="field full"><label>Details</label><textarea id="dDesc" required maxlength="3000"></textarea></div><div class="field"><label>Location</label><input id="dLocation" placeholder="City, region or Remote"></div><div class="field"><label>Country</label><input id="dCountry"></div><div class="field"><label>Budget</label><input id="dBudget" type="number" min="0" step="0.01"></div></div><br><button class="btn">Submit for Admin approval</button> <button type="button" class="btn secondary" id="cancelDemand">Cancel</button></form>`;
  document.querySelector('#cancelDemand').onclick=renderAccess;
  document.querySelector('#demandForm').onsubmit=async e=>{
    e.preventDefault(); const u=await user(); if(!u)return;
    const p=await profile(); if(!p?.can_post_demand)return toast('Admin approval is required before you can post a demand.');
    const {error}=await supabase.from('demands').insert({user_id:u.id,title:dTitle.value.trim(),description:dDesc.value.trim(),location:dLocation.value.trim(),country:dCountry.value.trim(),budget:dBudget.value?Number(dBudget.value):null,status:'pending'});
    toast(error?.message||'Demand submitted for Admin approval.',!error); if(!error){await renderAccess();await load();}
  };
}

async function load(){
  let q=supabase.from('demands').select('*,categories(name)').eq('status','approved').order('created_at',{ascending:false});
  const term=search.value.trim(); if(term)q=q.or(`title.ilike.%${term}%,description.ilike.%${term}%,location.ilike.%${term}%,country.ilike.%${term}%`);
  const {data,error}=await q.limit(60);
  if(error){list.innerHTML=`<div class="empty">${esc(error.message)}</div>`;return;}
  list.innerHTML=(data||[]).map(card).join('')||'<div class="empty">No approved demands found yet.</div>';
  document.querySelectorAll('[data-view]').forEach(btn=>btn.onclick=()=>viewDemand(btn.dataset.view));
}

async function viewDemand(id){
  const {data:d,error}=await supabase.from('demands').select('*,categories(name)').eq('id',id).maybeSingle();
  if(error||!d)return toast('Demand not found.');
  const {data:responses}=await supabase.from('demand_responses').select('*').eq('demand_id',id).eq('status','published').order('created_at',{ascending:false});
  const u=await user(),p=u?await profile():null;
  const responseForm=p?.can_respond_demand?`<form id="responseForm"><textarea id="responseText" required maxlength="3000" placeholder="Write a helpful response..."></textarea><br><button class="btn">Send response</button></form>`:'<p class="muted">Responses are limited to users approved by Admin.</p>';
  accessPanel.innerHTML=`<div class="panel" style="padding:22px"><button class="btn secondary small" id="backDemands">← Back</button><h2>${esc(d.title)}</h2><p>${esc(d.description)}</p><p class="muted">📍 ${esc(d.location||d.country||'Worldwide')}</p><hr><h3>Responses</h3><div>${(responses||[]).map(r=>`<div class="panel" style="padding:14px;margin:8px 0">${esc(r.message)}</div>`).join('')||'<p class="muted">No responses yet.</p>'}</div>${responseForm}</div>`;
  document.querySelector('#backDemands').onclick=renderAccess;
  document.querySelector('#responseForm')?.addEventListener('submit',async e=>{e.preventDefault();const cu=await user();if(!cu)return;const cp=await profile();if(!cp?.can_respond_demand)return toast('Admin approval is required to respond.');const {error}=await supabase.from('demand_responses').insert({demand_id:id,user_id:cu.id,message:responseText.value.trim()});toast(error?.message||'Response sent.',!error);if(!error)await viewDemand(id);});
}

search.onkeydown=e=>{if(e.key==='Enter')load()}; document.querySelector('#searchBtn').onclick=load;
await renderAccess(); await load();
