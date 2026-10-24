import { cn } from "@/lib/utils";

/** The engraved farmland strip that sits at the foot of a page. Decorative only. */
export function Landscape({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn("pointer-events-none select-none", className)}>
      <picture>
        <source media="(max-width: 900px)" srcSet="/art/landscape-sm.webp" />
        <img src="/art/landscape.webp" alt="" className="block h-auto max-h-[300px] w-full object-cover object-bottom" loading="lazy" decoding="async" />
      </picture>
    </div>
  );
}
