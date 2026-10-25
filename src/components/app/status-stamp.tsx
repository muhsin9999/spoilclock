import { Stamp } from "@/components/brand/stamp";

const LABEL: Record<string, [string, "forest" | "spoiling"]> = {
  rejected: ["Rejected", "spoiling"],
  reopened: ["Rejected", "spoiling"],
  no_deal: ["No deal", "spoiling"],
  negotiating: ["Negotiating", "forest"],
  deal_ready: ["Deal ready", "forest"],
  held: ["Held", "forest"],
  captured: ["Paid", "forest"],
  partial: ["Part paid", "forest"],
  voided: ["Voided", "spoiling"],
  spoiled: ["Spoiled", "spoiling"],
};

/** A load's state as a small ink stamp. */
export function StatusStamp({ status }: { status: string }) {
  const [label, tone] = LABEL[status] ?? [status, "forest"];
  return (
    <Stamp tone={tone} className="-rotate-3 px-2 py-0.5 text-[0.7rem]">
      {label}
    </Stamp>
  );
}
