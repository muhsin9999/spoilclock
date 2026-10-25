// Starts a negotiation and logs what the page shows every 5 s, without reloading.
import { chromium } from "/home/momoh_mustapha/projects/lifeline/node_modules/playwright-core/index.mjs";
const b = await chromium.launch({ executablePath: process.env.HOME + "/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome" });
const p = await b.newPage({ viewport: { width: 1440, height: 1000 } });
p.on("console", (m) => ["error", "warning"].includes(m.type()) && console.log("console", m.type(), m.text().slice(0, 200)));
p.on("pageerror", (e) => console.log("pageerror", e.message.slice(0, 200)));
const refreshes = [];
p.on("request", (r) => r.headers()["rsc"] && r.url().includes("/loads/") && refreshes.push(Date.now()));
await p.goto("http://localhost:3300/today", { waitUntil: "networkidle" });
await p.click("text=Open"); await p.waitForURL(/loads/); await p.waitForLoadState("networkidle");
await p.click("button:has-text('Find a buyer')");
const t0 = Date.now();
for (let i = 0; i < 1; i++) {
  await p.waitForTimeout(5000);
  const rounds = await p.locator("text=/^\\d+ rounds?/").first().textContent({ timeout: 500 }).catch(() => "-");
  const deal = await p.isVisible("text=Approve and hold payment");
  console.log(`${Math.round((Date.now() - t0) / 1000)}s rounds=${rounds} deal=${deal} loadRefreshes=${refreshes.length}`);
  if (deal) break;
}
await p.screenshot({ path: process.argv[2] + "/flow-4-deal.png", fullPage: true });
await b.close();
