// Kill test: can a buyer agent hold money with no approval page, and can we
// capture in full, capture part (short weight), void, and refund?
// Run: node --env-file=<env> spikes/01-authorize.mjs
import { pp, step } from "./paypal.mjs";

const card = {
  number: "4032039317984658", expiry: "2030-12", security_code: "123", name: "Buyer Agent Test",
  billing_address: { address_line_1: "1 Main St", admin_area_2: "San Jose", admin_area_1: "CA", postal_code: "95131", country_code: "US" },
};
const unit = (value, ref) => ({ reference_id: ref, description: "Strawberries, 1 truckload (spike)", amount: { currency_code: "USD", value } });

async function authorize(payment_source, value, ref) {
  const { json } = await pp("POST", "/v2/checkout/orders", {
    headers: { "PayPal-Request-Id": crypto.randomUUID() },
    body: { intent: "AUTHORIZE", purchase_units: [unit(value, ref)], payment_source },
  });
  const auth = json.purchase_units?.[0]?.payments?.authorizations?.[0];
  step(`authorize $${value} (${ref})`, json.status === "COMPLETED" && auth?.status === "CREATED",
    `order ${json.id} ${json.status} · auth ${auth?.id} ${auth?.status} · payee ${json.purchase_units?.[0]?.payee?.email_address ?? "?"}`);
  return auth;
}

const t0 = Date.now();
try {
  // 1. Accepted at the dock: capture everything.
  const a = await authorize({ card }, "2880.00", "accepted");
  const { json: c1 } = await pp("POST", `/v2/payments/authorizations/${a.id}/capture`, {
    headers: { "PayPal-Request-Id": crypto.randomUUID() }, body: { final_capture: true },
  });
  step("full capture", c1.status === "COMPLETED", `${c1.id} ${c1.status} $${c1.amount?.value}`);

  // 2. Short weight: capture only what arrived, release the rest.
  const b = await authorize({ card }, "2880.00", "short");
  const { json: c2 } = await pp("POST", `/v2/payments/authorizations/${b.id}/capture`, {
    headers: { "PayPal-Request-Id": crypto.randomUUID() },
    body: { amount: { currency_code: "USD", value: "2520.00" }, final_capture: true, note_to_payer: "2 of 16 pallets short" },
  });
  const { json: b2 } = await pp("GET", `/v2/payments/authorizations/${b.id}`);
  step("partial capture (short weight)", c2.status === "COMPLETED", `captured $${c2.amount?.value}; authorization now ${b2.status}`);

  // 3. Rejected again: void, no money moves.
  const v = await authorize({ card }, "2880.00", "rejected");
  await pp("POST", `/v2/payments/authorizations/${v.id}/void`);
  const { json: v2 } = await pp("GET", `/v2/payments/authorizations/${v.id}`);
  step("void", v2.status === "VOIDED", v2.status);

  // 4. Quality claim after payment: partial refund.
  const { json: r } = await pp("POST", `/v2/payments/captures/${c1.id}/refund`, {
    headers: { "PayPal-Request-Id": crypto.randomUUID() },
    body: { amount: { currency_code: "USD", value: "180.00" }, note_to_payer: "1 pallet below grade" },
  });
  step("partial refund", r.status === "COMPLETED", `${r.id} ${r.status}`);
} catch (e) { step("card lifecycle", false, e.message.slice(0, 600)); }

try {
  // 5. Buyer agent with a saved card (vault): no card number, no approval page.
  const { json: st } = await pp("POST", "/v3/vault/setup-tokens", {
    headers: { "PayPal-Request-Id": crypto.randomUUID() },
    body: { payment_source: { card } },
  });
  step("vault setup token", !!st.id, `${st.id} ${st.status}`);
  const { json: pt } = await pp("POST", "/v3/vault/payment-tokens", {
    headers: { "PayPal-Request-Id": crypto.randomUUID() },
    body: { payment_source: { token: { id: st.id, type: "SETUP_TOKEN" } } },
  });
  step("vault payment token", !!pt.id, `${pt.id} customer ${pt.customer?.id}`);
  const s = await authorize({ card: { vault_id: pt.id, stored_credential: { payment_initiator: "MERCHANT", usage: "SUBSEQUENT", usage_pattern: "UNSCHEDULED" } } }, "1950.00", "vaulted");
  const { json: c3 } = await pp("POST", `/v2/payments/authorizations/${s.id}/capture`, {
    headers: { "PayPal-Request-Id": crypto.randomUUID() }, body: { final_capture: true },
  });
  step("capture on vaulted card", c3.status === "COMPLETED", `${c3.id} ${c3.status}`);
  await pp("DELETE", `/v3/vault/payment-tokens/${pt.id}`);
} catch (e) { step("vaulted card", false, e.message.slice(0, 600)); }

console.log(`done in ${((Date.now() - t0) / 1000).toFixed(1)} s`);
