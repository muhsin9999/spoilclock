// Dev DB: the run behind the newest approved deal, and its loads (for local screenshots).
import "../../src/lib/net";
import { desc, eq, isNotNull } from "drizzle-orm";
import { db, schema as s } from "../../src/db";
const [d] = await db.select().from(s.deals).where(isNotNull(s.deals.approvedAt)).orderBy(desc(s.deals.approvedAt)).limit(1);
const [load] = await db.select().from(s.loads).where(eq(s.loads.id, d.loadId));
const loads = await db.select({ id: s.loads.id, truck: s.loads.truckId, status: s.loads.status }).from(s.loads).where(eq(s.loads.runId, load.runId));
console.log(JSON.stringify({ run: load.runId, loads }));
process.exit(0);
