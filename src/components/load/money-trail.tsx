import { headers } from "next/headers";
import QRCode from "qrcode";
import { BadgeCheck, Clock3 } from "lucide-react";
import { Stamp } from "@/components/brand/stamp";
import { buyer as buyerById } from "@/lib/buyers";
import { clock } from "@/lib/time";

const usd = (cents: number) => `$${(cents / 100).toLocaleString("en-US", { maximumFractionDigits: 2 })}`;

type Deal = {
  buyerId: string;
  pallets: number;
  perPalletCents: number;
  status: string;
  dockKey: string;
  paypalOrderId: string | null;
  authorizationId: string | null;
  captureId: string | null;
  capturedCents: number | null;
  approvedAt: Date | null;
  settledAt: Date | null;
};
type Event = { type: string; receivedAt: Date };

/** What happened to the money, step by step, each with PayPal's own id and its signed confirmation. */
export async function MoneyTrail({ deal, events, card }: { deal: Deal; events: Event[]; card?: string }) {
  const b = buyerById(deal.buyerId)!;
  const total = deal.pallets * deal.perPalletCents;
  const h = await headers();
  const dockUrl = `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}/dock/${deal.dockKey}`;
  const qr = await QRCode.toString(dockUrl, { type: "svg", margin: 0, color: { dark: "#1e2a20", light: "#00000000" } });
  const confirmed = (type: string) => events.find((e) => e.type === type);
  const stamp = { held: "Held", settling: "Held", captured: "Paid", partial: "Part paid", voided: "Voided" }[deal.status] ?? "Held";

  return (
    <div className="relative rounded-xl border border-line bg-card-soft p-6">
      <Stamp tone={deal.status === "voided" ? "spoiling" : "forest"} className="absolute -top-3 right-5 text-lg">
        {stamp} {deal.status === "partial" ? usd(deal.capturedCents ?? 0) : usd(total)}
      </Stamp>
      <h3 className="font-heading text-2xl">The money</h3>
      <p className="text-ink-muted">
        {deal.pallets} pallets · {usd(total)} · {b.name}
      </p>
      <ol className="mt-5 space-y-4">
        <Step
          title={`PayPal is holding ${usd(total)}`}
          detail={`On ${b.name}'s ${card ?? "card"} · approved ${deal.approvedAt ? clock(deal.approvedAt.getTime()) : ""} · PayPal ref ${deal.authorizationId}`}
          proof={confirmed("PAYMENT.AUTHORIZATION.CREATED")}
          done
        />
        {deal.status === "held" || deal.status === "settling" ? (
          <li className="flex gap-4 rounded-lg border border-dashed border-forest/40 p-4">
            <div className="size-24 shrink-0 [&>svg]:size-full" dangerouslySetInnerHTML={{ __html: qr }} aria-label="QR code for the dock check" />
            <div className="min-w-0">
              <div className="font-medium">Waiting for {b.name}&apos;s dock</div>
              <p className="text-sm text-ink-muted">Their receiver checks the load and confirms on their phone. Nothing is charged until then.</p>
              <a href={`/dock/${deal.dockKey}`} target="_blank" className="mt-2 inline-block text-sm text-forest underline underline-offset-4">
                Open the dock check
              </a>
            </div>
          </li>
        ) : deal.status === "voided" ? (
          <Step title="Rejected at the dock · hold released" detail={`PayPal released the hold ${deal.settledAt ? `at ${clock(deal.settledAt.getTime())}` : ""} · no money moved`} proof={confirmed("PAYMENT.AUTHORIZATION.VOIDED")} done />
        ) : (
          <Step
            title={deal.status === "partial" ? `Paid ${usd(deal.capturedCents ?? 0)} for the pallets that arrived` : `Paid ${usd(deal.capturedCents ?? total)}`}
            detail={`${deal.settledAt ? `${clock(deal.settledAt.getTime())} · ` : ""}PayPal ref ${deal.captureId}${deal.status === "partial" ? ` · ${usd(total - (deal.capturedCents ?? 0))} released` : ""}`}
            proof={confirmed("PAYMENT.CAPTURE.COMPLETED")}
            done
          />
        )}
      </ol>
    </div>
  );
}

function Step({ title, detail, proof, done }: { title: string; detail: string; proof?: Event; done?: boolean }) {
  return (
    <li className="flex gap-3">
      <span className={done ? "mt-1 size-2.5 shrink-0 rounded-full bg-forest" : "mt-1 size-2.5 shrink-0 rounded-full border-2 border-line"} />
      <div className="min-w-0">
        <div className="font-medium">{title}</div>
        <div className="truncate font-mono text-xs text-ink-muted">{detail}</div>
        <div className="mt-1 flex items-center gap-1.5 text-xs">
          {proof ? (
            <>
              <BadgeCheck className="size-3.5 text-forest" />
              <span className="text-forest">Confirmed by PayPal</span>
            </>
          ) : (
            <>
              <Clock3 className="size-3.5 text-ink-muted" />
              <span className="text-ink-muted">Waiting for PayPal to confirm</span>
            </>
          )}
        </div>
      </div>
    </li>
  );
}
