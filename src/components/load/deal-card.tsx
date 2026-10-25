import { AgentCrate } from "@/components/brand/agent-crate";
import { ApproveButton } from "./approve-button";

const usd = (n: number) => `$${n.toLocaleString("en-US")}`;

type Props = {
  loadId: string;
  card?: string;
  buyer: string;
  pallets: number;
  perPallet: number;
  floor: number;
  originalPerPallet: number;
  originalBuyer: string;
  arriveBy: string;
  marginBeforeSpoil: string;
};

/** The deal with its maths spelled out, and the one approval that makes PayPal hold the money. */
export function DealCard(p: Props) {
  const total = p.pallets * p.perPallet;
  const aboveFloor = total - p.pallets * p.floor;
  const share = Math.round((p.perPallet / p.originalPerPallet) * 100);
  return (
    <div className="rounded-xl border border-line bg-card-soft p-5">
      <div className="flex items-start gap-4">
        <AgentCrate mood="happy" className="mt-1 w-16 shrink-0" />
        <div className="min-w-0 flex-1">
          <span className="rounded-md bg-wheat px-2 py-0.5 text-xs font-medium text-forest-deep">Deal ready</span>
          <div className="mt-1.5 font-heading text-2xl tabular-nums">
            {p.pallets} pallets · {usd(total)}
          </div>
          <div className="text-ink-muted">
            {p.buyer} · unloaded by {p.arriveBy}, {p.marginBeforeSpoil} before it spoils
          </div>
        </div>
      </div>
      <dl className="mt-4 grid grid-cols-3 gap-3 border-t border-line pt-4 text-sm">
        <div>
          <dt className="text-ink-muted">Price</dt>
          <dd className="tabular-nums">{p.pallets} × {usd(p.perPallet)}</dd>
        </div>
        <div>
          <dt className="text-ink-muted">Above your floor</dt>
          <dd className="tabular-nums text-forest">+{usd(aboveFloor)}</dd>
        </div>
        <div>
          <dt className="text-ink-muted">Of {p.originalBuyer}&apos;s price</dt>
          <dd className="tabular-nums">{share}%</dd>
        </div>
      </dl>
      <ApproveButton loadId={p.loadId} />
      <p className="mt-2 text-center text-xs text-ink-muted">
        PayPal holds {usd(total)} on {p.buyer}&apos;s {p.card ?? "card"}. Nothing is charged until the new dock accepts the load.
      </p>
    </div>
  );
}
