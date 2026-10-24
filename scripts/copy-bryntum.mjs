// Bryntum's prebuilt bundle is served as a static file instead of going through the bundler:
// bundling it took Turbopack past 6 GB of memory. Copies the files the app loads into public/bryntum.
import { cpSync, mkdirSync } from "node:fs";

const from = "node_modules/@bryntum/scheduler";
const to = "public/bryntum";
mkdirSync(to, { recursive: true });
for (const f of ["scheduler.module.js", "scheduler.css", "svalbard-light.css"]) cpSync(`${from}/${f}`, `${to}/${f}`);
cpSync(`${from}/fontawesome`, `${to}/fontawesome`, { recursive: true });
