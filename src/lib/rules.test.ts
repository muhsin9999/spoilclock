import { describe, expect, it } from "vitest";
import { BUYERS } from "./buyers";
import { cannotTake, clampAsk, clampBid, dealAllowed } from "./rules";

const valley = BUYERS.find((b) => b.id === "valley")!;
const coastal = BUYERS.find((b) => b.id === "coastal")!;
// 10:00 Pacific on a fixed day, so dock hours are predictable.
const now = Date.parse("2026-11-03T18:00:00Z");
const load = { pallets: 16, softPct: 6, floorCents: 150_00, spoilsAt: now + 8 * 3_600_000, excluded: [] as string[] };

describe("rules", () => {
  it("never asks below the floor or above the last ask", () => {
    expect(clampAsk(120_00, 150_00)).toBe(150_00);
    expect(clampAsk(190_00, 150_00, 180_00)).toBe(180_00);
    expect(clampAsk(171_40, 150_00)).toBe(171_00);
  });
  it("keeps a buyer within its own brief", () => {
    expect(clampBid(valley, 999_00)).toBe(180_00);
    expect(clampBid(valley, 130_00, 150_00)).toBe(150_00);
  });
  it("rules out buyers that can't take the load", () => {
    expect(cannotTake(coastal, load, now)).toBe("Can take only 8 of 16 pallets");
    const night = Date.parse("2026-11-04T07:00:00Z"); // 11 PM Pacific
    expect(cannotTake(valley, { ...load, spoilsAt: night + 8 * 3_600_000 }, night)).toBeNull();
    expect(cannotTake({ ...coastal, brief: { ...coastal.brief, capacity: 20 } }, { ...load, spoilsAt: night + 8 * 3_600_000 }, night)).toBe("Dock closed by the time the truck arrives");
    expect(cannotTake(valley, { ...load, excluded: ["valley"] }, now)).toBe("Removed by you");
    expect(cannotTake(valley, { ...load, spoilsAt: now + 60 * 60_000 }, now)).toBe("Can't unload before the fruit spoils");
    expect(cannotTake(valley, load, now)).toBeNull();
  });
  it("only allows a deal at or above the floor", () => {
    expect(dealAllowed(valley, 149_00, load, now)).toBe(false);
    expect(dealAllowed(valley, 172_00, load, now)).toBe(true);
  });
});
