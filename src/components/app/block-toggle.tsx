"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { setBlocked } from "@/app/(app)/rules/actions";

export function BlockToggle({ buyerId, blocked, name }: { buyerId: string; blocked: boolean; name: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      role="switch"
      aria-checked={!blocked}
      aria-label={`Sell to ${name}`}
      disabled={pending}
      onClick={() =>
        start(async () => {
          const r = await setBlocked(buyerId, !blocked);
          if (!r.ok) toast.error(r.error);
          else toast.success(blocked ? `${name} is allowed again.` : `Your agent won't sell to ${name} on new loads.`);
        })
      }
      className="inline-flex items-center gap-2 text-sm"
    >
      <span className={`relative h-6 w-11 rounded-full transition-colors ${blocked ? "bg-line" : "bg-forest"}`}>
        <span className={`absolute top-0.5 size-5 rounded-full bg-card-soft shadow transition-all ${blocked ? "left-0.5" : "left-[1.375rem]"}`} />
      </span>
      {blocked ? "Blocked" : "Allowed"}
    </button>
  );
}
