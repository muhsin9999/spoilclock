"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { ChevronRight, FileUp, Plus, RotateCcw, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { addDelivery, readReport, reportRejection, startNewDay } from "@/app/(app)/today/actions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Truck } from "@/lib/demo-day";
import { clock } from "@/lib/time";
import { cn } from "@/lib/utils";
import { Board, type Trip } from "./board";

type BoardTrip = Trip & { loadId: string | null; crop: string | null; pallets: number | null };
type Defaults = Record<string, { reason: string; grade: string; softPct: number; pulpF: number }>;

const RECEIVERS = ["FreshMart DC", "Sunbelt Markets", "Harbor Foods", "GreenGrocer DC"];
const field = "h-10 w-full rounded-lg border border-line bg-card-soft px-3 text-sm outline-none focus:border-forest";

/** The Today board plus what you can do on it: open a trip, report a rejection, add a delivery, start a new day. */
export function TodayBoard({ trucks, trips, window, timeZone, defaults }: { trucks: Truck[]; trips: BoardTrip[]; window: { start: number; end: number }; timeZone: string; defaults: Defaults }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [pending, start] = useTransition();
  const trip = trips.find((t) => t.id === openId);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-muted">Click a delivery to report a rejection, or a rescue to open it.</p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setAdding(true)}>
            <Plus className="size-4" /> New delivery
          </Button>
          <Button
            variant="outline"
            disabled={pending}
            onClick={() =>
              start(async () => {
                if (globalThis.confirm("Start a new day? Today's trucks are replaced; your loads, deals and payments stay on Loads and Money.")) {
                  await startNewDay();
                  toast.success("A new day has started.");
                }
              })
            }
          >
            <RotateCcw className="size-4" /> {pending ? "Starting…" : "Start a new day"}
          </Button>
        </div>
      </div>
      <section className="hidden overflow-hidden rounded-xl border border-line bg-card-soft p-2 shadow-soft sm:block" aria-label="Today's trucks">
        {/* Phones see the list below instead. Mounted at once: a scheduler created after hydration came up empty. */}
        <Board trucks={trucks} trips={trips} window={window} timeZone={timeZone} onTripClick={setOpenId} />
      </section>
      <TripList trucks={trucks} trips={trips} onOpen={setOpenId} />
      <Dialog open={!!trip} onOpenChange={(o) => !o && setOpenId(null)}>
        <DialogContent className="max-w-lg">{trip && <TripDetails trip={trip} truck={trucks.find((t) => t.id === trip.truckId)!} defaults={defaults} onDone={() => setOpenId(null)} />}</DialogContent>
      </Dialog>
      <Dialog open={adding} onOpenChange={setAdding}>
        <DialogContent className="max-w-md">
          <NewDelivery trucks={trucks} onDone={() => setAdding(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}

const KIND: Record<string, string> = { pickup: "Pick up", delivery: "Delivery", rejected: "Rejected", redelivery: "New delivery" };

function TripDetails({ trip, truck, defaults, onDone }: { trip: BoardTrip; truck: Truck; defaults: Defaults; onDone: () => void }) {
  return (
    <>
      <DialogHeader>
        <DialogTitle className="font-heading text-2xl font-normal">
          {truck.name} · {KIND[trip.kind]}
        </DialogTitle>
        <DialogDescription>
          {trip.place} · {clock(trip.start)} to {clock(trip.end)} · {trip.crop ?? truck.crop}, {trip.pallets ?? truck.pallets} pallets
        </DialogDescription>
      </DialogHeader>
      {trip.kind === "delivery" ? (
        <RejectForm trip={trip} d={defaults[trip.crop ?? truck.crop]} onDone={onDone} />
      ) : trip.loadId ? (
        <Link href={`/loads/${trip.loadId}`} className="inline-flex h-11 items-center justify-center rounded-lg bg-forest px-5 text-card-soft hover:bg-forest-deep">
          Open the rescue
        </Link>
      ) : (
        <p className="text-sm text-ink-muted">A pickup from the farm. Nothing to do here.</p>
      )}
    </>
  );
}

function RejectForm({ trip, d, onDone }: { trip: BoardTrip; d: Defaults[string]; onDone: () => void }) {
  const router = useRouter();
  const form = useRef<HTMLFormElement>(null);
  const [vals, setVals] = useState(d);
  const [file, setFile] = useState<File | null>(null);
  const [reading, startRead] = useTransition();
  const [saving, startSave] = useTransition();
  const [readBy, setReadBy] = useState<string | null>(null);

  const read = (f: File) =>
    startRead(async () => {
      const fd = new FormData();
      fd.set("tripId", trip.id);
      fd.set("file", f);
      const r = await readReport(fd);
      if (!r.ok) return void toast.error(r.error);
      setVals(r.findings);
      setReadBy(f.name);
    });

  return (
    <form
      ref={form}
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        fd.set("tripId", trip.id);
        if (file) fd.set("file", file);
        startSave(async () => {
          const r = await reportRejection(fd);
          if (!r.ok) return void toast.error(r.error);
          onDone();
          router.push(`/loads/${r.loadId}`);
        });
      }}
    >
      <p className="text-sm text-ink-muted">Did {trip.place} turn this load away? Report it and your agent starts looking for a new buyer before it spoils.</p>
      <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-forest/40 p-3 text-sm hover:bg-forest-tint/50">
        <FileUp className="size-5 text-forest" />
        <span className="flex-1">{reading ? <span className="shimmer-text">Reading it…</span> : readBy ? <>Read by the AI: <b>{readBy}</b>. Check the details below.</> : "Attach the inspection report or a photo of it (optional). The AI fills in the details."}</span>
        <input
          type="file"
          accept="application/pdf,image/png,image/jpeg,image/webp,text/csv"
          className="sr-only"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            setFile(f);
            read(f);
          }}
        />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="col-span-2 text-sm">
          Why they rejected it
          <input name="reason" required value={vals.reason} onChange={(e) => setVals({ ...vals, reason: e.target.value })} className={`${field} mt-1`} />
        </label>
        <label className="text-sm">
          Grade
          <input name="grade" required value={vals.grade} onChange={(e) => setVals({ ...vals, grade: e.target.value })} className={`${field} mt-1`} />
        </label>
        <label className="text-sm">
          % soft or damaged
          <input name="softPct" type="number" min={0} max={100} required value={vals.softPct} onChange={(e) => setVals({ ...vals, softPct: Number(e.target.value) })} className={`${field} mt-1`} />
        </label>
        <label className="text-sm">
          Pulp temperature (°F)
          <input name="pulpF" type="number" min={20} max={90} required value={vals.pulpF} onChange={(e) => setVals({ ...vals, pulpF: Number(e.target.value) })} className={`${field} mt-1`} />
        </label>
      </div>
      <Button type="submit" size="lg" className="h-11 w-full" disabled={saving || reading}>
        {saving ? "Opening the rescue…" : (
          <>
            <Sparkles className="size-4" /> Report rejection and open a rescue
          </>
        )}
      </Button>
    </form>
  );
}

function NewDelivery({ trucks, onDone }: { trucks: Truck[]; onDone: () => void }) {
  const [pending, start] = useTransition();
  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        start(async () => {
          const r = await addDelivery(fd);
          if (!r.ok) return void toast.error(r.error);
          toast.success("Delivery added to the board.");
          onDone();
        });
      }}
    >
      <DialogHeader>
        <DialogTitle className="font-heading text-2xl font-normal">New delivery</DialogTitle>
        <DialogDescription>Put a truck&apos;s next delivery on today&apos;s board.</DialogDescription>
      </DialogHeader>
      <label className="block text-sm">
        Truck
        <select name="truckId" className={`${field} mt-1`}>
          {trucks.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name} · {t.crop}, {t.pallets} pallets
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm">
        Receiver
        <select name="place" className={`${field} mt-1`}>
          {RECEIVERS.map((r) => (
            <option key={r}>{r}</option>
          ))}
        </select>
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="text-sm">
          Arrives in
          <select name="startIn" defaultValue="1" className={`${field} mt-1`}>
            {[0, 1, 2, 3, 4, 5].map((h) => (
              <option key={h} value={h}>
                {h === 0 ? "now" : `${h} h`}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          Unloading takes
          <select name="hours" defaultValue="2" className={`${field} mt-1`}>
            {[1, 2, 3].map((h) => (
              <option key={h} value={h}>
                {h} h
              </option>
            ))}
          </select>
        </label>
      </div>
      <Button type="submit" size="lg" className="h-11 w-full" disabled={pending}>
        {pending ? "Adding…" : "Add to the board"}
      </Button>
    </form>
  );
}

const TONE: Record<string, string> = {
  pickup: "border-line bg-card-soft text-ink-muted",
  delivery: "border-forest/25 bg-forest-tint text-forest",
  rejected: "border-spoiling/40 bg-spoiling-tint text-spoiling",
  redelivery: "border-dashed border-forest bg-forest-tint/60 text-forest",
};

/** Phones: today's trips in time order, with a "Now" divider. Each opens the same dialog as the board. */
function TripList({ trucks, trips, onOpen }: { trucks: Truck[]; trips: BoardTrip[]; onOpen: (id: string) => void }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    // The time is read in the browser after mount (never during render), so server and browser agree.
    const first = setTimeout(() => setNow(Date.now()), 0);
    const t = setInterval(() => setNow(Date.now()), 60_000);
    return () => {
      clearTimeout(first);
      clearInterval(t);
    };
  }, []);
  const sorted = [...trips].sort((a, b) => a.start - b.start);
  const nowAt = now === null ? -1 : sorted.findIndex((t) => t.start > now);
  return (
    <ol className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-card-soft shadow-soft sm:hidden" aria-label="Today's trips">
      {sorted.map((t, i) => {
        const truck = trucks.find((x) => x.id === t.truckId)!;
        return (
          <li key={t.id}>
            {i === nowAt ? (
              <p className="flex items-center gap-2 bg-forest-tint/50 px-4 py-1.5 text-xs font-medium text-forest">
                <span className="size-1.5 rounded-full bg-forest" /> Now · {clock(now!)}
              </p>
            ) : null}
            <button type="button" onClick={() => onOpen(t.id)} className="flex w-full items-center gap-3 px-4 py-3 text-left active:bg-forest-tint/40">
              <span className="w-16 shrink-0 text-sm tabular-nums text-ink-muted">{clock(t.start)}</span>
              <span className="min-w-0 flex-1">
                <span className="block font-heading text-lg leading-tight">{truck.name}</span>
                <span className="block truncate text-xs text-ink-muted">
                  {truck.crop} · {t.place}
                </span>
              </span>
              <span className={cn("shrink-0 rounded-full border px-2 py-0.5 text-xs", TONE[t.kind])}>{KIND[t.kind]}</span>
              <ChevronRight className="size-4 shrink-0 text-ink-muted" />
            </button>
          </li>
        );
      })}
      {now !== null && nowAt === -1 ? (
        <li className="flex items-center gap-2 bg-forest-tint/50 px-4 py-1.5 text-xs font-medium text-forest">
          <span className="size-1.5 rounded-full bg-forest" /> Now · {clock(now)}
        </li>
      ) : null}
    </ol>
  );
}
