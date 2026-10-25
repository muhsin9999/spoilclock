import { notFound } from "next/navigation";
import { AgentCrate } from "@/components/brand/agent-crate";

// Local design check only: never served on Vercel.
export default function Styleguide() {
  if (process.env.VERCEL) notFound();
  return (
    <main className="grid grid-cols-5 gap-8 p-10">
      {(["idle", "working", "thinking", "worried", "happy"] as const).map((mood) => (
        <figure key={mood} className="text-center">
          <AgentCrate mood={mood} className="w-56" />
          <figcaption className="mt-2 text-sm text-ink-muted">{mood}</figcaption>
        </figure>
      ))}
      <figure className="text-center">
        <AgentCrate mood="idle" className="w-14" />
        <figcaption className="mt-2 text-sm text-ink-muted">small</figcaption>
      </figure>
    </main>
  );
}
