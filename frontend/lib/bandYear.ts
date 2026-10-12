// The band's year runs 1 June → 31 May (the academic year), so dashboard
// numbers are counted per band year, e.g. 1 มิ.ย. 2569 – 31 พ.ค. 2570.

/** The band year (Gregorian year it starts in) that a "YYYY-MM-DD" date falls in. */
export function bandYearOf(date: string): number {
  const [y, m] = date.split("-").map(Number);
  return m >= 6 ? y : y - 1;
}

/** [start, end) of a band year as UTC dates, matching @db.Date values. */
export function bandYearRange(year: number): { start: Date; end: Date } {
  return { start: new Date(Date.UTC(year, 5, 1)), end: new Date(Date.UTC(year + 1, 5, 1)) };
}

/** "1 มิ.ย. 2569 – 31 พ.ค. 2570" */
export function bandYearLabel(year: number): string {
  return `1 มิ.ย. ${year + 543} – 31 พ.ค. ${year + 544}`;
}
