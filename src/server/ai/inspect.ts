// Reads a receiver's rejection notice or inspection report (text or photo) and pulls out what the rescue needs.
// The grower checks the result before anything is opened.
import "server-only";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";
import { db, schema as s } from "@/db";
import type { Upload } from "@/server/uploads";
import { MODEL, openai } from "./client";

export const Findings = z.object({
  is_rejection_document: z.boolean().describe("True only if this is a receiving inspection, rejection notice or similar document about produce"),
  reason: z.string().describe("Why the load was rejected, in a few plain words, e.g. 'Cosmetic standards'"),
  grade: z.string().describe("The grade observed, e.g. 'U.S. No. 1', or 'Not stated'"),
  soft_pct: z.number().describe("Percent soft, bruised or damaged; 0 if not stated"),
  pulp_f: z.number().describe("Pulp temperature in °F; 0 if not stated"),
});

export async function readFindings(file: Upload, crop: string) {
  const started = Date.now();
  const content: { type: "input_text"; text: string } | { type: "input_image"; image_url: string; detail: "auto" } = file.data
    ? { type: "input_image", image_url: `data:${file.type};base64,${file.data}`, detail: "auto" }
    : { type: "input_text", text: (file.text ?? "").slice(0, 12_000) };
  const res = await openai().responses.parse({
    model: MODEL,
    instructions: `You read produce receiving documents for a grower. The load is ${crop}. Extract only what the document says; never guess numbers. Convert °C to °F.`,
    input: [{ role: "user", content: [{ type: "input_text", text: `Document: ${file.name}` }, content] }],
    reasoning: { effort: "low" },
    text: { format: zodTextFormat(Findings, "findings") },
  });
  await db.insert(s.aiCalls).values({ loadId: null, agent: "inspect", model: MODEL, inputTokens: res.usage?.input_tokens ?? 0, outputTokens: res.usage?.output_tokens ?? 0, ms: Date.now() - started });
  return res.output_parsed;
}
