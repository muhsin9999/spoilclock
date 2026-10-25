"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { ArrowUpRight, Brain, ChevronDown, FileText, Paperclip, SendHorizontal, X } from "lucide-react";
import { toast } from "sonner";
import { askYourAgent, forgetNote } from "@/app/(app)/agent-actions";
import { AgentCrate } from "@/components/brand/agent-crate";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export type FarmMessage = { id: string; kind: string; body: { text?: string; files?: string[]; steps?: string[]; seconds?: number; links?: { label: string; href: string }[]; actions?: string[] } };
export type Note = { id: string; text: string; about: string | null };

const SUGGESTIONS = ["What did we do last?", "Which load needs me most?", "How much has PayPal captured?", "Remember: Bargain Fresh pays late"];

/** "Ask your agent", from any page: a conversation grounded in this farm's records, with files and memory. */
export function AgentPanel({ messages, notes, compact = false }: { messages: FarmMessage[]; notes: Note[]; compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [pending, setPending] = useState<{ text: string; file?: string } | null>(null);
  const [busy, start] = useTransition();
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => {
    end.current?.scrollIntoView({ block: "nearest" });
  }, [messages.length, pending, open]);

  const send = (value: string) => {
    const v = value.trim();
    if ((!v && !file) || busy) return;
    const fd = new FormData();
    fd.set("text", v);
    if (file) fd.set("file", file);
    setPending({ text: v || `I've attached ${file!.name}.`, file: file?.name });
    setText("");
    setFile(null);
    start(async () => {
      const r = await askYourAgent(fd);
      setPending(null);
      if (!r.ok) {
        toast.error(r.error);
        setText(v);
      }
    });
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        className={
          compact
            ? "inline-flex items-center gap-1.5 rounded-md border border-line bg-card-soft px-2 py-1 text-xs"
            : "flex w-full items-center gap-3 rounded-xl border border-line bg-card-soft px-3 py-2 text-left shadow-soft transition-colors hover:border-forest/40"
        }
      >
        <AgentCrate mood={busy ? "thinking" : "idle"} className={compact ? "w-6" : "w-10"} />
        {compact ? (
          "Ask"
        ) : (
          <span>
            <span className="block text-sm font-medium">Ask your agent</span>
            <span className="block text-xs text-ink-muted">Anything about the farm</span>
          </span>
        )}
      </SheetTrigger>
      <SheetContent side="right" className="flex w-full flex-col gap-0 bg-card-soft p-0 sm:max-w-md">
        <header className="flex items-center gap-3 border-b border-line px-5 py-4 pr-12">
          <AgentCrate mood={busy ? "thinking" : messages.length ? "idle" : "happy"} followCursor={!busy} className="w-16" />
          <div>
            <SheetTitle className="font-heading text-2xl font-normal leading-none">Your agent</SheetTitle>
            <p className="mt-1 text-xs text-ink-muted">Answers from your farm&apos;s records · remembers what you tell it</p>
          </div>
        </header>

        <Memory notes={notes} />

        <ol className="flex-1 space-y-4 overflow-y-auto px-5 py-5" aria-live="polite">
          {messages.length === 0 && !pending && <li className="text-sm text-ink-muted">Ask about any load, buyer or payment, attach a document, or tell me something to remember.</li>}
          {messages.map((m) => (
            <li key={m.id}>
              <Bubble m={m} onNavigate={() => setOpen(false)} />
            </li>
          ))}
          {pending && (
            <>
              <li>
                <Bubble m={{ id: "pending", kind: "user", body: { text: pending.text, files: pending.file ? [pending.file] : undefined } }} onNavigate={() => {}} />
              </li>
              <li className="shimmer-text text-sm">Your agent is looking…</li>
            </>
          )}
          <div ref={end} />
        </ol>

        {messages.length === 0 && !pending && (
          <div className="flex flex-wrap gap-2 px-5 pb-3">
            {SUGGESTIONS.map((sug) => (
              <button key={sug} type="button" onClick={() => send(sug)} className="rounded-full border border-line px-3 py-1 text-sm text-ink-muted hover:border-forest hover:text-ink">
                {sug}
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
          <label className="grid size-10 shrink-0 cursor-pointer place-items-center rounded-lg text-ink-muted hover:bg-muted" aria-label="Attach a file">
            <Paperclip className="size-5" />
            <input type="file" className="sr-only" accept="application/pdf,image/png,image/jpeg,image/webp,text/csv,text/plain" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </label>
          <input value={text} onChange={(e) => setText(e.target.value)} maxLength={1000} placeholder="Ask your agent…" aria-label="Message your agent" className="h-10 min-w-0 flex-1 rounded-lg border border-line bg-parchment/60 px-3 text-sm outline-none focus:border-forest" />
          <button type="submit" disabled={busy || (!text.trim() && !file)} className="grid size-10 place-items-center rounded-lg bg-forest text-card-soft hover:bg-forest-deep disabled:opacity-50" aria-label="Send">
            <SendHorizontal className="size-4" />
          </button>
        </form>
      </SheetContent>
    </Sheet>
  );
}

function Memory({ notes }: { notes: Note[] }) {
  const [open, setOpen] = useState(false);
  const [busy, start] = useTransition();
  if (!notes.length) return null;
  return (
    <div className="border-b border-line px-5 py-2.5">
      <button type="button" onClick={() => setOpen((o) => !o)} className="flex w-full items-center gap-2 text-sm text-ink-muted hover:text-ink" aria-expanded={open}>
        <Brain className="size-4 text-kraft" />
        What I remember ({notes.length})
        <ChevronDown className={cn("ml-auto size-4 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <ul className="mt-2 space-y-1.5">
          {notes.map((n) => (
            <li key={n.id} className="flex items-start gap-2 rounded-lg bg-wheat/50 px-3 py-2 text-sm">
              <span className="min-w-0 flex-1">
                {n.text}
                {n.about && <span className="block text-xs text-ink-muted">about {n.about}</span>}
              </span>
              <button
                type="button"
                disabled={busy}
                onClick={() => start(async () => void (await forgetNote(n.id)))}
                className="text-ink-muted hover:text-spoiling"
                aria-label={`Forget: ${n.text}`}
              >
                <X className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Bubble({ m, onNavigate }: { m: FarmMessage; onNavigate: () => void }) {
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
  return (
    <div className="mr-6 space-y-2">
      {m.body.steps && m.body.steps.length > 0 && <Steps steps={m.body.steps} seconds={m.body.seconds ?? 0} />}
      <p className="rounded-2xl rounded-bl-md border border-line bg-parchment/50 px-4 py-2.5 text-[0.95rem] whitespace-pre-line">{m.body.text}</p>
      {m.body.actions?.map((a) => (
        <p key={a} className="flex items-center gap-2 text-xs text-ink-muted">
          <span className="h-px w-4 bg-line" />
          {a}
        </p>
      ))}
      {m.body.links && m.body.links.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {m.body.links.map((l) => (
            <Link key={l.href} href={l.href} onClick={onNavigate} className="inline-flex items-center gap-1 rounded-full border border-forest/30 px-3 py-1 text-sm text-forest hover:bg-forest-tint">
              {l.label} <ArrowUpRight className="size-3.5" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function Steps({ steps, seconds }: { steps: string[]; seconds: number }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="text-xs text-ink-muted">
      <button type="button" onClick={() => setOpen((o) => !o)} className="inline-flex items-center gap-1 hover:text-ink" aria-expanded={open}>
        {steps.length} steps in {seconds} s <ChevronDown className={cn("size-3.5 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <ol className="mt-1 space-y-0.5 border-l border-line pl-3">
          {steps.map((st) => (
            <li key={st}>{st}</li>
          ))}
        </ol>
      )}
    </div>
  );
}
