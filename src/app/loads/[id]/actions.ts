"use server";

import { after } from "next/server";
import { refresh } from "next/cache";
import { z } from "zod";
import { chat } from "@/server/ai/chat";
import { claimNegotiation, negotiate, underCap } from "@/server/ai/negotiate";
import { ownsLoad } from "@/server/load";
import { holdPayment } from "@/server/paypal/money";

const Id = z.uuid();

type Result = { ok: true } | { ok: false; error: string };

/** "Find a buyer": the agent starts (or resumes) negotiating in the background; the page watches it live. */
export async function startNegotiation(loadId: string): Promise<Result> {
  if (!Id.safeParse(loadId).success || !(await ownsLoad(loadId))) return { ok: false, error: "That load isn't yours." };
  if (!(await underCap())) return { ok: false, error: "The agents are busy with other visitors. Try again in a few minutes." };
  if (!(await claimNegotiation(loadId))) return { ok: false, error: "Your agent is already on it." };
  after(() => negotiate(loadId));
  refresh();
  return { ok: true };
}

const Message = z.object({ text: z.string().trim().min(1).max(1000) });

export async function sendMessage(loadId: string, text: string): Promise<Result> {
  if (!Id.safeParse(loadId).success || !(await ownsLoad(loadId))) return { ok: false, error: "That load isn't yours." };
  const parsed = Message.safeParse({ text });
  if (!parsed.success) return { ok: false, error: "Write a message first (up to 1,000 characters)." };
  if (!(await underCap())) return { ok: false, error: "Your agent is busy right now. Try again in a few minutes." };
  try {
    const reopen = await chat(loadId, parsed.data.text, []);
    if (reopen && (await claimNegotiation(loadId))) after(() => negotiate(loadId));
  } catch (e) {
    console.error("chat failed", e);
    return { ok: false, error: "Your agent couldn't answer just now. Try again." };
  }
  refresh();
  return { ok: true };
}

/** "Approve and hold payment": PayPal authorizes the deal on the buyer agent's saved card. */
export async function approveDeal(loadId: string): Promise<Result> {
  if (!Id.safeParse(loadId).success || !(await ownsLoad(loadId))) return { ok: false, error: "That load isn't yours." };
  const r = await holdPayment(loadId);
  refresh();
  return r;
}
