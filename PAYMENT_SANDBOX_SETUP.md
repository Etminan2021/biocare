# Payment Sandbox rollout

This branch contains code only. It has not been deployed to Supabase or to the public GitHub Pages site.

## Tabby

- The existing `care_get_tabby_test_secret` Vault RPC is used only by server functions; the database currently allows `service_role` to execute it, not `anon` or `authenticated`.
- Deploy `supabase/functions/tabby-payment-status/index.ts` with the same manual bearer-session validation used by the existing provider functions.
- A return URL never marks a booking paid. The status function looks up the signed-in customer's order, retrieves the provider payment using the stored Tabby payment ID, checks order reference, amount, and currency, and then maps the provider status to the local payment state.
- Tabby Sandbox uses the existing Vault secret `biocare_tabby_test_secret`.

## Tamara Direct Sandbox

- The checkout and status functions use `https://api-sandbox.tamara.co` only.
- Store the Tamara sandbox API token in Supabase Edge Function secrets as `TAMARA_API_TOKEN`. Never add it to the website, GitHub, or a message.
- Deploy both `tamara-create-checkout-direct` and `tamara-payment-status`.
- Tamara return URLs are only signals to poll. The status function fetches the order from Tamara, checks the merchant order reference, amount, and currency, and authorises an `approved` order server-side before marking the local payment paid.
- The request sends one generic “Laboratory services” line item, not the patient's selected test names.

## Validation still required before enabling this branch

1. Approve deployment of the functions to the existing Supabase project.
2. Add the Tamara Sandbox API token directly in Supabase Edge Function secrets.
3. Use a new booking for each provider, then test Sandbox checkout and return without real charges.
4. Confirm the Tamara merchant account is approved for Direct Sandbox checkout.
5. Deploy the site privately after the backend test passes. Do not publish this branch through the current public GitHub Pages setup.

## Provider references

- [Tabby: Retrieve a payment](https://docs.tabby.ai/api-reference/payments/retrieve-a-payment)
- [Tabby: Payment statuses](https://docs.tabby.ai/pay-in-4-custom-integration/payment-statuses)
- [Tamara: Create Checkout Session](https://docs.tamara.co/reference/createcheckoutsession)
- [Tamara: Get Order Details](https://docs.tamara.co/reference/getorderdetails)
- [Tamara: Authorise Order](https://docs.tamara.co/reference/authoriseorder)
