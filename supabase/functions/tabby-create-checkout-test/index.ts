import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

type JsonRecord = Record<string, unknown>;
const ALLOWED_ORIGINS = new Set(["https://biocare-private-review.jocundtitan128.chatgpt.site", "https://app.biocaredx.com"]);
const CATALOG_URL = "https://raw.githubusercontent.com/Etminan2021/biocare/codex/secure-provider-status/catalog.js";
const TABBY_API_BASE = "https://api.tabby.sa";
const TABBY_MERCHANT_CODE = "EtminanMDLG_App";
const ACTIVE_PAYMENT_STATUSES = ["initiated", "pending", "paid"];

let catalogCache: { expires: number; data: JsonRecord } | null = null;

function corsHeaders(origin: string | null): HeadersInit {
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    return {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Vary": "Origin",
    };
  }
  return {};
}
function respond(req: Request, body: JsonRecord, status = 200): Response {
  return Response.json(body, { status, headers: corsHeaders(req.headers.get("origin")) });
}
function asRecord(v: unknown): JsonRecord | null {
  return v && typeof v === "object" && !Array.isArray(v) ? v as JsonRecord : null;
}
function str(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const s = v.trim();
  return s ? s : null;
}
function money(v: unknown): number | null {
  const n = typeof v === "number" ? v : typeof v === "string" && v.trim() ? Number(v) : NaN;
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n * 100) / 100;
}
function itemKey(type: string, id: string) {
  return `${type}:${id}`;
}
async function loadCatalog(): Promise<JsonRecord> {
  if (catalogCache && catalogCache.expires > Date.now()) return catalogCache.data;
  const res = await fetch(CATALOG_URL, { headers: { Accept: "text/plain" } });
  if (!res.ok) throw new Error("CATALOG_FETCH_FAILED");
  const js = await res.text();
  const m = js.match(/const b64="([^"]+)"/);
  if (!m) throw new Error("CATALOG_FORMAT_INVALID");
  const bytes = Uint8Array.from(atob(m[1]), c => c.charCodeAt(0));
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"));
  const text = await new Response(stream).text();
  const parsed: unknown = JSON.parse(text);
  const rec = asRecord(parsed);
  if (!rec) throw new Error("CATALOG_JSON_INVALID");
  catalogCache = { expires: Date.now() + 5 * 60_000, data: rec };
  return rec;
}
function branchAddress(branchKey: string) {
  const map: Record<string, { city: string; address: string }> = {
    "jazan-airport": { city: "Jazan", address: "Prince Sultan Road" },
    "abu-arish": { city: "Abu Arish", address: "Biocare Medical Laboratories" },
    "sabya-king-fahd": { city: "Sabya", address: "King Fahd Road" },
    "sabya-king-abdullah": { city: "Sabya", address: "King Abdullah Road" },
    "addayer": { city: "Addayer", address: "Biocare Medical Laboratories" },
  };
  return map[branchKey] || { city: "Jazan", address: "Biocare Medical Laboratories" };
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin");
  if (req.method === "OPTIONS") {
    if (!origin || !ALLOWED_ORIGINS.has(origin)) return new Response(null, { status: 403 });
    return new Response(null, { status: 204, headers: corsHeaders(origin) });
  }
  if (req.method !== "POST") return respond(req, { message: "Method not allowed", code: "METHOD_NOT_ALLOWED" }, 405);
  if (origin && !ALLOWED_ORIGINS.has(origin)) return respond(req, { message: "Origin not allowed", code: "ORIGIN_NOT_ALLOWED" }, 403);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) {
    return respond(req, { message: "Server configuration error", code: "CONFIG_ERROR" }, 500);
  }

  const auth = req.headers.get("authorization") || "";
  const token = auth.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return respond(req, { message: "Authentication required", code: "AUTH_REQUIRED" }, 401);

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: authData, error: authError } = await admin.auth.getUser(token);
  const user = authData?.user;
  if (authError || !user) return respond(req, { message: "Invalid session", code: "INVALID_SESSION" }, 401);

  const { data: tabbySecret, error: secretError } = await admin.rpc("care_get_tabby_test_secret");
  if (secretError || !tabbySecret) {
    return respond(req, { message: "Tabby test configuration error", code: "TABBY_CONFIG_ERROR" }, 500);
  }

  let body: JsonRecord;
  try {
    const parsed: unknown = await req.json();
    const rec = asRecord(parsed);
    if (!rec) throw new Error();
    body = rec;
  } catch {
    return respond(req, { message: "Invalid request", code: "INVALID_REQUEST" }, 400);
  }

  const orderNumber = str(body.order_number)?.toUpperCase();
  if (!orderNumber || !/^BIO-[A-F0-9]{12}$/.test(orderNumber)) {
    return respond(req, { message: "Invalid order number", code: "INVALID_ORDER_NUMBER" }, 400);
  }

  const scenario = str(body.scenario)?.toLowerCase() ?? "success";
  if (!["success", "prescore_reject", "hpp_reject"].includes(scenario)) {
    return respond(req, { message: "Invalid test scenario", code: "INVALID_SCENARIO" }, 400);
  }

  const { data: order, error: orderError } = await admin
    .from("care_orders")
    .select("id, order_number, patient_id, service_type, status")
    .eq("order_number", orderNumber)
    .eq("patient_id", user.id)
    .maybeSingle();

  if (orderError) return respond(req, { message: "Unable to load order", code: "ORDER_LOOKUP_FAILED" }, 500);
  if (!order) return respond(req, { message: "Order not found", code: "ORDER_NOT_FOUND" }, 404);
  if (order.service_type !== "lab") return respond(req, { message: "Unsupported order", code: "UNSUPPORTED_ORDER" }, 400);
  if (["cancelled", "completed", "ready"].includes(String(order.status))) {
    return respond(req, { message: "Order is not payable", code: "ORDER_NOT_PAYABLE" }, 409);
  }

  const { data: existing, error: existingError } = await admin
    .from("care_payments")
    .select("id, status, tran_ref, amount, currency, created_at")
    .eq("order_id", order.id)
    .in("status", ACTIVE_PAYMENT_STATUSES)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingError) return respond(req, { message: "Unable to check payment", code: "PAYMENT_LOOKUP_FAILED" }, 500);
  if (existing) {
    return respond(req, {
      message: existing.status === "paid" ? "Order already paid" : "Payment already in progress",
      code: existing.status === "paid" ? "ALREADY_PAID" : "PAYMENT_IN_PROGRESS",
      status: existing.status,
      tran_ref: existing.tran_ref ?? null,
      amount: existing.amount,
      currency: existing.currency,
    }, 409);
  }

  const [{ data: details, error: detailsError }, { data: items, error: itemsError }] = await Promise.all([
    admin.from("care_lab_booking_details")
      .select("customer_type, phone, branch_key")
      .eq("order_id", order.id)
      .maybeSingle(),
    admin.from("care_lab_booking_items")
      .select("item_type, item_ref, item_name")
      .eq("order_id", order.id)
      .order("id"),
  ]);

  if (detailsError || itemsError) return respond(req, { message: "Unable to load booking", code: "BOOKING_LOOKUP_FAILED" }, 500);
  if (!details || !items?.length) return respond(req, { message: "Booking is incomplete", code: "BOOKING_INCOMPLETE" }, 409);
  if (!["saudi", "resident"].includes(String(details.customer_type))) {
    return respond(req, { message: "Invalid customer type", code: "INVALID_CUSTOMER_TYPE" }, 409);
  }

  let catalog: JsonRecord;
  try {
    catalog = await loadCatalog();
  } catch {
    return respond(req, { message: "Pricing catalog unavailable", code: "CATALOG_UNAVAILABLE" }, 503);
  }

  const tests = Array.isArray(catalog.tests) ? catalog.tests : [];
  const packages = Array.isArray(catalog.packages) ? catalog.packages : [];
  const base = new Map<string, JsonRecord>();
  for (const raw of tests) {
    const rec = asRecord(raw); const id = rec ? str(rec.code) : null;
    if (rec && id) base.set(itemKey("test", id), rec);
  }
  for (const raw of packages) {
    const rec = asRecord(raw); const id = rec ? str(rec.id) : null;
    if (rec && id) base.set(itemKey("package", id), rec);
  }

  const refs = [...new Set((items as any[]).map((x: any) => String(x.item_ref)))];
  const [{ data: customRows, error: customError }, { data: overrideRows, error: overrideError }] = await Promise.all([
    admin.from("care_catalog_custom").select("item_type,item_id,name,price,active").in("item_id", refs),
    admin.from("care_catalog_overrides").select("item_type,item_id,active,display_name,price_override").in("item_id", refs),
  ]);
  if (customError || overrideError) return respond(req, { message: "Pricing unavailable", code: "PRICING_LOOKUP_FAILED" }, 500);

  const custom = new Map<string, any>((customRows || []).map((r: any) => [itemKey(String(r.item_type), String(r.item_id)), r]));
  const overrides = new Map<string, any>((overrideRows || []).map((r: any) => [itemKey(String(r.item_type), String(r.item_id)), r]));

  let subtotal = 0;
  const pricedItems: Array<{ type: string; id: string; name: string; price: number }> = [];
  for (const row of items as any[]) {
    const type = String(row.item_type);
    const id = String(row.item_ref);
    if (!["test", "package"].includes(type) || !id) {
      return respond(req, { message: "Invalid booking item", code: "INVALID_ITEM" }, 409);
    }
    const key = itemKey(type, id);
    const baseRow = base.get(key) || null;
    const customRow = custom.get(key) || null;
    const overrideRow = overrides.get(key) || null;

    if (!baseRow && !customRow) {
      return respond(req, { message: "Item is no longer available", code: "ITEM_NOT_FOUND", item_id: id }, 409);
    }
    if (customRow && customRow.active === false) {
      return respond(req, { message: "Item is inactive", code: "ITEM_INACTIVE", item_id: id }, 409);
    }
    if (overrideRow && overrideRow.active === false) {
      return respond(req, { message: "Item is inactive", code: "ITEM_INACTIVE", item_id: id }, 409);
    }

    let price = money(baseRow?.price);
    if (customRow && customRow.price != null) price = money(customRow.price);
    if (overrideRow && overrideRow.price_override != null) price = money(overrideRow.price_override);
    if (price == null) {
      return respond(req, { message: "Price requires confirmation", code: "PRICE_UNAVAILABLE", item_id: id }, 409);
    }

    const name = str(overrideRow?.display_name) || str(customRow?.name) || str(baseRow?.name) || String(row.item_name || id);
    subtotal = Math.round((subtotal + price) * 100) / 100;
    pricedItems.push({ type, id, name, price });
  }

  const vat = String(details.customer_type) === "resident" ? Math.round(subtotal * 0.15 * 100) / 100 : 0;
  const total = Math.round((subtotal + vat) * 100) / 100;
  if (total <= 0) return respond(req, { message: "Invalid payment amount", code: "INVALID_AMOUNT" }, 409);

  const cartId = `TABBY-${crypto.randomUUID().replaceAll("-", "").slice(0, 24).toUpperCase()}`;
  const { data: paymentRow, error: insertError } = await admin
    .from("care_payments")
    .insert({
      order_id: order.id,
      provider: "tabby",
      cart_id: cartId,
      amount: total,
      currency: "SAR",
      status: "initiated",
      payment_method: "tabby",
    })
    .select("id")
    .single();

  if (insertError || !paymentRow) {
    return respond(req, { message: "Unable to initialize Tabby payment", code: "PAYMENT_INIT_FAILED" }, 500);
  }

  const branch = branchAddress(String(details.branch_key || ""));
  const successUrl = `https://biocare-private-review.jocundtitan128.chatgpt.site/?tabby=success&order=${encodeURIComponent(orderNumber)}`;
  const cancelUrl = `https://biocare-private-review.jocundtitan128.chatgpt.site/?tabby=cancel&order=${encodeURIComponent(orderNumber)}`;
  const failureUrl = `https://biocare-private-review.jocundtitan128.chatgpt.site/?tabby=failure&order=${encodeURIComponent(orderNumber)}`;

  let buyerEmail = "otp.success@tabby.ai";
  let buyerPhone = "+966500000001";
  if (scenario === "prescore_reject") buyerPhone = "+966500000002";
  if (scenario === "hpp_reject") buyerEmail = "otp.rejected@tabby.ai";

  const tabbyItems = pricedItems.map((x) => ({
    reference_id: `${x.type}-${x.id}`.slice(0, 100),
    title: x.name.slice(0, 200),
    quantity: 1,
    unit_price: x.price.toFixed(2),
    category: "Medical Laboratory Services",
    is_refundable: true,
  }));

  const payload = {
    payment: {
      amount: total.toFixed(2),
      currency: "SAR",
      description: `Biocare lab booking ${orderNumber}`,
      buyer: {
        name: "Biocare Test Customer",
        email: buyerEmail,
        phone: buyerPhone,
      },
      shipping_address: {
        city: branch.city,
        address: branch.address,
        zip: "00000",
      },
      order: {
        reference_id: orderNumber,
        updated_at: new Date().toISOString(),
        tax_amount: vat.toFixed(2),
        shipping_amount: "0.00",
        discount_amount: "0.00",
        items: tabbyItems,
      },
      buyer_history: {
        registered_since: user.created_at || new Date().toISOString(),
        loyalty_level: 0,
        wishlist_count: 0,
        is_social_networks_connected: false,
        is_phone_number_verified: true,
        is_email_verified: true,
      },
      order_history: [],
      meta: {
        customer: user.id,
        order_id: orderNumber,
        source: "biocare-sandbox",
      },
    },
    lang: "ar",
    merchant_code: TABBY_MERCHANT_CODE,
    merchant_urls: {
      success: successUrl,
      cancel: cancelUrl,
      failure: failureUrl,
    },
  };

  let providerResponse: Response;
  try {
    providerResponse = await fetch(`${TABBY_API_BASE}/api/v2/checkout`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${String(tabbySecret)}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });
  } catch {
    await admin.from("care_payments").update({
      response_message: "Tabby connection failed",
      updated_at: new Date().toISOString(),
    }).eq("id", paymentRow.id);
    return respond(req, { message: "Tabby unavailable; do not retry immediately", code: "PROVIDER_OUTCOME_UNKNOWN" }, 502);
  }

  let providerData: JsonRecord | null = null;
  try { providerData = asRecord(await providerResponse.json()); } catch {}

  if (!providerResponse.ok || !providerData) {
    const providerMessage = str(providerData?.error) || str(providerData?.message) || `HTTP ${providerResponse.status}`;
    await admin.from("care_payments").update({
      status: "failed",
      response_code: String(providerResponse.status),
      response_message: providerMessage.slice(0, 500),
      updated_at: new Date().toISOString(),
    }).eq("id", paymentRow.id);
    console.error("Tabby rejected checkout", { http_status: providerResponse.status, message: providerMessage.slice(0, 200) });
    return respond(req, { message: "Unable to create Tabby checkout", code: "PROVIDER_REJECTED" }, 502);
  }

  const sessionStatus = str(providerData.status);
  const paymentObj = asRecord(providerData.payment);
  const paymentId = str(paymentObj?.id);
  const configuration = asRecord(providerData.configuration);
  const availableProducts = asRecord(configuration?.available_products);
  const installments = Array.isArray(availableProducts?.installments) ? availableProducts?.installments as unknown[] : [];
  const firstInstallment = installments.length ? asRecord(installments[0]) : null;
  const webUrlRaw = str(firstInstallment?.web_url);

  if (sessionStatus !== "created" || !paymentId || !webUrlRaw) {
    const products = asRecord(configuration?.products);
    const installmentsProduct = asRecord(products?.installments);
    const rejectionReason = str(installmentsProduct?.rejection_reason) || "Tabby checkout rejected";
    await admin.from("care_payments").update({
      status: "failed",
      tran_ref: paymentId,
      response_status: sessionStatus,
      response_message: rejectionReason.slice(0, 500),
      updated_at: new Date().toISOString(),
    }).eq("id", paymentRow.id);
    return respond(req, {
      message: "Tabby is unavailable for this test order",
      code: "TABBY_REJECTED",
      reason: rejectionReason,
    }, 409);
  }

  let webUrl: URL;
  try {
    webUrl = new URL(webUrlRaw);
    if (webUrl.protocol !== "https:" || !["checkout.tabby.sa", "checkout.tabby.ai"].includes(webUrl.hostname)) throw new Error();
  } catch {
    await admin.from("care_payments").update({
      status: "failed",
      tran_ref: paymentId,
      response_status: sessionStatus,
      response_message: "Invalid Tabby redirect URL",
      updated_at: new Date().toISOString(),
    }).eq("id", paymentRow.id);
    return respond(req, { message: "Invalid Tabby response", code: "INVALID_PROVIDER_RESPONSE" }, 502);
  }

  const { error: updateError } = await admin.from("care_payments").update({
    status: "pending",
    tran_ref: paymentId,
    response_status: sessionStatus,
    response_code: "TEST",
    response_message: `Tabby sandbox ${scenario}`,
    updated_at: new Date().toISOString(),
  }).eq("id", paymentRow.id);

  if (updateError) {
    return respond(req, { message: "Tabby checkout created but state could not be stored", code: "PAYMENT_STATE_SAVE_FAILED" }, 500);
  }

  return respond(req, {
    ok: true,
    test_mode: true,
    scenario,
    order_number: orderNumber,
    amount: total,
    currency: "SAR",
    payment_id: paymentId,
    payment_url: webUrl.toString(),
  });
});