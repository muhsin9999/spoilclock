// /architecture: as it opens, after playing to step 10 with the safety lens on, the other tabs, and on a phone.
import { chromium } from "/home/momoh_mustapha/projects/lifeline/node_modules/playwright-core/index.mjs";
const out = process.argv[2];
const BASE = process.env.BASE ?? "http://localhost:3300";
const b = await chromium.launch({ executablePath: process.env.HOME + "/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome" });
const p = await b.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
p.on("pageerror", (e) => errors.push(e.message));
await p.goto(`${BASE}/architecture`, { waitUntil: "networkidle" });
await p.screenshot({ path: `${out}/arch-1-open.png`, fullPage: true });
for (let i = 0; i < 9; i++) await p.click("button[aria-label='Next step']");
await p.click("button:has-text('Show the safety steps')");
await p.waitForTimeout(900);
await p.screenshot({ path: `${out}/arch-2-step10-safety.png`, fullPage: true });
for (const t of ["What the AI can't do", "Decisions", "The parts"]) {
  await p.click(`[role=tab]:has-text("${t}")`);
  await p.waitForTimeout(300);
  await p.screenshot({ path: `${out}/arch-tab-${t.replace(/\W+/g, "-")}.png`, fullPage: true });
}
const ph = await (await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true })).newPage();
await ph.goto(`${BASE}/architecture`, { waitUntil: "networkidle" });
const w = await ph.evaluate(() => document.documentElement.scrollWidth);
await ph.screenshot({ path: `${out}/arch-phone.png`, fullPage: true });
console.log("phone width", w, errors.length ? "ERRORS " + JSON.stringify(errors) : "no page errors");
await b.close();
