"use client";

import { useRouter } from "next/navigation";
import { useEffect, useTransition } from "react";

/**
 * While the agents are working, re-reads the page so each new offer appears as it lands.
 * Waits for each refresh to finish before the next, so a slow one is never cancelled by its successor.
 */
export function LiveRefresh({ active, everyMs = 1500 }: { active: boolean; everyMs?: number }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  useEffect(() => {
    if (!active || pending) return;
    const id = setTimeout(() => start(() => router.refresh()), everyMs);
    return () => clearTimeout(id);
  }, [active, pending, everyMs, router]);
  return null;
}
