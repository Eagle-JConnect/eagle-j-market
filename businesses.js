import {supabase} from './supabase.js';
import {nav,esc,img,bootGlobalUI} from './utils.js';

document.querySelector('#nav').innerHTML=nav('businesses');
bootGlobalUI();

const list=document.querySelector('#list');
const q=document.querySelector('#q'), cat=document.querySelector('#cat');
const country=document.querySelector('#country'), region=document.querySelector('#region');
const city=document.querySelector('#city'), postal=document.querySelector('#postal'), remote=document.querySelector('#remote');
const p=new URLSearchParams(location.search);
q.value=p.get('q')||''; country.value=p.get('country')||''; region.value=p.get('region')||''; city.value=p.get('city')||''; postal.value=p.get('postal')||'';
remote.checked=p.get('remote')==='1';

async function init(){
  const {data:c}=await supabase.from('categories').select('*').eq('active',true).order('name');
  cat.innerHTML='<option value="">All categories</option>'+(c||[]).map(x=>`<option value="${esc(x.id)}">${esc(x.name)}</option>`).join('');
  if(p.get('category')){const x=(c||[]).find(x=>x.slug===p.get('category'));if(x)cat.value=x.id}
  load();
}

async function load(){
  let query=supabase.from('businesses').select('*,categories(name)').eq('status','approved').order('featured',{ascending:false}).order('created_at',{ascending:false});
  if(cat.value) query=query.eq('category_id',cat.value);
  const term=q.value.trim();
  if(term) query=query.or(`business_name.ilike.%${term}%,description.ilike.%${term}%,area.ilike.%${term}%,city.ilike.%${term}%,country.ilike.%${term}%`);
  if(country.value.trim()) query=query.ilike('country',`%${country.value.trim()}%`);
  if(region.value.trim()) query=query.ilike('region',`%${region.value.trim()}%`);
  if(city.value.trim()) query=query.ilike('city',`%${city.value.trim()}%`);
  if(postal.value.trim()) query=query.ilike('postal_code',`%${postal.value.trim()}%`);
  if(remote.checked) query=query.eq('is_remote',true);
  const {data,error}=await query.limit(60);
  if(error){list.innerHTML=`<div class="empty">${esc(error.message)}</div>`;return}
  list.innerHTML=(data||[]).map(b=>`<article class="card"><div class="card-img">${img(b.cover_image_url||b.logo_url,b.business_name)}</div><div class="card-body"><span class="badge">${esc(b.categories?.name||'Business')}</span><h3>${esc(b.business_name)} ${b.verified?'✓':''}</h3><p>${esc(b.is_remote?'Remote / Online':([b.area,b.city,b.region,b.country].filter(Boolean).join(' • ')||'Worldwide'))} • ${esc(b.phone||'Contact available')}</p><div class="actions"><a class="btn small" href="business.html?id=${b.id}">View</a>${b.whatsapp?`<a class="btn small success" target="_blank" href="https://wa.me/${b.whatsapp.replace(/[^0-9]/g,'')}">WhatsApp</a>`:''}</div></div></article>`).join('')||'<div class="empty">No businesses found.</div>';
}
document.querySelector('#go').onclick=load;
[q,country,region,city,postal].forEach(el=>el?.addEventListener('keydown',e=>{if(e.key==='Enter')load()}));
init();
