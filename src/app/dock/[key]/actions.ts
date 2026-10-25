"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { settle, type DockOutcome } from "@/server/paypal/money";

const Key = z.string().regex(/^[0-9a-f]{32}$/);

/** The receiver's decision at the new dock. The dock key in the link is what authorises it. */
export async function checkLoad(key: string, outcome: DockOutcome) {
  if (!Key.safeParse(key).success) return { ok: false as const, error: "This dock link isn't valid." };
  const r = await settle(key, outcome);
  refresh();
  return r;
}
