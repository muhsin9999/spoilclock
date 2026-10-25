// node scripts/spikes/shots.mjs <outDir> <path>[@WxH] ...  (server on :3300)
import { chromium } from "/home/momoh_mustapha/projects/lifeline/node_modules/playwright-core/index.mjs";
const [out, ...paths] = process.argv.slice(2);
const b = await chromium.launch({ executablePath: process.env.HOME + "/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome" });
for (const spec of paths) {
  const [path, size = "1440x900"] = spec.split("@");
  const [width, height] = size.split("x").map(Number);
  const p = await b.newPage({ viewport: { width, height } });
  const errors = [];
  p.on("pageerror", (e) => errors.push(e.message));
  p.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  await p.goto(`http://localhost:3300${path}`, { waitUntil: "networkidle" });
  await p.waitForTimeout(1500);
  // scroll through so in-view animations play before the full-page shot
  for (let y = 0; y < (await p.evaluate(() => document.body.scrollHeight)); y += 400) { await p.evaluate((v) => window.scrollTo(0, v), y); await p.waitForTimeout(900); }
  await p.waitForTimeout(7000); await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(500);
  const name = `${out}/${(path.replace(/\W+/g, "-").replace(/^-|-$/g, "") || "home")}-${width}.png`;
  await p.screenshot({ path: name, fullPage: true });
  console.log(name, errors.length ? JSON.stringify(errors.slice(0, 4)) : "no errors");
  await p.close();
}
await b.close();
