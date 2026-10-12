import { describe, expect, it } from "vitest";
import { bandYearLabel, bandYearOf, bandYearRange } from "./bandYear";

describe("band year", () => {
  it("starts on 1 June", () => {
    expect(bandYearOf("2026-06-01")).toBe(2026);
    expect(bandYearOf("2026-05-31")).toBe(2025);
    expect(bandYearOf("2026-10-12")).toBe(2026);
    expect(bandYearOf("2027-01-15")).toBe(2026);
  });
  it("covers 1 June to 31 May", () => {
    const { start, end } = bandYearRange(2026);
    expect(start.toISOString().slice(0, 10)).toBe("2026-06-01");
    expect(end.toISOString().slice(0, 10)).toBe("2027-06-01");
    expect(bandYearLabel(2026)).toBe("1 มิ.ย. 2569 – 31 พ.ค. 2570");
  });
});
