import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

type Rec = Record<string, unknown>;
const ORIGIN = "https://etminan2021.github.io";
const API = "https://api-sandbox.tamara.co";

function obj(value: unknown): Rec | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Rec : null;
}
function str(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const result = value.trim();
  return result || null;
}
function amount(value: unknown): number | null {
  const parsed = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  return Number.isFinite(parsed) ? Math.round(parsed * 100) / 100 : null;
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
async function tamaraRequest(apiToken: string, path: string, method = "GET"): Promise<{ response: Response; data: Rec | null }> {
  const response = await fetch(`${API}${path}`, {
    method,
    headers: { Authorization: `Bearer ${apiToken}`, Accept: "application/json", "Content-Type": "application/json" },
    signal: AbortSignal.timeout(12000),
  });
  let data: Rec | null = null;
  try { data = obj(await response.json()); } catch {}
  return { response, data };
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
    .select("id,order_number,patient_id")
    .eq("order_number", orderNumber)
    .eq("patient_id", user.id)
    .maybeSingle();
  if (orderError) return respond(req, { code: "ORDER_LOOKUP_FAILED", message: "Unable to load booking" }, 500);
  if (!order) return respond(req, { code: "ORDER_NOT_FOUND", message: "Booking not found" }, 404);

  const { data: payment, error: paymentError } = await admin
    .from("care_payments")
    .select("id,status,tran_ref,amount,currency,provider,response_status,created_at")
    .eq("order_id", order.id)
    .eq("provider", "tamara")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (paymentError) return respond(req, { code: "PAYMENT_LOOKUP_FAILED", message: "Unable to load payment" }, 500);
  if (!payment) return respond(req, { ok: true, order_number: orderNumber, status: "not_started", verified: false });
  if (payment.status === "paid") {
    return respond(req, { ok: true, order_number: orderNumber, status: "paid", verified: true });
  }
  const tamaraOrderId = str(payment.tran_ref);
  if (!tamaraOrderId) {
    return respond(req, { ok: true, order_number: orderNumber, status: payment.status, verified: false });
  }

  let details: { response: Response; data: Rec | null };
  try {
    details = await tamaraRequest(apiToken, `/orders/${encodeURIComponent(tamaraOrderId)}`);
  } catch {
    return respond(req, { code: "TAMARA_UNAVAILABLE", message: "Unable to verify payment with Tamara" }, 502);
  }
  if (!details.response.ok || !details.data) {
    console.error("Tamara order lookup failed", { http_status: details.response.status });
    return respond(req, { code: "TAMARA_STATUS_FAILED", message: "Unable to verify payment status" }, 502);
  }

  const total = obj(details.data.total_amount);
  const providerRef = str(details.data.order_reference_id);
  const providerAmount = amount(total?.amount);
  const providerCurrency = str(total?.currency)?.toUpperCase();
  const localAmount = amount(payment.amount);
  if (
    providerRef !== orderNumber ||
    providerAmount === null ||
    localAmount === null ||
    providerAmount !== localAmount ||
    providerCurrency !== String(payment.currency).toUpperCase()
  ) {
    console.error("Tamara payment details mismatch", { order_number: orderNumber, tamara_order_id: tamaraOrderId });
    return respond(req, { code: "PAYMENT_DETAILS_MISMATCH", message: "Payment details could not be verified" }, 409);
  }

  let providerStatus = str(details.data.status)?.toLowerCase().replaceAll("_", " ");
  if (providerStatus === "approved") {
    let authorization: { response: Response; data: Rec | null };
    try {
      authorization = await tamaraRequest(apiToken, `/orders/${encodeURIComponent(tamaraOrderId)}/authorise`, "POST");
    } catch {
      return respond(req, { code: "TAMARA_AUTHORISE_FAILED", message: "Tamara approved the payment; confirmation is still pending" }, 502);
    }
    if (!authorization.response.ok || !authorization.data) {
      console.error("Tamara authorization failed", { http_status: authorization.response.status });
      return respond(req, { code: "TAMARA_AUTHORISE_FAILED", message: "Tamara approved the payment; confirmation is still pending" }, 502);
    }
    providerStatus = str(authorization.data.status)?.toLowerCase().replaceAll("_", " ") || "approved";
  }

  let nextStatus: "pending" | "paid" | "failed" | "cancelled" = "pending";
  if (providerStatus === "authorised" || providerStatus === "fully captured") nextStatus = "paid";
  if (providerStatus === "declined" || providerStatus === "expired") nextStatus = "failed";
  if (providerStatus === "canceled" || providerStatus === "cancelled") nextStatus = "cancelled";
  if (!["new", "approved", "authorised", "fully captured", "declined", "expired", "canceled", "cancelled"].includes(String(providerStatus))) {
    return respond(req, { code: "UNKNOWN_TAMARA_STATUS", message: "Tamara returned an unrecognized status" }, 502);
  }

  const updateValues: Rec = {
    status: nextStatus,
    response_status: providerStatus,
    response_message: `Tamara Sandbox verified: ${providerStatus}`,
    updated_at: new Date().toISOString(),
  };
  if (nextStatus === "paid") updateValues.paid_at = new Date().toISOString();
  const { error: updateError } = await admin
    .from("care_payments")
    .update(updateValues)
    .eq("id", payment.id)
    .neq("status", "paid");
  if (updateError) return respond(req, { code: "PAYMENT_UPDATE_FAILED", message: "Unable to record payment status" }, 500);

  return respond(req, {
    ok: true,
    order_number: orderNumber,
    status: nextStatus,
    provider_status: providerStatus,
    verified: nextStatus === "paid",
  });
});
