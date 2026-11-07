import { describe, expect, it } from "vitest";
import { periodRange, presetAvailable } from "@/lib/kam/period";
const months = Array.from({ length: 18 }, (_, i) => new Date(Date.UTC(2025, i, 1)).toISOString().slice(0, 7)); // 2025-01..2026-06
describe("period presets", () => {
  it("Last 3M is the latest 3 months in the data", () => expect(periodRange("last3", months)).toEqual({ from: "2026-04", to: "2026-06" }));
  it("Last 12M crosses the year boundary", () => expect(periodRange("last12", months)).toEqual({ from: "2025-07", to: "2026-06" }));
  it("YTD runs Jan to the latest month of the latest year", () => expect(periodRange("ytd", months)).toEqual({ from: "2026-01", to: "2026-06" }));
  it("disables presets longer than the data", () => {
    expect(presetAvailable("last12", months.slice(0, 6))).toBe(false);
    expect(presetAvailable("last6", months.slice(0, 6))).toBe(true);
  });
});
