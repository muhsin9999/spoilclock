import { ingest, verifySignature, type WebhookEvent } from "@/server/paypal/webhooks";

// PayPal webhook receiver. Unverified deliveries are kept (marked unverified) but never shown as confirmation.
export async function POST(request: Request) {
  const raw = await request.text();
  let event: WebhookEvent;
  try {
    event = JSON.parse(raw) as WebhookEvent;
  } catch {
    return Response.json({ ok: false }, { status: 400 });
  }
  if (!event?.id || !event.event_type) return Response.json({ ok: false }, { status: 400 });
  let verified = false;
  try {
    verified = await verifySignature(request.headers, raw);
  } catch (e) {
    console.error("webhook verification failed", e);
    return Response.json({ ok: false }, { status: 503 }); // PayPal retries later
  }
  const outcome = await ingest(event, verified);
  return Response.json({ ok: verified, outcome }, { status: verified ? 200 : 400 });
}
