import { describe, expect, it } from "vitest";
import { autoSlug, cleanCustomSlug, dateSuffix, englishNameError, looksLikeId, slugify } from "./slug";

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
  it("cleanCustomSlug tidies typed values", () => {
    expect(cleanCustomSlug("CBS night 2025")).toBe("cbs-night-2025");
  });
  it("cleanCustomSlug only takes English", () => {
    expect(cleanCustomSlug("ลาวดวงเดือน")).toBe("");
    expect(cleanCustomSlug("CBS ไนท์")).toBe("");
    expect(englishNameError("")).toBe("กรอกชื่อภาษาอังกฤษ");
    expect(englishNameError("ลาว")).not.toBeNull();
    expect(englishNameError("Lao Duang Duen")).toBeNull();
  });
  it("looksLikeId tells cuids from slugs", () => {
    expect(looksLikeId("cmv0u7jvk000v1h767lhvsspd")).toBe(true);
    expect(looksLikeId("cbs-night-2569-11-12")).toBe(false);
    expect(looksLikeId("งานวิชาภาคการตลาด-2569-11-10")).toBe(false);
  });
});
