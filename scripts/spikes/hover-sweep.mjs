// Sweeps the mouse down a lane of map cards and counts how often the whole map flips between dimmed and not.
import { chromium } from "/home/momoh_mustapha/projects/lifeline/node_modules/playwright-core/index.mjs";
const url = process.argv[2];
const b = await chromium.launch({ executablePath: process.env.HOME + "/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome" });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto(url, { waitUntil: "networkidle" });
await p.waitForTimeout(1500);
// Record every change to how many cards are dimmed (class-level, not the CSS transition).
await p.evaluate(() => {
  window.__flips = [];
  let last = -1;
  const tick = () => {
    const n = [...document.querySelectorAll(".react-flow__node-arch button")].filter((e) => /opacity-30/.test(e.className)).length;
    if (n !== last) window.__flips.push(n), (last = n);
    requestAnimationFrame(tick);
  };
  tick();
});
const cards = p.locator(".react-flow__node-arch button");
const boxes = [];
for (let i = 0; i < (await cards.count()); i++) boxes.push(await cards.nth(i).boundingBox());
const lane = boxes.filter((bx) => Math.abs(bx.x - boxes[6].x) < 5).sort((a, c) => a.y - c.y);
await p.mouse.move(lane[0].x + 100, lane[0].y - 30);
for (const bx of lane) await p.mouse.move(bx.x + 100, bx.y + bx.height + 20, { steps: 12 });
await p.waitForTimeout(800);
const flips = await p.evaluate(() => window.__flips);
console.log(`swept ${lane.length} cards: dim count went ${flips.join(" → ")} (${flips.length - 1} flips)`);
await b.close();
