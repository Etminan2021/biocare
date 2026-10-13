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
    const priced = selected.filter(x => Number.isFinite(Number(x.price)));
    const subtotal = priced.reduce((sum, x) => sum + Number(x.price), 0);
    const pending = selected.length - priced.length;

    return `
      <section class="section">
        <div class="section-head">
          <h2 class="under">الحجز</h2>
          <span class="count-badge">${selected.length} عنصر</span>
        </div>

        <div class="card">
          <h3>اختياراتك</h3>

          ${
            selected.length
              ? `<div class="cart-list">
                  ${selected.map((x, i) => `
                    <div class="cart-row">
                      <div>
                        <strong>${esc(x.name)}</strong>
                        <div class="muted">
                          ${x.type === "package" ? "باقة" : "تحليل"}
                          —
                          ${Number.isFinite(Number(x.price)) ? fmtPrice(x.price) : "السعر عند الطلب"}
                        </div>
                      </div>
                      <button onclick="removeCart(${i})" class="remove-btn">حذف</button>
                    </div>
                  `).join("")}
                </div>`
              : `<p class="muted">لم تتم إضافة تحاليل أو باقات بعد.</p>`
          }

          <div class="cart-total">
            <span>الإجمالي المعروف</span>
            <strong>${fmtPrice(subtotal)}</strong>
          </div>

          ${
            pending
              ? `<p class="micro-note">
                   يوجد ${pending} عنصر يحتاج تأكيد السعر من المختبر قبل الدفع.
                 </p>`
              : ""
          }

          <p class="micro-note">تضاف ضريبة القيمة المضافة للمقيمين.</p>
        </div>

        ${
          selected.length
            ? `
            <div class="card">
              <h3>بيانات الحجز</h3>

              ${
                !authUser
                  ? `
                    <div class="notice">
                      يلزم تسجيل الدخول إلى حساب العميل لإتمام الحجز.
                    </div>
                    <button class="primary" type="button" onclick="openLogin()">
                      تسجيل الدخول / إنشاء حساب
                    </button>
                  `
                  : `
                    <p class="muted">
                      الحساب: ${esc(authUser.email || "")}
                    </p>

                    <label for="bioBookingBranch">الفرع</label>
                    <select id="bioBookingBranch">
                      <option value="">اختر الفرع</option>
                      ${branches.map(([key, name]) =>
                        `<option value="${key}">${esc(name)}</option>`
                      ).join("")}
                    </select>

                    <label for="bioBookingDate">تاريخ الزيارة</label>
                    <input
                      id="bioBookingDate"
                      type="date"
                      min="${localDate(0)}"
                      max="${localDate(60)}"
                      onchange="biocareBookingDateChanged()"
                    >

                    <label for="bioBookingPeriod">الفترة المفضلة</label>
                    <select id="bioBookingPeriod">
                      <option value="">اختر الفترة</option>
                      <option value="08:00-12:00" data-friday="no">
                        8 صباحًا – 12 ظهرًا
                      </option>
                      <option value="12:00-16:00" data-friday="no">
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

                    <label for="bioBookingPhone">رقم الجوال</label>
                    <input
                      id="bioBookingPhone"
                      type="tel"
                      inputmode="tel"
                      autocomplete="tel"
                      placeholder="05XXXXXXXX"
                    >

                    <label for="bioBookingCustomerType">نوع العميل</label>
                    <select
                      id="bioBookingCustomerType"
                      onchange="biocareBookingUpdateTotal()"
                    >
                      <option value="saudi">سعودي</option>
                      <option value="resident">مقيم</option>
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

  window.biocareBookingUpdateTotal = function () {
    const box = document.getElementById("bioBookingTotal");
    if (!box) return;

    const priced = selected.filter(x => Number.isFinite(Number(x.price)));
    const subtotal = priced.reduce((sum, x) => sum + Number(x.price), 0);
    const pending = selected.length - priced.length;

    const type =
      document.getElementById("bioBookingCustomerType")?.value || "saudi";

    const vat =
      type === "resident" && pending === 0
        ? Math.round(subtotal * 0.15 * 100) / 100
        : 0;

    const total = subtotal + vat;

    if (pending > 0) {
      box.innerHTML = `
        <strong>الإجمالي المعروف: ${fmtPrice(subtotal)}</strong>
        <br>
        <span class="micro-note">
          يوجد عنصر بسعر يحتاج تأكيد المختبر؛ لن يتم بدء الدفع حتى يتم تأكيد السعر النهائي.
        </span>
      `;
      return;
    }

    box.innerHTML = `
      <div>المبلغ: <strong>${fmtPrice(subtotal)}</strong></div>
      ${
        type === "resident"
          ? `<div>ضريبة القيمة المضافة 15%: <strong>${fmtPrice(vat)}</strong></div>`
          : ""
      }
      <div style="margin-top:8px">
        الإجمالي:
        <strong>${fmtPrice(total)}</strong>
      </div>
    `;
  };

  window.biocareBookingDateChanged = function () {
    const dateInput = document.getElementById("bioBookingDate");
    const period = document.getElementById("bioBookingPeriod");

    if (!dateInput || !period || !dateInput.value) return;

    const chosen = new Date(dateInput.value + "T12:00:00");
    const friday = chosen.getDay() === 5;

    Array.from(period.options).forEach(option => {
      if (option.dataset.friday === "no") {
        option.disabled = friday;
      }
    });

    if (period.selectedOptions[0]?.disabled) {
      period.value = "";
    }
  };

  window.createBiocareLabBooking = async function () {
    const button = document.getElementById("bioBookingSubmit");
    const status = document.getElementById("bioBookingStatus");

    if (!button || !status) return;

    if (!selected.length) {
      status.textContent = "السلة فارغة.";
      return;
    }

    const branch =
      document.getElementById("bioBookingBranch")?.value || "";

    const date =
      document.getElementById("bioBookingDate")?.value || "";

    const period =
      document.getElementById("bioBookingPeriod")?.value || "";

    const phone =
      document.getElementById("bioBookingPhone")?.value.trim() || "";

    const customerType =
      document.getElementById("bioBookingCustomerType")?.value || "saudi";

    if (!branch) {
      status.textContent = "اختر الفرع.";
      return;
    }

    if (!date) {
      status.textContent = "اختر تاريخ الزيارة.";
      return;
    }

    if (!period) {
      status.textContent = "اختر الفترة المفضلة.";
      return;
    }

    const cleanPhone = phone.replace(/\D/g, "");

    if (cleanPhone.length < 9 || cleanPhone.length > 15) {
      status.textContent = "أدخل رقم جوال صحيح.";
      return;
    }

    button.disabled = true;
    status.textContent = "جارٍ إنشاء الحجز...";

    try {
      const client = await initAuth();

      const { data: userData, error: userError } =
        await client.auth.getUser();

      if (userError || !userData?.user) {
        throw new Error("يجب تسجيل الدخول لإتمام الحجز.");
      }

      const items = selected.map(x => ({
        type: x.type,
        id: String(x.id || x.code || ""),
        code: String(x.code || x.id || ""),
        name: String(x.name || ""),
        price: Number.isFinite(Number(x.price))
          ? Number(x.price)
          : null
      }));

      const { data: orderNumber, error } = await client.rpc(
        "care_create_lab_booking",
        {
          p_branch_key: branch,
          p_requested_date: date,
          p_preferred_period: period,
          p_phone: cleanPhone,
          p_customer_type: customerType,
          p_items: items
        }
      );

      if (error) throw error;

      selected = [];
      save();
      render();

      openModal(`
        <h2>تم استلام حجزك ✅</h2>

        <div class="card">
          <p>رقم الحجز:</p>

          <div
            style="
              font-size:22px;
              font-weight:800;
              direction:ltr;
              text-align:center;
              margin:14px 0
            "
          >
            ${esc(orderNumber)}
          </div>

          <p class="muted">
            تم تسجيل الحجز في نظام بيوكير.
          </p>

          <p class="micro-note">
            سيتم ربط خطوة الدفع الإلكتروني بهذا الحجز في المرحلة التالية.
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

    } catch (error) {
      console.error(error);

      const msg = String(
        error?.message || "تعذر إنشاء الحجز."
      );

      if (/authentication|required|jwt|login/i.test(msg)) {
        status.textContent =
          "انتهت جلسة الدخول. سجّل الدخول مرة أخرى.";
      } else if (/invalid branch/i.test(msg)) {
        status.textContent = "الفرع المختار غير متاح.";
      } else if (/invalid booking date/i.test(msg)) {
        status.textContent = "تاريخ الحجز غير صحيح.";
      } else if (/daily request limit/i.test(msg)) {
        status.textContent =
          "تم الوصول للحد اليومي للطلبات. حاول لاحقًا.";
      } else {
        status.textContent =
          "تعذر إنشاء الحجز: " + msg;
      }

    } finally {
      button.disabled = false;
    }
  };

  function attach() {
    if (
      typeof window.booking !== "function" ||
      typeof window.go !== "function"
    ) {
      setTimeout(attach, 150);
      return;
    }

    window.booking = bookingPage;

    const originalGo = window.go;

    window.go = function (v) {
      originalGo(v);

      if (v === "booking") {
        setTimeout(() => {
          biocareBookingUpdateTotal();
          biocareBookingDateChanged();
        }, 0);
      }
    };

    try {
      if (typeof view !== "undefined" && view === "booking") {
        render();
        biocareBookingUpdateTotal();
      }
    } catch (_) {}
  }

  attach();
})();
/* Biocare PayTabs payment */
(function () {
  const originalOpenModal = window.openModal;

  window.startBiocarePayment = async function (orderNumber) {
    const status = document.getElementById("bioPaymentStatus");
    const button = document.getElementById("bioPaymentButton");

    if (button) button.disabled = true;
    if (status) status.textContent = "جارٍ تجهيز صفحة الدفع...";

    try {
      const client = await initAuth();

      const { data: userData, error: userError } =
        await client.auth.getUser();

      if (userError || !userData?.user) {
        throw new Error("يجب تسجيل الدخول.");
      }

      localStorage.setItem(
        "biocare_payment_order",
        orderNumber
      );

      const { data, error } = await client.functions.invoke(
        "paytabs-create-payment-v3",
        {
          body: {
            order_number: orderNumber
          }
        }
      );

      if (error) throw error;

      const paymentUrl = String(data?.payment_url || "");
      const url = new URL(paymentUrl);

      if (
        url.protocol !== "https:" ||
        !["secure.paytabs.sa", "secure.paytabs.com"].includes(url.hostname)
      ) {
        throw new Error("رابط الدفع غير صحيح.");
      }

      window.location.assign(url.toString());

    } catch (e) {
      console.error(e);

      if (status) {
        status.textContent =
          "تعذر بدء الدفع الآن. حاول مرة أخرى بعد قليل.";
      }

      if (button) button.disabled = false;
    }
  };

  window.openModal = function (html) {
    const match = String(html).match(/BIO-[A-F0-9]{12}/);

    if (
      match &&
      String(html).includes("تم استلام حجزك")
    ) {
      const orderNumber = match[0];

      html += `
        <div class="card">
          <button
            id="bioPaymentButton"
            class="primary"
            type="button"
            onclick="startBiocarePayment('${orderNumber}')"
          >
            الدفع الآن بالبطاقة
          </button>

          <p
            id="bioPaymentStatus"
            role="status"
            style="margin-top:12px"
          ></p>
        </div>
      `;
    }

    return originalOpenModal(html);
  };

  async function paymentStatus(orderNumber) {
    const client = await initAuth();

    const { data, error } = await client.functions.invoke(
      "paytabs-payment-status",
      {
        body: {
          order_number: orderNumber
        }
      }
    );

    if (error) throw error;

    return data;
  }

  async function checkReturn() {
    const params = new URLSearchParams(location.search);

    if (params.get("payment") !== "return") return;

    const orderNumber =
      localStorage.getItem("biocare_payment_order");

    history.replaceState(
      {},
      "",
      location.pathname
    );

    if (!orderNumber) return;

    originalOpenModal(`
      <h2>جاري التحقق من الدفع...</h2>
      <div class="card">
        <p class="muted">
          نتحقق من حالة العملية بشكل آمن.
        </p>
      </div>
    `);

    let result = null;

    for (let i = 0; i < 5; i++) {
      try {
        result = await paymentStatus(orderNumber);
      } catch (e) {
        console.error(e);
      }

      if (
        result?.status === "paid" ||
        result?.status === "failed" ||
        result?.status === "cancelled"
      ) {
        break;
      }

      await new Promise(r => setTimeout(r, 1500));
    }

    if (result?.status === "paid") {
      localStorage.removeItem("biocare_payment_order");

      originalOpenModal(`
        <h2>تم الدفع بنجاح ✅</h2>
        <div class="card">
          <p>رقم الحجز:</p>
          <strong>${orderNumber}</strong>
          <p class="muted">
            تم تأكيد عملية الدفع في نظام بيوكير.
          </p>
          <button
            class="primary"
            onclick="closeModal();go('home')"
          >
            العودة للرئيسية
          </button>
        </div>
      `);

    } else if (
      result?.status === "failed" ||
      result?.status === "cancelled"
    ) {
      originalOpenModal(`
        <h2>لم يكتمل الدفع</h2>
        <div class="card">
          <p class="muted">
            لم يتم تأكيد عملية الدفع.
          </p>
          <button
            id="bioPaymentButton"
            class="primary"
            onclick="startBiocarePayment('${orderNumber}')"
          >
            إعادة محاولة الدفع
          </button>
          <p id="bioPaymentStatus"></p>
        </div>
      `);

    } else {
      originalOpenModal(`
        <h2>العملية قيد التحقق</h2>
        <div class="card">
          <p class="muted">
            لم يصل التأكيد النهائي من بوابة الدفع بعد.
            لا تعِد الدفع الآن.
          </p>
        </div>
      `);
    }
  }

  setTimeout(checkReturn, 500);
})();
