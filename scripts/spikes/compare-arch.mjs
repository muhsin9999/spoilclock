// Screenshots the three apps' live architecture pages at the same size, for comparison.
import { chromium } from "/home/momoh_mustapha/projects/lifeline/node_modules/playwright-core/index.mjs";
const out = process.argv[2];
const b = await chromium.launch({ executablePath: process.env.HOME + "/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome" });
for (const [name, url] of [["lifeline", "https://lifeline-giving.vercel.app/architecture"], ["cleared", "https://cleared-web.onrender.com/architecture"], ["spoilclock", "https://spoilclock-app.vercel.app/architecture"]]) {
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  try {
    await p.goto(url, { waitUntil: "networkidle", timeout: 90000 });
    await p.waitForTimeout(2500);
    await p.screenshot({ path: `${out}/compare-${name}.png` });
    console.log(name, "ok");
  } catch (e) { console.log(name, "failed", e.message.split("\n")[0]); }
  await p.close();
}
await b.close();
