"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { startNegotiation } from "@/app/(app)/loads/[id]/actions";
import { Button } from "@/components/ui/button";

export function FindBuyerButton({ loadId, again }: { loadId: string; again?: boolean }) {
  const [pending, start] = useTransition();
  return (
    <Button
      size="lg"
      className="h-12 rounded-lg px-6 text-base"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const r = await startNegotiation(loadId);
          if (!r.ok) toast.error(r.error);
        })
      }
    >
      {pending ? "Starting…" : again ? "Try again" : "Find a buyer"}
    </Button>
  );
}
