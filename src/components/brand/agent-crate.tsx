"use client";

import { useEffect, useRef, useState } from "react";
import { m, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

export type CrateMood = "idle" | "working" | "thinking" | "worried" | "happy";

// The engraved crate (public/art/crate-blank.webp, 1103×896 before scaling) with its face drawn in code, so it can
// blink, look around and change mood. Coordinates are in the image's own pixels; the face sits on the top slat.
const W = 1103;
const H = 896;
const FACE = { x: 566, y: 516 };
const INK = "#6b3a17";

export function AgentCrate({ mood = "idle", followCursor = false, className, label }: { mood?: CrateMood; followCursor?: boolean; className?: string; label?: string }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const [gaze, setGaze] = useState({ x: 0, y: 0 });
  const [blink, setBlink] = useState(false);

  // Blink every few seconds, at slightly random intervals.
  useEffect(() => {
    if (reduce || mood === "happy") return;
    let t: ReturnType<typeof setTimeout>;
    const next = () => {
      t = setTimeout(() => {
        setBlink(true);
        setTimeout(() => setBlink(false), 140);
        next();
      }, 2600 + Math.random() * 2600);
    };
    next();
    return () => clearTimeout(t);
  }, [mood, reduce]);

  // Idle: glance around now and then. Following the cursor overrides it.
  useEffect(() => {
    if (reduce || followCursor || mood !== "idle") return;
    const id = setInterval(() => setGaze({ x: [0, -14, 14, 0][Math.floor(Math.random() * 4)], y: [0, -6, 4][Math.floor(Math.random() * 3)] }), 2200);
    return () => clearInterval(id);
  }, [mood, followCursor, reduce]);

  useEffect(() => {
    if (!followCursor || reduce) return;
    const onMove = (e: PointerEvent) => {
      const r = ref.current?.getBoundingClientRect();
      if (!r) return;
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height * 0.58);
      const d = Math.max(1, Math.hypot(dx, dy));
      setGaze({ x: (dx / d) * Math.min(16, d / 12), y: (dy / d) * Math.min(9, d / 20) });
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, [followCursor, reduce]);

  const eyeY = mood === "thinking" ? -10 : mood === "worried" ? 6 : 0;
  const scan = mood === "working" && !reduce;

  return (
    <div ref={ref} className={cn("relative aspect-[1103/896] select-none", className)} role={label ? "img" : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/art/crate-blank.webp" alt="" className="absolute inset-0 size-full" draggable={false} />
      <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 size-full overflow-visible">
        <g transform={`translate(${FACE.x} ${FACE.y}) scale(1.28)`} fill={INK} stroke={INK} strokeLinecap="round">
          {mood === "happy" ? (
            <>
              <path d="M -122 6 Q -95 -26 -68 6" fill="none" strokeWidth="13" />
              <path d="M 68 6 Q 95 -26 122 6" fill="none" strokeWidth="13" />
            </>
          ) : (
            <m.g animate={scan ? { x: [-16, 16, -16] } : { x: gaze.x, y: gaze.y + eyeY }} transition={scan ? { duration: 1.6, repeat: Infinity, ease: "easeInOut" } : { type: "spring", stiffness: 120, damping: 14 }}>
              {[-95, 95].map((cx) => (
                <m.ellipse key={cx} cx={cx} cy={0} rx={24} ry={27} stroke="none" animate={{ scaleY: blink ? 0.08 : mood === "thinking" ? 0.7 : 1 }} transition={{ duration: 0.09 }} style={{ transformBox: "fill-box", transformOrigin: "center" }} />
              ))}
            </m.g>
          )}
          {mood === "worried" && (
            <>
              <path d="M -128 -46 L -70 -58" fill="none" strokeWidth="9" />
              <path d="M 70 -58 L 128 -46" fill="none" strokeWidth="9" />
            </>
          )}
          <m.path
            fill="none"
            strokeWidth="11"
            initial={false}
            animate={{ d: mood === "worried" ? "M -44 82 Q 0 58 44 82" : mood === "happy" ? "M -58 52 Q 0 118 58 52" : mood === "thinking" ? "M -26 74 Q 4 70 30 66" : "M -46 60 Q 0 100 46 60" }}
            transition={{ duration: 0.35 }}
          />
        </g>
      </svg>
    </div>
  );
}
