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
}

export interface CellRef {
  row: number;
  col: number;
}
