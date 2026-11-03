// Chat history in "Ask your agent": two conversations, switch, survive a reload. node … <out-dir> (local :3300)
import { chromium } from "/home/momoh_mustapha/projects/lifeline/node_modules/playwright-core/index.mjs";
const [out] = process.argv.slice(2);
const BASE = process.env.BASE ?? "http://localhost:3300";
const b = await chromium.launch({ executablePath: process.env.HOME + "/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome" });
const p = await (await b.newContext({ viewport: { width: 1440, height: 950 }, deviceScaleFactor: 2 })).newPage();
const ok = (c, m) => console.log(c ? "PASS" : "FAIL", m);
const d = p.locator("[role=dialog]");
const openPanel = async () => { await p.click("aside button:has-text('Ask your agent')"); await p.waitForSelector("text=Your agent", { timeout: 10000 }); };
const ask = async (q) => {
  await d.locator("input[aria-label='Message your agent']").fill(q); await d.locator("button[aria-label='Send']").click();
  await p.getByText("Your agent is looking…").waitFor({ state: "detached", timeout: 90_000 });
  await p.waitForFunction(() => document.querySelectorAll("[role=dialog] ol[aria-live] > li").length >= 2, null, { timeout: 30_000 }); await p.waitForTimeout(500);
};
await p.goto(`${BASE}/today`, { waitUntil: "networkidle" }); await openPanel();
await ask("Which buyer paid fastest this week?");
await d.getByRole("button", { name: "New chat" }).click(); await p.waitForTimeout(300);
ok(!(await d.getByText("Which buyer paid fastest this week?").count()), "New chat opens an empty conversation");
await ask("What's spoiling soonest?");
await d.getByRole("button", { name: "Past conversations" }).click(); await p.waitForTimeout(400);
const items = await d.locator('section[aria-label="Past conversations"] li').allInnerTexts();
ok(items.length >= 2 && items[0].startsWith("What's spoiling soonest?"), `History lists: ${items.map((t) => t.split("\n")[0]).join(" | ")}`);
await p.screenshot({ path: `${out}/spoilclock-history.png` });
await d.getByRole("button", { name: /Which buyer paid fastest/ }).click(); await p.waitForTimeout(400);
ok((await d.getByText("Which buyer paid fastest this week?").count()) === 1 && !(await d.getByText("What's spoiling soonest?").count()), "picking it shows that conversation only");
await p.reload({ waitUntil: "networkidle" }); await openPanel();
await d.getByRole("button", { name: "Past conversations" }).click(); await p.waitForTimeout(400);
ok((await d.locator('section[aria-label="Past conversations"] li').count()) >= 2, "history survives a reload");
await b.close();
