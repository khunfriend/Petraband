import { describe, expect, it } from "vitest";
import { accessoryTotals, type InstrumentAccessories } from "./accessories";

const types = [
  { id: "stand", name: "สแตนโน้ต", perPlayer: 1 },
  { id: "chair", name: "เก้าอี้", perPlayer: 0 },
];

describe("accessoryTotals", () => {
  it("counts per-person accessories from the number of people", () => {
    expect(accessoryTotals(types, [], 3, {})).toEqual([
      { id: "stand", name: "สแตนโน้ต", count: 3 },
      { id: "chair", name: "เก้าอี้", count: 0 },
    ]);
  });

  it("adds per-instrument counts times the players on that position", () => {
    const rows: InstrumentAccessories[] = [
      { name: "ระนาดเอก", accessories: { chair: 1 } },
      { name: "ฆ้องวงใหญ่", accessories: { chair: 1, stand: 1 } },
    ];
    const totals = accessoryTotals(types, rows, 4, { ระนาดเอก: 2, ฆ้องวงใหญ่: 1 });
    expect(totals).toEqual([
      { id: "stand", name: "สแตนโน้ต", count: 5 },
      { id: "chair", name: "เก้าอี้", count: 3 },
    ]);
  });

  it("ignores positions with no settings and unknown accessory ids", () => {
    const rows = [{ name: "ขิม", accessories: { gone: 9 } }];
    expect(accessoryTotals(types, rows, 1, { ขิม: 1, จะเข้: 1 })[1].count).toBe(0);
  });
});
