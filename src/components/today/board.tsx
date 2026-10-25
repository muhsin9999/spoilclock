"use client";

import { useEffect, useRef } from "react";
import type { Scheduler as BryntumScheduler } from "@bryntum/scheduler";
import type { TripKind, Truck } from "@/lib/demo-day";

export type Trip = { id: string; truckId: string; kind: TripKind; place: string; start: number; end: number };

// Bryntum's prebuilt bundle is served from public/bryntum (scripts/copy-bryntum.mjs) and loaded at
// runtime, so the bundler never processes it. Only its types are imported above.
const loadBryntum = () => import(/* webpackIgnore: true */ /* turbopackIgnore: true */ "/bryntum/scheduler.module.js" as string) as Promise<typeof import("@bryntum/scheduler")>;

const KIND_LABEL: Record<Trip["kind"], string> = {
  pickup: "Pick up",
  delivery: "Delivery",
  rejected: "Rejected",
  redelivery: "New delivery",
};

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

type Props = { trucks: Truck[]; trips: Trip[]; window: { start: number; end: number }; timeZone: string; onTripClick?: (id: string) => void };

export function Board({ trucks, trips, window: win, timeZone, onTripClick }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const click = useRef(onTripClick);
  useEffect(() => {
    click.current = onTripClick;
  }, [onTripClick]);

  useEffect(() => {
    let scheduler: BryntumScheduler | undefined;
    let cancelled = false;
    loadBryntum().then(({ Scheduler }) => {
      if (cancelled || !host.current) return;
      // Phones: a narrow truck column and a timeline that scrolls sideways inside its card.
      const narrow = host.current.clientWidth < 640;
      scheduler = new Scheduler({
        appendTo: host.current,
        project: { timeZone },
        readOnly: true,
        startDate: new Date(win.start),
        endDate: new Date(win.end),
        rowHeight: 96,
        barMargin: 22,
        forceFit: !narrow,
        visibleDate: narrow ? { date: new Date(), block: "center" } : undefined,
        eventStyle: null,
        zoomOnMouseWheel: false,
        zoomOnTimeAxisDoubleClick: false,
        viewPreset: {
          base: "hourAndDay",
          tickWidth: narrow ? 64 : 88,
          headers: [{ unit: "hour", dateFormat: "h A" }],
        },
        features: {
          timeRanges: { showCurrentTimeLine: { name: "Now" } },
          eventTooltip: { template: ({ eventRecord }: { eventRecord: { name: string; getData(k: string): unknown } }) => `${esc(eventRecord.name)} · ${esc(String(eventRecord.getData("place")))}` },
          scheduleTooltip: false,
          cellMenu: false,
          eventMenu: false,
          scheduleMenu: false,
          headerMenu: false,
          timeAxisHeaderMenu: false,
          sort: false,
          stripe: false,
          columnLines: true,
        },
        columns: [
          {
            text: "",
            field: "name",
            width: narrow ? 118 : 230,
            htmlEncode: false,
            renderer: ({ record }: { record: { getData(k: string): unknown } }) =>
              `<div class="sc-truck"><div class="sc-truck-name">${esc(String(record.getData("name")))}</div><div class="sc-truck-load">${esc(String(record.getData("load")))}</div></div>`,
          },
        ],
        resources: trucks.map((t) => ({ id: t.id, name: t.name, load: `${t.crop} · ${t.pallets} pallets` })),
        events: trips.map((t) => ({
          id: t.id,
          resourceId: t.truckId,
          startDate: new Date(t.start),
          endDate: new Date(t.end),
          name: KIND_LABEL[t.kind],
          place: t.place,
          cls: `sc-trip sc-${t.kind}`,
        })),
        listeners: { eventClick: ({ eventRecord }: { eventRecord: { id: string | number } }) => click.current?.(String(eventRecord.id)) },
        eventRenderer: ({ eventRecord }: { eventRecord: { name: string; getData(k: string): unknown } }) =>
          `<span class="sc-dot"></span><span class="sc-trip-text"><b>${esc(eventRecord.name)}</b><span>${esc(String(eventRecord.getData("place")))}</span></span>`,
      });
    });
    return () => {
      cancelled = true;
      scheduler?.destroy();
    };
  }, [trucks, trips, win.start, win.end, timeZone]);

  return <div ref={host} className="sc-board h-[26.5rem]" />;
}
