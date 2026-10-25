"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { m } from "motion/react";
import { ChevronLeft, ChevronRight, FileCode2, Gauge, Lock, Pause, Play, ShieldCheck } from "lucide-react";
import { CANNOT, DECISIONS, LANES, PARTS, REPO, STEPS } from "@/lib/architecture";
import { cn } from "@/lib/utils";

const TABS = ["Life of one load", "The parts", "What the AI can't do", "Decisions"] as const;
type Tab = (typeof TABS)[number];

export function Explorer() {
  const [tab, setTab] = useState<Tab>("Life of one load");
  return (
    <div>
      <div role="tablist" aria-label="Views" className="flex flex-wrap gap-1 border-b border-line">
        {TABS.map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={cn("-mb-px border-b-2 px-4 py-2.5 text-[0.95rem] transition-colors", tab === t ? "border-forest font-medium text-forest-deep" : "border-transparent text-ink-muted hover:text-ink")}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="pt-8">
        {tab === "Life of one load" && <Life />}
        {tab === "The parts" && <Parts />}
        {tab === "What the AI can't do" && <Cannot />}
        {tab === "Decisions" && <Decisions />}
      </div>
    </div>
  );
}

function FileLink({ path }: { path: string }) {
  return (
    <a href={REPO + path} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-md border border-line bg-card-soft px-2 py-1 font-mono text-xs text-ink-muted hover:border-forest hover:text-forest">
      <FileCode2 className="size-3.5" />
      {path}
    </a>
  );
}

// ─── Life of one load: a swimlane in time order ─────────────────────────────────────────────────────

const COL = 168; // px per step on the track
const ROW = 92; // px per lane

function Life() {
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [trust, setTrust] = useState(false);
  const track = useRef<HTMLDivElement>(null);
  const cards = useRef<(HTMLButtonElement | null)[]>([]);
  const [points, setPoints] = useState<{ x: number; y: number; l: number; r: number }[]>([]);

  // Card centres, measured, so the path runs through the real cards.
  const measure = useCallback(() => {
    const box = track.current?.getBoundingClientRect();
    if (!box) return;
    setPoints(cards.current.map((c) => (c ? { x: c.offsetLeft + c.offsetWidth / 2, y: c.offsetTop + c.offsetHeight / 2, l: c.offsetLeft, r: c.offsetLeft + c.offsetWidth } : { x: 0, y: 0, l: 0, r: 0 })));
  }, []);
  useLayoutEffect(() => {
    measure();
    const ro = new ResizeObserver(measure);
    if (track.current) ro.observe(track.current);
    return () => ro.disconnect();
  }, [measure]);

  useEffect(() => {
    if (!playing) return;
    const id = setTimeout(() => {
      if (active >= STEPS.length - 1) setPlaying(false);
      else setActive((a) => a + 1);
    }, 1900);
    return () => clearTimeout(id);
  }, [playing, active]);

  // Keep the active card in view on the scrolling track.
  useEffect(() => {
    cards.current[active]?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [active]);

  const step = STEPS[active];
  const lane = LANES.find((l) => l.id === step.lane)!;
  // Right-angled links through the gaps between cards: out of one card's right edge, along the gap, into the next.
  const route = (to: number) =>
    points
      .slice(0, to + 1)
      .map((p, i, all) => {
        if (i === 0) return `M${p.r} ${p.y}`;
        const prev = all[i - 1];
        const gap = (prev.r + p.l) / 2;
        return `L${gap} ${prev.y} L${gap} ${p.y} L${p.l} ${p.y}${i < all.length - 1 ? ` M${p.r} ${p.y}` : ""}`;
      })
      .join(" ");
  const path = points.length ? route(points.length - 1) : "";
  const dot = points[active];

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button onClick={() => setPlaying((p) => !p)} className="inline-flex h-10 items-center gap-2 rounded-lg bg-forest px-4 text-card-soft hover:bg-forest-deep">
          {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
          {playing ? "Pause" : active === 0 ? "Play the rescue" : "Play on"}
        </button>
        <button onClick={() => setActive((a) => Math.max(0, a - 1))} disabled={active === 0} className="grid size-10 place-items-center rounded-lg border border-line hover:bg-wheat/50 disabled:opacity-40" aria-label="Previous step">
          <ChevronLeft className="size-4" />
        </button>
        <button onClick={() => setActive((a) => Math.min(STEPS.length - 1, a + 1))} disabled={active === STEPS.length - 1} className="grid size-10 place-items-center rounded-lg border border-line hover:bg-wheat/50 disabled:opacity-40" aria-label="Next step">
          <ChevronRight className="size-4" />
        </button>
        <span className="ml-1 text-sm text-ink-muted tabular-nums">
          Step {active + 1} of {STEPS.length}
        </span>
        <button
          onClick={() => setTrust((t) => !t)}
          aria-pressed={trust}
          className={cn("ml-auto inline-flex h-10 items-center gap-2 rounded-lg border px-3 text-sm", trust ? "border-forest bg-forest-tint text-forest-deep" : "border-line text-ink-muted hover:text-ink")}
        >
          <ShieldCheck className="size-4" /> Show the safety steps
        </button>
      </div>

      {/* Desktop and tablet: the swimlane */}
      <div className="hidden overflow-hidden rounded-xl border border-line bg-card-soft md:flex">
        <ol className="w-44 shrink-0 border-r border-line" aria-label="Lanes">
          {LANES.map((l) => (
            <li key={l.id} className="flex flex-col justify-center border-b border-line px-4 last:border-b-0" style={{ height: ROW }}>
              <span className="font-heading text-lg leading-tight">{l.label}</span>
              <span className="text-xs text-ink-muted">{l.note}</span>
            </li>
          ))}
        </ol>
        <div className="min-w-0 flex-1 overflow-x-auto">
          <div ref={track} className="relative" style={{ width: STEPS.length * COL + 24, height: LANES.length * ROW }}>
            {LANES.map((l, i) => (
              <div key={l.id} className={cn("absolute inset-x-0 border-b border-line", i % 2 && "bg-parchment/40")} style={{ top: i * ROW, height: ROW }} />
            ))}
            <svg className="pointer-events-none absolute inset-0" width="100%" height="100%" aria-hidden>
              <path d={path} fill="none" stroke="var(--line)" strokeWidth="2" strokeDasharray="5 5" />
              {points.length > 1 && active > 0 && <path d={route(active)} fill="none" stroke="var(--forest)" strokeWidth="2.5" strokeLinejoin="round" />}
            </svg>
            {STEPS.map((s, i) => {
              const row = LANES.findIndex((l) => l.id === s.lane);
              const dim = trust && !s.trust;
              return (
                <button
                  key={s.id}
                  ref={(el) => {
                    cards.current[i] = el;
                  }}
                  onClick={() => {
                    setPlaying(false);
                    setActive(i);
                  }}
                  className={cn(
                    "absolute z-10 w-[148px] rounded-lg border px-2.5 py-2 text-left text-[0.8rem] leading-snug transition-all",
                    i === active ? "border-forest bg-forest text-card-soft shadow-soft" : i < active ? "border-forest/40 bg-forest-tint" : "border-line bg-card-soft hover:border-forest/50",
                    dim && "opacity-25",
                  )}
                  style={{ left: 12 + i * COL, top: row * ROW + 14, minHeight: ROW - 28 }}
                  aria-current={i === active ? "step" : undefined}
                >
                  <span className={cn("block text-[0.65rem] tabular-nums", i === active ? "text-card-soft/70" : "text-ink-muted")}>
                    {i + 1}
                    {s.trust && <Lock className="ml-1 inline size-2.5" />}
                  </span>
                  {s.title}
                </button>
              );
            })}
            {dot && (
              <m.span className="pointer-events-none absolute z-20 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-turning ring-4 ring-turning/25" animate={{ left: dot.x, top: dot.y - (ROW - 28) / 2 - 6 }} transition={{ type: "spring", stiffness: 140, damping: 20 }} />
            )}
          </div>
        </div>
      </div>

      {/* Phones: the steps in order */}
      <ol className="space-y-2 md:hidden">
        {STEPS.map((s, i) => (
          <li key={s.id}>
            <button onClick={() => setActive(i)} className={cn("flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left", i === active ? "border-forest bg-forest-tint" : "border-line bg-card-soft", trust && !s.trust && "opacity-30")}>
              <span className="w-5 text-xs text-ink-muted tabular-nums">{i + 1}</span>
              <span className="min-w-0 flex-1">
                <span className="block text-xs text-ink-muted">{LANES.find((l) => l.id === s.lane)!.label}</span>
                <span className="block">{s.title}</span>
              </span>
              {s.trust && <Lock className="size-3.5 text-forest" />}
            </button>
          </li>
        ))}
      </ol>

      {/* What happens at this step */}
      <m.section key={step.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-6 grid gap-6 rounded-xl border border-line bg-card-soft p-6 lg:grid-cols-[1.3fr_1fr]" aria-live="polite">
        <div>
          <p className="text-sm text-ink-muted">
            Step {active + 1} · {lane.label}
          </p>
          <h2 className="mt-1 font-heading text-[1.8rem] leading-tight">{step.title}</h2>
          <p className="mt-3 text-lg leading-relaxed text-ink/85">{step.what}</p>
          {step.trust && (
            <p className="mt-3 inline-flex items-center gap-2 rounded-md bg-forest-tint px-2.5 py-1 text-sm text-forest-deep">
              <ShieldCheck className="size-4" /> A safety step
            </p>
          )}
        </div>
        <div className="space-y-4">
          {step.call && <pre className="overflow-x-auto rounded-lg border border-line bg-parchment/60 p-3 font-mono text-xs leading-relaxed whitespace-pre-wrap">{step.call}</pre>}
          {step.measured && (
            <p className="flex items-start gap-2 text-sm">
              <Gauge className="mt-0.5 size-4 shrink-0 text-kraft" />
              <span>
                <span className="text-ink-muted">Measured on the live site: </span>
                {step.measured}
              </span>
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            {step.files.map((f) => (
              <FileLink key={f} path={f} />
            ))}
          </div>
        </div>
      </m.section>
    </div>
  );
}

function Parts() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {PARTS.map((p) => (
        <article key={p.name} className="flex flex-col rounded-xl border border-line bg-card-soft p-5">
          <h2 className="font-heading text-xl">{p.name}</h2>
          <p className="mt-2 flex-1 leading-relaxed text-ink/85">{p.does}</p>
          <div className="mt-4">
            <FileLink path={p.where} />
          </div>
        </article>
      ))}
    </div>
  );
}

function Cannot() {
  return (
    <div>
      <p className="max-w-2xl text-lg text-ink/85">The agents propose; code and you decide. These hold whatever a model says.</p>
      <ul className="mt-6 divide-y divide-line rounded-xl border border-line bg-card-soft">
        {CANNOT.map((c) => (
          <li key={c.text} className="grid gap-2 px-5 py-4 md:grid-cols-[16rem_1fr_auto] md:items-center">
            <span className="flex items-center gap-2 font-heading text-lg">
              <Lock className="size-4 text-forest" />
              Can&apos;t {c.text.charAt(0).toLowerCase() + c.text.slice(1)}
            </span>
            <span className="text-ink/85">{c.how}</span>
            <FileLink path={c.file} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function Decisions() {
  return (
    <ul className="grid gap-4 md:grid-cols-2">
      {DECISIONS.map((d) => (
        <li key={d.chose} className="rounded-xl border border-line bg-card-soft p-5">
          <p className="font-heading text-xl">{d.chose}</p>
          <p className="mt-2 leading-relaxed text-ink/85">{d.why}</p>
        </li>
      ))}
    </ul>
  );
}
