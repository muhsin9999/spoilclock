// Reads the latest PayPal webhook deliveries from the LIVE database.
import { desc } from "drizzle-orm";
import { db, schema as s } from "@/db";
for (const e of await db.select().from(s.paypalEvents).orderBy(desc(s.paypalEvents.receivedAt)).limit(8))
  console.log(e.receivedAt.toISOString().slice(11, 19), e.type.padEnd(32), e.verified ? "verified" : "UNVERIFIED", e.dealId ? "matched" : "unmatched");
process.exit(0);
