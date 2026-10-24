// Reopens a load page in the same visitor's cookie jar and checks what it shows, then tests router.refresh.
import { chromium } from "/home/momoh_mustapha/projects/lifeline/node_modules/playwright-core/index.mjs";
const [out, path] = process.argv.slice(2);
const b = await chromium.launch({ executablePath: process.env.HOME + "/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome" });
const ctx = await b.newContext({ viewport: { width: 1440, height: 1000 } });
const p = await ctx.newPage();
const rsc = [];
p.on("request", (r) => r.headers()["rsc"] && rsc.push(r.url()));
await p.goto("http://localhost:3300/today", { waitUntil: "networkidle" });
console.log("cookie", (await ctx.cookies()).map((c) => c.name).join(","));
await p.click("text=Open"); await p.waitForURL(/loads/); await p.waitForTimeout(1000);
console.log("fresh run shows Find a buyer:", await p.isVisible("button:has-text('Find a buyer')"));
await p.click("button:has-text('Find a buyer')");
await p.waitForTimeout(12000);
console.log("rsc requests during 12 s:", rsc.length, rsc.slice(-2));
console.log("chat has agent text:", await p.isVisible("text=/FreshMart rejected|cosmetic/i"));
await p.reload({ waitUntil: "networkidle" }); await p.waitForTimeout(500);
console.log("after reload, chat has agent text:", await p.isVisible("text=/FreshMart rejected|cosmetic/i"), "offers:", await p.isVisible("text=Round 1"));
await b.close();
