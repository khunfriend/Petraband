// Shared bits of the practice roll call ("เช็คชื่อ").

export const STATUS_LABEL = { PRESENT: "มา", LATE: "สาย", EXCUSED: "ลา", ABSENT: "ขาด" } as const;
export type AttendanceStatusKey = keyof typeof STATUS_LABEL;

const WEEKDAY = ["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์"];

/** "อาทิตย์ 12 ต.ค. 69" for a "YYYY-MM-DD" practice date. */
export function attendanceDayLabel(date: string) {
  const d = new Date(`${date}T00:00:00Z`);
  return `${WEEKDAY[d.getUTCDay()]} ${d.toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit", timeZone: "UTC" })}`;
}
