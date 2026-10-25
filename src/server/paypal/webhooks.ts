// PayPal webhooks: verify the signature, store each event once, and tie it to its deal.
import "server-only";
import { X509Certificate } from "node:crypto";
import { eq, or } from "drizzle-orm";
import { db, schema as s } from "@/db";
import { checkSignature, trustedCertUrl } from "@/lib/paypal-signature";
import { paypal } from "./rest";

export type WebhookEvent = {
  id: string;
  event_type: string;
  resource?: { id?: string; custom_id?: string; supplementary_data?: { related_ids?: { order_id?: string; authorization_id?: string } } };
};

export const EVENTS = ["PAYMENT.AUTHORIZATION.CREATED", "PAYMENT.AUTHORIZATION.VOIDED", "PAYMENT.CAPTURE.COMPLETED", "PAYMENT.CAPTURE.DENIED", "PAYMENT.CAPTURE.REFUNDED"];

const HEADERS = ["paypal-auth-algo", "paypal-cert-url", "paypal-transmission-id", "paypal-transmission-sig", "paypal-transmission-time"] as const;
const certs = new Map<string, string>();

async function cert(url: string) {
  const hit = certs.get(url);
  if (hit) return hit;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`PayPal certificate fetch failed (${res.status})`);
  const pem = await res.text();
  if (new Date(new X509Certificate(pem).validTo) < new Date()) throw new Error("PayPal signing certificate has expired");
  certs.set(url, pem);
  return pem;
}

/**
 * Confirms a delivery really came from PayPal for our webhook: first offline, on the exact bytes PayPal sent with
 * PayPal's certificate (fetched only from PayPal's own hosts); if that can't decide, PayPal's verify API.
 */
export async function verifySignature(headers: Headers, raw: string) {
  if (HEADERS.some((h) => !headers.get(h))) return false;
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  if (!webhookId) return false;
  const get = (h: (typeof HEADERS)[number]) => headers.get(h)!;
  const certUrl = get("paypal-cert-url");
  if (!trustedCertUrl(certUrl)) return false;
  if (/^SHA256withRSA$/i.test(get("paypal-auth-algo"))) {
    try {
      if (checkSignature({ transmissionId: get("paypal-transmission-id"), time: get("paypal-transmission-time"), webhookId, raw, signature: get("paypal-transmission-sig"), certPem: await cert(certUrl) })) return true;
    } catch (e) {
      console.warn("Offline webhook check failed, asking PayPal:", (e as Error).message);
    }
  }
  const fields = { auth_algo: get("paypal-auth-algo"), cert_url: certUrl, transmission_id: get("paypal-transmission-id"), transmission_sig: get("paypal-transmission-sig"), transmission_time: get("paypal-transmission-time"), webhook_id: webhookId };
  const body = `${JSON.stringify(fields).slice(0, -1)},"webhook_event":${raw}}`;
  const r = await paypal<{ verification_status: string }>("POST", "/v1/notifications/verify-webhook-signature", { rawBody: body });
  return r.verification_status === "SUCCESS";
}

/** Stores a delivery once. Our orders carry the deal id as custom_id; the order id is the fallback match. */
export async function ingest(event: WebhookEvent, verified: boolean) {
  const r = event.resource ?? {};
  const orderId = r.supplementary_data?.related_ids?.order_id;
  const custom = r.custom_id && /^[0-9a-f-]{36}$/i.test(r.custom_id) ? r.custom_id : undefined;
  const [deal] = custom || orderId ? await db.select({ id: s.deals.id }).from(s.deals).where(or(custom ? eq(s.deals.id, custom) : undefined, orderId ? eq(s.deals.paypalOrderId, orderId) : undefined)) : [];
  const rows = await db
    .insert(s.paypalEvents)
    .values({ eventId: event.id, type: event.event_type, resourceId: r.id ?? null, dealId: deal?.id ?? null, verified, payload: event })
    .onConflictDoNothing({ target: s.paypalEvents.eventId })
    .returning({ id: s.paypalEvents.id });
  return rows.length ? (deal ? "stored" : "unmatched") : "duplicate";
}
