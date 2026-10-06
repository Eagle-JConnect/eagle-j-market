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
        ? `🟢 ${t("Someone is connected")} • ${count}`
        : `🟢 ${t("Online")}`;
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
   GLOBAL UI BOOTSTRAP
========================= */
export async function bootGlobalUI(){
  initLanguage();
  startPresence();

  const authSlot=document.querySelector('#authSlot');
  if(authSlot){
    if(!supabase){
      authSlot.innerHTML=`<a class="btn small" href="login.html">${esc(t('Login'))}</a>`;
      return;
    }
    const current=await user();
    if(current){
      const p=await profile();
      const name=(p?.first_name||current.user_metadata?.first_name||current.email?.split('@')[0]||'Account').trim();
      authSlot.innerHTML=`<a class="nav-account" href="dashboard.html">👤 ${esc(name)}</a><button type="button" class="btn small secondary" id="navLogout">${esc(t('Logout'))}</button>`;
      document.querySelector('#navLogout')?.addEventListener('click',async()=>{
        const result=await logout();
        if(result.success) location.href='index.html';
      });
    }else{
      authSlot.innerHTML=`<a class="nav-account" href="login.html">${esc(t('Login'))}</a><a class="btn small" href="register.html">${esc(t('Create account'))}</a>`;
    }
  }

  const notifSlots=[document.querySelector('#notificationSlot'),document.querySelector('#mobileNotificationSlot')].filter(Boolean);
  if(notifSlots.length && supabase){
    const current=await user();
    if(current){
      const {count}=await supabase.from('notifications').select('id',{count:'exact',head:true}).eq('user_id',current.id).eq('read',false);
      const n=Number(count||0);
      notifSlots.forEach(slot=>slot.innerHTML=`<a class="notification-link" href="dashboard.html#notifications" aria-label="${esc(t('Notifications'))}">🔔${n?`<span class="notification-count">${n>99?'99+':n}</span>`:''}</a>`);
    }else{
      notifSlots.forEach(slot=>slot.innerHTML='<a class="notification-link" href="login.html" aria-label="Notifications">🔔</a>');
    }
  }
}

/* =========================
   NAVIGATION
========================= */

export function nav(active = "") {
  queueMicrotask(()=>initLanguage());
  return `
    <header class="header">
      <a class="brand" href="index.html">🦅 <span>EAGLE-J MARKET</span></a>
      <nav class="nav">
        <a class="${active==="home"?"active":""}" href="index.html">Home</a>
        <a class="${active==="businesses"?"active":""}" href="businesses.html">Businesses</a>
        <a class="${active==="products"?"active":""}" href="products.html">Products</a>
        <a class="${active==="deals"?"active":""}" href="deals.html">Deals</a>
        <a class="${active==="pricing"?"active":""}" href="pricing.html">Plans</a>
        <a class="${active==="dashboard"?"active":""}" href="dashboard.html">My Account</a>
        <span id="notificationSlot" class="notification-slot"></span>
        <span id="authSlot" class="auth-slot"></span>
      </nav>
      <div class="header-actions">
        <label class="language-control" title="Language"><span aria-hidden="true">🌐</span><span class="language-label">Language</span><select id="languageSelect" aria-label="Language"><option value="en">English</option><option value="fr">Français</option><option value="ht">Kreyòl</option></select></label>
        <span id="mobileNotificationSlot" class="notification-slot"></span>
        <div id="presenceStatus" class="presence-status" role="status" aria-live="polite">🟢 Online</div>
        <button type="button" class="menu" aria-label="Menu" onclick="document.querySelector('.nav').classList.toggle('open')">☰</button>
      </div>
    </header>
    <div class="mobile-bottom-nav">
      <a href="index.html">⌂<span>Home</span></a>
      <a href="businesses.html">⌕<span>Explore</span></a>
      <a href="products.html">🛍<span>Products</span></a>
      <a href="dashboard.html">👤<span>Account</span></a>
    </div>`;
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
