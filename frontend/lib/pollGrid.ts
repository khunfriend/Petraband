// Helpers for the when2meet-style availability poll grid.

export const POLL_STEP_MIN = 30;

export function toMin(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

export function fromMin(min: number): string {
  return `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
}

/** Cells of `step` minutes covering [start, end). "24:00" is allowed as an end. */
export function cellsForRange(start: string, end: string, step = POLL_STEP_MIN) {
  const out: { startTime: string; endTime: string }[] = [];
  for (let t = toMin(start); t + step <= toMin(end); t += step) {
    out.push({ startTime: fromMin(t), endTime: fromMin(t + step) });
  }
  return out;
}

type Timed = { startTime: string; endTime: string };

/** Joins back-to-back slots (10:00–10:30 + 10:30–11:00 → 10:00–11:00). Input must share a date. */
export function mergeContiguous<T extends Timed>(slots: T[]): { startTime: string; endTime: string; parts: T[] }[] {
  const sorted = [...slots].sort((a, b) => toMin(a.startTime) - toMin(b.startTime));
  const out: { startTime: string; endTime: string; parts: T[] }[] = [];
  for (const s of sorted) {
    const last = out[out.length - 1];
    if (last && last.endTime === s.startTime) {
      last.endTime = s.endTime;
      last.parts.push(s);
    } else {
      out.push({ startTime: s.startTime, endTime: s.endTime, parts: [s] });
    }
  }
  return out;
}

/** Row keys for the grid: every distinct start–end pair, in time order. */
export function gridRows(slots: Timed[]): Timed[] {
  const seen = new Map<string, Timed>();
  for (const s of slots) seen.set(`${s.startTime}|${s.endTime}`, { startTime: s.startTime, endTime: s.endTime });
  return [...seen.values()].sort((a, b) => toMin(a.startTime) - toMin(b.startTime) || toMin(a.endTime) - toMin(b.endTime));
}
