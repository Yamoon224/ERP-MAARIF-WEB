import { describe, expect, it } from "vitest";
import { niceScale, OTHER_COLOR, seriesColor, toSlices } from "@/components/ui/charts/chartUtils";

describe("niceScale", () => {
  it("rounds the axis up to a clean number with evenly spaced ticks", () => {
    expect(niceScale(1_000_000)).toEqual({ max: 1000000, ticks: [0, 250000, 500000, 750000, 1000000] });
    expect(niceScale(830000)).toEqual({ max: 1000000, ticks: [0, 200000, 400000, 600000, 800000, 1000000] });
    expect(niceScale(1_800_000).max).toBe(2_000_000);
    expect(niceScale(23).ticks).toEqual([0, 5, 10, 15, 20, 25]);
  });

  it("keeps whole-number ticks for headcounts", () => {
    expect(niceScale(3, true)).toEqual({ max: 3, ticks: [0, 1, 2, 3] });
    expect(niceScale(1, true)).toEqual({ max: 1, ticks: [0, 1] });
    expect(niceScale(42, true).max).toBe(50);
  });

  it("stays drawable when every value is zero", () => {
    expect(niceScale(0).max).toBeGreaterThan(0);
    expect(niceScale(0, true).ticks).toEqual([0, 1]);
  });
});

describe("toSlices", () => {
  const item = (key: string, value: number) => ({ key, label: key.toUpperCase(), value });

  it("drops empty parts and puts the biggest first, colored in the fixed series order", () => {
    const slices = toSlices([item("a", 10), item("b", 0), item("c", 30)]);

    expect(slices.map((slice) => slice.key)).toEqual(["c", "a"]);
    expect(slices.map((slice) => slice.color)).toEqual([seriesColor(0), seriesColor(1)]);
  });

  it("folds everything past six parts into a neutral 'Autres' part", () => {
    const items = ["a", "b", "c", "d", "e", "f", "g", "h"].map((key, index) => item(key, 100 - index * 10));

    const slices = toSlices(items);

    expect(slices).toHaveLength(6);
    expect(slices[5]).toMatchObject({ key: "other", label: "Autres", color: OTHER_COLOR, value: 50 + 40 + 30 });
    expect(slices.slice(0, 5).map((slice) => slice.key)).toEqual(["a", "b", "c", "d", "e"]);
  });

  it("keeps exactly six parts as they are", () => {
    const slices = toSlices(["a", "b", "c", "d", "e", "f"].map((key, index) => item(key, 60 - index)));

    expect(slices).toHaveLength(6);
    expect(slices.some((slice) => slice.key === "other")).toBe(false);
  });
});
