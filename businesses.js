import { supabase, supabaseConfigured } from "./supabase.js";
const demo=[
 {business_name:"Loude Fashion Studio",category:"Fashion",area:"Nassau",description:"Custom clothing, bonnets and fashion services."},
 {business_name:"EAGLE-J Services",category:"Home Services",area:"Nassau",description:"Local services and opportunities."},
 {business_name:"Bahamas Local Eats",category:"Restaurants",area:"Nassau",description:"Local dining and food services."},
 {business_name:"Nassau Auto Care",category:"Auto",area:"Nassau",description:"Automotive services."}
];
const list=document.getElementById("businessList"), search=document.getElementById("businessSearch"), filter=document.getElementById("categoryFilter");
function render(data){list.innerHTML=data.map(b=>`<article class="card"><div class="card-icon">🏪</div><div class="card-body"><span class="pill">${b.category||"Business"}</span><h3>${b.business_name}</h3><p>${b.description||""}</p><small>📍 ${b.area||"Nassau"}</small><br><a class="text-link" href="#">View business →</a></div></article>`).join("")||"<p>No businesses found.</p>";}
let data=demo;
async function load(){if(supabaseConfigured){const {data:d,error}=await supabase.from("businesses").select("*").eq("status","approved").order("featured",{ascending:false});if(!error&&d?.length)data=d;} const p=new URLSearchParams(location.search); if(p.get("category")) filter.value=p.get("category"); apply();}
function apply(){const q=search.value.toLowerCase();const c=filter.value;render(data.filter(b=>(!q||`${b.business_name} ${b.description} ${b.category}`.toLowerCase().includes(q))&&(!c||b.category===c)));}
search.addEventListener("input",apply);filter.addEventListener("change",apply);load();
