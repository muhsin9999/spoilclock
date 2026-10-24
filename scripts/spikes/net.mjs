import { chromium } from "/home/momoh_mustapha/projects/lifeline/node_modules/playwright-core/index.mjs";
const b = await chromium.launch({ executablePath: process.env.HOME + "/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome" });
const p = await b.newPage();
p.on("response", (r) => r.status() >= 400 && console.log(r.status(), r.url()));
p.on("pageerror", (e) => console.log("pageerror", e.message));
await p.goto("http://localhost:3300/today", { waitUntil: "networkidle" }); await p.waitForTimeout(2000); await b.close();
