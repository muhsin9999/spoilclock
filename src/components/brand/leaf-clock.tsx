import { cn } from "@/lib/utils";

const TICKS = Array.from({ length: 12 }, (_, i) => i * 30);

/** The mark: a clock face of tick marks whose only hand is a leaf. */
export function LeafClock({ className, angle = 35, title }: { className?: string; angle?: number; title?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={cn("size-10 shrink-0", className)} role={title ? "img" : undefined} aria-label={title} aria-hidden={title ? undefined : true}>
      <circle cx="24" cy="24" r="21.5" fill="none" stroke="var(--ink)" strokeWidth="1.4" />
      {TICKS.map((a) => (
        <line key={a} x1="24" y1={a % 90 === 0 ? 4.6 : 5.2} x2="24" y2={a % 90 === 0 ? 8.6 : 7.4} stroke="var(--ink)" strokeWidth={a % 90 === 0 ? 1.6 : 1.1} strokeLinecap="round" transform={`rotate(${a} 24 24)`} />
      ))}
      <Leaf angle={angle} />
    </svg>
  );
}

/** The leaf hand on its own, drawn pointing up from (24,24) and rotated by `angle`. */
export function Leaf({ angle = 35, color = "var(--forest)" }: { angle?: number; color?: string }) {
  return (
    <g transform={`rotate(${angle} 24 24)`}>
      <line x1="24" y1="24" x2="24" y2="19.5" stroke="var(--ink)" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M24 20.5C19.6 17.6 19.2 12.2 24 7.6C28.8 12.2 28.4 17.6 24 20.5Z" fill={color} />
      <path d="M24 19.4V9.6" stroke="var(--card-soft)" strokeWidth="0.7" strokeLinecap="round" opacity="0.8" />
      <circle cx="24" cy="24" r="1.7" fill="var(--ink)" />
    </g>
  );
}

export function Logo({ size = "md", className }: { size?: "sm" | "md" | "lg"; className?: string }) {
  const mark = { sm: "size-7", md: "size-9", lg: "size-12" }[size];
  const word = { sm: "text-xl", md: "text-2xl", lg: "text-[2rem]" }[size];
  return (
    <span className={cn("inline-flex items-center gap-2.5 text-ink", className)}>
      <LeafClock className={mark} />
      <span className={cn("font-heading font-medium tracking-[-0.02em]", word)}>Spoilclock</span>
    </span>
  );
}
