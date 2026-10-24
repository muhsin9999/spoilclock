import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = ["Rejected", "Finding a buyer", "Payment held", "At the new dock", "Paid"] as const;

/** Where this load is: done steps filled, the current one ringed, the rest hollow. */
export function RouteSteps({ current, detail }: { current: number; detail?: Partial<Record<number, string>> }) {
  return (
    <ol className="grid grid-cols-5" aria-label="Where this load is">
      {STEPS.map((s, i) => {
        const done = i < current;
        const now = i === current;
        return (
          <li key={s} className="min-w-0" aria-current={now ? "step" : undefined}>
            <div className="flex items-center">
              <span
                className={cn(
                  "grid size-7 shrink-0 place-items-center rounded-full border-2 bg-card-soft",
                  done && (i === 0 ? "border-spoiling bg-spoiling text-card-soft" : "border-forest bg-forest text-card-soft"),
                  now && "border-forest ring-4 ring-forest/15",
                  !done && !now && "border-line",
                )}
              >
                {done ? <Check className="size-4" strokeWidth={3} /> : now ? <span className="size-2.5 rounded-full bg-forest" /> : null}
              </span>
              {i < STEPS.length - 1 && <span className={cn("mx-2 h-0.5 flex-1 rounded-full", done ? "bg-forest/60" : "bg-line")} />}
            </div>
            <div className="mt-2 pr-4">
              <span className={cn("block font-heading text-[1.05rem] leading-tight", !done && !now && "text-ink-muted")}>{s}</span>
              {detail?.[i] && <span className="block truncate text-sm text-ink-muted">{detail[i]}</span>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
