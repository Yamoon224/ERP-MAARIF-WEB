import { describe, expect, it } from "vitest";
import {
  currentMonth,
  formatAverage,
  formatDate,
  formatMonth,
  formatPercent,
  monthsBetween,
  today,
} from "@/lib/utils/format";

describe("monthsBetween", () => {
  it("lists every month of a school year, bounds included", () => {
    const months = monthsBetween("2025-10-01", "2026-06-30");

    expect(months).toHaveLength(9);
    expect(months[0]).toBe("2025-10");
    expect(months[2]).toBe("2025-12");
    expect(months[3]).toBe("2026-01");
    expect(months[8]).toBe("2026-06");
  });

  it("returns a single month when both dates fall in it", () => {
    expect(monthsBetween("2025-11-03", "2025-11-28")).toEqual(["2025-11"]);
  });

  it("returns nothing when the end precedes the start", () => {
    expect(monthsBetween("2026-06-01", "2025-10-01")).toEqual([]);
  });
});

describe("date formatting", () => {
  it("formats an ISO date without shifting it across time zones", () => {
    expect(formatDate("2025-11-03")).toBe("03/11/2025");
    expect(formatDate("2025-11-03T23:30:00+00:00")).toBe("03/11/2025");
    expect(formatDate(null)).toBe("—");
  });

  it("writes a month in French", () => {
    expect(formatMonth("2025-10")).toBe("octobre 2025");
    expect(formatMonth("2026-01")).toBe("janvier 2026");
  });

  it("pads the current month and day", () => {
    expect(currentMonth(new Date(2026, 0, 5))).toBe("2026-01");
    expect(today(new Date(2026, 0, 5))).toBe("2026-01-05");
  });
});

describe("indicators", () => {
  it("shows a dash when there is nothing to average", () => {
    expect(formatAverage(null)).toBe("—");
    expect(formatAverage(14.5)).toBe("14.50/20");
    expect(formatPercent(null)).toBe("—");
  });
});
