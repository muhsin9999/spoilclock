"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { approveDeal } from "@/app/(app)/loads/[id]/actions";
import { Button } from "@/components/ui/button";

export function ApproveButton({ loadId }: { loadId: string }) {
  const [pending, start] = useTransition();
  return (
    <Button
      size="lg"
      className="mt-5 h-12 w-full rounded-lg text-base"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const r = await approveDeal(loadId);
          if (!r.ok) toast.error(r.error);
        })
      }
    >
      {pending ? "Asking PayPal to hold the payment…" : "Approve and hold payment"}
    </Button>
  );
}
