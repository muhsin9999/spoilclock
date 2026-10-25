// Holds the mouse still over a map card and samples what the page shows every 50 ms, to catch hover flicker.
import { chromium } from "/home/momoh_mustapha/projects/lifeline/node_modules/playwright-core/index.mjs";
const url = process.argv[2];
const b = await chromium.launch({ executablePath: process.env.HOME + "/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome" });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto(url, { waitUntil: "networkidle" });
await p.waitForTimeout(1500);
const card = p.locator(".react-flow__node-arch button").nth(Number(process.argv[3] ?? 6));
const box = await card.boundingBox();
await p.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 5 });
const samples = [];
for (let i = 0; i < 40; i++) {
  samples.push(
    await p.evaluate(() => {
      const dims = [...document.querySelectorAll(".react-flow__node-arch button")].filter((e) => getComputedStyle(e).opacity < 0.5).length;
      const nodes = document.querySelectorAll(".react-flow__node").length;
      const t = document.querySelector(".react-flow__viewport")?.getAttribute("style") ?? "";
      return `${dims}dim/${nodes}nodes ${t.match(/translate\([^)]*\)/)?.[0] ?? ""}`;
    }),
  );
  await p.waitForTimeout(50);
}
const changes = samples.filter((s, i) => i && s !== samples[i - 1]).length;
console.log(`card ${await card.innerText().then((t) => t.split("\n")[0])}: ${changes} changes in 2 s`);
console.log([...new Set(samples)].slice(0, 6).join("\n"));
await b.close();
