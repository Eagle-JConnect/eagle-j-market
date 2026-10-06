import { supabase } from "./supabase.js";

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
   NAVIGATION
========================= */

export function nav(active = "") {

  return `

    <header class="header">

      <a
        class="brand"
        href="index.html"
      >
        🦅
        <span>
          EAGLE-J MARKET
        </span>
      </a>


      <nav class="nav">

        <a
          class="${active === "home" ? "active" : ""}"
          href="index.html"
        >
          Home
        </a>


        <a
          class="${active === "businesses" ? "active" : ""}"
          href="businesses.html"
        >
          Businesses
        </a>


        <a
          class="${active === "products" ? "active" : ""}"
          href="products.html"
        >
          Products
        </a>


        <a
          class="${active === "deals" ? "active" : ""}"
          href="deals.html"
        >
          Deals
        </a>


        <a
          class="${active === "pricing" ? "active" : ""}"
          href="pricing.html"
        >
          Plans
        </a>


        <a
          class="${active === "dashboard" ? "active" : ""}"
          href="dashboard.html"
        >
          My Account
        </a>

      </nav>


      <button
        type="button"
        class="menu"
        onclick="
          document
            .querySelector('.nav')
            .classList
            .toggle('open')
        "
      >
        ☰
      </button>

    </header>

  `;
}
