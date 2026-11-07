// DEV DB ONLY: adds one short "new delivery" trip to a run, to check how the board draws it. RUN=<run id>
import "../../src/lib/net";
import { db, schema as s } from "../../src/db";
if (process.env.DATABASE_URL === process.env.DATABASE_URL_PROD) { console.log("refusing: that is the live database"); process.exit(1); }
const now = Date.now();
await db.insert(s.trips).values({ runId: process.env.RUN!, truckId: "t14", kind: "redelivery", place: "Valley Juice Co.", startAt: new Date(now + 15 * 60_000), endAt: new Date(now + 70 * 60_000) });
console.log("added");
process.exit(0);
