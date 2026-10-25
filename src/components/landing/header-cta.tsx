"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, m } from "motion/react";
import { ArrowRight } from "lucide-react";

/** The header's "See it live" only appears once the hero's own button has scrolled out of view. */
export function HeaderCta({ watch }: { watch: string }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const el = document.getElementById(watch);
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setShow(!e.isIntersecting && e.boundingClientRect.top < 0));
    io.observe(el);
    return () => io.disconnect();
  }, [watch]);
  return (
    <AnimatePresence>
      {show && (
        <m.span initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
          <Link href="/today" className="inline-flex h-10 items-center gap-2 rounded-lg bg-forest px-4 text-sm text-card-soft hover:bg-forest-deep">
            See it live <ArrowRight className="size-4" />
          </Link>
        </m.span>
      )}
    </AnimatePresence>
  );
}
