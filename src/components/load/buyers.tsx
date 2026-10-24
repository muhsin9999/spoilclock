import type { Buyer } from "@/lib/buyers";
import { cn } from "@/lib/utils";

type Props = {
  buyers: Buyer[];
  offers: { by: string; perPalletCents: number }[];
  states: { buyerId: string; status: string; note: string }[];
  live: boolean;
};

/** The buyer agents on the other side: who they are, their best offer, and why they're in or out. */
export function Buyers({ buyers, offers, states, live }: Props) {
  return (
    <ul className="divide-y divide-line">
      {buyers.map((b) => {
        const bids = offers.filter((o) => o.by === b.id).map((o) => o.perPalletCents);
        const best = bids.length ? Math.max(...bids) / 100 : null;
        const st = states.find((x) => x.buyerId === b.id);
        const deal = st?.status === "deal";
        const note = st?.note || (live ? "Talking…" : "Waiting for your agent");
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
              <div className={cn("truncate text-sm", deal ? "text-forest" : "text-ink-muted", live && !st?.note && "shimmer-text")}>{note}</div>
            </div>
            {best !== null && (
              <div className="text-right">
                <div className={cn("font-heading text-lg tabular-nums", !deal && "text-ink-muted")}>${best}</div>
                <div className="text-xs text-ink-muted">best a pallet</div>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
