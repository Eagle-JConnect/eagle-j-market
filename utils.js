import { supabase } from "./supabase.js";
import { getLanguage, setLanguage, initLanguage, t } from "./i18n.js";

export const $ = (selector, root = document) =>
  root.querySelector(selector);

export const $$ = (selector, root = document) =>
  [...root.querySelectorAll(selector)];


/* =========================
   ESCAPE HTML
========================= */

export function esc(value) {
  return String(value ?? "").replace(
    /[&<>'"]/g,
    character => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "'": "&#39;",
      '"': "&quot;"
    }[character])
  );
}


/* =========================
   MONEY
========================= */

export function money(value, currency = "USD") {

  if (value == null || value === "") {
    return "—";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency
  }).format(Number(value));
}


/* =========================
   SLUGIFY
========================= */

export function slugify(value) {

  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}


/* =========================
   CURRENT USER
========================= */

export async function user() {

  if (!supabase) {
    console.error("Supabase is not available.");
    return null;
  }

  try {

    const { data, error } =
      await supabase.auth.getUser();

    if (error) {
      console.error(
        "Get user error:",
        error
      );

      return null;
    }

    return data?.user || null;

  } catch (error) {

    console.error(
      "Unexpected user error:",
      error
    );

    return null;
  }
}


/* =========================
   CURRENT PROFILE
========================= */

export async function profile() {

  const currentUser =
    await user();

  if (!currentUser) {
    return null;
  }

  try {

    const { data, error } =
      await supabase
        .from("profiles")
        .select("*")
        .eq(
          "user_id",
          currentUser.id
        )
        .maybeSingle();

    if (error) {

      console.error(
        "Profile error:",
        error
      );

      return null;
    }

    return data || null;

  } catch (error) {

    console.error(
      "Unexpected profile error:",
      error
    );

    return null;
  }
}


/* =========================
   TOAST
========================= */

export function toast(
  message,
  success = false
) {

  let element =
    $("#toast");

  if (!element) {

    element =
      document.createElement("div");

    element.id =
      "toast";

    document.body.appendChild(
      element
    );
  }

  element.textContent =
    message;

  element.className =
    "toast " +
    (success ? "ok" : "");

  element.classList.add(
    "show"
  );

  setTimeout(() => {

    element.classList.remove(
      "show"
    );

  }, 2500);
}


/* =========================
   REQUIRE AUTH
========================= */

export async function requireAuth() {

  const currentUser =
    await user();

  if (!currentUser) {

    window.location.replace(
      "login.html?next=" +
      encodeURIComponent(
        window.location.pathname +
        window.location.search
      )
    );

    return null;
  }

  return currentUser;
}


/* =========================
   LOGOUT
========================= */

export async function logout() {

  try {

    console.log(
      "EAGLE-J MARKET: logout started"
    );


    const {
      error
    } =
      await supabase.auth.signOut({
        scope: "local"
      });


    if (error) {

      console.error(
        "Supabase logout error:",
        error
      );

      return {
        success: false,
        error
      };
    }


    console.log(
      "EAGLE-J MARKET: logout successful"
    );


    return {
      success: true,
      error: null
    };


  } catch (error) {

    console.error(
      "Logout exception:",
      error
    );

    return {
      success: false,
      error
    };
  }
}


/* =========================
   IMAGE
========================= */

export function img(
  url,
  alt = ""
) {

  if (url) {

    return `
      <img
        src="${esc(url)}"
        alt="${esc(alt)}"
        loading="lazy"
      >
    `;

  }

  return `
    <div class="img-placeholder">
      🦅
    </div>
  `;
}



/* =========================
   STORAGE IMAGE UPLOAD
========================= */
export async function uploadImage(file, folder="general"){
  if(!file) return {url:null,error:null};
  const current=await user();
  if(!current) return {url:null,error:new Error("Please log in before uploading an image.")};
  const allowed=["image/jpeg","image/png","image/webp","image/gif"];
  if(!allowed.includes(file.type)) return {url:null,error:new Error("Please choose a JPG, PNG, WEBP or GIF image.")};
  if(file.size>8*1024*1024) return {url:null,error:new Error("Image must be 8 MB or smaller.")};
  const ext=(file.name.split(".").pop()||"jpg").toLowerCase().replace(/[^a-z0-9]/g,"");
  const path=`${current.id}/${folder}/${crypto.randomUUID()}.${ext}`;
  const {error}=await supabase.storage.from("market-images").upload(path,file,{cacheControl:"3600",upsert:false,contentType:file.type});
  if(error) return {url:null,error};
  const {data}=supabase.storage.from("market-images").getPublicUrl(path);
  return {url:data.publicUrl,error:null,path};
}
export function bindImagePicker(input, preview, {folder="general", onUploaded=()=>{}}={}){
  if(!input) return;
  input.addEventListener("change",async()=>{
    const file=input.files?.[0]; if(!file)return;
    if(preview){preview.src=URL.createObjectURL(file);preview.hidden=false;}
    input.disabled=true; const result=await uploadImage(file,folder); input.disabled=false;
    if(result.error){toast(result.error.message);input.value="";return;} onUploaded(result.url);
  });
}

/* =========================
   GLOBAL ONLINE PRESENCE
========================= */
let presenceChannel=null;
let presenceStarted=false;

export async function startPresence(){
  const status=document.querySelector("#presenceStatus");
  if(!status || !supabase || presenceStarted) return;
  presenceStarted=true;

  try {
    const sessionId=crypto.randomUUID();
    presenceChannel=supabase.channel("eagle-j-market-online",{
      config:{presence:{key:sessionId}}
    });

    const update=()=>{
      if(!presenceChannel) return;
      const count=Object.keys(presenceChannel.presenceState()).length;
      status.textContent=count>0
        ? `${t("Someone is connected")} • ${count}`
        : t("Online");
      status.classList.add("presence-online");
    };

    presenceChannel
      .on("presence",{event:"sync"},update)
      .on("presence",{event:"join"},update)
      .on("presence",{event:"leave"},update);

    const result=await presenceChannel.subscribe(async code=>{
      if(code==="SUBSCRIBED"){
        await presenceChannel.track({online_at:new Date().toISOString()});
        update();
      }
    });

    if(result === "CHANNEL_ERROR" || result === "TIMED_OUT") {
      presenceChannel=null;
      presenceStarted=false;
    }
  } catch(error) {
    console.warn("Presence unavailable:",error);
    presenceChannel=null;
    presenceStarted=false;
  }
}

/* =========================
   NAVIGATION
========================= */

export function nav(active = "") {
  queueMicrotask(()=>initLanguage());
  const activeLink = href => active && href.includes(active) ? "active" : "";
  return `
    <header class="header" id="siteHeader">
      <a class="brand" href="index.html">🦅 <span>EAGLE-J MARKET</span></a>
      <nav class="nav" id="mainNav" aria-label="Main navigation">
        <a class="${activeLink("index.html") || (active === "home" ? "active" : "")}" href="index.html">Home</a>
        <a class="${active === "businesses" ? "active" : ""}" href="businesses.html">Businesses</a>
        <a class="${active === "products" ? "active" : ""}" href="products.html">Products</a>
        <a class="${active === "deals" ? "active" : ""}" href="deals.html">Deals</a>
        <a class="${active === "pricing" ? "active" : ""}" href="pricing.html">Plans</a>
        <a class="${active === "dashboard" ? "active" : ""}" href="dashboard.html">My Account</a>
        <button type="button" class="nav-action notification-trigger" id="notificationButton" aria-expanded="false" aria-controls="notificationPanel">🔔 <span data-label="Notifications">Notifications</span> <span id="notificationBadge" class="notification-badge" hidden>0</span></button>
        <label class="language-control"><span>🌐</span><select id="languageSelect" aria-label="Language"><option value="en">English</option><option value="fr">Français</option><option value="ht">Kreyòl</option></select></label>
        <a class="nav-action login-link" href="login.html">🔐 <span data-label="Login">Login</span></a>
        <button type="button" class="nav-action google-menu" id="googleMenuLogin">🟢 <span data-label="Continue with Google">Gmail / Google</span></button>
        <div class="notification-panel" id="notificationPanel" hidden>
          <div class="notification-head"><strong data-label="Notifications">Notifications</strong><button type="button" id="closeNotifications" aria-label="Close">×</button></div>
          <div id="notificationList" class="notification-list"><div class="notification-empty">Someone is connected</div></div>
          <a class="btn small" href="dashboard.html" data-label="View notifications">View notifications</a>
        </div>
      </nav>
      <div id="presenceStatus" class="presence-status" role="status" aria-live="polite">Online</div>
      <button type="button" class="menu" aria-label="Menu" aria-expanded="false" aria-controls="mainNav">☰</button>
    </header>`;
}

export function bootGlobalUI(){
  initLanguage();
  const menu=document.querySelector('.menu');
  const navEl=document.querySelector('#mainNav, .nav');
  if(menu && navEl && !menu.dataset.bound){
    menu.dataset.bound='1';
    menu.addEventListener('click',()=>{
      const open=navEl.classList.toggle('open');
      menu.setAttribute('aria-expanded',String(open));
    });
  }

  const notificationButton=document.querySelector('#notificationButton');
  const panel=document.querySelector('#notificationPanel');
  const closeNotifications=document.querySelector('#closeNotifications');
  if(notificationButton && panel && !notificationButton.dataset.bound){
    notificationButton.dataset.bound='1';
    const close=()=>{panel.hidden=true;notificationButton.setAttribute('aria-expanded','false')};
    notificationButton.addEventListener('click',async()=>{
      panel.hidden=!panel.hidden;
      notificationButton.setAttribute('aria-expanded',String(!panel.hidden));
      if(!panel.hidden) await loadNotifications();
    });
    closeNotifications?.addEventListener('click',close);
    document.addEventListener('click',e=>{
      if(!panel.hidden && !panel.contains(e.target) && !notificationButton.contains(e.target)) close();
    });
  }

  const googleButton=document.querySelector('#googleMenuLogin');
  if(googleButton && !googleButton.dataset.bound){
    googleButton.dataset.bound='1';
    googleButton.addEventListener('click',async()=>{
      if(!supabase){ location.href='login.html'; return; }
      try{
        const {error}=await supabase.auth.signInWithOAuth({
          provider:'google',
          options:{redirectTo:`${location.origin}${location.pathname.replace(/[^/]*$/, '')}login.html`}
        });
        if(error) toast(error.message);
      }catch(error){ toast(error?.message||'Google login failed.'); }
    });
  }

  startPresence();
  loadNotifications();
}

async function loadNotifications(){
  const list=document.querySelector('#notificationList');
  const badge=document.querySelector('#notificationBadge');
  if(!list) return;
  const items=[];
  const status=document.querySelector('#presenceStatus');
  if(status?.textContent) items.push({title:status.textContent,body:'EAGLE-J MARKET online presence'});
  if(supabase){
    try{
      const {data:userData}=await supabase.auth.getUser();
      const uid=userData?.user?.id;
      if(uid){
        const {data,error}=await supabase.from('notifications').select('*').eq('user_id',uid).eq('read',false).order('created_at',{ascending:false}).limit(8);
        if(!error){
          for(const n of data||[]) items.push({title:n.title||'Notification',body:n.message||n.body||''});
          if(badge){badge.textContent=String((data||[]).length);badge.hidden=!(data||[]).length;}
        }
      }
    }catch(e){ console.warn('Notification load failed:',e); }
  }
  if(badge && !badge.textContent) badge.hidden=true;
  list.innerHTML=items.length?items.slice(0,8).map(n=>`<div class="notification-item"><strong>${esc(n.title)}</strong><span>${esc(n.body)}</span></div>`).join(''):'<div class="notification-empty">No new notifications.</div>';
  applyLanguage();
}



if(document.readyState==="loading") {
  document.addEventListener("DOMContentLoaded",()=>{
    initLanguage();
    startPresence();
  },{once:true});
} else {
  initLanguage();
  startPresence();
}

document.addEventListener("change",e=>{
  if(e.target?.id==="languageSelect") setLanguage(e.target.value);
});
