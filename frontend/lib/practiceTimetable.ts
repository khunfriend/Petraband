// Turns a practice schedule into the rows of the printed timetable:
// days that share the same time slots collapse into one date cell.

export type TimetableSlot = {
  id: string;
  startTime: string;
  endTime: string;
  label: string;
  /** "" = the schedule's location. */
  location?: string;
  isSpecial: boolean;
};

export type TimetableDay = { id: string; date: string; slots: TimetableSlot[] };

export type TimetableBlock = {
  /** Date labels, one per line in the date cell. Consecutive runs of 3+ days become "2–6 พ.ย.". */
  dateLines: string[];
  /** The merged days, in date order — for deleting one of them. */
  days: { id: string; date: string }[];
  slots: {
    id: string;
    /** This slot's id on every merged day — edit all of them together. */
    ids: string[];
    startTime: string;
    endTime: string;
    label: string;
    location: string;
    items: string[];
    isSpecial: boolean;
  }[];
};

const DAY_MS = 86_400_000;

function slotKey(slots: TimetableSlot[]): string {
  return slots.map((s) => `${s.startTime}|${s.endTime}|${s.isSpecial ? 1 : 0}|${s.location ?? ""}|${s.label.trim()}`).join("\n");
}

function fmtDay(d: Date): string {
  return d.toLocaleDateString("th-TH", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
}

function fmtRange(a: Date, b: Date): string {
  const month = (d: Date) => d.toLocaleDateString("th-TH", { month: "short", timeZone: "UTC" });
  return month(a) === month(b)
    ? `${a.getUTCDate()}–${b.getUTCDate()} ${month(b)}`
    : `${a.getUTCDate()} ${month(a)} – ${b.getUTCDate()} ${month(b)}`;
}

/** Date strings are @db.Date values serialised as UTC midnight. */
export function formatDateLines(isoDates: string[]): string[] {
  const dates = [...new Set(isoDates)].map((s) => new Date(s)).sort((a, b) => a.getTime() - b.getTime());
  const lines: string[] = [];
  let i = 0;
  while (i < dates.length) {
    let j = i;
    while (j + 1 < dates.length && dates[j + 1].getTime() - dates[j].getTime() === DAY_MS) j++;
    if (j - i >= 2) {
      lines.push(fmtRange(dates[i], dates[j]));
    } else {
      for (let k = i; k <= j; k++) lines.push(fmtDay(dates[k]));
    }
    i = j + 1;
  }
  return lines;
}

export function buildTimetable(days: TimetableDay[]): TimetableBlock[] {
  const groups = new Map<string, TimetableDay[]>();
  for (const day of days) {
    const sorted = [...day.slots];
    const key = slotKey(sorted);
    const list = groups.get(key);
    if (list) list.push(day);
    else groups.set(key, [day]);
  }

  return [...groups.values()]
    .map((group) => ({
      first: Math.min(...group.map((d) => new Date(d.date).getTime())),
      block: {
        dateLines: formatDateLines(group.map((d) => d.date)),
        days: group
          .map((d) => ({ id: d.id, date: d.date }))
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
        slots: group[0].slots.map((s, i) => ({
          id: s.id,
          ids: group.map((d) => d.slots[i].id),
          label: s.label,
          location: s.location ?? "",
          startTime: s.startTime,
          endTime: s.endTime,
          isSpecial: s.isSpecial,
          items: s.label.split("\n").map((l) => l.trim()).filter(Boolean),
        })),
      },
    }))
    .sort((a, b) => a.first - b.first)
    .map((g) => g.block);
}
