"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { ChevronDown, FileText, Paperclip, SendHorizontal, X } from "lucide-react";
import { toast } from "sonner";
import { sendMessage } from "@/app/(app)/loads/[id]/actions";
import { AgentCrate } from "@/components/brand/agent-crate";
import { cn } from "@/lib/utils";
import { useDictation, VoiceButton } from "@/components/app/voice-input";

export type ChatMessage = { id: string; kind: string; body: { text?: string; files?: string[]; steps?: string[]; seconds?: number } };

// Worded for this load: who turned it away comes from the load itself.
const suggestionsFor = (rejectedBy: string) => [`Why did ${rejectedBy.replace(/ DC$/, "")} reject it?`, "Don't sell to Bargain Fresh", "Raise my floor to $160"];

/** This load's chat with your agent. Its work folds into the conversation; rule changes show as a line. */
export function LoadChat({ loadId, truck, rejectedBy, messages, working, closed }: { loadId: string; truck: string; rejectedBy: string; messages: ChatMessage[]; working: boolean; closed?: boolean }) {
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [pending, setPending] = useState<{ text: string; file?: string } | null>(null);
  const [isPending, start] = useTransition();
  const end = useRef<HTMLDivElement>(null);
  const voice = useDictation(text, setText);
  const asked = new Set(messages.filter((m) => m.kind === "user").map((m) => m.body.text?.trim()));
  const left = suggestionsFor(rejectedBy).filter((s) => !asked.has(s));

  useEffect(() => {
    end.current?.scrollIntoView({ block: "nearest" });
  }, [messages.length, pending]);

  const send = (value: string) => {
    const v = value.trim();
    if ((!v && !file) || isPending) return;
    voice.stop();
    const fd = new FormData();
    fd.set("text", v);
    if (file) fd.set("file", file);
    setPending({ text: v || `I've attached ${file!.name}.`, file: file?.name });
    setText("");
    setFile(null);
    start(async () => {
      const r = await sendMessage(loadId, fd);
      setPending(null);
      if (!r.ok) {
        toast.error(r.error);
        setText(v);
      }
    });
  };

  return (
    <section className="flex h-full max-h-[52rem] min-h-[34rem] flex-col rounded-xl border border-line bg-card-soft shadow-soft" aria-label={`Chat about ${truck}`}>
      <header className="flex items-center gap-3 border-b border-line px-5 py-4">
        <AgentCrate mood={isPending ? "thinking" : working ? "working" : "idle"} className="w-14" />
        <div>
          <h2 className="font-heading text-xl leading-none">Your agent</h2>
          <p className="mt-1 text-xs text-ink-muted">{working ? "Talking to buyers…" : `Selling ${truck} for you · tell it anything`}</p>
        </div>
      </header>
      <ol className="flex-1 space-y-4 overflow-y-auto px-5 py-5" aria-live="polite">
        {messages.length === 0 && !pending && <li className="text-sm text-ink-muted">Ask your agent anything about this load, or give it a rule, like a buyer to avoid or a new floor price.</li>}
        {messages.map((m) => (
          <li key={m.id}>
            <Message m={m} />
          </li>
        ))}
        {pending && (
          <>
            <li>
              <Message m={{ id: "pending", kind: "user", body: { text: pending.text, files: pending.file ? [pending.file] : undefined } }} />
            </li>
            <li className="shimmer-text text-sm">Your agent is thinking…</li>
          </>
        )}
        <div ref={end} />
      </ol>
      {left.length > 0 && !pending && !closed && (
        <div className="flex flex-wrap gap-2 px-5 pb-3">
          {left.map((s) => (
            <button key={s} type="button" onClick={() => send(s)} className="rounded-full border border-line px-3 py-1 text-sm text-ink-muted hover:border-forest hover:text-ink">
              {s}
            </button>
          ))}
        </div>
      )}
      {file && (
        <div className="mx-3 mb-1 flex items-center gap-2 rounded-lg border border-line bg-card px-3 py-1.5 text-sm">
          <FileText className="size-4 text-ink-muted" />
          <span className="min-w-0 flex-1 truncate">{file.name}</span>
          <button type="button" onClick={() => setFile(null)} aria-label="Remove the file" className="text-ink-muted hover:text-ink">
            <X className="size-4" />
          </button>
        </div>
      )}
      <form
        className="flex items-center gap-2 border-t border-line p-3"
        onSubmit={(e) => {
          e.preventDefault();
          send(text);
        }}
      >
        <label className={cn("grid size-10 shrink-0 cursor-pointer place-items-center rounded-lg text-ink-muted hover:bg-muted", closed && "pointer-events-none opacity-40")} aria-label="Attach a file">
          <Paperclip className="size-5" />
          <input type="file" className="sr-only" accept="application/pdf,image/png,image/jpeg,image/webp,text/csv,text/plain" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        </label>
        {voice.supported && !closed ? <VoiceButton listening={voice.listening} onToggle={voice.toggle} /> : null}
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={1000}
          className="h-10 min-w-0 flex-1 rounded-lg border border-line bg-parchment/60 px-3 text-sm outline-none focus:border-forest"
          placeholder={voice.listening ? "Listening…" : "Tell your agent something…"}
          aria-label="Message your agent"
        />
        <button type="submit" disabled={isPending || (!text.trim() && !file)} className="grid size-10 place-items-center rounded-lg bg-forest text-card-soft hover:bg-forest-deep disabled:opacity-50" aria-label="Send">
          <SendHorizontal className="size-4" />
        </button>
      </form>
    </section>
  );
}

function Message({ m }: { m: ChatMessage }) {
  if (m.kind === "rule")
    return (
      <div className="flex items-center gap-3 text-xs text-ink-muted">
        <span className="h-px flex-1 bg-line" />
        {m.body.text}
        <span className="h-px flex-1 bg-line" />
      </div>
    );
  if (m.kind === "work") return <Work steps={m.body.steps ?? []} seconds={m.body.seconds ?? 0} />;
  if (m.kind === "user")
    return (
      <div className="ml-10 flex flex-col items-end gap-1.5">
        <p className="rounded-2xl rounded-br-md bg-forest-tint px-4 py-2.5 text-[0.95rem]">{m.body.text}</p>
        {m.body.files?.map((f) => (
          <span key={f} className="inline-flex items-center gap-2 rounded-lg border border-line bg-card px-3 py-1.5 text-sm">
            <FileText className="size-4 text-ink-muted" />
            {f}
          </span>
        ))}
      </div>
    );
  return <p className="mr-6 rounded-2xl rounded-bl-md border border-line bg-parchment/50 px-4 py-2.5 text-[0.95rem]">{m.body.text}</p>;
}

function Work({ steps, seconds }: { steps: string[]; seconds: number }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="text-sm text-ink-muted">
      <button type="button" onClick={() => setOpen((o) => !o)} className="inline-flex items-center gap-1.5 hover:text-ink" aria-expanded={open}>
        {steps.length} steps in {seconds} s
        <ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <ol className="mt-2 space-y-1 border-l border-line pl-3">
          {steps.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>
      )}
    </div>
  );
}
