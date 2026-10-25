// Real model-call numbers from the LIVE database, for the architecture page.
import { sql } from "drizzle-orm";
import { db } from "@/db";
const per = await db.execute(sql`
  select load_id, count(*)::int calls, sum(input_tokens)::int input, sum(output_tokens)::int output,
         extract(epoch from max(created_at) - min(created_at))::int span_s
  from ai_calls where agent <> 'chat' and agent <> 'inspect' and load_id is not null
  group by load_id order by min(created_at) desc limit 8`);
console.log("negotiations:", JSON.stringify(per));
const by = await db.execute(sql`select agent, count(*)::int n, avg(input_tokens)::int avg_in, avg(output_tokens)::int avg_out, avg(ms)::int avg_ms from ai_calls group by agent order by n desc`);
console.log("by agent:", JSON.stringify(by));
const ev = await db.execute(sql`select type, count(*)::int n, sum(case when verified then 1 else 0 end)::int verified from paypal_events group by type`);
console.log("events:", JSON.stringify(ev));
process.exit(0);
