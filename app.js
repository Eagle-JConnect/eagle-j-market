import { supabase, supabaseConfigured } from "./supabase.js";

const demoBusinesses = [
  {business_name:"Loude Fashion Studio",category:"Fashion",area:"Nassau",description:"Fashion, sewing and custom clothing services.",featured:true},
  {business_name:"EAGLE-J Services",category:"Home Services",area:"Nassau",description:"Local services and opportunities.",featured:true},
  {business_name:"Bahamas Local Eats",category:"Restaurants",area:"Nassau",description:"Discover local food and dining.",featured:true}
];
const demoDeals = [
  {title:"Bonnet Special",business_name:"Loude Fashion Studio",deal_price:10,description:"$10 + a surprise bonus."},
  {title:"Local Business Promotion",business_name:"EAGLE-J Services",deal_price:5,description:"Featured promotion offer."}
];

function businessCard(b){
  return `<article class="card"><div class="card-icon">🏪</div><div class="card-body"><span class="pill">${b.category||"Business"}</span><h3>${b.business_name}</h3><p>${b.description||"Local business on EAGLE-J MARKET."}</p><small>📍 ${b.area||"Nassau"}</small></div></article>`;
}
function dealCard(d){
  return `<article class="card deal"><div class="deal-image">🔥</div><div class="card-body"><span class="pill">DEAL</span><h3>${d.title}</h3><p>${d.description||""}</p><strong class="deal-price">$${d.deal_price}</strong><small>${d.business_name||"Local business"}</small></div></article>`;
}
async function loadHome(){
  let businesses = demoBusinesses, deals = demoDeals;
  if(supabaseConfigured){
    const b = await supabase.from("businesses").select("*").eq("status","approved").eq("featured",true).limit(6);
    const d = await supabase.from("deals").select("*, businesses(business_name)").eq("status","active").eq("featured",true).limit(6);
    if(!b.error && b.data?.length) businesses = b.data;
    if(!d.error && d.data?.length) deals = d.data.map(x=>({...x,business_name:x.businesses?.business_name}));
  }
  document.getElementById("featuredBusinesses").innerHTML = businesses.map(businessCard).join("");
  document.getElementById("homeDeals").innerHTML = deals.map(dealCard).join("");
}
loadHome();
