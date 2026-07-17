"use client";

import { useEffect, useState } from "react";
import type { FullSheet, MergedCellData } from "./types";

interface Props {
  sheetId: string;
}

export function SheetViewer({ sheetId }: Props) {
  const [sheet, setSheet] = useState<FullSheet | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setSheet(null);
    fetch(`/api/sheets/${sheetId}`)
      .then((r) => r.json())
      .then((data) => setSheet(data.sheet ?? null))
      .finally(() => setLoading(false));
  }, [sheetId]);

  if (loading) return <p className="text-sm text-muted py-6 text-center">กำลังโหลด...</p>;
  if (!sheet) return <p className="text-sm text-muted py-6 text-center">ไม่พบข้อมูล</p>;

  // Build lookup maps
  const cellMap = new Map<string, FullSheet["cells"][number]>();
  for (const cell of sheet.cells) {
    cellMap.set(`${cell.rowIndex},${cell.colIndex}`, cell);
  }

  const mergeStartMap = new Map<string, MergedCellData>();
  const covered = new Set<string>();
  for (const m of sheet.mergedCells) {
    mergeStartMap.set(`${m.startRow},${m.startCol}`, m);
    for (let r = m.startRow; r <= m.endRow; r++) {
      for (let c = m.startCol; c <= m.endCol; c++) {
        if (r !== m.startRow || c !== m.startCol) covered.add(`${r},${c}`);
      }
    }
  }

  const colWidths = new Map(sheet.columnWidths.map((cw) => [cw.colIndex, cw.widthPx]));
  const rowHeights = new Map(sheet.rowHeights.map((rh) => [rh.rowIndex, rh.heightPx]));

  // Trim to rows/cols that have data
  let maxRow = 0;
  let maxCol = 0;
  for (const cell of sheet.cells) {
    if (cell.cellValue) {
      if (cell.rowIndex > maxRow) maxRow = cell.rowIndex;
      if (cell.colIndex > maxCol) maxCol = cell.colIndex;
    }
  }
  for (const m of sheet.mergedCells) {
    if (m.endRow > maxRow) maxRow = m.endRow;
    if (m.endCol > maxCol) maxCol = m.endCol;
  }

  const displayRows = Math.max(maxRow + 1, 1);
  const displayCols = Math.max(maxCol + 1, 1);

  return (
    <div className="overflow-auto">
      <table
        style={{
          borderCollapse: "collapse",
          tableLayout: "fixed",
          width: "100%",
        }}
      >
        <colgroup>
          {Array.from({ length: displayCols }, (_, c) => (
            <col key={c} style={{ width: colWidths.get(c) ?? 80 }} />
          ))}
        </colgroup>
        <tbody>
          {Array.from({ length: displayRows }, (_, r) => (
            <tr key={r} style={{ height: rowHeights.get(r) ?? 28 }}>
              {Array.from({ length: displayCols }, (_, c) => {
                const key = `${r},${c}`;
                if (covered.has(key)) return null;
                const merge = mergeStartMap.get(key);
                const rowSpan = merge ? merge.endRow - merge.startRow + 1 : 1;
                const colSpan = merge ? merge.endCol - merge.startCol + 1 : 1;
                const cell = cellMap.get(key);
                const s = cell?.style;
                return (
                  <td
                    key={c}
                    rowSpan={rowSpan}
                    colSpan={colSpan}
                    style={{
                      border: "1px solid #e5e7eb",
                      padding: "2px 6px",
                      fontFamily: s?.fontFamily ?? "Sarabun, sans-serif",
                      fontSize: s?.fontSize ?? 14,
                      fontWeight: s?.isBold ? "bold" : "normal",
                      fontStyle: s?.isItalic ? "italic" : "normal",
                      textDecoration: s?.isUnderline ? "underline" : "none",
                      textAlign: (s?.textAlign ?? "center") as React.CSSProperties["textAlign"],
                      color: s?.textColor ?? "#000000",
                      backgroundColor: s?.highlightColor ?? "transparent",
                      verticalAlign: "middle",
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {cell?.cellValue ?? ""}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
