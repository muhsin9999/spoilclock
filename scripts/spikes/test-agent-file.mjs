// The mismatch case on its own: a Truck 08 lettuce notice must not be filed to Truck 14's strawberries.
import { chromium } from "/home/momoh_mustapha/projects/lifeline/node_modules/playwright-core/index.mjs";
const [pdf] = process.argv.slice(2);
const BASE = process.env.BASE ?? "http://localhost:3300";
const b = await chromium.launch({ executablePath: process.env.HOME + "/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome" });
for (let run = 1; run <= 3; run++) {
  const p = await (await b.newContext({ viewport: { width: 1440, height: 950 } })).newPage();
  await p.goto(`${BASE}/today`, { waitUntil: "networkidle" });
  await p.click("aside button:has-text('Ask your agent')");
  await p.setInputFiles("[role=dialog] input[type=file]", pdf);
  await p.fill("[role=dialog] input[aria-label='Message your agent']", "File this to Truck 14's load.");
  await p.click("[role=dialog] button[aria-label='Send']");
  await p.waitForSelector("text=Your agent is looking…", { state: "detached", timeout: 120000 });
  await p.waitForFunction(() => document.querySelectorAll("[role=dialog] ol[aria-live] > li").length >= 2, null, { timeout: 30000 });
  await p.waitForTimeout(600);
  const a = (await p.locator("[role=dialog] ol[aria-live] > li").last().innerText()).replace(/\s+/g, " ");
  console.log(`run ${run}: ${/Filed .* to Truck 14/.test(a) ? "FILED (wrong)" : "refused (right)"} — ${a.slice(0, 200)}`);
  await p.context().close();
}
await b.close();
