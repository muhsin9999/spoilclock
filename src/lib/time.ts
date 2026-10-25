// Times are shown in the farm's own clock (Salinas, CA).
export const FARM_TZ = "America/Los_Angeles";
export const clock = (t: number) => new Date(t).toLocaleTimeString("en-US", { timeZone: FARM_TZ, hour: "numeric", minute: "2-digit" });
export const day = (t: number) => new Date(t).toLocaleDateString("en-US", { timeZone: FARM_TZ, month: "short", day: "numeric" });

/** For server components: marks the render as per-request and returns the request time. */
export async function requestNow() {
  const { connection } = await import("next/server");
  await connection();
  return Date.now();
}
