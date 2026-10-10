// Who is free for each practice session ("ใครว่าง" sheet). A member's own
// answer on the timetable wins; otherwise it comes from the availability polls
// of the performance; otherwise it is unknown.

import { mergeContiguous, toMin } from "@/lib/pollGrid";

export type Availability = "yes" | "no" | null;

export type PollAnswers = {
  /** Poll cells (30-minute steps) by date "YYYY-MM-DD". */
  cells: { date: string; startTime: string; endTime: string; availableUserIds: string[] }[];
  /** Everyone who answered anything in this poll. */
  responderIds: string[];
};

/**
 * What the polls say about `userId` for one session. Polls are tried in the
 * order given (the schedule's own poll first); the first one that offered the
 * whole session and that the member answered decides. A session is "yes" only
 * when every poll cell inside it was marked free.
 */
export function availabilityFromPolls(
  polls: PollAnswers[],
  date: string,
  startTime: string,
  endTime: string,
  userId: string,
): Availability {
  const start = toMin(startTime);
  const end = toMin(endTime);
  for (const poll of polls) {
    if (!poll.responderIds.includes(userId)) continue;
    const onDay = poll.cells.filter((c) => c.date === date);
    const covered = mergeContiguous(onDay).some((r) => toMin(r.startTime) <= start && toMin(r.endTime) >= end);
    if (!covered) continue;
    const inside = onDay.filter((c) => toMin(c.startTime) < end && toMin(c.endTime) > start);
    return inside.every((c) => c.availableUserIds.includes(userId)) ? "yes" : "no";
  }
  return null;
}

/** Thai day-of-week colours (pastel), as on printed practice sheets. Sunday = 0. */
export const THAI_DAY_TINT = [
  "#fbd5d5", // อาทิตย์ — red
  "#fdf3c4", // จันทร์ — yellow
  "#f9d6ec", // อังคาร — pink
  "#d5f0d8", // พุธ — green
  "#fde0c7", // พฤหัสบดี — orange
  "#cdeefb", // ศุกร์ — blue
  "#e6d9f7", // เสาร์ — purple
];
