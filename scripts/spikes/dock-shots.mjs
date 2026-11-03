// The dock page at phone size: the three actions, then each confirm card (never confirmed). Usage: node … <outdir> <dockKey>
import { chromium } from "/home/momoh_mustapha/projects/lifeline/node_modules/playwright-core/index.mjs";
const [out, key] = process.argv.slice(2);
const BASE = process.env.BASE ?? "http://localhost:3100";
const b = await chromium.launch({ executablePath: `${process.env.HOME}/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome` });
const p = await (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })).newPage();
let dialogs = 0;
p.on("dialog", (d) => { dialogs++; d.dismiss(); });
await p.goto(`${BASE}/dock/${key}`); await p.waitForLoadState("networkidle"); await p.waitForTimeout(800);
const actions = p.getByRole("button", { name: /Accept all/ });
await actions.scrollIntoViewIfNeeded();
await p.screenshot({ path: `${out}/dock-1-actions.png` });
for (const [name, file] of [[/Some pallets short/, "dock-2-confirm-short.png"], [/Accept all/, "dock-3-confirm-accept.png"], [/Reject load/, "dock-4-confirm-reject.png"]]) {
  await p.getByRole("button", { name }).click(); await p.waitForTimeout(300);
  await p.getByRole("alertdialog").scrollIntoViewIfNeeded();
  await p.screenshot({ path: `${out}/${file}` });
  await p.getByRole("button", { name: "Go back" }).click(); await p.waitForTimeout(200);
}
console.log(dialogs === 0 ? "PASS no browser pop-up" : `FAIL ${dialogs} browser pop-ups`);
await b.close();
