// Shared OpenAI client and model choice for Spoilclock's agents.
import "server-only";
import "@/lib/net";
import OpenAI from "openai";

let client: OpenAI | undefined;
export const openai = () => (client ??= new OpenAI({ timeout: 30_000, maxRetries: 1 }));
export const MODEL = process.env.AI_MODEL || "gpt-5.4-mini";
