// The paperwork that comes with a rejected load: the receiver's inspection report and the truck's temperature
// log. For the demo farm these are generated samples, marked "sample" wherever they're shown.

type Load = { truckName: string; crop: string; pallets: number; grade: string; softPct: number; pulpF: number; rejectedBy: string; reason: string; rejectedAt: Date; shelfHours: number };

const fmt = (d: Date) => d.toLocaleString("en-US", { timeZone: "America/Los_Angeles", dateStyle: "medium", timeStyle: "short" });

export function inspectionReport(l: Load) {
  return [
    "RECEIVING INSPECTION REPORT (SAMPLE)",
    `Receiver: ${l.rejectedBy}`,
    `Inspected: ${fmt(l.rejectedAt)} (Pacific)`,
    "Shipper: Salinas Ridge Farms, Salinas, CA",
    `Carrier unit: ${l.truckName} (reefer)`,
    "",
    `Commodity: ${l.crop}`,
    `Quantity: ${l.pallets} pallets`,
    `Grade observed: ${l.grade}`,
    `Pulp temperature: ${l.pulpF}°F (average of 6 samples)`,
    "",
    "Defects (average of 6 samples):",
    `  Soft, bruised or damaged: ${l.softPct}%`,
    "  Decay: 0.5%",
    "",
    `Decision: REJECTED. Reason: ${l.reason.toLowerCase()}.`,
    "Condition: sound. No decay above tolerance. Suitable for processing or discount retail if sold promptly.",
    `Inspector note: keep cold; expected sellable life about ${l.shelfHours} hours from inspection.`,
  ].join("\n");
}

/** A temperature reading every 30 minutes from loading to the rejection. */
export function tempLog(l: Load, from: Date) {
  const rows = ["time_pacific,air_f,pulp_f"];
  const step = 30 * 60_000;
  for (let t = from.getTime(), i = 0; t <= l.rejectedAt.getTime(); t += step, i++) {
    const air = l.pulpF - 3 + ((i * 7) % 5) * 0.4;
    const pulp = Math.min(l.pulpF, l.pulpF - 3 + i * 0.35);
    rows.push(`${new Date(t).toLocaleTimeString("en-US", { timeZone: "America/Los_Angeles", hour: "numeric", minute: "2-digit" })},${air.toFixed(1)},${pulp.toFixed(1)}`);
  }
  return rows.join("\n");
}
