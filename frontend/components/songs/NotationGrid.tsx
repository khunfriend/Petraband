"use client";

import { useState, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";

export interface NoteCell {
  value: string;
  bg?: string | null;
  bold?: boolean | null;
  italic?: boolean | null;
}

export interface SheetRow {
  row: number;
  type: "title" | "section" | "normal" | "empty";
  cols: NoteCell[];
  // section rows
  value?: string;
  sub?: string;
  colspan?: number;
}

export interface SheetData {
  id?: string;
  key?: string | null;
  rows: SheetRow[];
}

const COLS = 12;

interface NotationGridProps {
  sheetData: SheetData;
  editable?: boolean;
  onChange?: (sheetData: SheetData) => void;
}

export function NotationGrid({ sheetData, editable = false, onChange }: NotationGridProps) {
  const [localData, setLocalData] = useState<SheetData>(sheetData);
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const data = editable ? localData : sheetData;

  // Find the rightmost non-empty column across all normal rows
  const effectiveCols = Math.max(
    1,
    ...data.rows
      .filter((r) => r.type === "normal")
      .map((r) => {
        for (let i = r.cols.length - 1; i >= 0; i--) {
          if (r.cols[i]?.value) return i + 1;
        }
        return 0;
      })
  );

  const updateCell = useCallback(
    (rowIdx: number, colIdx: number, value: string) => {
      const newRows = data.rows.map((row, ri) => {
        if (ri !== rowIdx) return row;
        const newCols = row.cols.map((cell, ci) =>
          ci === colIdx ? { ...cell, value } : cell
        );
        return { ...row, cols: newCols };
      });
      const updated = { ...data, rows: newRows };
      setLocalData(updated);
      onChange?.(updated);
    },
    [data, onChange]
  );

  const focusCell = useCallback((rowIdx: number, colIdx: number) => {
    const key = `${rowIdx}-${colIdx}`;
    inputRefs.current[key]?.focus();
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, rowIdx: number, colIdx: number) => {
      const normalRows = data.rows.reduce<number[]>((acc, row, i) => {
        if (row.type === "normal") acc.push(i);
        return acc;
      }, []);
      const curNormalPos = normalRows.indexOf(rowIdx);

      if (e.key === "Tab") {
        e.preventDefault();
        const nextCol = e.shiftKey ? colIdx - 1 : colIdx + 1;
        if (nextCol >= 0 && nextCol < effectiveCols) {
          focusCell(rowIdx, nextCol);
        } else if (!e.shiftKey && curNormalPos < normalRows.length - 1) {
          focusCell(normalRows[curNormalPos + 1], 0);
        } else if (e.shiftKey && curNormalPos > 0) {
          focusCell(normalRows[curNormalPos - 1], effectiveCols - 1);
        }
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (curNormalPos < normalRows.length - 1) {
          focusCell(normalRows[curNormalPos + 1], colIdx);
        }
      } else if (e.key === "ArrowRight" && colIdx < effectiveCols - 1) {
        focusCell(rowIdx, colIdx + 1);
      } else if (e.key === "ArrowLeft" && colIdx > 0) {
        focusCell(rowIdx, colIdx - 1);
      }
    },
    [data.rows, focusCell, effectiveCols]
  );

  const addRow = useCallback(() => {
    const maxRow = Math.max(0, ...data.rows.map((r) => r.row));
    const newRow: SheetRow = {
      row: maxRow + 1,
      type: "normal",
      cols: Array.from({ length: COLS }, () => ({ value: "" })),
    };
    const updated = { ...data, rows: [...data.rows, newRow] };
    setLocalData(updated);
    onChange?.(updated);
  }, [data, onChange]);

  const removeRow = useCallback(
    (rowIdx: number) => {
      const newRows = data.rows.filter((_, i) => i !== rowIdx);
      const updated = { ...data, rows: newRows };
      setLocalData(updated);
      onChange?.(updated);
    },
    [data, onChange]
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full table-fixed border-collapse text-sm font-thai">
        <colgroup>
          {Array.from({ length: effectiveCols }).map((_, i) => (
            <col key={i} style={{ width: `${100 / effectiveCols}%` }} />
          ))}
          {editable && <col style={{ width: "28px" }} />}
        </colgroup>
        <tbody>
          {data.rows.filter((row) => row.type !== "empty").map((row, rowIdx) => {

            if (row.type === "title") {
              const cell = row.cols[0];
              return (
                <tr key={rowIdx}>
                  <td
                    colSpan={effectiveCols + (editable ? 1 : 0)}
                    className="py-2 text-center text-base font-bold text-ink"
                  >
                    {cell?.value ?? ""}
                  </td>
                </tr>
              );
            }

            if (row.type === "section") {
              const cell = row.cols[0] as (NoteCell & { sub?: string }) | undefined;
              const val = cell?.value ?? (row as unknown as Record<string, string>).value ?? "";
              const sub = cell?.sub ?? (row as unknown as Record<string, string>).sub ?? "";
              return (
                <tr key={rowIdx} className="bg-surface-cream-strong">
                  <td
                    colSpan={effectiveCols + (editable ? 1 : 0)}
                    className="px-2 py-1"
                  >
                    <span className="font-semibold text-ink">{val}</span>
                    {sub && <span className="ml-2 text-xs text-muted">({sub})</span>}
                  </td>
                </tr>
              );
            }

            // normal row
            return (
              <tr key={rowIdx} className="border-b border-hairline-soft last:border-0">
                {row.cols.slice(0, effectiveCols).map((cell, colIdx) => {
                  const cellKey = `${rowIdx}-${colIdx}`;
                  const isEmpty = !cell.value;
                  const bgStyle = cell.bg ? { backgroundColor: cell.bg } : {};

                  return (
                    <td
                      key={colIdx}
                      className={cn(
                        "border border-hairline text-center p-0 h-8",
                        isEmpty && !editable && "bg-surface-soft"
                      )}
                      style={bgStyle}
                    >
                      {editable ? (
                        <input
                          ref={(el) => { inputRefs.current[cellKey] = el; }}
                          value={cell.value}
                          onChange={(e) => updateCell(rowIdx, colIdx, e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, rowIdx, colIdx)}
                          className={cn(
                            "w-full h-full text-center bg-transparent px-1 text-xs text-ink outline-none",
                            "focus:bg-coral/10 focus:ring-1 focus:ring-coral/50",
                            cell.bold && "font-bold",
                            cell.italic && "italic"
                          )}
                        />
                      ) : (
                        <span
                          className={cn(
                            "block px-1 text-xs text-ink",
                            cell.bold && "font-bold",
                            cell.italic && "italic",
                            isEmpty && "text-muted-soft"
                          )}
                        >
                          {cell.value || ""}
                        </span>
                      )}
                    </td>
                  );
                })}

                {editable && (
                  <td className="w-6 pl-1">
                    <button
                      onClick={() => removeRow(rowIdx)}
                      className="text-xs text-muted hover:text-error transition-colors"
                      title="ลบบรรทัด"
                    >
                      ✕
                    </button>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>

      {editable && (
        <button
          onClick={addRow}
          className="mt-3 text-sm text-muted hover:text-ink transition-colors flex items-center gap-1"
        >
          <span className="text-lg leading-none">+</span> เพิ่มบรรทัด
        </button>
      )}
    </div>
  );
}
