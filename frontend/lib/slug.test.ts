import { describe, expect, it } from "vitest";
import { autoSlug, dateSuffix, looksLikeId, slugify, slugMatchesBase } from "./slug";

describe("slugify", () => {
  it("lower-cases and dashes English", () => {
    expect(slugify("  CBS Night!! (2026) ")).toBe("cbs-night-2026");
  });
  it("keeps Thai, including vowels and tone marks", () => {
    expect(slugify("งานวิชาภาคการตลาด")).toBe("งานวิชาภาคการตลาด");
    expect(slugify("Sustainability Expo 2026 (ศูนย์ฯ)")).toBe("sustainability-expo-2026-ศูนย์ฯ");
  });
  it("returns empty for nothing usable", () => {
    expect(slugify("!!! ---")).toBe("");
  });
});

describe("autoSlug", () => {
  it("adds the first show date in the Buddhist year", () => {
    expect(autoSlug("CBS Night", new Date("2026-11-12T00:00:00.000Z"))).toBe("cbs-night-2569-11-12");
  });
  it("works without a date and without usable letters", () => {
    expect(autoSlug("CBS Night")).toBe("cbs-night");
    expect(autoSlug("???", new Date("2026-11-12T00:00:00.000Z"))).toBe("performance-2569-11-12");
  });
});

describe("helpers", () => {
  it("dateSuffix handles missing dates", () => {
    expect(dateSuffix(null)).toBe("");
  });
  it("slugMatchesBase accepts the base and its -N variants", () => {
    expect(slugMatchesBase("ลาวดวงเดือน", "ลาวดวงเดือน")).toBe(true);
    expect(slugMatchesBase("ลาวดวงเดือน-2", "ลาวดวงเดือน")).toBe(true);
    expect(slugMatchesBase("ลาวดวงเดือน-ใหม่", "ลาวดวงเดือน")).toBe(false);
    expect(slugMatchesBase("lao-duang-duen", "ลาวดวงเดือน")).toBe(false);
    expect(slugMatchesBase(null, "x")).toBe(false);
  });
  it("looksLikeId tells cuids from slugs", () => {
    expect(looksLikeId("cmv0u7jvk000v1h767lhvsspd")).toBe(true);
    expect(looksLikeId("cbs-night-2569-11-12")).toBe(false);
    expect(looksLikeId("งานวิชาภาคการตลาด-2569-11-10")).toBe(false);
  });
});
