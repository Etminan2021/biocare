import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

type JsonRecord = Record<string, unknown>;
const ALLOWED_ORIGINS = new Set(["https://biocare-private-review.jocundtitan128.chatgpt.site", "https://biocaredx.com"]);
const TABBY_API_BASE = "https://api.tabby.sa";

function asRecord(value: unknown): JsonRecord | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as JsonRecord
    : null;
}
function str(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const result = value.trim();
  return result || null;
}
function corsHeaders(origin: string | null): HeadersInit {
  if (!origin || !ALLOWED_ORIGINS.has(origin)) return {};
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}
function respond(req: Request, body: JsonRecord, status = 200): Response {
  return Response.json(body, { status, headers: corsHeaders(req.headers.get("origin")) });
}
function amount(value: unknown): number | null {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? Math.round(parsed * 100) / 100 : null;
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin");
  if (req.method === "OPTIONS") {
    if (!origin || !ALLOWED_ORIGINS.has(origin)) return new Response(null, { status: 403 });
    return new Response(null, { status: 204, headers: corsHeaders(origin) });
  }
  if (req.method !== "POST") {
    return respond(req, { code: "METHOD_NOT_ALLOWED", message: "Method not allowed" }, 405);
  }
  if (origin && !ALLOWED_ORIGINS.has(origin)) {
    return respond(req, { code: "ORIGIN_NOT_ALLOWED", message: "Origin not allowed" }, 403);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) {
    return respond(req, { code: "CONFIG_ERROR", message: "Server configuration error" }, 500);
  }

  const token = (req.headers.get("authorization") || "").match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return respond(req, { code: "AUTH_REQUIRED", message: "Authentication required" }, 401);
  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: authData, error: authError } = await admin.auth.getUser(token);
  const user = authData?.user;
  if (authError || !user) {
    return respond(req, { code: "INVALID_SESSION", message: "Invalid session" }, 401);
  }

  let body: JsonRecord;
  try {
    const parsed = asRecord(await req.json());
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
    .select("id,order_number")
    .eq("order_number", orderNumber)
    .eq("patient_id", user.id)
    .maybeSingle();
  if (orderError) return respond(req, { code: "ORDER_LOOKUP_FAILED", message: "Unable to load order" }, 500);
  if (!order) return respond(req, { code: "ORDER_NOT_FOUND", message: "Order not found" }, 404);

  const { data: payment, error: paymentError } = await admin
    .from("care_payments")
    .select("id,status,tran_ref,amount,currency,response_code,response_status,paid_at")
    .eq("order_id", order.id)
    .eq("provider", "tabby")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (paymentError) return respond(req, { code: "PAYMENT_LOOKUP_FAILED", message: "Unable to load payment" }, 500);
  if (!payment) return respond(req, { ok: true, order_number: orderNumber, status: "not_started", verified: false });
  if (payment.status === "paid") {
    return respond(req, { ok: true, order_number: orderNumber, status: "paid", verified: true });
  }
  if (payment.response_code !== "TEST") {
    return respond(req, { code: "NOT_TEST_PAYMENT", message: "This endpoint is for Tabby Sandbox payments only" }, 409);
  }
  const paymentId = str(payment.tran_ref);
  if (!paymentId) {
    return respond(req, { ok: true, order_number: orderNumber, status: payment.status, verified: false });
  }

  const { data: tabbySecret, error: secretError } = await admin.rpc("care_get_tabby_test_secret");
  if (secretError || typeof tabbySecret !== "string" || !tabbySecret) {
    return respond(req, { code: "TABBY_CONFIG_ERROR", message: "Tabby test configuration error" }, 500);
  }

  let providerResponse: Response;
  try {
    providerResponse = await fetch(`${TABBY_API_BASE}/api/v2/payments/${encodeURIComponent(paymentId)}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${tabbySecret}`, Accept: "application/json" },
      signal: AbortSignal.timeout(10000),
    });
  } catch {
    return respond(req, { code: "TABBY_UNAVAILABLE", message: "Unable to verify payment with Tabby" }, 502);
  }
  let providerData: JsonRecord | null = null;
  try { providerData = asRecord(await providerResponse.json()); } catch {}
  if (!providerResponse.ok || !providerData) {
    console.error("Tabby status lookup failed", { http_status: providerResponse.status });
    return respond(req, { code: "TABBY_STATUS_FAILED", message: "Unable to verify payment status" }, 502);
  }

  const providerOrder = asRecord(providerData.order);
  const providerRef = str(providerOrder?.reference_id);
  const providerAmount = amount(providerData.amount);
  const providerCurrency = str(providerData.currency)?.toUpperCase();
  const localAmount = amount(payment.amount);
  if (
    str(providerData.id) !== paymentId ||
    providerRef !== orderNumber ||
    providerAmount === null ||
    localAmount === null ||
    providerAmount !== localAmount ||
    providerCurrency !== String(payment.currency).toUpperCase()
  ) {
    console.error("Tabby payment details mismatch", { order_number: orderNumber, payment_id: paymentId });
    return respond(req, { code: "PAYMENT_DETAILS_MISMATCH", message: "Payment details could not be verified" }, 409);
  }

  const providerStatus = str(providerData.status)?.toUpperCase();
  let nextStatus: "pending" | "paid" | "failed" | null = null;
  if (providerStatus === "CREATED") nextStatus = "pending";
  if (providerStatus === "AUTHORIZED" || providerStatus === "CLOSED") nextStatus = "paid";
  if (providerStatus === "REJECTED" || providerStatus === "EXPIRED") nextStatus = "failed";
  if (!nextStatus) {
    return respond(req, { code: "UNKNOWN_TABBY_STATUS", message: "Tabby returned an unrecognized status" }, 502);
  }

  const updateValues: JsonRecord = {
    status: nextStatus,
    response_status: providerStatus,
    response_message: `Tabby Sandbox verified: ${providerStatus}`,
    updated_at: new Date().toISOString(),
  };
  if (nextStatus === "paid") updateValues.paid_at = new Date().toISOString();
  const { error: updateError } = await admin
    .from("care_payments")
    .update(updateValues)
    .eq("id", payment.id)
    .neq("status", "paid");
  if (updateError) {
    return respond(req, { code: "PAYMENT_UPDATE_FAILED", message: "Unable to record payment status" }, 500);
  }

  return respond(req, {
    ok: true,
    order_number: orderNumber,
    status: nextStatus,
    provider_status: providerStatus,
    verified: nextStatus === "paid",
  });
});
