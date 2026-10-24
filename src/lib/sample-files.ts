// The paperwork that comes with the demo load: an inspection report and the truck's temperature log.
// Fictional, like the farm; marked as samples wherever they're shown.

type Load = { crop: string; pallets: number; grade: string; softPct: number; pulpF: number; rejectedBy: string; reason: string; rejectedAt: Date };

const fmt = (d: Date) => d.toLocaleString("en-US", { timeZone: "America/Los_Angeles", dateStyle: "medium", timeStyle: "short" });

export function inspectionReport(l: Load) {
  return [
    "RECEIVING INSPECTION REPORT (SAMPLE)",
    `Receiver: ${l.rejectedBy}`,
    `Inspected: ${fmt(l.rejectedAt)} (Pacific)`,
    "Shipper: Salinas Ridge Farms, Salinas, CA",
    "Carrier unit: Truck 14 (reefer)",
    "",
    `Commodity: ${l.crop}, 8 x 1 lb clamshells per tray`,
    `Quantity: ${l.pallets} pallets (about ${l.pallets * 600} lb)`,
    `Grade observed: ${l.grade}`,
    `Pulp temperature: ${l.pulpF}°F (range 36 to 39°F across 6 samples)`,
    "",
    "Defects (average of 6 samples):",
    `  Soft or bruised berries: ${l.softPct}%`,
    "  Decay (mould): 0.5%",
    "  Misshapen or undersized: 9%",
    "  Off-colour (white shoulders): 4%",
    "",
    `Decision: REJECTED. Reason: ${l.reason.toLowerCase()} (misshapen and off-colour above the receiver's 8% retail limit).`,
    "Condition: sound. No decay above tolerance. Suitable for processing or discount retail if sold promptly.",
    "Inspector note: hold at 32 to 36°F; expected sellable life about 10 hours from inspection.",
  ].join("\n");
}

/** A temperature reading every 30 minutes from loading to the rejection. */
export function tempLog(l: Load, from: Date) {
  const rows = ["time_pacific,air_f,pulp_f"];
  const step = 30 * 60_000;
  for (let t = from.getTime(), i = 0; t <= l.rejectedAt.getTime(); t += step, i++) {
    const air = 34 + ((i * 7) % 5) * 0.4;
    const pulp = Math.min(l.pulpF, 35 + i * 0.35);
    rows.push(`${new Date(t).toLocaleTimeString("en-US", { timeZone: "America/Los_Angeles", hour: "numeric", minute: "2-digit" })},${air.toFixed(1)},${pulp.toFixed(1)}`);
  }
  return rows.join("\n");
}
