// Deletes the saved test cards a failed spike left behind (by customer id).
import { pp, step } from "./paypal.mjs";
for (const customer of process.argv.slice(2)) {
  const { json } = await pp("GET", `/v3/vault/payment-tokens?customer_id=${customer}`);
  for (const t of json.payment_tokens ?? []) { await pp("DELETE", `/v3/vault/payment-tokens/${t.id}`); step(`deleted ${t.id}`, true, customer); }
}
