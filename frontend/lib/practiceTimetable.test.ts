import { describe, expect, it } from "vitest";
import { buildTimetable, formatDateLines, isBreakShow } from "./practiceTimetable";

const slot = (id: string, startTime: string, endTime: string, label = "") => ({
  id, startTime, endTime, label, isSpecial: false,
});

describe("formatDateLines", () => {
  it("collapses runs of three or more days", () => {
    const lines = formatDateLines([
      "2026-11-02T00:00:00.000Z", "2026-11-03T00:00:00.000Z", "2026-11-04T00:00:00.000Z",
      "2026-11-05T00:00:00.000Z", "2026-11-06T00:00:00.000Z",
    ]);
    expect(lines).toEqual(["2–6 พ.ย."]);
  });

  it("keeps separate or two-day dates on their own lines", () => {
    const lines = formatDateLines(["2026-10-29T00:00:00.000Z", "2026-10-22T00:00:00.000Z", "2026-10-28T00:00:00.000Z"]);
    expect(lines).toHaveLength(3);
    expect(lines[0]).toContain("22");
    expect(lines[2]).toContain("29");
  });
});

describe("buildTimetable", () => {
  it("merges days with identical slots and splits labels into items", () => {
    const slots = (p: string) => [slot(`${p}1`, "16:00", "16:10", "ขนเครื่อง"), slot(`${p}2`, "16:10", "17:10", "ลาวดวงเดือน\nลาวดวงดอกไม้\n")];
    const blocks = buildTimetable([
      { id: "a", date: "2026-10-22T00:00:00.000Z", slots: slots("a") },
      { id: "b", date: "2026-11-05T00:00:00.000Z", slots: [slot("b1", "16:00", "16:40", "เตรียมพร้อม")] },
      { id: "c", date: "2026-10-28T00:00:00.000Z", slots: slots("c") },
    ]);
    expect(blocks).toHaveLength(2);
    expect(blocks[0].dateLines).toHaveLength(2);
    expect(blocks[0].slots[1].items).toEqual(["ลาวดวงเดือน", "ลาวดวงดอกไม้"]);
    expect(blocks[1].slots[0].items).toEqual(["เตรียมพร้อม"]);
    expect(blocks[0].slots[1].ids).toEqual(["a2", "c2"]);
    expect(blocks[0].days.map((d) => d.id)).toEqual(["a", "c"]);
  });

  it("does not merge days whose slots are held in different places", () => {
    const blocks = buildTimetable([
      { id: "a", date: "2026-10-10T00:00:00.000Z", slots: [{ ...slot("a1", "13:00", "14:00"), location: "หอประชุม" }] },
      { id: "b", date: "2026-10-11T00:00:00.000Z", slots: [slot("b1", "13:00", "14:00")] },
    ]);
    expect(blocks).toHaveLength(2);
    expect(blocks[0].slots[0].location).toBe("หอประชุม");
    expect(blocks[1].slots[0].location).toBe("");
  });

  it("keeps days without slots", () => {
    const blocks = buildTimetable([{ id: "a", date: "2026-11-02T00:00:00.000Z", slots: [] }]);
    expect(blocks).toEqual([
      { dateLines: [expect.any(String)], days: [{ id: "a", date: "2026-11-02T00:00:00.000Z" }], note: "", slots: [] },
    ]);
  });

  it("merges days only when show and note match too", () => {
    const slot = (id: string, show: string) => ({ id, startTime: "13:00", endTime: "14:00", label: "", show, isSpecial: false });
    const blocks = buildTimetable([
      { id: "a", date: "2026-11-01T00:00:00.000Z", note: "ควรคล่องแล้ว", slots: [slot("a1", "TMR & GBY")] },
      { id: "b", date: "2026-11-07T00:00:00.000Z", note: "ควรคล่องแล้ว", slots: [slot("b1", "TMR & GBY")] },
      { id: "c", date: "2026-11-08T00:00:00.000Z", note: "พร้อมแสดง", slots: [slot("c1", "TMR & GBY")] },
      { id: "d", date: "2026-11-09T00:00:00.000Z", note: "พร้อมแสดง", slots: [slot("d1", "All Shows")] },
    ]);
    expect(blocks.map((b) => b.days.map((d) => d.id))).toEqual([["a", "b"], ["c"], ["d"]]);
    expect(blocks[0].note).toBe("ควรคล่องแล้ว");
    expect(blocks[0].slots[0]).toMatchObject({ show: "TMR & GBY", ids: ["a1", "b1"] });
  });

  it("spots break rows", () => {
    expect(isBreakShow("Break")).toBe(true);
    expect(isBreakShow("พักกินข้าว")).toBe(true);
    expect(isBreakShow("All Shows")).toBe(false);
  });
});
