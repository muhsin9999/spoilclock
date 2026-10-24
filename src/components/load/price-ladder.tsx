"use client";

import { useState } from "react";
import type { Buyer, Offer } from "@/lib/demo-load";

type Props = { offers: Offer[]; buyers: Buyer[]; floor: number; deal?: { perPallet: number; buyerId: string } };

const W = 640;
const H = 300;
const PAD = { l: 52, r: 132, t: 20, b: 36 };
const SELLER = { id: "seller", name: "Your agent's ask", color: "var(--ink)" };

/**
 * The negotiation as a price ladder: your agent's ask steps down, each buyer agent's bid steps up,
 * the floor is a dashed line, and the deal is where an ask and a bid meet. One round per step.
 */
export function PriceLadder({ offers, buyers, floor, deal }: Props) {
  const [hover, setHover] = useState<number | null>(null);
  const rounds = Math.max(...offers.map((o) => o.round));
  const prices = [...offers.map((o) => o.perPallet), floor];
  const lo = Math.floor((Math.min(...prices) - 10) / 10) * 10;
  const hi = Math.ceil((Math.max(...prices) + 5) / 10) * 10;
  const x = (r: number) => PAD.l + ((r - 1) / Math.max(1, rounds - 1)) * (W - PAD.l - PAD.r);
  const y = (p: number) => PAD.t + (1 - (p - lo) / (hi - lo)) * (H - PAD.t - PAD.b);
  const ticks = Array.from({ length: Math.floor((hi - lo) / 20) + 1 }, (_, i) => lo + i * 20);
  const series = [SELLER, ...buyers].map((s) => ({ ...s, pts: offers.filter((o) => o.by === s.id).sort((a, b) => a.round - b.round) }));
  const dealPt = deal && offers.find((o) => o.by === deal.buyerId && o.perPallet === deal.perPallet);

  return (
    <figure className="relative">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        role="img"
        aria-label={`Offers per pallet over ${rounds} rounds. Floor $${floor}.${deal ? ` Deal at $${deal.perPallet}.` : ""}`}
        onMouseLeave={() => setHover(null)}
        onMouseMove={(e) => {
          const box = e.currentTarget.getBoundingClientRect();
          const px = ((e.clientX - box.left) / box.width) * W;
          const r = Math.round(((px - PAD.l) / (W - PAD.l - PAD.r)) * (rounds - 1)) + 1;
          setHover(r >= 1 && r <= rounds ? r : null);
        }}
      >
        {ticks.map((t) => (
          <g key={t}>
            <line x1={PAD.l} x2={W - PAD.r} y1={y(t)} y2={y(t)} stroke="var(--line)" strokeWidth="1" />
            <text x={PAD.l - 10} y={y(t)} dy="0.32em" textAnchor="end" className="fill-ink-muted text-[11px] tabular-nums">${t}</text>
          </g>
        ))}
        {Array.from({ length: rounds }, (_, i) => (
          <text key={i} x={x(i + 1)} y={H - 12} textAnchor="middle" className="fill-ink-muted text-[11px]">Round {i + 1}</text>
        ))}
        <line x1={PAD.l} x2={W - PAD.r} y1={y(floor)} y2={y(floor)} stroke="var(--spoiling)" strokeWidth="1.5" strokeDasharray="5 5" />
        <text x={W - PAD.r + 10} y={y(floor)} dy="0.32em" className="fill-spoiling text-[12px] font-medium">Your floor ${floor}</text>
        {hover && <line x1={x(hover)} x2={x(hover)} y1={PAD.t} y2={H - PAD.b} stroke="var(--ink-muted)" strokeWidth="1" opacity="0.4" />}
        {series.map((s) => (
          <g key={s.id}>
            <polyline points={s.pts.map((p) => `${x(p.round)},${y(p.perPallet)}`).join(" ")} fill="none" stroke={s.color} strokeWidth="2" strokeLinejoin="round" strokeDasharray={s.id === "seller" ? "0" : undefined} />
            {s.pts.map((p) => (
              <circle key={p.round} cx={x(p.round)} cy={y(p.perPallet)} r={hover === p.round ? 5.5 : 4} fill={s.id === "seller" ? "var(--card-soft)" : s.color} stroke={s.color} strokeWidth="2" />
            ))}
            {s.pts.length > 0 && !(dealPt && s.id === deal?.buyerId) && s.id !== "seller" && (
              <text x={x(s.pts.at(-1)!.round) + 9} y={y(s.pts.at(-1)!.perPallet)} dy="0.32em" className="text-[11px]" fill={s.color}>
                {s.name.split(" ")[0]}
              </text>
            )}
          </g>
        ))}
        {dealPt && (
          <g transform={`translate(${x(dealPt.round)}, ${y(dealPt.perPallet)})`}>
            <circle r="7" fill="var(--forest)" stroke="var(--card-soft)" strokeWidth="2.5" />
            <g transform="translate(14, -14)">
              <rect width="112" height="28" rx="7" fill="var(--forest)" />
              <text x="56" y="14" dy="0.34em" textAnchor="middle" className="fill-card-soft text-[12px] font-medium">Deal · ${dealPt.perPallet}</text>
            </g>
          </g>
        )}
      </svg>
      {hover && (
        <div className="pointer-events-none absolute top-2 rounded-lg border border-line bg-card-soft px-3 py-2 text-xs shadow-soft" style={{ left: `calc(${(x(hover) / W) * 100}% + 12px)` }}>
          <div className="mb-1 font-medium">Round {hover}</div>
          {series.map((s) => {
            const p = s.pts.find((o) => o.round === hover);
            return p ? (
              <div key={s.id} className="flex items-center gap-2 tabular-nums">
                <span className="size-2 rounded-full" style={{ background: s.color }} />
                <span className="text-ink-muted">{s.name}</span>
                <span className="ml-auto pl-3">${p.perPallet}</span>
              </div>
            ) : null;
          })}
        </div>
      )}
      <figcaption className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-ink-muted">
        {series.map((s) => (
          <span key={s.id} className="inline-flex items-center gap-2">
            <span className="size-2.5 rounded-full border-2" style={{ borderColor: s.color, background: s.id === "seller" ? "transparent" : s.color }} />
            {s.name}
          </span>
        ))}
      </figcaption>
    </figure>
  );
}
