// Dev DB: deals waiting at the dock (their dock key opens /dock/<key>). npx tsx --env-file=.env.local scripts/spikes/q-dock.ts
import "../../src/lib/net";
import { db, schema as s } from "../../src/db";
const rows = await db.select({ status: s.deals.status, key: s.deals.dockKey, pallets: s.deals.pallets }).from(s.deals);
const by: Record<string, number> = {};
for (const r of rows) by[r.status] = (by[r.status] ?? 0) + 1;
console.log(by);
console.log("open at dock:", rows.filter((r) => !["ready", "holding", "captured", "partial", "voided"].includes(r.status)).slice(0, 2).map((r) => `${r.status} ${r.key}`));
process.exit(0);
