"use client";

import Image from "next/image";
import { useState } from "react";
import { ChevronDown, FileText, Paperclip, SendHorizontal } from "lucide-react";
import type { ChatMessage } from "@/lib/demo-load";
import { cn } from "@/lib/utils";

/** This load's chat with your agent. Its work folds into the conversation; rule changes show as a line. */
export function LoadChat({ truck, messages }: { truck: string; messages: ChatMessage[] }) {
  return (
    <section className="flex h-full min-h-[34rem] flex-col rounded-xl border border-line bg-card-soft shadow-soft" aria-label={`Chat about ${truck}`}>
      <header className="flex items-center gap-3 border-b border-line px-5 py-4">
        <Image src="/art/crate-sm.webp" alt="" width={36} height={37} />
        <div>
          <h2 className="font-heading text-xl leading-none">Your agent</h2>
          <p className="mt-1 text-xs text-ink-muted">Selling {truck} for you · tell it anything</p>
        </div>
      </header>
      <ol className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
        {messages.map((m, i) => (
          <li key={i}>
            <Message m={m} />
          </li>
        ))}
      </ol>
      <form className="flex items-center gap-2 border-t border-line p-3" onSubmit={(e) => e.preventDefault()}>
        <button type="button" className="grid size-10 place-items-center rounded-lg text-ink-muted hover:bg-muted" aria-label="Attach a file">
          <Paperclip className="size-5" />
        </button>
        <input className="h-10 min-w-0 flex-1 rounded-lg border border-line bg-parchment/60 px-3 text-sm outline-none focus:border-forest" placeholder="Tell your agent something…" />
        <button type="submit" className="grid size-10 place-items-center rounded-lg bg-forest text-card-soft hover:bg-forest-deep" aria-label="Send">
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
        {m.text}
        <span className="h-px flex-1 bg-line" />
      </div>
    );
  if (m.kind === "work") return <Work steps={m.steps} seconds={m.seconds} />;
  if (m.kind === "user")
    return (
      <div className="ml-10 flex flex-col items-end gap-1.5">
        <p className="rounded-2xl rounded-br-md bg-forest-tint px-4 py-2.5 text-[0.95rem]">{m.text}</p>
        {m.files?.map((f) => (
          <span key={f} className="inline-flex items-center gap-2 rounded-lg border border-line bg-card px-3 py-1.5 text-sm">
            <FileText className="size-4 text-ink-muted" />
            {f}
          </span>
        ))}
      </div>
    );
  return <p className="mr-6 rounded-2xl rounded-bl-md border border-line bg-parchment/50 px-4 py-2.5 text-[0.95rem]">{m.text}</p>;
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
