import { eq } from "drizzle-orm";
import { db, schema as s } from "@/db";
const [l] = await db.select().from(s.loads).where(eq(s.loads.id, "df72c3d8-ce0c-4978-ac10-6182ee096f86"));
console.log(l.runId);
process.exit(0);
