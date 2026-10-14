(function () {
  const branches = [
    ["jazan-airport", "جازان – طريق الأمير سلطان (المطار)"],
    ["abu-arish", "أبو عريش"],
    ["sabya-king-fahd", "صبيا – طريق الملك فهد"],
    ["sabya-king-abdullah", "صبيا – طريق الملك عبدالله (بجوار الطيري)"],
    ["addayer", "الداير"]
  ];

  function localDate(offsetDays = 0) {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);

    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");

    return `${y}-${m}-${day}`;
  }

  function bookingPage() {
    const priced = selected.filter(
      x => Number.isFinite(Number(x.price))
    );

    const subtotal = priced.reduce(
      (sum, x) => sum + Number(x.price),
      0
    );

    const pending =
      selected.length - priced.length;

    return `
      <section class="section">

        <div class="section-head">
          <h2 class="under">الحجز</h2>

          <span class="count-badge">
            ${selected.length} عنصر
          </span>
        </div>

        <div class="card">

          <h3>اختياراتك</h3>

          ${
            selected.length
              ? `
                <div class="cart-list">

                  ${selected.map((x, i) => `
                    <div class="cart-row">

                      <div>

                        <strong>
                          ${esc(x.name)}
                        </strong>

                        <div class="muted">

                          ${
                            x.type === "package"
                              ? "باقة"
                              : "تحليل"
                          }

                          —

                          ${
                            Number.isFinite(Number(x.price))
                              ? fmtPrice(x.price)
                              : "السعر عند الطلب"
                          }

                        </div>

                      </div>

                      <button
                        onclick="removeCart(${i})"
                        class="remove-btn"
                      >
                        حذف
                      </button>

                    </div>
                  `).join("")}

                </div>
              `
              : `
                <p class="muted">
                  لم تتم إضافة تحاليل أو باقات بعد.
                </p>
              `
          }

          <div class="cart-total">

            <span>
              الإجمالي المعروف
            </span>

            <strong>
              ${fmtPrice(subtotal)}
            </strong>

          </div>

          ${
            pending
              ? `
                <p class="micro-note">
                  يوجد ${pending} عنصر يحتاج تأكيد السعر من المختبر قبل الدفع.
                </p>
              `
              : ""
          }

          <p class="micro-note">
            تضاف ضريبة القيمة المضافة للمقيمين.
          </p>

        </div>

        ${
          selected.length
            ? `
              <div class="card">

                <h3>
                  بيانات الحجز
                </h3>

                ${
                  !authUser
                    ? `
                      <div class="notice">
                        يلزم تسجيل الدخول إلى حساب العميل لإتمام الحجز.
                      </div>

                      <button
                        class="primary"
                        type="button"
                        onclick="openLogin()"
                      >
                        تسجيل الدخول / إنشاء حساب
                      </button>
                    `
                    : `
                      <p class="muted">
                        الحساب:
                        ${esc(authUser.email || "")}
                      </p>

                      <label for="bioBookingBranch">
                        الفرع
                      </label>

                      <select id="bioBookingBranch">

                        <option value="">
                          اختر الفرع
                        </option>

                        ${
                          branches
                            .map(
                              ([key, name]) =>
                                `<option value="${key}">
                                  ${esc(name)}
                                </option>`
                            )
                            .join("")
                        }

                      </select>

                      <label for="bioBookingDate">
                        تاريخ الزيارة
                      </label>

                      <input
                        id="bioBookingDate"
                        type="date"
                        min="${localDate(0)}"
                        max="${localDate(60)}"
                        onchange="biocareBookingDateChanged()"
                      >

                      <label for="bioBookingPeriod">
                        الفترة المفضلة
                      </label>

                      <select id="bioBookingPeriod">

                        <option value="">
                          اختر الفترة
                        </option>

                        <option
                          value="08:00-12:00"
                          data-friday="no"
                        >
                          8 صباحًا – 12 ظهرًا
                        </option>

                        <option
                          value="12:00-16:00"
                          data-friday="no"
                        >
                          12 ظهرًا – 4 مساءً
                        </option>

                        <option value="16:00-20:00">
                          4 مساءً – 8 مساءً
                        </option>

                        <option value="20:00-23:00">
                          8 مساءً – 11 مساءً
                        </option>

                      </select>

                      <p class="micro-note">
                        يوم الجمعة تبدأ ساعات العمل من 4 مساءً.
                      </p>

                      <label for="bioBookingPhone">
                        رقم الجوال
                      </label>

                      <input
                        id="bioBookingPhone"
                        type="tel"
                        inputmode="tel"
                        autocomplete="tel"
                        placeholder="05XXXXXXXX"
                      >

                      <label for="bioBookingCustomerType">
                        نوع العميل
                      </label>

                      <select
                        id="bioBookingCustomerType"
                        onchange="biocareBookingUpdateTotal()"
                      >

                        <option value="saudi">
                          سعودي
                        </option>

                        <option value="resident">
                          مقيم
                        </option>

                      </select>

                      <div
                        id="bioBookingTotal"
                        class="notice"
                        style="margin-top:16px"
                      ></div>

                      <button
                        id="bioBookingSubmit"
                        class="primary"
                        type="button"
                        style="margin-top:14px"
                        onclick="createBiocareLabBooking()"
                      >
                        تأكيد الحجز
                      </button>

                      <p
                        id="bioBookingStatus"
                        role="status"
                        style="margin-top:12px"
                      ></p>
                    `
                }

              </div>
            `
            : ""
        }

      </section>
    `;
  }

  window.biocareBookingUpdateTotal =
    function () {

      const box =
        document.getElementById(
          "bioBookingTotal"
        );

      if (!box) return;

      const priced =
        selected.filter(
          x =>
            Number.isFinite(
              Number(x.price)
            )
        );

      const subtotal =
        priced.reduce(
          (sum, x) =>
            sum + Number(x.price),
          0
        );

      const pending =
        selected.length -
        priced.length;

      const type =
        document
          .getElementById(
            "bioBookingCustomerType"
          )
          ?.value || "saudi";

      const vat =
        type === "resident" &&
        pending === 0
          ? Math.round(
              subtotal *
              0.15 *
              100
            ) / 100
          : 0;

      const total =
        Math.round(
          (subtotal + vat) *
          100
        ) / 100;

      if (pending > 0) {
        box.innerHTML = `
          <strong>
            الإجمالي المعروف:
            ${fmtPrice(subtotal)}
          </strong>

          <br>

          <span class="micro-note">
            يوجد عنصر بسعر يحتاج تأكيد المختبر؛
            لن يتم بدء الدفع حتى يتم تأكيد السعر النهائي.
          </span>
        `;

        return;
      }

      box.innerHTML = `

        <div>
          المبلغ:
          <strong>
            ${fmtPrice(subtotal)}
          </strong>
        </div>

        ${
          type === "resident"
            ? `
              <div>
                ضريبة القيمة المضافة 15%:
                <strong>
                  ${fmtPrice(vat)}
                </strong>
              </div>
            `
            : ""
        }

        <div style="margin-top:8px">

          الإجمالي:

          <strong>
            ${fmtPrice(total)}
          </strong>

        </div>
      `;
    };

  window.biocareBookingDateChanged =
    function () {

      const dateInput =
        document.getElementById(
          "bioBookingDate"
        );

      const period =
        document.getElementById(
          "bioBookingPeriod"
        );

      if (
        !dateInput ||
        !period ||
        !dateInput.value
      ) {
        return;
      }

      const chosen =
        new Date(
          dateInput.value +
          "T12:00:00"
        );

      const friday =
        chosen.getDay() === 5;

      Array
        .from(period.options)
        .forEach(option => {

          if (
            option.dataset.friday ===
            "no"
          ) {
            option.disabled =
              friday;
          }

        });

      if (
        period
          .selectedOptions[0]
          ?.disabled
      ) {
        period.value = "";
      }
    };

  async function getLoggedInClient() {

    const client =
      await initAuth();

    const {
      data: userData,
      error: userError
    } =
      await client.auth.getUser();

    if (
      userError ||
      !userData?.user
    ) {
      throw new Error(
        "يجب تسجيل الدخول لإتمام العملية."
      );
    }

    return client;
  }

  function setPaymentButtonsDisabled(
    disabled
  ) {

    [
      "bioPaymentButton",
      "bioApplePayButton",
      "bioTabbyButton"
    ].forEach(id => {

      const button =
        document.getElementById(
          id
        );

      if (button) {
        button.disabled =
          disabled;
      }

    });
  }

  window.startBiocarePayment =
    async function (
      orderNumber,
      paymentMode = "card"
    ) {

      const mode =
        paymentMode === "applepay"
          ? "applepay"
          : "card";

      const status =
        document.getElementById(
          "bioPaymentStatus"
        );

      setPaymentButtonsDisabled(
        true
      );

      if (status) {

        status.textContent =
          mode === "applepay"
            ? "جارٍ تجهيز Apple Pay..."
            : "جارٍ تجهيز الدفع الآمن...";

      }

      try {

        const client =
          await getLoggedInClient();

        localStorage.setItem(
          "biocare_payment_order",
          String(orderNumber)
        );

        const {
          data,
          error
        } =
          await client.functions.invoke(
            "paytabs-create-payment-v3",
            {
              body: {
                order_number:
                  String(
                    orderNumber
                  ),

                payment_mode:
                  mode
              }
            }
          );

        if (error) {
          throw error;
        }

        const paymentUrl =
          String(
            data?.payment_url ||
            ""
          );

        if (!paymentUrl) {
          throw new Error(
            "لم يتم إنشاء رابط الدفع."
          );
        }

        const url =
          new URL(
            paymentUrl
          );

        if (
          url.protocol !== "https:" ||
          ![
            "secure.paytabs.sa",
            "secure.paytabs.com"
          ].includes(
            url.hostname
          )
        ) {
          throw new Error(
            "رابط الدفع غير صحيح."
          );
        }

        /*
         * Apple Pay
         */
        if (
          mode === "applepay"
        ) {

          window.location.assign(
            url.toString()
          );

          return;
        }

        /*
         * Mada / Visa / Mastercard
         */
        openModal(`
          <h2
            style="
              margin-bottom:14px
            "
          >
            الدفع الآمن
          </h2>

          <div
            style="
              width:100%;
              background:#fff;
              border-radius:18px;
              overflow:hidden;
            "
          >

            <iframe
              src="${esc(
                url.toString()
              )}"
              title="الدفع الآمن"
              allow="payment *"
              style="
                display:block;
                width:100%;
                height:76vh;
                min-height:600px;
                border:0;
                background:#fff;
              "
            ></iframe>

          </div>

          <p
            class="muted"
            style="
              text-align:center;
              margin-top:10px;
            "
          >
            يتم تنفيذ الدفع بشكل آمن داخل تطبيق بيوكير.
          </p>
        `);

      } catch (error) {

        console.error(
          error
        );

        if (status) {

          status.textContent =
            "تعذر بدء الدفع الآن. حاول مرة أخرى بعد قليل.";

        }

        setPaymentButtonsDisabled(
          false
        );
      }
    };

  /*
   * Tabby Sandbox
   */
  window.startBiocareTabbyTest =
    async function (
      orderNumber
    ) {

      const status =
        document.getElementById(
          "bioPaymentStatus"
        );

      setPaymentButtonsDisabled(
        true
      );

      if (status) {
        status.textContent =
          "جارٍ تجهيز تابي التجريبي...";
      }

      try {

        const client =
          await getLoggedInClient();

        localStorage.setItem(
          "biocare_tabby_order",
          String(orderNumber)
        );

        const {
          data,
          error
        } =
          await client.functions.invoke(
            "tabby-create-checkout-test",
            {
              body: {
                order_number:
                  String(
                    orderNumber
                  ),

                scenario:
                  "success"
              }
            }
          );

        if (error) {
          throw error;
        }

        const paymentUrl =
          String(
            data?.payment_url ||
            ""
          );

        if (!paymentUrl) {
          throw new Error(
            "لم يتم إنشاء رابط تابي."
          );
        }

        const url =
          new URL(
            paymentUrl
          );

        if (
          url.protocol !== "https:" ||
          ![
            "checkout.tabby.sa",
            "checkout.tabby.ai"
          ].includes(
            url.hostname
          )
        ) {
          throw new Error(
            "رابط تابي غير صحيح."
          );
        }

        window.location.assign(
          url.toString()
        );

      } catch (error) {

        console.error(
          error
        );

        if (status) {

          status.textContent =
            "تعذر بدء تجربة تابي الآن. استخدم حجزًا جديدًا وحاول مرة أخرى.";

        }

        setPaymentButtonsDisabled(
          false
        );
      }
    };

  async function getPaymentStatus(
    orderNumber
  ) {

    const client =
      await getLoggedInClient();

    const {
      data,
      error
    } =
      await client.functions.invoke(
        "paytabs-payment-status",
        {
          body: {
            order_number:
              String(
                orderNumber
              )
          }
        }
      );

    if (error) {
      throw error;
    }

    return data || {};
  }

  function paymentOptionsHtml(
    orderNumber
  ) {

    return `

      <button
        id="bioApplePayButton"
        type="button"
        dir="ltr"
        aria-label="الدفع باستخدام Apple Pay"
        onclick="startBiocarePayment('${esc(
          orderNumber
        )}','applepay')"
        style="
          display:block;
          width:100%;
          min-height:54px;
          margin-top:16px;
          border:0;
          border-radius:14px;
          background:#000;
          color:#fff;
          font-size:24px;
          font-weight:600;
          cursor:pointer;
          direction:ltr;
          unicode-bidi:isolate;
          font-family:
            -apple-system,
            BlinkMacSystemFont,
            'SF Pro Display',
            'Helvetica Neue',
            Arial,
            sans-serif;
        "
      >
        <span
          dir="ltr"
          style="
            direction:ltr;
            unicode-bidi:isolate;
          "
        > Pay</span>
      </button>

      <div
        style="
          display:flex;
          align-items:center;
          gap:12px;
          margin:18px 0;
          color:#8b8f99;
          font-size:13px;
        "
      >

        <span
          style="
            height:1px;
            background:#e2e5ea;
            flex:1;
          "
        ></span>

        <span>
          أو
        </span>

        <span
          style="
            height:1px;
            background:#e2e5ea;
            flex:1;
          "
        ></span>

      </div>

      <button
        id="bioPaymentButton"
        class="primary"
        type="button"
        onclick="startBiocarePayment('${esc(
          orderNumber
        )}','card')"
      >
        الدفع بالبطاقة
      </button>

      <div
        style="
          margin-top:10px;
          text-align:center;
          font-size:12px;
          color:#8b8f99;
        "
      >
        مدى • Visa • Mastercard
      </div>

      <button
        id="bioTabbyButton"
        type="button"
        onclick="startBiocareTabbyTest('${esc(
          orderNumber
        )}')"
        style="
          display:block;
          width:100%;
          min-height:54px;
          margin-top:18px;
          border:2px solid #111;
          border-radius:14px;
          background:#fff;
          color:#111;
          font-size:18px;
          font-weight:800;
          cursor:pointer;
        "
      >
        الدفع مع تابي
      </button>

      <div
        style="
          margin-top:8px;
          text-align:center;
          font-size:11px;
          color:#8b8f99;
        "
      >
        وضع تجريبي Sandbox
      </div>

      <p
        id="bioPaymentStatus"
        role="status"
        style="
          margin-top:12px
        "
      ></p>
    `;
  }

  function showPaidModal(
    orderNumber
  ) {

    localStorage.removeItem(
      "biocare_payment_order"
    );

    openModal(`
      <h2>
        تم الدفع بنجاح ✅
      </h2>

      <div class="card">

        <p>
          رقم الحجز:
        </p>

        <div
          style="
            font-size:22px;
            font-weight:800;
            direction:ltr;
            text-align:center;
            margin:14px 0
          "
        >
          ${esc(
            orderNumber
          )}
        </div>

        <p class="muted">
          تم تأكيد عملية الدفع في نظام بيوكير.
        </p>

        <button
          class="primary"
          type="button"
          onclick="closeModal();go('home')"
        >
          العودة للرئيسية
        </button>

      </div>
    `);
  }

  function showFailedPaymentModal(
    orderNumber
  ) {

    openModal(`
      <h2>
        لم يكتمل الدفع
      </h2>

      <div class="card">

        <p class="muted">
          لم يتم تأكيد عملية الدفع.
          يمكنك المحاولة مرة أخرى.
        </p>

        ${paymentOptionsHtml(
          orderNumber
        )}

        <button
          type="button"
          style="
            margin-top:10px
          "
          onclick="closeModal();go('home')"
        >
          العودة للرئيسية
        </button>

      </div>
    `);
  }

  function showPendingPaymentModal(
    orderNumber
  ) {

    openModal(`
      <h2>
        العملية قيد التحقق
      </h2>

      <div class="card">

        <p class="muted">
          لم يصل التأكيد النهائي من بوابة الدفع بعد.
          لا تعِد الدفع الآن.
        </p>

        <button
          class="primary"
          type="button"
          onclick="refreshBiocarePaymentStatus('${esc(
            orderNumber
          )}')"
        >
          تحديث حالة الدفع
        </button>

        <p
          id="bioPaymentStatus"
          role="status"
          style="
            margin-top:12px
          "
        ></p>

      </div>
    `);
  }

  window.refreshBiocarePaymentStatus =
    async function (
      orderNumber
    ) {

      const statusBox =
        document.getElementById(
          "bioPaymentStatus"
        );

      if (statusBox) {
        statusBox.textContent =
          "جارٍ التحقق...";
      }

      try {

        const result =
          await getPaymentStatus(
            orderNumber
          );

        if (
          result?.status ===
          "paid"
        ) {

          showPaidModal(
            orderNumber
          );

          return;
        }

        if (
          result?.status ===
            "failed" ||
          result?.status ===
            "cancelled"
        ) {

          showFailedPaymentModal(
            orderNumber
          );

          return;
        }

        if (statusBox) {

          statusBox.textContent =
            "ما زالت العملية قيد التحقق. لا تعِد الدفع الآن.";

        }

      } catch (error) {

        console.error(
          error
        );

        if (statusBox) {

          statusBox.textContent =
            "تعذر التحقق الآن. حاول بعد قليل.";

        }
      }
    };

  async function checkPaymentReturn() {

    const params =
      new URLSearchParams(
        window.location.search
      );

    if (
      params.get(
        "payment"
      ) !== "return"
    ) {
      return;
    }

    const orderNumber =
      localStorage.getItem(
        "biocare_payment_order"
      );

    history.replaceState(
      {},
      "",
      window.location.pathname +
        window.location.hash
    );

    if (!orderNumber) {

      openModal(`
        <h2>
          العودة من صفحة الدفع
        </h2>

        <div class="card">

          <p class="muted">
            تم الرجوع إلى بيوكير.
            افتح طلباتك للتحقق من حالة العملية.
          </p>

          <button
            class="primary"
            type="button"
            onclick="closeModal();go('home')"
          >
            الرئيسية
          </button>

        </div>
      `);

      return;
    }

    openModal(`
      <h2>
        جاري التحقق من الدفع...
      </h2>

      <div class="card">

        <p class="muted">
          نتحقق من عملية الدفع بشكل آمن.
          لا تغلق الصفحة.
        </p>

      </div>
    `);

    let result = null;

    for (
      let attempt = 0;
      attempt < 8;
      attempt++
    ) {

      try {

        result =
          await getPaymentStatus(
            orderNumber
          );

      } catch (error) {

        console.error(
          error
        );
      }

      if (
        result?.status ===
          "paid" ||
        result?.status ===
          "failed" ||
        result?.status ===
          "cancelled"
      ) {
        break;
      }

      if (
        attempt < 7
      ) {

        await new Promise(
          resolve =>
            setTimeout(
              resolve,
              1500
            )
        );
      }
    }

    if (
      result?.status ===
      "paid"
    ) {

      showPaidModal(
        orderNumber
      );

      return;
    }

    if (
      result?.status ===
        "failed" ||
      result?.status ===
        "cancelled"
    ) {

      showFailedPaymentModal(
        orderNumber
      );

      return;
    }

    showPendingPaymentModal(
      orderNumber
    );
  }

  /*
   * Return from Tabby sandbox.
   *
   * لا نعتبر العملية مدفوعة هنا.
   * هذه فقط نتيجة العودة من صفحة الاختبار.
   */
  async function checkTabbyReturn() {

    const params =
      new URLSearchParams(
        window.location.search
      );

    const tabbyResult =
      params.get(
        "tabby"
      );

    if (
      ![
        "success",
        "cancel",
        "failure"
      ].includes(
        String(
          tabbyResult
        )
      )
    ) {
      return;
    }

    const orderFromUrl =
      params.get(
        "order"
      );

    const storedOrder =
      localStorage.getItem(
        "biocare_tabby_order"
      );

    const orderNumber =
      orderFromUrl ||
      storedOrder ||
      "";

    history.replaceState(
      {},
      "",
      window.location.pathname +
        window.location.hash
    );

    localStorage.removeItem(
      "biocare_tabby_order"
    );

    if (
      tabbyResult ===
      "success"
    ) {

      openModal(`
        <h2>
          تم الرجوع من تابي ✅
        </h2>

        <div class="card">

          ${
            orderNumber
              ? `
                <p>
                  رقم الحجز:
                </p>

                <div
                  style="
                    font-size:20px;
                    font-weight:800;
                    direction:ltr;
                    text-align:center;
                    margin:12px 0;
                  "
                >
                  ${esc(
                    orderNumber
                  )}
                </div>
              `
              : ""
          }

          <p class="muted">
            اكتملت تجربة مسار تابي التجريبي بنجاح.
          </p>

          <div
            class="notice"
            style="
              margin-top:14px;
            "
          >
            هذه بيئة Sandbox.
            لم يتم تسجيل الحجز كمدفوع نهائيًا بعد.
            سنربط خطوة التحقق والتأكيد النهائي من تابي بعد نجاح الاختبار.
          </div>

          <button
            class="primary"
            type="button"
            style="
              margin-top:14px;
            "
            onclick="closeModal();go('home')"
          >
            العودة للرئيسية
          </button>

        </div>
      `);

      return;
    }

    if (
      tabbyResult ===
      "cancel"
    ) {

      openModal(`
        <h2>
          تم إلغاء تجربة تابي
        </h2>

        <div class="card">

          <p class="muted">
            تم الرجوع من صفحة تابي دون إكمال الاختبار.
          </p>

          <button
            class="primary"
            type="button"
            onclick="closeModal();go('home')"
          >
            العودة للرئيسية
          </button>

        </div>
      `);

      return;
    }

    openModal(`
      <h2>
        لم تكتمل تجربة تابي
      </h2>

      <div class="card">

        <p class="muted">
          أعادت تابي نتيجة فشل للاختبار.
          سنراجع نتيجة الطلب قبل الانتقال للإنتاج.
        </p>

        <button
          class="primary"
          type="button"
          onclick="closeModal();go('home')"
        >
          العودة للرئيسية
        </button>

      </div>
    `);
  }

  window.createBiocareLabBooking =
    async function () {

      const button =
        document.getElementById(
          "bioBookingSubmit"
        );

      const status =
        document.getElementById(
          "bioBookingStatus"
        );

      if (
        !button ||
        !status
      ) {
        return;
      }

      if (!selected.length) {

        status.textContent =
          "السلة فارغة.";

        return;
      }

      const branch =
        document
          .getElementById(
            "bioBookingBranch"
          )
          ?.value || "";

      const date =
        document
          .getElementById(
            "bioBookingDate"
          )
          ?.value || "";

      const period =
        document
          .getElementById(
            "bioBookingPeriod"
          )
          ?.value || "";

      const phone =
        document
          .getElementById(
            "bioBookingPhone"
          )
          ?.value
          .trim() || "";

      const customerType =
        document
          .getElementById(
            "bioBookingCustomerType"
          )
          ?.value ||
        "saudi";

      if (!branch) {

        status.textContent =
          "اختر الفرع.";

        return;
      }

      if (!date) {

        status.textContent =
          "اختر تاريخ الزيارة.";

        return;
      }

      if (!period) {

        status.textContent =
          "اختر الفترة المفضلة.";

        return;
      }

      const cleanPhone =
        phone.replace(
          /\D/g,
          ""
        );

      if (
        cleanPhone.length < 9 ||
        cleanPhone.length > 15
      ) {

        status.textContent =
          "أدخل رقم جوال صحيح.";

        return;
      }

      button.disabled =
        true;

      status.textContent =
        "جارٍ إنشاء الحجز...";

      try {

        const client =
          await getLoggedInClient();

        const items =
          selected.map(
            x => ({
              type:
                x.type,

              id:
                String(
                  x.id ||
                  x.code ||
                  ""
                ),

              code:
                String(
                  x.code ||
                  x.id ||
                  ""
                ),

              name:
                String(
                  x.name ||
                  ""
                ),

              price:
                Number.isFinite(
                  Number(
                    x.price
                  )
                )
                  ? Number(
                      x.price
                    )
                  : null
            })
          );

        const {
          data: orderNumber,
          error
        } =
          await client.rpc(
            "care_create_lab_booking",
            {
              p_branch_key:
                branch,

              p_requested_date:
                date,

              p_preferred_period:
                period,

              p_phone:
                cleanPhone,

              p_customer_type:
                customerType,

              p_items:
                items
            }
          );

        if (error) {
          throw error;
        }

        const safeOrderNumber =
          String(
            orderNumber ||
            ""
          );

        selected = [];

        save();

        render();

        openModal(`
          <h2>
            تم استلام حجزك ✅
          </h2>

          <div class="card">

            <p>
              رقم الحجز:
            </p>

            <div
              style="
                font-size:22px;
                font-weight:800;
                direction:ltr;
                text-align:center;
                margin:14px 0
              "
            >
              ${esc(
                safeOrderNumber
              )}
            </div>

            <p class="muted">
              تم تسجيل الحجز في نظام بيوكير.
            </p>

            <p class="micro-note">
              سيتم التحقق من الأسعار واحتساب المبلغ النهائي
              في الخادم قبل فتح صفحة الدفع الآمنة.
            </p>

            ${paymentOptionsHtml(
              safeOrderNumber
            )}

            <button
              type="button"
              style="
                margin-top:10px
              "
              onclick="closeModal();go('home')"
            >
              الدفع لاحقًا
            </button>

          </div>
        `);

      } catch (error) {

        console.error(
          error
        );

        const msg =
          String(
            error?.message ||
            "تعذر إنشاء الحجز."
          );

        if (
          /authentication|required|jwt|login/i
            .test(msg)
        ) {

          status.textContent =
            "انتهت جلسة الدخول. سجّل الدخول مرة أخرى.";

        } else if (
          /invalid branch/i
            .test(msg)
        ) {

          status.textContent =
            "الفرع المختار غير متاح.";

        } else if (
          /invalid booking date/i
            .test(msg)
        ) {

          status.textContent =
            "تاريخ الحجز غير صحيح.";

        } else if (
          /daily request limit/i
            .test(msg)
        ) {

          status.textContent =
            "تم الوصول للحد اليومي للطلبات. حاول لاحقًا.";

        } else {

          status.textContent =
            "تعذر إنشاء الحجز: " +
            msg;
        }

      } finally {

        button.disabled =
          false;
      }
    };

  function attach() {

    if (
      typeof window.booking !==
        "function" ||
      typeof window.go !==
        "function"
    ) {

      setTimeout(
        attach,
        150
      );

      return;
    }

    window.booking =
      bookingPage;

    const originalGo =
      window.go;

    window.go =
      function (v) {

        originalGo(
          v
        );

        if (
          v === "booking"
        ) {

          setTimeout(
            () => {

              biocareBookingUpdateTotal();

              biocareBookingDateChanged();

            },
            0
          );
        }
      };

    try {

      if (
        typeof view !==
          "undefined" &&
        view === "booking"
      ) {

        render();

        biocareBookingUpdateTotal();
      }

    } catch (_) {}

    setTimeout(
      () => {

        checkPaymentReturn()
          .catch(
            error =>
              console.error(
                error
              )
          );

        checkTabbyReturn()
          .catch(
            error =>
              console.error(
                error
              )
          );

      },
      300
    );
  }

  attach();
})();
