import { describe, expect, it } from "vitest";
import { availabilityFromPolls, type PollAnswers } from "./practiceAvailability";

const cells = (date: string, from: number, to: number, free: string[]) =>
  Array.from({ length: (to - from) * 2 }, (_, i) => {
    const m = from * 60 + i * 30;
    const t = (x: number) => `${String(Math.floor(x / 60)).padStart(2, "0")}:${String(x % 60).padStart(2, "0")}`;
    return { date, startTime: t(m), endTime: t(m + 30), availableUserIds: free };
  });

describe("availabilityFromPolls", () => {
  const poll: PollAnswers = {
    cells: [...cells("2026-10-16", 13, 15, ["a", "b"]), ...cells("2026-10-16", 15, 17, ["a"])],
    responderIds: ["a", "b"],
  };

  it("is yes only when free for the whole session", () => {
    expect(availabilityFromPolls([poll], "2026-10-16", "13:00", "17:00", "a")).toBe("yes");
    expect(availabilityFromPolls([poll], "2026-10-16", "13:00", "17:00", "b")).toBe("no");
    expect(availabilityFromPolls([poll], "2026-10-16", "13:00", "15:00", "b")).toBe("yes");
  });

  it("is unknown when the member never answered", () => {
    expect(availabilityFromPolls([poll], "2026-10-16", "13:00", "17:00", "c")).toBeNull();
  });

  it("is unknown when the poll didn't offer the whole session", () => {
    expect(availabilityFromPolls([poll], "2026-10-16", "12:00", "17:00", "a")).toBeNull();
    expect(availabilityFromPolls([poll], "2026-10-17", "13:00", "17:00", "a")).toBeNull();
  });

  it("handles sessions not on the half hour", () => {
    expect(availabilityFromPolls([poll], "2026-10-16", "13:15", "14:45", "b")).toBe("yes");
  });

  it("falls through to the next poll", () => {
    const later: PollAnswers = { cells: cells("2026-10-17", 13, 17, ["c"]), responderIds: ["c"] };
    expect(availabilityFromPolls([poll, later], "2026-10-17", "13:00", "17:00", "c")).toBe("yes");
  });
});
