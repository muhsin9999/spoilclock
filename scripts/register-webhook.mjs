// Registers Spoilclock's PayPal webhook. Usage: node --env-file=.env.local scripts/register-webhook.mjs https://<host>/api/paypal/webhook
const url = process.argv[2];
if (!url?.startsWith("https://")) throw new Error("Pass the public https URL of /api/paypal/webhook");
const BASE = "https://api-m.sandbox.paypal.com";
const EVENTS = ["PAYMENT.AUTHORIZATION.CREATED", "PAYMENT.AUTHORIZATION.VOIDED", "PAYMENT.CAPTURE.COMPLETED", "PAYMENT.CAPTURE.DENIED", "PAYMENT.CAPTURE.REFUNDED"];
const auth = Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString("base64");
const t = await (await fetch(`${BASE}/v1/oauth2/token`, { method: "POST", headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" }, body: "grant_type=client_credentials" })).json();
const h = { Authorization: `Bearer ${t.access_token}`, "Content-Type": "application/json" };
const list = await (await fetch(`${BASE}/v1/notifications/webhooks`, { headers: h })).json();
const existing = list.webhooks?.find((w) => w.url === url);
if (existing) {
  console.log("already registered", existing.id);
} else {
  const res = await fetch(`${BASE}/v1/notifications/webhooks`, { method: "POST", headers: h, body: JSON.stringify({ url, event_types: EVENTS.map((name) => ({ name })) }) });
  const body = await res.json();
  if (!res.ok) throw new Error(`${res.status} ${body.name}: ${body.message} ${JSON.stringify(body.details ?? [])}`);
  console.log("created", body.id);
}
