// Opens pages on :3300 and prints full browser errors (use with dev-run.sh for readable messages).
import { chromium } from "/home/momoh_mustapha/projects/lifeline/node_modules/playwright-core/index.mjs";
const b = await chromium.launch({ executablePath: process.env.HOME + "/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome" });
const p = await b.newPage();
p.on("pageerror", (e) => console.log("pageerror", e.message.slice(0, 600)));
p.on("console", (m) => m.type() === "error" && console.log("console", m.text().slice(0, 600)));
p.on("requestfinished", async (rq) => { const r = await rq.response(); if (r && r.status() >= 400) console.log(r.status(), rq.url()); });
p.on("requestfailed", (rq) => console.log("failed", rq.url(), rq.failure()?.errorText));
for (const path of process.argv.slice(2)) { console.log("==", path); await p.goto(`http://localhost:3300${path}`, { waitUntil: "networkidle" }); await p.waitForTimeout(1500); }
await b.close();
