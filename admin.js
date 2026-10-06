<!DOCTYPE html>
<html lang="en">

<head>

  <meta charset="UTF-8">

  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  >

  <title>
    EAGLE-J MARKET — Admin Dashboard
  </title>

  <link
    rel="stylesheet"
    href="./style.css"
  >

</head>


<body>


  <!-- NAVIGATION -->

  <div id="nav"></div>


  <main class="container">


    <!-- ADMIN HEADER -->

    <section class="admin-header">

      <div>

        <h1>
          Admin Dashboard
        </h1>

        <p>
          Manage EAGLE-J MARKET
        </p>

      </div>


      <button
        type="button"
        id="logout"
        class="btn danger"
      >
        Logout
      </button>

    </section>



    <!-- STATS -->

    <section class="stats">


      <div class="card">

        <h3>
          Users
        </h3>

        <strong id="users">
          0
        </strong>

      </div>


      <div class="card">

        <h3>
          Pending Businesses
        </h3>

        <strong id="pending">
          0
        </strong>

      </div>


      <div class="card">

        <h3>
          Total Businesses
        </h3>

        <strong id="businesses">
          0
        </strong>

      </div>


      <div class="card">

        <h3>
          Pending Payments
        </h3>

        <strong id="payments">
          0
        </strong>

      </div>


    </section>



    <!-- ADMIN TABS -->

    <div class="admin-nav">


      <button
        type="button"
        class="btn"
        data-tab="businessTab"
      >
        Businesses
      </button>


      <button
        type="button"
        class="btn"
        data-tab="usersTab"
      >
        Users
      </button>


      <button
        type="button"
        class="btn"
        data-tab="paymentsTab"
      >
        Payments
      </button>


    </div>



    <!-- BUSINESSES -->

    <section id="businessTab">

      <h2>
        Businesses
      </h2>

      <div id="businessTable">
        Loading...
      </div>

    </section>



    <!-- USERS -->

    <section
      id="usersTab"
      class="hidden"
    >

      <h2>
        Users
      </h2>

      <div id="userTable">
        Loading...
      </div>

    </section>



    <!-- PAYMENTS -->

    <section
      id="paymentsTab"
      class="hidden"
    >

      <h2>
        Payments
      </h2>

      <div id="paymentTable">
        Loading...
      </div>

    </section>


  </main>



  <!-- JAVASCRIPT -->

  <script type="module">


    import {
      supabase
    } from "./supabase.js";


    import {
      nav,
      requireAuth,
      profile,
      logout,
      esc,
      toast
    } from "./utils.js";



    /* =========================
       NAV
    ========================= */

    document
      .querySelector("#nav")
      .innerHTML = nav();



    /* =========================
       AUTH
    ========================= */

    const currentUser =
      await requireAuth();


    if (!currentUser) {

      throw new Error(
        "User is not authenticated."
      );

    }



    /* =========================
       ADMIN CHECK
    ========================= */

    const currentProfile =
      await profile();


    if (
      !currentProfile ||
      currentProfile.account_type !== "admin"
    ) {

      window.location.replace(
        "dashboard.html"
      );

      throw new Error(
        "Admin access required."
      );

    }



    /* =========================
       ELEMENTS
    ========================= */

    const usersEl =
      document.querySelector("#users");

    const pendingEl =
      document.querySelector("#pending");

    const businessesEl =
      document.querySelector("#businesses");

    const paymentsEl =
      document.querySelector("#payments");


    const businessTable =
      document.querySelector(
        "#businessTable"
      );

    const userTable =
      document.querySelector(
        "#userTable"
      );

    const paymentTable =
      document.querySelector(
        "#paymentTable"
      );



    /* =========================
       LOAD DASHBOARD
    ========================= */

    async function load() {


      const [

        usersResult,
        businessesResult,
        paymentsResult

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
          )

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



      const U =
        usersResult.data || [];


      const B =
        businessesResult.data || [];


      const P =
        paymentsResult.data || [];



      /* =========================
         STATS
      ========================= */

      usersEl.textContent =
        U.length;


      pendingEl.textContent =
        B.filter(
          x => x.status === "pending"
        ).length;


      businessesEl.textContent =
        B.length;


      paymentsEl.textContent =
        P.filter(
          x => x.status === "pending"
        ).length;



      /* =========================
         BUSINESS TABLE
      ========================= */

      businessTable.innerHTML = `

        <table class="table">

          <thead>

            <tr>

              <th>
                Business
              </th>

              <th>
                Category
              </th>

              <th>
                Status
              </th>

              <th>
                Plan
              </th>

              <th>
                Action
              </th>

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
                        x.status
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



      /* =========================
         USERS TABLE
      ========================= */

      userTable.innerHTML = `

        <table class="table">

          <thead>

            <tr>

              <th>
                Name
              </th>

              <th>
                Phone
              </th>

              <th>
                Type
              </th>

              <th>
                Status
              </th>

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



      /* =========================
         PAYMENT TABLE
      ========================= */

      paymentTable.innerHTML = `

        <table class="table">

          <thead>

            <tr>

              <th>
                Business
              </th>

              <th>
                Amount
              </th>

              <th>
                Type
              </th>

              <th>
                Status
              </th>

              <th>
                Action
              </th>

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



      /* =========================
         APPROVE
      ========================= */

      document
        .querySelectorAll(
          "[data-approve]"
        )
        .forEach(button => {

          button.onclick =
            async () => {

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
                    button.dataset
                      .approve
                  );


              toast(
                result.error
                  ?.message ||
                  "Business approved",
                !result.error
              );


              if (!result.error) {
                await load();
              }

            };

        });



      /* =========================
         REJECT
      ========================= */

      document
        .querySelectorAll(
          "[data-reject]"
        )
        .forEach(button => {

          button.onclick =
            async () => {

              const result =
                await supabase
                  .from("businesses")
                  .update({
                    status:
                      "rejected"
                  })
                  .eq(
                    "id",
                    button.dataset
                      .reject
                  );


              toast(
                result.error
                  ?.message ||
                  "Business rejected",
                !result.error
              );


              if (!result.error) {
                await load();
              }

            };

        });



      /* =========================
         FEATURE
      ========================= */

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
                    button.dataset
                      .feature
                );


              if (!business)
                return;


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
                result.error
                  ?.message ||
                  (
                    business.featured
                      ? "Business unfeatured"
                      : "Business featured"
                  ),
                !result.error
              );


              if (!result.error) {
                await load();
              }

            };

        });



      /* =========================
         MARK PAYMENT PAID
      ========================= */

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
                    button.dataset
                      .pay
                );


              if (!payment)
                return;


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
                result.error
                  ?.message ||
                  "Payment marked paid",
                !result.error
              );


              if (!result.error) {
                await load();
              }

            };

        });

    }



    /* =========================
       TABS
    ========================= */

    document
      .querySelectorAll(
        ".admin-nav button[data-tab]"
      )
      .forEach(button => {

        button.onclick = () => {


          [
            "businessTab",
            "usersTab",
            "paymentsTab"

          ].forEach(id => {

            document
              .querySelector(
                "#" + id
              )
              .classList
              .add("hidden");

          });


          document
            .querySelector(
              "#" +
              button.dataset.tab
            )
            .classList
            .remove("hidden");

        };

      });



    /* =========================
       LOGOUT BUTTON
    ========================= */

    const logoutButton =
      document.querySelector(
        "#logout"
      );


    if (logoutButton) {

      logoutButton.addEventListener(
        "click",
        async function(event) {

          logoutButton.disabled =
            true;

          logoutButton.textContent =
            "Logging out...";


          await logout(event);

        }
      );

    }



    /* =========================
       START
    ========================= */

    await load();


  </script>


</body>

</html>
