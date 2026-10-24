import { cn } from "@/lib/utils";

/** An ink stamp for the big moments only: Rejected, Held, Accepted, Voided. */
export function Stamp({ children, tone = "spoiling", className }: { children: React.ReactNode; tone?: "spoiling" | "forest"; className?: string }) {
  return (
    <span
      className={cn(
        "stamp inline-block whitespace-nowrap -rotate-6 rounded-md border-[2.5px] px-3 py-1 font-heading text-[0.95rem] font-semibold uppercase leading-tight tracking-[0.06em]",
        tone === "spoiling" ? "border-spoiling text-spoiling" : "border-forest text-forest",
        className,
      )}
    >
      {children}
    </span>
  );
}
