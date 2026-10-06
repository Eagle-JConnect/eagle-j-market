import { supabase } from "./supabase.js";

import {
  nav,
  requireAuth,
  profile,
  logout,
  esc,
  toast
} from "./utils.js";


// ========================================
// CHECK SUPABASE
// ========================================

if (!supabase) {
  document.body.innerHTML = `
    <main class="container">
      <section class="card">
        <h2>Connection Error</h2>
        <p>
          Supabase is not configured correctly.
          Please check your config.js file.
        </p>
      </section>
    </main>
  `;

  throw new Error("Supabase is not configured.");
}


// ========================================
// NAVIGATION
// ========================================

const navElement = document.querySelector("#nav");

if (navElement) {
  navElement.innerHTML = nav();
}


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
        "EAGLE-J MARKET: Logout button clicked"
      );

      logoutButton.disabled = true;

      logoutButton.textContent =
        "Logging out...";

      try {

        const result =
          await logout();

        console.log(
          "Logout result:",
          result
        );


        if (
          result &&
          result.success === false
        ) {

          console.error(
            "Logout failed:",
            result.error
          );

          logoutButton.disabled =
            false;

          logoutButton.textContent =
            "Logout";

          alert(
            "Logout failed. Please try again."
          );

          return;
        }


        console.log(
          "EAGLE-J MARKET: Logout successful"
        );


        // Make sure local session is cleared
        await supabase.auth.signOut();


        // Go to login page
        window.location.replace(
          "./login.html"
        );

      } catch (error) {

        console.error(
          "Logout error:",
          error
        );

        logoutButton.disabled =
          false;

        logoutButton.textContent =
          "Logout";

        alert(
          "An error occurred while logging out."
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
    "User is not authenticated."
  );

}


// ========================================
// ADMIN CHECK
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
    "Admin access required."
  );

}


// ========================================
// ELEMENTS
// ========================================

const usersEl =
  document.querySelector("#users");

const pendingEl =
  document.querySelector("#pending");

const businessesEl =
  document.querySelector("#businesses");

const paymentsEl =
  document.querySelector("#payments");

const businessTable =
  document.querySelector("#businessTable");

const userTable =
  document.querySelector("#userTable");

const paymentTable =
  document.querySelector("#paymentTable");


// ========================================
// LOAD DASHBOARD
// ========================================

async function load() {

  try {

    const [

      usersResult,
      businessesResult,
      paymentsResult

    ] = await Promise.all([

      // USERS
      supabase
        .from("profiles")
        .select("*")
        .order(
          "created_at",
          {
            ascending: false
          }
        ),

      // BUSINESSES
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

      // PAYMENTS
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
        )

    ]);


    // ====================================
    // CHECK ERRORS
    // ====================================

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


    const U =
      usersResult.data || [];

    const B =
      businessesResult.data || [];

    const P =
      paymentsResult.data || [];


    // ====================================
    // STATS
    // ====================================

    if (usersEl) {

      usersEl.textContent =
        U.length;

    }


    if (pendingEl) {

      pendingEl.textContent =
        B.filter(
          x =>
            x.status === "pending"
        ).length;

    }


    if (businessesEl) {

      businessesEl.textContent =
        B.length;

    }


    if (paymentsEl) {

      paymentsEl.textContent =
        P.filter(
          x =>
            x.status === "pending"
        ).length;

    }


    // ====================================
    // BUSINESSES TABLE
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
              B.map(x => `

                <tr>

                  <td>

                    <b>
                      ${esc(
                        x.business_name
                      )}
                    </b>

                    <br>

                    <small>
                      ${esc(
                        x.area || ""
                      )}
                    </small>

                  </td>


                  <td>
                    ${esc(
                      x.categories?.name || ""
                    )}
                  </td>


                  <td>

                    <span
                      class="badge ${
                        x.status === "approved"
                          ? "green"
                          : x.status === "pending"
                          ? "yellow"
                          : "red"
                      }"
                    >

                      ${esc(
                        x.status || ""
                      )}

                    </span>

                  </td>


                  <td>

                    ${esc(
                      x.plan || ""
                    )}

                  </td>


                  <td>

                    ${
                      x.status === "pending"
                        ? `

                          <button
                            type="button"
                            class="btn small success"
                            data-approve="${x.id}"
                          >
                            Approve
                          </button>

                          <button
                            type="button"
                            class="btn small danger"
                            data-reject="${x.id}"
                          >
                            Reject
                          </button>

                        `
                        : ""
                    }


                    ${
                      x.status === "approved"
                        ? `

                          <button
                            type="button"
                            class="btn small secondary"
                            data-feature="${x.id}"
                          >

                            ${
                              x.featured
                                ? "Unfeature"
                                : "Feature"
                            }

                          </button>

                        `
                        : ""
                    }

                  </td>

                </tr>

              `).join("")
            }

          </tbody>

        </table>

      `;

    }


    // ====================================
    // USERS TABLE
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

            </tr>

          </thead>

          <tbody>

            ${
              U.map(x => `

                <tr>

                  <td>

                    ${esc(
                      x.first_name || ""
                    )}

                    ${esc(
                      x.last_name || ""
                    )}

                  </td>


                  <td>

                    ${esc(
                      x.phone || ""
                    )}

                  </td>


                  <td>

                    ${esc(
                      x.account_type || ""
                    )}

                  </td>


                  <td>

                    ${esc(
                      x.status || ""
                    )}

                  </td>

                </tr>

              `).join("")
            }

          </tbody>

        </table>

      `;

    }


    // ====================================
    // PAYMENTS TABLE
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
              P.map(x => `

                <tr>

                  <td>

                    ${esc(
                      x.businesses
                        ?.business_name || ""
                    )}

                  </td>


                  <td>

                    $${Number(
                      x.amount || 0
                    ).toFixed(2)}

                  </td>


                  <td>

                    ${esc(
                      x.payment_type || ""
                    )}

                  </td>


                  <td>

                    ${esc(
                      x.status || ""
                    )}

                  </td>


                  <td>

                    ${
                      x.status === "pending"
                        ? `

                          <button
                            type="button"
                            class="btn small success"
                            data-pay="${x.id}"
                          >
                            Mark Paid
                          </button>

                        `
                        : ""
                    }

                  </td>

                </tr>

              `).join("")
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

            button.disabled = true;

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

            button.disabled = true;

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
    // FEATURE BUSINESS
    // ====================================

    document
      .querySelectorAll(
        "[data-feature]"
      )
      .forEach(button => {

        button.onclick =
          async () => {

            const business =
              B.find(
                x =>
                  x.id ===
                  button.dataset.feature
              );


            if (!business)
              return;


            button.disabled = true;


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
              P.find(
                x =>
                  x.id ===
                  button.dataset.pay
              );


            if (!payment)
              return;


            button.disabled = true;


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
      "Dashboard load error:",
      error
    );

    toast(
      "Unable to load admin dashboard."
    );

  }

}


// ========================================
// ADMIN TABS
// ========================================

document
  .querySelectorAll(
    ".admin-nav button[data-tab]"
  )
  .forEach(button => {

    button.onclick = () => {

      const tabs = [
        "businessTab",
        "usersTab",
        "paymentsTab"
      ];


      tabs.forEach(id => {

        const section =
          document.querySelector(
            "#" + id
          );

        if (section) {

          section.classList.add(
            "hidden"
          );

        }

      });


      const selected =
        document.querySelector(
          "#" + button.dataset.tab
        );


      if (selected) {

        selected.classList.remove(
          "hidden"
        );

      }

    };

  });


// ========================================
// START DASHBOARD
// ========================================

await load();

console.log(
  "EAGLE-J MARKET Admin Dashboard loaded successfully."
);
