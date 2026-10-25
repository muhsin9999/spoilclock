"use server";

import { refresh } from "next/cache";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema as s } from "@/db";
import { askAgent } from "@/server/ai/assistant";
import { underCap } from "@/server/ai/negotiate";
import { currentRun } from "@/server/run";
import { readUpload } from "@/server/uploads";

type Result = { ok: true } | { ok: false; error: string };

/** "Ask your agent": one message, maybe with a file. */
export async function askYourAgent(form: FormData): Promise<Result> {
  const text = String(form.get("text") ?? "").trim().slice(0, 1000);
  const file = form.get("file");
  const hasFile = file instanceof File && file.size > 0;
  if (!text && !hasFile) return { ok: false, error: "Write a message or attach a file." };
  if (!(await underCap())) return { ok: false, error: "Your agent is busy with other visitors. Try again in a few minutes." };
  const up = hasFile ? await readUpload(file) : null;
  if (up && "error" in up) return { ok: false, error: up.error };
  const run = await currentRun();
  try {
    await askAgent(run.id, text || `I've attached ${up!.name}.`, up);
  } catch (e) {
    console.error("askAgent failed", e);
    await db.insert(s.farmMessages).values({ runId: run.id, kind: "agent", body: { text: "I couldn't finish that just now. Nothing was changed. Try again." } });
  }
  refresh();
  return { ok: true };
}

/** Forget one note. */
export async function forgetNote(id: string): Promise<Result> {
  if (!z.uuid().safeParse(id).success) return { ok: false, error: "Unknown note." };
  const run = await currentRun();
  await db.delete(s.notes).where(and(eq(s.notes.id, id), eq(s.notes.runId, run.id)));
  refresh();
  return { ok: true };
}
