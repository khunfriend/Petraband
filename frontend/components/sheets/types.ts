/** The site font; older sheets may still name Sarabun or Roboto. */
export const DEFAULT_FONT = "IBM Plex Sans Thai";
const LEGACY_FONTS = new Set(["Sarabun", "Roboto", DEFAULT_FONT]);

/** CSS font-family for a cell: legacy/default names map to the loaded site font. */
export function cssFont(font?: string | null): string {
  return !font || LEGACY_FONTS.has(font) ? "var(--font-plex), system-ui, sans-serif" : font;
}

export interface CellStyle {
  fontFamily?: string;
  fontSize?: number;
  isBold?: boolean;
  isItalic?: boolean;
  isUnderline?: boolean;
  textAlign?: "left" | "center" | "right";
  verticalAlign?: "top" | "middle" | "bottom";
  wrapText?: boolean;
  textColor?: string;
  highlightColor?: string | null;
  // CSS border shorthand per side, e.g. "1px solid #000000"; "" means none.
  borderTop?: string;
  borderRight?: string;
  borderBottom?: string;
  borderLeft?: string;
}

export interface CellRun {
  text: string;
  fontSize?: number;
  isBold?: boolean;
  isItalic?: boolean;
  isUnderline?: boolean;
  textColor?: string;
}

export interface CellData {
  cellValue: string | null;
  richValue: CellRun[] | null;
  style: CellStyle | null;
}

export interface MergedCellData {
  id: string;
  startRow: number;
  startCol: number;
  endRow: number;
  endCol: number;
}

export interface SheetSummary {
  id: string;
  name: string;
  sheetOrder: number;
  columnCount: number;
  rowCount: number;
  isPublished: boolean;
}

export interface FullSheet {
  id: string;
  name: string;
  sheetOrder: number;
  columnCount: number;
  rowCount: number;
  cells: Array<{
    id: string;
    rowIndex: number;
    colIndex: number;
    cellValue: string | null;
    richValue: CellRun[] | null;
    style: (CellStyle & { id: string; cellId: string }) | null;
  }>;
  mergedCells: MergedCellData[];
  columnWidths: Array<{ colIndex: number; widthPx: number }>;
  rowHeights: Array<{ rowIndex: number; heightPx: number }>;
  /** Margin text before / after a row; absent rows have none. */
  rowNotes?: Array<{ rowIndex: number; leftText: string; rightText: string }>;
}

export interface CellRef {
  row: number;
  col: number;
}
