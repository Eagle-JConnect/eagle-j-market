import { supabase } from "./supabase.js";

import {
  nav,
  requireAuth,
  profile,
  logout,
  esc,
  toast,
  bootGlobalUI
} from "./utils.js";


// ========================================
// SUPABASE CHECK
// ========================================

if (!supabase) {

  console.error(
    "EAGLE-J MARKET: Supabase is not configured."
  );

  document.body.innerHTML = `
    <main class="container">
      <section class="card">
        <h2>Connection Error</h2>
        <p>Supabase is not configured correctly.</p>
      </section>
    </main>
  `;

  throw new Error(
    "Supabase is not configured."
  );
}


// ========================================
// NAVIGATION
// ========================================

const navElement = document.querySelector("#nav");
if (navElement && !navElement.querySelector(".header")) {
  navElement.innerHTML = nav("admin");
}
bootGlobalUI();


// ========================================
// LOGOUT
// ========================================

const logoutButton =
  document.querySelector("#logout");


if (logoutButton) {

  logoutButton.addEventListener(
    "click",
    async () => {

      console.log(
        "EAGLE-J MARKET: LOGOUT CLICKED"
      );


      logoutButton.disabled =
        true;

      logoutButton.textContent =
        "Logging out...";


      try {

        const result =
          await logout();


        console.log(
          "EAGLE-J MARKET: LOGOUT RESULT",
          result
        );


        if (
          result &&
          result.success === false
        ) {

          throw (
            result.error ||
            new Error(
              "Logout failed."
            )
          );

        }


        console.log(
          "EAGLE-J MARKET: LOGOUT SUCCESS"
        );


        window.location.replace(
          "./login.html"
        );


      } catch (error) {

        console.error(
          "EAGLE-J MARKET: LOGOUT ERROR",
          error
        );


        logoutButton.disabled =
          false;

        logoutButton.textContent =
          "Logout";


        alert(
          "Logout failed: " +
          (
            error?.message ||
            "Unknown error"
          )
        );

      }

    }
  );

}


// ========================================
// AUTHENTICATION
// ========================================

const currentUser =
  await requireAuth();


if (!currentUser) {

  throw new Error(
    "Authentication required."
  );

}


// ========================================
// ADMIN SECURITY
// ========================================

const currentProfile =
  await profile();


if (
  !currentProfile ||
  currentProfile.account_type !== "admin"
) {

  window.location.replace(
    "./dashboard.html"
  );

  throw new Error(
    "Admin access denied."
  );

}


// ========================================
// ELEMENTS
// ========================================

const usersElement =
  document.querySelector("#users");

const pendingElement =
  document.querySelector("#pending");

const businessesElement =
  document.querySelector("#businesses");

const paymentsElement =
  document.querySelector("#payments");

const businessTable =
  document.querySelector("#businessTable");

const userTable =
  document.querySelector("#userTable");

const paymentTable =
  document.querySelector("#paymentTable");
const demandTable = document.querySelector("#demandTable");


// ========================================
// LOAD DASHBOARD
// ========================================

async function load() {

  try {

    const [
      usersResult,
      businessesResult,
      paymentsResult,
      demandsResult
    ] = await Promise.all([

      supabase
        .from("profiles")
        .select("*")
        .order(
          "created_at",
          {
            ascending: false
          }
        ),

      supabase
        .from("businesses")
        .select(
          "*,categories(name)"
        )
        .order(
          "created_at",
          {
            ascending: false
          }
        ),

      supabase
        .from("payments")
        .select(
          "*,businesses(business_name)"
        )
        .order(
          "created_at",
          {
            ascending: false
          }
        ),
      supabase
        .from("demands")
        .select("*")
        .order("created_at", {ascending:false})

    ]);


    if (usersResult.error) {

      console.error(
        "Users error:",
        usersResult.error
      );

    }


    if (businessesResult.error) {

      console.error(
        "Businesses error:",
        businessesResult.error
      );

    }


    if (paymentsResult.error) {

      console.error(
        "Payments error:",
        paymentsResult.error
      );

    }


    const users =
      usersResult.data || [];

    const businesses =
      businessesResult.data || [];

    const payments =
      paymentsResult.data || [];
    const demands = (demandsResult.data || []).map(demand => ({
      ...demand,
      profiles: users.find(user => user.user_id === demand.user_id) || null
    }));

    const bterm = (document.querySelector("#businessSearch")?.value || "").trim().toLowerCase();
    const uterm = (document.querySelector("#userSearch")?.value || "").trim().toLowerCase();
    const visibleBusinesses = bterm ? businesses.filter(b => `${b.business_name||""} ${b.area||""} ${b.city||""}`.toLowerCase().includes(bterm)) : businesses;
    const visibleUsers = uterm ? users.filter(u => `${u.first_name||""} ${u.last_name||""} ${u.phone||""} ${u.account_type||""}`.toLowerCase().includes(uterm)) : users;


    // ====================================
    // STATS
    // ====================================

    if (usersElement) {

      usersElement.textContent =
        users.length;

    }


    if (pendingElement) {

      pendingElement.textContent =
        businesses.filter(
          business =>
            business.status === "pending"
        ).length;

    }


    if (businessesElement) {

      businessesElement.textContent =
        businesses.length;

    }


    if (paymentsElement) {

      paymentsElement.textContent =
        payments.filter(
          payment =>
            payment.status === "pending"
        ).length;

    }


    // ====================================
    // BUSINESSES
    // ====================================

    if (businessTable) {

      businessTable.innerHTML = `

        <table class="table">

          <thead>

            <tr>
              <th>Business</th>
              <th>Category</th>
              <th>Status</th>
              <th>Plan</th>
              <th>Action</th>
            </tr>

          </thead>

          <tbody>

            ${
              visibleBusinesses.map(
                business => `

                  <tr>

                    <td>

                      <b>
                        ${esc(
                          business.business_name
                        )}
                      </b>

                      <br>

                      <small>
                        ${esc(
                          business.area || ""
                        )}
                      </small>

                    </td>


                    <td>
                      ${esc(
                        business
                          .categories
                          ?.name || ""
                      )}
                    </td>


                    <td>

                      <span
                        class="badge ${
                          business.status ===
                          "approved"
                            ? "green"
                            : business.status ===
                              "pending"
                            ? "yellow"
                            : "red"
                        }"
                      >

                        ${esc(
                          business.status || ""
                        )}

                      </span>

                    </td>


                    <td>
                      ${esc(
                        business.plan || ""
                      )}
                    </td>


                    <td>

                      ${
                        business.status ===
                        "pending"
                          ? `

                            <button
                              type="button"
                              class="btn small success"
                              data-approve="${business.id}"
                            >
                              Approve
                            </button>

                            <button
                              type="button"
                              class="btn small danger"
                              data-reject="${business.id}"
                            >
                              Reject
                            </button>

                          `
                          : ""
                      }


                      ${
                        business.status ===
                        "approved"
                          ? `

                            <button
                              type="button"
                              class="btn small secondary"
                              data-feature="${business.id}"
                            >

                              ${
                                business.featured
                                  ? "Unfeature"
                                  : "Feature"
                              }

                            </button>

                          `
                          : ""
                      }

                    </td>

                  </tr>

                `
              ).join("")
            }

          </tbody>

        </table>

      `;

    }


    // ====================================
    // USERS
    // ====================================

    if (userTable) {

      userTable.innerHTML = `

        <table class="table">

          <thead>

            <tr>
              <th>Name</th>
              <th>Phone</th>
              <th>Type</th>
              <th>Status</th>
              <th>Demand access</th>
            </tr>

          </thead>

          <tbody>

            ${
              visibleUsers.map(
                user => `

                  <tr>

                    <td>

                      ${esc(
                        user.first_name || ""
                      )}

                      ${esc(
                        user.last_name || ""
                      )}

                    </td>

                    <td>
                      ${esc(
                        user.phone || ""
                      )}
                    </td>

                    <td>
                      ${esc(
                        user.account_type || ""
                      )}
                    </td>

                    <td>
                      ${esc(user.status || "")}
                    </td>
                    <td><button class="btn small ${user.can_post_demand?"success":"secondary"}" data-post-access="${user.user_id}">${user.can_post_demand?"Posting ON":"Grant posting"}</button> <button class="btn small ${user.can_respond_demand?"success":"secondary"}" data-response-access="${user.user_id}">${user.can_respond_demand?"Responses ON":"Grant responses"}</button></td>

                  </tr>

                `
              ).join("")
            }

          </tbody>

        </table>

      `;

    }



    if (demandTable) {
      demandTable.innerHTML = `<table class="table"><thead><tr><th>Demand</th><th>User</th><th>Status</th><th>Action</th></tr></thead><tbody>${demands.map(d=>`<tr><td><b>${esc(d.title)}</b><br><small>${esc((d.description||'').slice(0,120))}</small></td><td>${esc(`${d.profiles?.first_name||''} ${d.profiles?.last_name||''}`.trim()||'User')}</td><td>${esc(d.status)}</td><td>${d.status==='pending'?`<button class="btn small success" data-demand-approve="${d.id}">Approve</button> <button class="btn small danger" data-demand-reject="${d.id}">Reject</button>`:''}${d.status==='approved'?`<button class="btn small secondary" data-demand-close="${d.id}">Close</button>`:''}</td></tr>`).join('')}</tbody></table>` || '<p>No demands.</p>';
    }

    document.querySelectorAll('[data-post-access]').forEach(btn=>btn.onclick=async()=>{const row=users.find(x=>x.user_id===btn.dataset.postAccess);if(!row)return;const r=await supabase.from('profiles').update({can_post_demand:!row.can_post_demand}).eq('user_id',row.user_id);toast(r.error?.message||'Posting access updated',!r.error);if(!r.error)load();});
    document.querySelectorAll('[data-response-access]').forEach(btn=>btn.onclick=async()=>{const row=users.find(x=>x.user_id===btn.dataset.responseAccess);if(!row)return;const r=await supabase.from('profiles').update({can_respond_demand:!row.can_respond_demand}).eq('user_id',row.user_id);toast(r.error?.message||'Response access updated',!r.error);if(!r.error)load();});
    document.querySelectorAll('[data-demand-approve]').forEach(btn=>btn.onclick=async()=>{const r=await supabase.from('demands').update({status:'approved'}).eq('id',btn.dataset.demandApprove);toast(r.error?.message||'Demand approved',!r.error);if(!r.error)load();});
    document.querySelectorAll('[data-demand-reject]').forEach(btn=>btn.onclick=async()=>{const r=await supabase.from('demands').update({status:'rejected'}).eq('id',btn.dataset.demandReject);toast(r.error?.message||'Demand rejected',!r.error);if(!r.error)load();});
    document.querySelectorAll('[data-demand-close]').forEach(btn=>btn.onclick=async()=>{const r=await supabase.from('demands').update({status:'closed'}).eq('id',btn.dataset.demandClose);toast(r.error?.message||'Demand closed',!r.error);if(!r.error)load();});

    // ====================================
    // PAYMENTS
    // ====================================

    if (paymentTable) {

      paymentTable.innerHTML = `

        <table class="table">

          <thead>

            <tr>
              <th>Business</th>
              <th>Amount</th>
              <th>Type</th>
              <th>Status</th>
              <th>Action</th>
            </tr>

          </thead>

          <tbody>

            ${
              payments.map(
                payment => `

                  <tr>

                    <td>

                      ${esc(
                        payment
                          .businesses
                          ?.business_name ||
                        ""
                      )}

                    </td>

                    <td>

                      $${Number(
                        payment.amount || 0
                      ).toFixed(2)}

                    </td>

                    <td>
                      ${esc(
                        payment.payment_type ||
                        ""
                      )}
                    </td>

                    <td>
                      ${esc(
                        payment.status ||
                        ""
                      )}
                    </td>

                    <td>

                      ${
                        payment.status ===
                        "pending"
                          ? `

                            <button
                              type="button"
                              class="btn small success"
                              data-pay="${payment.id}"
                            >
                              Mark Paid
                            </button>

                          `
                          : ""
                      }

                    </td>

                  </tr>

                `
              ).join("")
            }

          </tbody>

        </table>

      `;

    }


    // ====================================
    // APPROVE BUSINESS
    // ====================================

    document
      .querySelectorAll(
        "[data-approve]"
      )
      .forEach(button => {

        button.onclick =
          async () => {

            button.disabled =
              true;


            const result =
              await supabase
                .from("businesses")
                .update({
                  status:
                    "approved",
                  verified:
                    true
                })
                .eq(
                  "id",
                  button.dataset.approve
                );


            toast(
              result.error?.message ||
              "Business approved",
              !result.error
            );


            if (!result.error) {

              await load();

            } else {

              button.disabled =
                false;

            }

          };

      });


    // ====================================
    // REJECT BUSINESS
    // ====================================

    document
      .querySelectorAll(
        "[data-reject]"
      )
      .forEach(button => {

        button.onclick =
          async () => {

            button.disabled =
              true;


            const result =
              await supabase
                .from("businesses")
                .update({
                  status:
                    "rejected"
                })
                .eq(
                  "id",
                  button.dataset.reject
                );


            toast(
              result.error?.message ||
              "Business rejected",
              !result.error
            );


            if (!result.error) {

              await load();

            } else {

              button.disabled =
                false;

            }

          };

      });


    // ====================================
    // FEATURE
    // ====================================

    document
      .querySelectorAll(
        "[data-feature]"
      )
      .forEach(button => {

        button.onclick =
          async () => {

            const business =
              businesses.find(
                item =>
                  item.id ===
                  button.dataset.feature
              );


            if (!business) {
              return;
            }


            button.disabled =
              true;


            const result =
              await supabase
                .from("businesses")
                .update({
                  featured:
                    !business.featured
                })
                .eq(
                  "id",
                  business.id
                );


            toast(
              result.error?.message ||
              (
                business.featured
                  ? "Business unfeatured"
                  : "Business featured"
              ),
              !result.error
            );


            if (!result.error) {

              await load();

            } else {

              button.disabled =
                false;

            }

          };

      });


    // ====================================
    // MARK PAYMENT PAID
    // ====================================

    document
      .querySelectorAll(
        "[data-pay]"
      )
      .forEach(button => {

        button.onclick =
          async () => {

            const payment =
              payments.find(
                item =>
                  item.id ===
                  button.dataset.pay
              );


            if (!payment) {
              return;
            }


            button.disabled =
              true;


            const result =
              await supabase
                .from("payments")
                .update({
                  status:
                    "paid"
                })
                .eq(
                  "id",
                  payment.id
                );


            toast(
              result.error?.message ||
              "Payment marked paid",
              !result.error
            );


            if (!result.error) {

              await load();

            } else {

              button.disabled =
                false;

            }

          };

      });


  } catch (error) {

    console.error(
      "Dashboard loading error:",
      error
    );

    toast(
      "Unable to load admin dashboard."
    );

  }

}


// ========================================
// TABS
// ========================================

document
  .querySelectorAll(
    ".admin-nav button[data-tab]"
  )
  .forEach(button => {

    button.addEventListener(
      "click",
      () => {

        const tabs = [
          "businessTab",
          "usersTab",
          "paymentsTab",
          "demandsTab"
        ];


        tabs.forEach(id => {
          const section = document.getElementById(id);
          if (section) section.classList.add("hidden");
        });
        document.querySelectorAll(".admin-nav button[data-tab]").forEach(tabButton => {
          const active = tabButton === button;
          tabButton.setAttribute("aria-selected", String(active));
          tabButton.classList.toggle("secondary", !active);
        });


        const selected =
          document.getElementById(
            button.dataset.tab
          );


        if (selected) {

          selected.classList.remove(
            "hidden"
          );

        }

      }
    );

  });


document.querySelector("#businessSearch")?.addEventListener("input", load);
document.querySelector("#userSearch")?.addEventListener("input", load);

// ========================================
// START
// ========================================

await load();


console.log(
  "EAGLE-J MARKET: Admin Dashboard loaded."
);
