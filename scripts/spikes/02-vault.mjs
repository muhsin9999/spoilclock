// Which sandbox test cards can be saved (vaulted) for a buyer agent, and can an order use the saved card?
import { pp, step } from "./paypal.mjs";
const addr = { address_line_1: "1 Main St", admin_area_2: "San Jose", admin_area_1: "CA", postal_code: "95131", country_code: "US" };
for (const number of ["4111111111111111", "4012888888881881", "4005519200000004", "5555555555554444", "4012000033330026"]) {
  try {
    const { json: st } = await pp("POST", "/v3/vault/setup-tokens", { headers: { "PayPal-Request-Id": crypto.randomUUID() }, body: { payment_source: { card: { number, expiry: "2030-12", security_code: "123", name: "Valley Juice Co", billing_address: addr } } } });
    const { json: pt } = await pp("POST", "/v3/vault/payment-tokens", { headers: { "PayPal-Request-Id": crypto.randomUUID() }, body: { payment_source: { token: { id: st.id, type: "SETUP_TOKEN" } } } });
    step(`vault ${number.slice(0, 4)}…${number.slice(-4)}`, !!pt.id, `token ${pt.id} customer ${pt.customer?.id}`);
    const { json: o } = await pp("POST", "/v2/checkout/orders", { headers: { "PayPal-Request-Id": crypto.randomUUID() }, body: { intent: "AUTHORIZE", purchase_units: [{ amount: { currency_code: "USD", value: "10.00" } }], payment_source: { card: { vault_id: pt.id } } } });
    const auth = o.purchase_units?.[0]?.payments?.authorizations?.[0];
    step("  authorize with saved card", auth?.status === "CREATED", `${o.status} auth ${auth?.id}`);
    if (auth) await pp("POST", `/v2/payments/authorizations/${auth.id}/void`);
    await pp("DELETE", `/v3/vault/payment-tokens/${pt.id}`);
    step("  saved card deleted again", true);
    break;
  } catch (e) { step(`vault ${number.slice(0, 4)}…${number.slice(-4)}`, false, e.message.slice(0, 600)); }
}
