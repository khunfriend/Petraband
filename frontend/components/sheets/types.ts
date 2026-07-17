export interface CellStyle {
  fontFamily?: string;
  fontSize?: number;
  isBold?: boolean;
  isItalic?: boolean;
  isUnderline?: boolean;
  textAlign?: "left" | "center" | "right";
  textColor?: string;
  highlightColor?: string | null;
}

export interface CellData {
  cellValue: string | null;
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
