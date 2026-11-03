// Load chat keeps unused suggestions; mic shows in the load chat and the agent panel. Usage: node … (local server)
import { chromium } from "/home/momoh_mustapha/projects/lifeline/node_modules/playwright-core/index.mjs";
const BASE = process.env.BASE ?? "http://localhost:3100";
const b = await chromium.launch({ executablePath: `${process.env.HOME}/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome` });
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
await ctx.addInitScript(() => { class F { start() {} stop() { setTimeout(() => this.onend?.(), 10); } } Object.defineProperty(window, "webkitSpeechRecognition", { value: F, configurable: true }); });
const p = await ctx.newPage();
const ok = (c, m) => console.log(c ? "PASS" : "FAIL", m);
await p.goto(BASE); await p.getByRole("link", { name: /See it live/i }).first().click();
await p.waitForURL(/\/today/, { timeout: 60_000 }); await p.waitForLoadState("networkidle");
const loads = [...new Set(await p.locator('a[href^="/loads/"]').evaluateAll((as) => as.map((a) => a.getAttribute("href"))))];
let load = null;
for (const l of loads) { await p.goto(BASE + l); await p.waitForLoadState("networkidle"); await p.waitForTimeout(600); if (await p.getByRole("button", { name: /Raise my floor|Why did/ }).count()) { load = l; break; } }
console.log("loads tried:", loads.length);
const chips = await p.getByRole("button", { name: /Why did|Don.t sell|Raise my floor/ }).allInnerTexts();
console.log("load", load, "suggestions:", chips.length);
ok((await p.getByRole("button", { name: "Voice typing" }).count()) >= 1, "mic in the load chat");
await b.close();
