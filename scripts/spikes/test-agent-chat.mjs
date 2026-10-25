// "Ask your agent", end to end with real model calls: questions, memory, an action, a filed attachment.
import { chromium } from "/home/momoh_mustapha/projects/lifeline/node_modules/playwright-core/index.mjs";
const [out, pdf] = process.argv.slice(2);
const BASE = process.env.BASE ?? "http://localhost:3300";
const b = await chromium.launch({ executablePath: process.env.HOME + "/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome" });
const p = await (await b.newContext({ viewport: { width: 1440, height: 950 } })).newPage();
const errors = [];
p.on("pageerror", (e) => errors.push(e.message));
const t0 = Date.now();
const log = (m) => console.log(`${((Date.now() - t0) / 1000).toFixed(0)}s ${m}`);
await p.goto(`${BASE}/today`, { waitUntil: "networkidle" });
await p.click("aside button:has-text('Ask your agent')");
await p.waitForSelector("text=Your agent", { timeout: 10000 });

async function ask(text, file) {
  const before = await p.locator("[role=dialog] ol[aria-live] > li").count();
  if (file) await p.setInputFiles("[role=dialog] input[type=file]", file);
  await p.fill("[role=dialog] input[aria-label='Message your agent']", text);
  await p.click("[role=dialog] button[aria-label='Send']");
  await p.waitForSelector("text=Your agent is looking…", { timeout: 10000 });
  await p.waitForSelector("text=Your agent is looking…", { state: "detached", timeout: 120000 });
  // Wait for the stored reply to arrive: the list grows by the question and the answer.
  await p.waitForFunction((n) => document.querySelectorAll("[role=dialog] ol[aria-live] > li").length >= n + 2 - (n === 1 ? 1 : 0), before, { timeout: 30000 }).catch(() => {});
  await p.waitForTimeout(600);
  const last = await p.locator("[role=dialog] ol[aria-live] > li").last().innerText();
  log(`Q: ${text}\n   A: ${last.replace(/\s+/g, " ").slice(0, 330)}`);
  return last;
}

await ask("What did we do last?");
await ask("Remember: Bargain Fresh pays late, so only sell to them if nobody else will.");
const mem = await p.locator("text=/What I remember \\(\\d+\\)/").innerText().catch(() => "none");
log(`memory: ${mem}`);
await ask("Which load needs me most right now?");
await ask("Please file this inspection notice to Truck 14's load.", pdf);
await ask("Find a buyer for Truck 14.");
await p.screenshot({ path: `${out}/agent-chat-1.png` });
// Let the negotiation finish, then ask about it.
await p.keyboard.press("Escape");
await p.click("main a:has-text('Truck 14')");
await p.waitForURL(/loads\//);
const files = await p.locator("a[href^='/api/files/']").allInnerTexts();
log(`Truck 14 files: ${files.map((f) => f.replace(/\s+/g, " ")).join(" | ")}`);
await p.waitForSelector("text=Approve and hold payment", { timeout: 240000 });
log("deal ready: " + (await p.textContent("text=/16 pallets ·/")));
await p.click("aside button:has-text('Ask your agent')");
await ask("What deal did you get on Truck 14, and did you avoid Bargain Fresh?");
await p.screenshot({ path: `${out}/agent-chat-2.png` });
console.log(errors.length ? "PAGE ERRORS " + JSON.stringify(errors.slice(0, 3)) : "no page errors");
await b.close();
