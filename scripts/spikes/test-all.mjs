// Clicks through every action a visitor can take, with real agents and real PayPal sandbox calls.
// BASE=http://localhost:3300 node scripts/spikes/test-all.mjs <outDir> <pdf>
import { chromium } from "/home/momoh_mustapha/projects/lifeline/node_modules/playwright-core/index.mjs";

const [out, pdf] = process.argv.slice(2);
const BASE = process.env.BASE ?? "http://localhost:3300";
const b = await chromium.launch({ executablePath: process.env.HOME + "/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome" });
const ctx = await b.newContext({ viewport: { width: 1440, height: 1000 } });
const p = await ctx.newPage();
const errors = [];
p.on("pageerror", (e) => errors.push(e.message));
p.on("dialog", (d) => d.accept());
const t0 = Date.now();
const results = [];
const check = (name, ok, detail = "") => {
  results.push([name, ok]);
  console.log(`${ok ? "PASS" : "FAIL"} ${((Date.now() - t0) / 1000).toFixed(0)}s ${name}${detail ? " — " + detail : ""}`);
};
const shot = (n) => p.screenshot({ path: `${out}/test-${n}.png`, fullPage: true });
const step = async (name, fn) => {
  try {
    await fn();
  } catch (e) {
    check(name, false, e.message.split("\n")[0].slice(0, 200));
    await shot(`fail-${name.replace(/\W+/g, "-")}`).catch(() => {});
  }
};

// The dock check, on a phone.
async function dock(href, action) {
  const phone = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const d = await phone.newPage();
  d.on("dialog", (x) => x.accept());
  await d.goto(BASE + href, { waitUntil: "load" }); await p.waitForTimeout(2500);
  await d.click(action);
  await d.waitForSelector("text=/Accepted · paid|Part accepted · paid|Rejected · hold released/", { timeout: 60000 });
  await d.screenshot({ path: `${out}/test-dock-${action.replace(/\W+/g, "")}.png`, fullPage: true });
  await phone.close();
}

async function negotiateAndApprove() {
  await p.click("button:has-text('Find a buyer'), button:has-text('Try again')");
  await p.waitForSelector("text=Approve and hold payment", { timeout: 240000 });
  await p.click("button:has-text('Approve and hold payment')");
  await p.waitForSelector("text=Open the dock check", { timeout: 60000 });
  return p.getAttribute("text=Open the dock check", "href");
}

await p.goto(`${BASE}/today`, { waitUntil: "load" }); await p.waitForTimeout(2500);
await p.waitForSelector(".b-sch-event");

await step("report a rejection with an uploaded PDF", async () => {
  await p.click(".b-sch-event:has-text('Sunbelt Markets')");
  await p.waitForSelector("text=Report rejection and open a rescue");
  await p.setInputFiles("input[type=file]", pdf);
  await p.waitForSelector("text=/Read by the AI/", { timeout: 60000 });
  const reason = await p.inputValue("input[name=reason]");
  const temp = await p.inputValue("input[name=pulpF]");
  const soft = await p.inputValue("input[name=softPct]");
  check("AI read the notice", /tip burn/i.test(reason) && Number(temp) >= 36 && Number(temp) <= 39 && soft === "9", `reason "${reason}", ${soft}% soft, ${temp}°F (notice said 3 °C)`);
  await p.click("button:has-text('Report rejection and open a rescue')");
  await p.waitForURL(/\/loads\//, { timeout: 30000 });
  await p.waitForSelector("text=Truck 08: rejected load");
  check("rescue opened for Truck 08", true, p.url());
});

await step("chat answers a question", async () => {
  await p.fill("input[aria-label='Message your agent']", "Why did Sunbelt reject the load, and is it still sellable?");
  await p.click("button[aria-label='Send']");
  await p.waitForSelector("text=Your agent is thinking…", { state: "detached", timeout: 60000 });
  await p.waitForTimeout(1500);
  const last = await p.locator("ol[aria-live] li p").last().textContent();
  check("chat answered", !!last && last.length > 20, last?.slice(0, 140));
});

await step("edit the floor", async () => {
  await p.click("button[aria-label='Change your floor']");
  await p.fill("input[aria-label='Floor per pallet in dollars']", "140");
  await p.click("button:has-text('Save')");
  await p.waitForSelector("text=/Floor changed · \\$\\d+ → \\$140 a pallet/", { timeout: 20000 });
  check("floor changed and noted in chat", true);
});

await step("negotiate, approve, dock accepts all", async () => {
  const href = await negotiateAndApprove();
  check("deal approved, PayPal holding", true, href);
  await shot("held");
  await dock(href, "button:has-text('Accept all')");
  await p.reload({ waitUntil: "load" }); await p.waitForTimeout(2500);
  await p.waitForSelector("text=/Captured \\$/", { timeout: 30000 });
  check("full capture shown on the load", true);
  await shot("paid");
});

await step("strawberries: dock rejects, PayPal voids, agent tries again", async () => {
  await p.goto(`${BASE}/today`, { waitUntil: "load" }); await p.waitForTimeout(2500);
  await p.click("a:has-text('Truck 14')");
  await p.waitForURL(/\/loads\//);
  const href = await negotiateAndApprove();
  await dock(href, "button:has-text('Reject load')");
  await p.reload({ waitUntil: "load" }); await p.waitForTimeout(2500);
  await p.waitForSelector("text=/Rejected at the dock · hold released/", { timeout: 30000 });
  check("void shown on the load", true);
  const tryAgain = await p.isVisible("button:has-text('Try again')");
  check("agent can try the other buyers", tryAgain);
  await shot("voided");
});

await step("rules: floor share and block a buyer", async () => {
  await p.goto(`${BASE}/rules`, { waitUntil: "load" }); await p.waitForTimeout(2500);
  await p.locator("input[name=floorShare]").fill("80");
  await p.click("button:has-text('Save floor')");
  await p.waitForSelector("text=Saved. New rejections use this floor.", { timeout: 15000 });
  await p.click("button[aria-label='Sell to Bargain Fresh']");
  await p.waitForSelector("text=/won't sell to Bargain Fresh/", { timeout: 15000 });
  check("rules saved", true);
});

await step("start a new day keeps history", async () => {
  await p.goto(`${BASE}/today`, { waitUntil: "load" }); await p.waitForTimeout(2500);
  await p.click("button:has-text('Start a new day')");
  await p.waitForSelector("text=/day 2/", { timeout: 30000 });
  await p.waitForSelector("text=Truck 31", { timeout: 10000 });
  check("day 2 started", true);
  await shot("day2");
});

await step("loads and money show what happened", async () => {
  await p.goto(`${BASE}/loads`, { waitUntil: "load" }); await p.waitForTimeout(2500);
  const rows = await p.locator("tbody tr").count();
  check("loads lists every load", rows >= 3, `${rows} rows`);
  await shot("loads");
  await p.goto(`${BASE}/money`, { waitUntil: "load" }); await p.waitForTimeout(2500);
  const entries = await p.locator("main ol li").count();
  check("money lists holds, capture and release", entries >= 4, `${entries} entries`);
  await shot("money");
  await p.goto(`${BASE}/buyers`, { waitUntil: "load" }); await p.waitForTimeout(2500);
  await shot("buyers");
});

await step("sandbox panel opens", async () => {
  await p.click("text=Connected to PayPal · Sandbox");
  await p.waitForSelector("text=Buyer agents pay with cards saved in PayPal's Vault");
  check("sandbox panel", true);
});

const failed = results.filter(([, ok]) => !ok).length;
console.log(`\n${results.length - failed}/${results.length} checks passed${errors.length ? ` · page errors: ${JSON.stringify(errors.slice(0, 3))}` : " · no page errors"}`);
await b.close();
