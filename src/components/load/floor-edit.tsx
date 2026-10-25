"use client";

import { useState, useTransition } from "react";
import { Pencil } from "lucide-react";
import { toast } from "sonner";
import { setFloor } from "@/app/(app)/loads/[id]/actions";

/** The load's floor, editable in place. */
export function FloorEdit({ loadId, dollars, locked }: { loadId: string; dollars: number; locked: boolean }) {
  const [editing, setEditing] = useState(false);
  const [v, setV] = useState(String(dollars));
  const [pending, start] = useTransition();
  if (locked) return <span className="tabular-nums">${dollars} a pallet</span>;
  if (!editing)
    return (
      <button type="button" onClick={() => setEditing(true)} className="inline-flex items-center gap-1.5 rounded-md border border-line px-2 py-0.5 tabular-nums hover:border-forest" aria-label="Change your floor">
        ${dollars} a pallet <Pencil className="size-3 text-ink-muted" />
      </button>
    );
  return (
    <form
      className="flex items-center gap-1.5"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const r = await setFloor(loadId, Number(v));
          if (!r.ok) return void toast.error(r.error);
          setEditing(false);
        });
      }}
    >
      $<input autoFocus type="number" min={1} value={v} onChange={(e) => setV(e.target.value)} className="h-7 w-16 rounded-md border border-forest bg-card-soft px-1.5 tabular-nums outline-none" aria-label="Floor per pallet in dollars" />
      <button type="submit" disabled={pending} className="rounded-md bg-forest px-2 py-0.5 text-card-soft">
        {pending ? "…" : "Save"}
      </button>
    </form>
  );
}
