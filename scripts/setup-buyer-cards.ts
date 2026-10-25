// Saves one sandbox test card per buyer agent in PayPal's Vault, so each agent can pay with no approval page.
// We store only PayPal's token, never the card number. Run once per database:
//   npx tsx --conditions=react-server --env-file=.env.local scripts/setup-buyer-cards.ts
import { db, schema as s } from "@/db";
import { BUYERS } from "@/lib/buyers";
import { paypal } from "@/server/paypal/rest";

// PayPal's public sandbox test numbers (developer.paypal.com → Card testing). Not real cards.
const TEST_CARDS: Record<string, { number: string; brand: string }> = {
  valley: { number: "4111111111111111", brand: "Visa" },
  bargain: { number: "5555555555554444", brand: "Mastercard" },
  coastal: { number: "4012888888881881", brand: "Visa" },
};
const EMAIL: Record<string, string> = {
  valley: "spoilclock-buyer-1-9806641d@personal.example.com",
  bargain: "spoilclock-buyer-2-9806641d@personal.example.com",
  coastal: "spoilclock-buyer-3-9806641d@personal.example.com",
};

for (const b of BUYERS) {
  const c = TEST_CARDS[b.id];
  const setup = await paypal<{ id: string }>("POST", "/v3/vault/setup-tokens", {
    headers: { "PayPal-Request-Id": crypto.randomUUID() },
    body: {
      customer: { id: `spoilclock-${b.id}` },
      payment_source: { card: { number: c.number, expiry: "2030-12", security_code: "123", name: b.name, billing_address: { address_line_1: "1 Main St", admin_area_2: "Salinas", admin_area_1: "CA", postal_code: "93901", country_code: "US" } } },
    },
  });
  const token = await paypal<{ id: string }>("POST", "/v3/vault/payment-tokens", { headers: { "PayPal-Request-Id": crypto.randomUUID() }, body: { payment_source: { token: { id: setup.id, type: "SETUP_TOKEN" } } } });
  await db
    .insert(s.buyerCards)
    .values({ buyerId: b.id, vaultId: token.id, brand: c.brand, last4: c.number.slice(-4) })
    .onConflictDoUpdate({ target: s.buyerCards.buyerId, set: { vaultId: token.id, brand: c.brand, last4: c.number.slice(-4) } });
  console.log(`${b.name}: ${c.brand} ····${c.number.slice(-4)} saved (${EMAIL[b.id]})`);
}
process.exit(0);
