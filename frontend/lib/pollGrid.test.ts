import { describe, expect, it } from "vitest";
import { cellsForRange, gridRows, mergeContiguous } from "./pollGrid";

describe("cellsForRange", () => {
  it("splits a range into 30-minute cells", () => {
    expect(cellsForRange("10:00", "11:30")).toEqual([
      { startTime: "10:00", endTime: "10:30" },
      { startTime: "10:30", endTime: "11:00" },
      { startTime: "11:00", endTime: "11:30" },
    ]);
  });

  it("allows an end of 24:00 and drops a partial last cell", () => {
    expect(cellsForRange("23:00", "24:00")).toHaveLength(2);
    expect(cellsForRange("10:00", "10:45")).toHaveLength(1);
    expect(cellsForRange("12:00", "10:00")).toEqual([]);
  });
});

describe("mergeContiguous", () => {
  it("joins back-to-back cells and keeps gaps apart", () => {
    const merged = mergeContiguous([
      { id: "c", startTime: "17:00", endTime: "17:30" },
      { id: "a", startTime: "16:00", endTime: "16:30" },
      { id: "b", startTime: "16:30", endTime: "17:00" },
      { id: "d", startTime: "19:00", endTime: "19:30" },
    ]);
    expect(merged.map((m) => [m.startTime, m.endTime, m.parts.map((p) => p.id).join("")])).toEqual([
      ["16:00", "17:30", "abc"],
      ["19:00", "19:30", "d"],
    ]);
  });
});

describe("gridRows", () => {
  it("dedupes and sorts rows across days", () => {
    const rows = gridRows([
      { startTime: "14:00", endTime: "17:00" },
      { startTime: "10:00", endTime: "12:00" },
      { startTime: "14:00", endTime: "17:00" },
    ]);
    expect(rows.map((r) => r.startTime)).toEqual(["10:00", "14:00"]);
  });
});
