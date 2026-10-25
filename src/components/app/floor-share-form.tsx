"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { saveFloorShare } from "@/app/(app)/rules/actions";
import { Button } from "@/components/ui/button";

export function FloorShareForm({ value }: { value: number }) {
  const [v, setV] = useState(value);
  const [pending, start] = useTransition();
  return (
    <form
      className="mt-5 space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        start(async () => {
          const r = await saveFloorShare(fd);
          if (!r.ok) toast.error(r.error);
          else toast.success("Saved. New rejections use this floor.");
        });
      }}
    >
      <div className="flex items-baseline gap-3">
        <span className="font-heading text-[2.6rem] leading-none tabular-nums">{v}%</span>
        <span className="text-ink-muted">of the original price · strawberries at $200 a pallet → ${Math.round((200 * v) / 100)} floor</span>
      </div>
      <input name="floorShare" type="range" min={50} max={100} step={5} value={v} onChange={(e) => setV(Number(e.target.value))} className="w-full accent-[var(--forest)]" aria-label="Floor as a share of the original price" />
      <Button type="submit" disabled={pending || v === value}>
        {pending ? "Saving…" : "Save floor"}
      </Button>
    </form>
  );
}
