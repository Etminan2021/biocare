(function () {

  function getOrderNumber(button) {
    const source = String(
      button?.getAttribute("onclick") || ""
    );

    const match = source.match(
      /\('([^']+)'/
    );

    return match
      ? match[1]
      : "";
  }

  function setSelected(
    wrapper,
    method
  ) {
    wrapper.dataset.selectedMethod =
      method;

    wrapper
      .querySelectorAll(
        ".bio-pay-choice"
      )
      .forEach(button => {

        const selected =
          button.dataset.method ===
          method;

        button.setAttribute(
          "aria-pressed",
          selected
            ? "true"
            : "false"
        );

        button.classList.toggle(
          "is-selected",
          selected
        );

        const check =
          button.querySelector(
            ".bio-pay-check"
          );

        if (check) {
          check.hidden =
            !selected;
        }
      });

    const continueButton =
      wrapper.querySelector(
        ".bio-pay-continue"
      );

    if (continueButton) {
      continueButton.disabled =
        false;
    }

    const status =
      wrapper.querySelector(
        "#bioPaymentStatus"
      );

    if (status) {
      status.textContent = "";
    }
  }

  function setBusy(
    wrapper,
    busy
  ) {
    wrapper
      .querySelectorAll(
        ".bio-pay-choice"
      )
      .forEach(button => {

        if (
          !button.dataset.unavailable
        ) {
          button.disabled =
            busy;
        }
      });

    const continueButton =
      wrapper.querySelector(
        ".bio-pay-continue"
      );

    if (continueButton) {
      continueButton.disabled =
        busy ||
        !wrapper.dataset.selectedMethod;
    }
  }

  function buildPaymentUI(
    orderNumber
  ) {
    const wrapper =
      document.createElement(
        "div"
      );

    wrapper.className =
      "bio-payment-picker";

    wrapper.dataset.selectedMethod =
      "";

    wrapper.innerHTML = `
      <style>
        .bio-payment-picker {
          margin-top:18px;
        }

        .bio-pay-title {
          margin-bottom:12px;
          color:#101426;
          font-size:16px;
          font-weight:800;
          text-align:right;
        }

        .bio-pay-grid {
          display:grid;
          grid-template-columns:
            repeat(2,minmax(0,1fr));
          gap:12px;
        }

        .bio-pay-choice {
          position:relative;
          min-height:118px;
          padding:14px 10px;
          border:1.5px solid #e1e4ea;
          border-radius:16px;
          background:#fff;
          color:#101426;
          cursor:pointer;
          transition:
            border-color .15s ease,
            box-shadow .15s ease,
            transform .15s ease;
        }

        .bio-pay-choice:active:not(:disabled) {
          transform:scale(.985);
        }

        .bio-pay-choice.is-selected {
          border-color:#101426;
          box-shadow:
            0 0 0 2px #101426 inset;
        }

        .bio-pay-choice:disabled {
          cursor:default;
        }

        .bio-pay-check {
          position:absolute;
          top:8px;
          right:8px;
          width:24px;
          height:24px;
          border-radius:50%;
          display:flex;
          align-items:center;
          justify-content:center;
          background:#101426;
          color:#fff;
          font-size:15px;
          font-weight:900;
        }

        .bio-pay-check[hidden] {
          display:none !important;
        }

        .bio-pay-logo {
          min-height:52px;
          display:flex;
          align-items:center;
          justify-content:center;
        }

        .bio-pay-label {
          margin-top:7px;
          font-size:14px;
          font-weight:800;
        }

        .bio-pay-badge {
          display:inline-block;
          margin-right:5px;
          padding:2px 6px;
          border-radius:999px;
          background:#f0f2f5;
          color:#747a86;
          font-size:9px;
          vertical-align:middle;
        }

        .bio-pay-choice.is-unavailable {
          background:#fafafa;
          opacity:.62;
        }

        .bio-pay-continue {
          width:100%;
          margin-top:16px;
        }

        .bio-pay-status {
          margin-top:12px;
          text-align:center;
        }

        @media (max-width:360px) {
          .bio-pay-grid {
            gap:9px;
          }

          .bio-pay-choice {
            min-height:108px;
            padding:12px 7px;
          }
        }
      </style>

      <div class="bio-pay-title">
        &#1575;&#1582;&#1578;&#1585;
        &#1591;&#1585;&#1610;&#1602;&#1577;
        &#1575;&#1604;&#1583;&#1601;&#1593;
      </div>

      <div class="bio-pay-grid">

        <button
          class="bio-pay-choice"
          type="button"
          data-method="card"
          aria-pressed="false"
          aria-label="card payment"
        >

          <span
            class="bio-pay-check"
            hidden
          >&#10003;</span>

          <div
            class="bio-pay-logo"
            dir="ltr"
          >
            <svg
              width="150"
              height="48"
              viewBox="0 0 150 48"
              role="img"
              aria-label="Visa Mastercard mada"
            >
              <text
                x="0"
                y="31"
                font-family="Arial,sans-serif"
                font-size="21"
                font-weight="900"
                font-style="italic"
                fill="#1A1F71"
              >VISA</text>

              <circle
                cx="68"
                cy="24"
                r="12"
                fill="#EB001B"
              ></circle>

              <circle
                cx="80"
                cy="24"
                r="12"
                fill="#F79E1B"
                fill-opacity=".94"
              ></circle>

              <text
                x="101"
                y="30"
                font-family="Arial,sans-serif"
                font-size="17"
                font-weight="900"
                fill="#111111"
              >mada</text>
            </svg>
          </div>

          <div class="bio-pay-label">
            &#1575;&#1604;&#1576;&#1591;&#1575;&#1602;&#1577;
          </div>

        </button>

        <button
          class="bio-pay-choice"
          type="button"
          data-method="applepay"
          aria-pressed="false"
          aria-label="Apple Pay"
        >

          <span
            class="bio-pay-check"
            hidden
          >&#10003;</span>

          <div
            class="bio-pay-logo"
            dir="ltr"
            style="
              direction:ltr;
              unicode-bidi:isolate;
              font-family:
                -apple-system,
                BlinkMacSystemFont,
                'SF Pro Display',
                'Helvetica Neue',
                Arial,
                sans-serif;
              font-size:29px;
              font-weight:700;
              color:#000;
            "
          >
            &#63743; Pay
          </div>

          <div class="bio-pay-label">
            Apple Pay
          </div>

        </button>

        <button
          class="bio-pay-choice"
          type="button"
          data-method="tabby"
          aria-pressed="false"
          aria-label="Tabby"
        >

          <span
            class="bio-pay-check"
            hidden
          >&#10003;</span>

          <div
            class="bio-pay-logo"
            dir="ltr"
          >
            <svg
              width="118"
              height="48"
              viewBox="0 0 118 48"
              role="img"
              aria-label="Tabby"
            >
              <text
                x="5"
                y="33"
                font-family="Arial,sans-serif"
                font-size="32"
                font-weight="900"
                fill="#111111"
              >tabby</text>
            </svg>
          </div>

          <div class="bio-pay-label">
            &#1578;&#1575;&#1576;&#1610;
            <span class="bio-pay-badge">
              &#1578;&#1580;&#1585;&#1610;&#1576;&#1610;
            </span>
          </div>

        </button>

        <button
          class="bio-pay-choice is-unavailable"
          type="button"
          data-method="tamara"
          data-unavailable="true"
          disabled
          aria-disabled="true"
          aria-label="Tamara"
        >

          <div class="bio-pay-logo">
            <span
              style="
                padding:7px 14px;
                border-radius:12px;
                background:
                  linear-gradient(
                    90deg,
                    #87dcff,
                    #ffd39d,
                    #f4aacb
                  );
                color:#111;
                font-size:21px;
                font-weight:900;
              "
            >
              &#1578;&#1605;&#1575;&#1585;&#1575;
            </span>
          </div>

          <div class="bio-pay-label">
            Tamara
            <span class="bio-pay-badge">
              &#1602;&#1585;&#1610;&#1576;&#1611;&#1575;
            </span>
          </div>

        </button>

      </div>

      <button
        class="primary bio-pay-continue"
        type="button"
        disabled
      >
        &#1605;&#1578;&#1575;&#1576;&#1593;&#1577;
        &#1604;&#1604;&#1583;&#1601;&#1593;
      </button>

      <p
        id="bioPaymentStatus"
        class="bio-pay-status"
        role="status"
      ></p>
    `;

    wrapper
      .querySelectorAll(
        ".bio-pay-choice[data-method]"
      )
      .forEach(button => {

        if (
          button.dataset.unavailable
        ) {
          return;
        }

        button.addEventListener(
          "click",
          () => {
            setSelected(
              wrapper,
              button.dataset.method || ""
            );
          }
        );
      });

    const continueButton =
      wrapper.querySelector(
        ".bio-pay-continue"
      );

    continueButton?.addEventListener(
      "click",
      async () => {

        const method =
          wrapper.dataset.selectedMethod ||
          "";

        const status =
          wrapper.querySelector(
            "#bioPaymentStatus"
          );

        if (!method) {

          if (status) {
            status.textContent =
              "\u0627\u062e\u062a\u0631 \u0637\u0631\u064a\u0642\u0629 \u0627\u0644\u062f\u0641\u0639 \u0623\u0648\u0644\u064b\u0627.";
          }

          return;
        }

        setBusy(
          wrapper,
          true
        );

        try {

          if (
            method === "tabby"
          ) {

            await window
              .startBiocareTabbyTest(
                orderNumber
              );

          } else {

            await window
              .startBiocarePayment(
                orderNumber,
                method
              );
          }

        } finally {

          if (
            document.body.contains(
              wrapper
            )
          ) {
            setBusy(
              wrapper,
              false
            );
          }
        }
      }
    );

    return wrapper;
  }

  function upgradePaymentOptions() {

    const appleButton =
      document.getElementById(
        "bioApplePayButton"
      );

    if (!appleButton) {
      return;
    }

    const parent =
      appleButton.parentElement;

    if (
      !parent ||
      parent.querySelector(
        ":scope > .bio-payment-picker"
      )
    ) {
      return;
    }

    const orderNumber =
      getOrderNumber(
        appleButton
      );

    if (!orderNumber) {
      return;
    }

    const status =
      parent.querySelector(
        "#bioPaymentStatus"
      );

    const wrapper =
      buildPaymentUI(
        orderNumber
      );

    parent.insertBefore(
      wrapper,
      appleButton
    );

    let node =
      appleButton;

    while (node) {

      const next =
        node.nextSibling;

      const isStatus =
        node === status;

      node.remove();

      if (isStatus) {
        break;
      }

      node =
        next;
    }
  }

  function startObserver() {

    upgradePaymentOptions();

    const observer =
      new MutationObserver(
        () => {
          upgradePaymentOptions();
        }
      );

    observer.observe(
      document.body,
      {
        childList:true,
        subtree:true
      }
    );
  }

  if (
    document.readyState ===
    "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      startObserver,
      {
        once:true
      }
    );

  } else {

    startObserver();
  }

})();
