"use client";

import { useEffect, useRef } from "react";
import type { Scheduler as BryntumScheduler } from "@bryntum/scheduler";
import type { Trip, Truck } from "@/lib/demo-day";

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

type Props = { trucks: Truck[]; trips: Trip[]; window: { start: number; end: number }; timeZone: string };

export function Board({ trucks, trips, window: win, timeZone }: Props) {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let scheduler: BryntumScheduler | undefined;
    let cancelled = false;
    loadBryntum().then(({ Scheduler }) => {
      if (cancelled || !host.current) return;
      scheduler = new Scheduler({
        appendTo: host.current,
        project: { timeZone },
        readOnly: true,
        startDate: new Date(win.start),
        endDate: new Date(win.end),
        rowHeight: 96,
        barMargin: 22,
        forceFit: true,
        eventStyle: null,
        zoomOnMouseWheel: false,
        zoomOnTimeAxisDoubleClick: false,
        viewPreset: {
          base: "hourAndDay",
          tickWidth: 88,
          headers: [{ unit: "hour", dateFormat: "h A" }],
        },
        features: {
          timeRanges: { showCurrentTimeLine: { name: "Now" } },
          eventTooltip: false,
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
            width: 230,
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
          name: `${KIND_LABEL[t.kind]} · ${t.place}`,
          cls: `sc-trip sc-${t.kind}`,
        })),
        eventRenderer: ({ eventRecord }: { eventRecord: { name: string } }) => `<span class="sc-dot"></span><span class="sc-trip-text">${esc(eventRecord.name)}</span>`,
      });
    });
    return () => {
      cancelled = true;
      scheduler?.destroy();
    };
  }, [trucks, trips, win.start, win.end, timeZone]);

  return <div ref={host} className="sc-board h-[26.5rem]" />;
}
