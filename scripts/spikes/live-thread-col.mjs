// Read-only: does the live farm_messages table have the thread column.
import "../../src/lib/net.ts";
import postgres from "postgres";
const sql = postgres(process.env.DATABASE_URL_PROD, { max: 1, prepare: false });
console.log(await sql`select column_name, data_type from information_schema.columns where table_name='farm_messages' and column_name='thread'`);
await sql.end();
