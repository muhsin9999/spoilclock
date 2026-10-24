import type { Buyer, BuyerOutcome, Offer } from "@/lib/demo-load";
import { cn } from "@/lib/utils";

/** The buyer agents on the other side: who they are, their best offer, and why they're in or out. */
export function Buyers({ buyers, offers, outcomes }: { buyers: Buyer[]; offers: Offer[]; outcomes: BuyerOutcome[] }) {
  return (
    <ul className="divide-y divide-line">
      {buyers.map((b) => {
        const best = Math.max(...offers.filter((o) => o.by === b.id).map((o) => o.perPallet));
        const out = outcomes.find((o) => o.buyerId === b.id);
        return (
          <li key={b.id} className="flex items-center gap-4 py-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-full font-heading text-sm text-card-soft" style={{ background: b.color }} aria-hidden>
              {b.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-2">
                <span className="font-medium">{b.name}</span>
                <span className="truncate text-xs text-ink-muted">Buyer agent · {b.kind}</span>
              </div>
              <div className={cn("truncate text-sm", out?.status === "deal" ? "text-forest" : "text-ink-muted")}>{out?.note}</div>
            </div>
            <div className="text-right">
              <div className={cn("font-heading text-lg tabular-nums", out?.status !== "deal" && "text-ink-muted")}>${best}</div>
              <div className="text-xs text-ink-muted">best a pallet</div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
