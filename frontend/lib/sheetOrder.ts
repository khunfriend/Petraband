export const SHEET_ORDER = ["เครื่องนำ", "เครื่องตาม", "เครื่องสาย/ขลุ่ย"];

export function sheetRank(name: string): number {
  const i = SHEET_ORDER.indexOf(name);
  return i === -1 ? SHEET_ORDER.length : i;
}

export function sortSheetsByCanonicalOrder<T extends { name: string; sheetOrder: number }>(
  sheets: T[]
): T[] {
  return sheets
    .slice()
    .sort((a, b) => sheetRank(a.name) - sheetRank(b.name) || a.sheetOrder - b.sheetOrder);
}
