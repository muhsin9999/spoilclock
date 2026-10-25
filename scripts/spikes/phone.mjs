// Phone screenshots of every app page (390×844), including the visitor's open load.
import { chromium } from "/home/momoh_mustapha/projects/lifeline/node_modules/playwright-core/index.mjs";
const out = process.argv[2];
const BASE = process.env.BASE ?? "http://localhost:3300";
const b = await chromium.launch({ executablePath: process.env.HOME + "/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome" });
const p = await (await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 })).newPage();
for (const path of ["/today", "LOAD", "/loads", "/buyers", "/money", "/rules"]) {
  if (path === "LOAD") {
    await p.goto(`${BASE}/today`, { waitUntil: "networkidle" });
    await p.click("main a:has-text('Truck 14')");
    await p.waitForURL(/loads\//);
  } else await p.goto(BASE + path, { waitUntil: "networkidle" });
  await p.waitForTimeout(1200);
  const w = await p.evaluate(() => document.documentElement.scrollWidth);
  const name = path === "LOAD" ? "load" : path.slice(1);
  await p.screenshot({ path: `${out}/phone-${name}.png`, fullPage: true });
  console.log(`${name}: page width ${w}px ${w > 390 ? "OVERFLOWS" : "ok"}`);
}
await b.close();
