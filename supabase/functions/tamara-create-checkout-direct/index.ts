import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

type Rec = Record<string, unknown>;
const ORIGIN = "https://etminan2021.github.io";
const API = "https://api-sandbox.tamara.co";
const CATALOG_URL = "https://raw.githubusercontent.com/Etminan2021/biocare/main/catalog.js";

function obj(value: unknown): Rec | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Rec : null;
}
function str(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const valueTrimmed = value.trim();
  return valueTrimmed || null;
}
function money(value: unknown): number | null {
  const parsed = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return Math.round(parsed * 100) / 100;
}
function itemKey(type: string, id: string) {
  return `${type}:${id}`;
}
function headers(origin: string | null): HeadersInit {
  return origin === ORIGIN ? {
    "Access-Control-Allow-Origin": ORIGIN,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  } : {};
}
function respond(req: Request, body: Rec, status = 200) {
  return Response.json(body, { status, headers: headers(req.headers.get("origin")) });
}
async function loadCatalog(): Promise<Rec> {
  const response = await fetch(CATALOG_URL, { headers: { Accept: "text/plain" } });
  if (!response.ok) throw new Error("CATALOG_FETCH_FAILED");
  const source = await response.text();
  const match = source.match(/const b64="([^"]+)"/);
  if (!match) throw new Error("CATALOG_FORMAT_INVALID");
  const compressed = Uint8Array.from(atob(match[1]), c => c.charCodeAt(0));
  const stream = new Blob([compressed]).stream().pipeThrough(new DecompressionStream("gzip"));
  const decoded = await new Response(stream).text();
  const parsed = obj(JSON.parse(decoded));
  if (!parsed) throw new Error("CATALOG_JSON_INVALID");
  return parsed;
}
function branchAddress(key: string) {
  const map: Record<string, { city: string; address: string }> = {
    "jazan-airport": { city: "Jazan", address: "Prince Sultan Road" },
    "abu-arish": { city: "Abu Arish", address: "Biocare Medical Laboratories" },
    "sabya-king-fahd": { city: "Sabya", address: "King Fahd Road" },
    "sabya-king-abdullah": { city: "Sabya", address: "King Abdullah Road" },
    "addayer": { city: "Addayer", address: "Biocare Medical Laboratories" },
  };
  return map[key] || { city: "Jazan", address: "Biocare Medical Laboratories" };
}
function tamaraPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("966")) return `+${digits}`;
  if (digits.startsWith("05")) return `+966${digits.slice(1)}`;
  if (digits.startsWith("5")) return `+966${digits}`;
  return `+${digits}`;
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin");
  if (req.method === "OPTIONS") {
    if (origin !== ORIGIN) return new Response(null, { status: 403 });
    return new Response(null, { status: 204, headers: headers(origin) });
  }
  if (req.method !== "POST") return respond(req, { code: "METHOD_NOT_ALLOWED", message: "Method not allowed" }, 405);
  if (origin && origin !== ORIGIN) return respond(req, { code: "ORIGIN_NOT_ALLOWED", message: "Origin not allowed" }, 403);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const apiToken = Deno.env.get("TAMARA_API_TOKEN");
  if (!supabaseUrl || !serviceKey) return respond(req, { code: "CONFIG_ERROR", message: "Server configuration error" }, 500);
  if (!apiToken) return respond(req, { code: "TAMARA_CONFIG_ERROR", message: "Tamara Sandbox is not configured" }, 503);

  const bearer = (req.headers.get("authorization") || "").match(/^Bearer\s+(.+)$/i)?.[1];
  if (!bearer) return respond(req, { code: "AUTH_REQUIRED", message: "Authentication required" }, 401);
  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: authData, error: authError } = await admin.auth.getUser(bearer);
  const user = authData?.user;
  if (authError || !user) return respond(req, { code: "INVALID_SESSION", message: "Invalid session" }, 401);

  let body: Rec;
  try {
    const parsed = obj(await req.json());
    if (!parsed) throw new Error("invalid body");
    body = parsed;
  } catch {
    return respond(req, { code: "INVALID_REQUEST", message: "Invalid request" }, 400);
  }
  const orderNumber = str(body.order_number)?.toUpperCase();
  if (!orderNumber || !/^BIO-[A-F0-9]{12}$/.test(orderNumber)) {
    return respond(req, { code: "INVALID_ORDER_NUMBER", message: "Invalid order number" }, 400);
  }

  const { data: order, error: orderError } = await admin
    .from("care_orders")
    .select("id,order_number,patient_id,service_type,status")
    .eq("order_number", orderNumber)
    .eq("patient_id", user.id)
    .maybeSingle();
  if (orderError) return respond(req, { code: "ORDER_LOOKUP_FAILED", message: "Unable to load booking" }, 500);
  if (!order) return respond(req, { code: "ORDER_NOT_FOUND", message: "Booking not found" }, 404);
  if (order.service_type !== "lab" || ["cancelled", "completed", "ready"].includes(String(order.status))) {
    return respond(req, { code: "ORDER_NOT_PAYABLE", message: "Booking is not payable" }, 409);
  }

  const { data: details, error: detailsError } = await admin
    .from("care_lab_booking_details")
    .select("customer_type,phone,branch_key")
    .eq("order_id", order.id)
    .maybeSingle();
  const { data: rows, error: rowsError } = await admin
    .from("care_lab_booking_items")
    .select("item_type,item_ref,item_name")
    .eq("order_id", order.id)
    .order("id");
  if (detailsError || rowsError) return respond(req, { code: "BOOKING_LOOKUP_FAILED", message: "Unable to load booking details" }, 500);
  if (!details || !rows?.length || !["saudi", "resident"].includes(String(details.customer_type))) {
    return respond(req, { code: "BOOKING_INCOMPLETE", message: "Booking is incomplete" }, 409);
  }

  const { data: existing, error: existingError } = await admin
    .from("care_payments")
    .select("id,status,provider,tran_ref,created_at")
    .eq("order_id", order.id)
    .in("status", ["initiated", "pending", "paid"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (existingError) return respond(req, { code: "PAYMENT_LOOKUP_FAILED", message: "Unable to check payment" }, 500);
  if (existing) {
    return respond(req, {
      code: existing.status === "paid" ? "ALREADY_PAID" : "PAYMENT_IN_PROGRESS",
      message: existing.status === "paid" ? "Booking already paid" : "A payment is already in progress",
    }, 409);
  }

  let catalog: Rec;
  try { catalog = await loadCatalog(); } catch {
    return respond(req, { code: "CATALOG_UNAVAILABLE", message: "Pricing catalog unavailable" }, 503);
  }
  const baseItems = new Map<string, Rec>();
  for (const raw of Array.isArray(catalog.tests) ? catalog.tests : []) {
    const rec = obj(raw); const id = rec ? str(rec.code) : null;
    if (rec && id) baseItems.set(itemKey("test", id), rec);
  }
  for (const raw of Array.isArray(catalog.packages) ? catalog.packages : []) {
    const rec = obj(raw); const id = rec ? str(rec.id) : null;
    if (rec && id) baseItems.set(itemKey("package", id), rec);
  }

  const refs = [...new Set((rows as Rec[]).map(row => String(row.item_ref)))];
  const [{ data: customs, error: customError }, { data: overrides, error: overrideError }] = await Promise.all([
    admin.from("care_catalog_custom").select("item_type,item_id,name,price,active").in("item_id", refs),
    admin.from("care_catalog_overrides").select("item_type,item_id,active,display_name,price_override").in("item_id", refs),
  ]);
  if (customError || overrideError) return respond(req, { code: "PRICING_LOOKUP_FAILED", message: "Pricing is unavailable" }, 500);
  const customByKey = new Map<string, Rec>((customs || []).map((row: Rec) => [itemKey(String(row.item_type), String(row.item_id)), row]));
  const overridesByKey = new Map<string, Rec>((overrides || []).map((row: Rec) => [itemKey(String(row.item_type), String(row.item_id)), row]));

  let subtotal = 0;
  for (const row of rows as Rec[]) {
    const type = String(row.item_type);
    const id = String(row.item_ref);
    if (!["test", "package"].includes(type) || !id) return respond(req, { code: "INVALID_ITEM", message: "Invalid booking item" }, 409);
    const key = itemKey(type, id);
    const base = baseItems.get(key) || null;
    const custom = customByKey.get(key) || null;
    const override = overridesByKey.get(key) || null;
    if (!base && !custom) return respond(req, { code: "ITEM_NOT_FOUND", message: "An item is no longer available" }, 409);
    if (custom?.active === false || override?.active === false) return respond(req, { code: "ITEM_INACTIVE", message: "An item is inactive" }, 409);
    let price = money(base?.price);
    if (custom?.price != null) price = money(custom.price);
    if (override?.price_override != null) price = money(override.price_override);
    if (price === null) return respond(req, { code: "PRICE_UNAVAILABLE", message: "A price needs confirmation" }, 409);
    subtotal = Math.round((subtotal + price) * 100) / 100;
  }
  const tax = details.customer_type === "resident" ? Math.round(subtotal * 0.15 * 100) / 100 : 0;
  const total = Math.round((subtotal + tax) * 100) / 100;
  if (total <= 0) return respond(req, { code: "INVALID_AMOUNT", message: "Invalid payment amount" }, 409);

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("full_name,phone")
    .eq("id", user.id)
    .maybeSingle();
  if (profileError) return respond(req, { code: "CUSTOMER_LOOKUP_FAILED", message: "Unable to load customer details" }, 500);
  const fullName = str(profile?.full_name) || str(user.user_metadata?.full_name) || str(user.user_metadata?.name);
  const email = str(user.email);
  const phone = tamaraPhone(String(details.phone || profile?.phone || ""));
  if (!fullName || !email || phone.length < 10) {
    return respond(req, { code: "CUSTOMER_DETAILS_REQUIRED", message: "Add your name, email, and a valid Saudi mobile number before using Tamara" }, 409);
  }
  const parts = fullName.split(/\s+/);
  const firstName = parts.shift() || "";
  const lastName = parts.join(" ") || "Customer";
  const branch = branchAddress(String(details.branch_key || ""));
  const paymentId = crypto.randomUUID();
  const checkoutBase = "https://etminan2021.github.io/biocare/?";
  const paymentRow = await admin.from("care_payments").insert({
    order_id: order.id,
    provider: "tamara",
    cart_id: `TAMARA-${paymentId.replaceAll("-", "").slice(0, 24).toUpperCase()}`,
    amount: total,
    currency: "SAR",
    status: "initiated",
    payment_method: "tamara",
  }).select("id").single();
  if (paymentRow.error || !paymentRow.data) {
    return respond(req, { code: "PAYMENT_INIT_FAILED", message: "Unable to initialize Tamara" }, 500);
  }

  const payload = {
    order_reference_id: orderNumber,
    order_number: orderNumber,
    total_amount: { amount: total, currency: "SAR" },
    description: `Biocare laboratory booking ${orderNumber}`,
    country_code: "SA",
    payment_type: "PAY_BY_INSTALMENTS",
    locale: "ar_SA",
    items: [{
      reference_id: orderNumber,
      type: "Service",
      name: "Laboratory services",
      sku: "BIOCARE-LAB",
      quantity: 1,
      unit_price: { amount: subtotal, currency: "SAR" },
      tax_amount: { amount: tax, currency: "SAR" },
      total_amount: { amount: total, currency: "SAR" },
    }],
    consumer: {
      first_name: firstName,
      last_name: lastName,
      phone_number: phone,
      email,
    },
    shipping_address: {
      first_name: firstName,
      last_name: lastName,
      address_line1: branch.address,
      city: branch.city,
      country_code: "SA",
      phone_number: phone,
      zip_code: "00000",
    },
    merchant_url: {
      success: `${checkoutBase}tamara=success&order=${encodeURIComponent(orderNumber)}`,
      failure: `${checkoutBase}tamara=failure&order=${encodeURIComponent(orderNumber)}`,
      cancel: `${checkoutBase}tamara=cancel&order=${encodeURIComponent(orderNumber)}`,
    },
  };

  let response: Response;
  try {
    response = await fetch(`${API}/checkout`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiToken}`, "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(15000),
    });
  } catch {
    await admin.from("care_payments").update({
      response_message: "Tamara connection outcome unknown",
      updated_at: new Date().toISOString(),
    }).eq("id", paymentRow.data.id);
    return respond(req, { code: "PROVIDER_OUTCOME_UNKNOWN", message: "Tamara is unavailable; check status before retrying" }, 502);
  }
  let providerData: Rec | null = null;
  try { providerData = obj(await response.json()); } catch {}
  if (!response.ok || !providerData) {
    const message = str(providerData?.message) || `HTTP ${response.status}`;
    await admin.from("care_payments").update({
      status: "failed",
      response_code: String(response.status),
      response_message: message.slice(0, 500),
      updated_at: new Date().toISOString(),
    }).eq("id", paymentRow.data.id);
    console.error("Tamara sandbox checkout rejected", { http_status: response.status });
    return respond(req, { code: "PROVIDER_REJECTED", message: "Unable to create Tamara checkout" }, 502);
  }
  const tamaraOrderId = str(providerData.order_id);
  const checkoutUrlRaw = str(providerData.checkout_url);
  let checkoutUrl: URL | null = null;
  try {
    if (checkoutUrlRaw) {
      const candidate = new URL(checkoutUrlRaw);
      if (
        candidate.protocol === "https:" &&
        ["checkout.tamara.co", "checkout-sandbox.tamara.co"].includes(candidate.hostname)
      ) checkoutUrl = candidate;
    }
  } catch {}
  if (!tamaraOrderId || !checkoutUrl) {
    await admin.from("care_payments").update({
      status: "failed",
      tran_ref: tamaraOrderId,
      response_status: str(providerData.status),
      response_message: "Invalid Tamara checkout response",
      updated_at: new Date().toISOString(),
    }).eq("id", paymentRow.data.id);
    return respond(req, { code: "INVALID_PROVIDER_RESPONSE", message: "Invalid Tamara response" }, 502);
  }

  const { error: saveError } = await admin.from("care_payments").update({
    status: "pending",
    tran_ref: tamaraOrderId,
    response_status: str(providerData.status) || "new",
    response_message: "Tamara Sandbox checkout created",
    updated_at: new Date().toISOString(),
  }).eq("id", paymentRow.data.id);
  if (saveError) {
    return respond(req, { code: "PAYMENT_STATE_SAVE_FAILED", message: "Tamara checkout created but payment state could not be saved" }, 500);
  }
  return respond(req, {
    ok: true,
    sandbox: true,
    order_number: orderNumber,
    payment_url: checkoutUrl.toString(),
  });
});
