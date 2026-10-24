"use client";
import { useEffect, useState } from "react";

/** The current time, starting from the server's `now` so the first render matches, then ticking. */
export function useNow(serverNow: number, everyMs = 1000) {
  const [now, setNow] = useState(serverNow);
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), everyMs);
    return () => clearInterval(id);
  }, [everyMs]);
  return now;
}
