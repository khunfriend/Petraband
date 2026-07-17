"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { cn } from "@/lib/utils";
import type { CellData, CellRef, CellStyle, FullSheet, MergedCellData } from "./types";

const DEFAULT_COL_WIDTH = 100;
const DEFAULT_ROW_HEIGHT = 28;

function colLetter(col: number): string {
  let s = "";
  let n = col;
  do {
    s = String.fromCharCode(65 + (n % 26)) + s;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return s;
}

function cellKey(row: number, col: number) {
  return `${row},${col}`;
}

export interface SheetGridHandle {
  getSelection: () => CellRef[];
  applyStyle: (style: CellStyle) => void;
  mergeCells: () => void;
  unmergeCells: () => void;
  addRow: () => void;
  deleteRow: () => void;
  addCol: () => void;
  deleteCol: () => void;
  getCurrentStyle: () => CellStyle;
}

interface Props {
  sheetId: string;
  initialData: FullSheet;
  onSelectionChange?: (cells: CellRef[], currentStyle: CellStyle) => void;
  onRowCountChange?: (rowCount: number) => void;
  onColCountChange?: (colCount: number) => void;
  onSaveStatus?: (status: "saving" | "saved" | "error") => void;
}

export const SheetGrid = forwardRef<SheetGridHandle, Props>(function SheetGrid(
  { sheetId, initialData, onSelectionChange, onRowCountChange, onColCountChange, onSaveStatus },
  ref
) {
  const [rowCount, setRowCount] = useState(initialData.rowCount);
  const [colCount, setColCount] = useState(initialData.columnCount);

  const [cells, setCells] = useState<Map<string, CellData>>(() => {
    const m = new Map<string, CellData>();
    for (const c of initialData.cells) {
      m.set(cellKey(c.rowIndex, c.colIndex), {
        cellValue: c.cellValue,
        style: c.style
          ? {
              fontFamily: c.style.fontFamily,
              fontSize: c.style.fontSize,
              isBold: c.style.isBold,
              isItalic: c.style.isItalic,
              isUnderline: c.style.isUnderline,
              textAlign: c.style.textAlign,
              textColor: c.style.textColor,
              highlightColor: c.style.highlightColor,
            }
          : null,
      });
    }
    return m;
  });

  const [merges, setMerges] = useState<MergedCellData[]>(initialData.mergedCells);

  const [colWidths, setColWidths] = useState<Map<number, number>>(() => {
    const m = new Map<number, number>();
    for (const c of initialData.columnWidths) m.set(c.colIndex, c.widthPx);
    return m;
  });
  const [rowHeights, setRowHeights] = useState<Map<number, number>>(() => {
    const m = new Map<number, number>();
    for (const r of initialData.rowHeights) m.set(r.rowIndex, r.heightPx);
    return m;
  });

  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set());
  const [anchor, setAnchor] = useState<CellRef | null>(null);
  const [editingCell, setEditingCell] = useState<CellRef | null>(null);
  const [editValue, setEditValue] = useState("");
  const isComposingRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Track latest edit state for beforeunload flush
  const editingCellRef = useRef<CellRef | null>(null);
  const editValueRef = useRef<string>("");
  useEffect(() => { editingCellRef.current = editingCell; }, [editingCell]);
  useEffect(() => { editValueRef.current = editValue; }, [editValue]);

  // Undo / Redo history
  const historyRef = useRef<Map<string, CellData>[]>([new Map()]);
  const historyIndexRef = useRef(0);

  function cloneCells(m: Map<string, CellData>): Map<string, CellData> {
    return new Map(m);
  }

  const pushHistory = useCallback((newCells: Map<string, CellData>) => {
    historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
    historyRef.current.push(cloneCells(newCells));
    if (historyRef.current.length > 100) historyRef.current.shift();
    historyIndexRef.current = historyRef.current.length - 1;
  }, []);

  function saveCellDiff(prevMap: Map<string, CellData>, nextMap: Map<string, CellData>) {
    const payload: Array<{ rowIndex: number; colIndex: number; cellValue: string | null }> = [];
    const allKeys = new Set([...prevMap.keys(), ...nextMap.keys()]);
    for (const k of allKeys) {
      const prevVal = prevMap.get(k)?.cellValue ?? null;
      const nextVal = nextMap.get(k)?.cellValue ?? null;
      if (prevVal !== nextVal) {
        const [rowIndex, colIndex] = k.split(",").map(Number);
        payload.push({ rowIndex, colIndex, cellValue: nextVal });
      }
    }
    if (payload.length === 0) return;
    fetch(`/api/sheets/${sheetId}/cells`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cells: payload }),
    }).catch(() => {});
  }

  // Debounce refs
  const cellSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingCells = useRef<Map<string, string | null>>(new Map());
  const colSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingCols = useRef<Map<number, number>>(new Map());
  const rowSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRows = useRef<Map<number, number>>(new Map());

  // Resize drag state
  const resizeRef = useRef<
    | { type: "col"; index: number; startX: number; startWidth: number }
    | { type: "row"; index: number; startY: number; startHeight: number }
    | null
  >(null);

  const getColWidth = useCallback(
    (col: number) => colWidths.get(col) ?? DEFAULT_COL_WIDTH,
    [colWidths]
  );
  const getRowHeight = useCallback(
    (row: number) => rowHeights.get(row) ?? DEFAULT_ROW_HEIGHT,
    [rowHeights]
  );

  // Notify selection change and current style
  const currentStyle = useMemo<CellStyle>(() => {
    if (selectedCells.size === 0) return {};
    // Use first selected cell's style as reference
    const first = Array.from(selectedCells)[0];
    const cell = cells.get(first);
    return cell?.style ?? {};
  }, [selectedCells, cells]);

  useEffect(() => {
    if (onSelectionChange) {
      const arr: CellRef[] = Array.from(selectedCells).map((k) => {
        const [r, c] = k.split(",").map(Number);
        return { row: r, col: c };
      });
      onSelectionChange(arr, currentStyle);
    }
  }, [selectedCells, currentStyle, onSelectionChange]);

  // Compute merge coverage: cells that are hidden because a merge covers them
  const hiddenCells = useMemo(() => {
    const s = new Set<string>();
    for (const m of merges) {
      for (let r = m.startRow; r <= m.endRow; r++) {
        for (let c = m.startCol; c <= m.endCol; c++) {
          if (r === m.startRow && c === m.startCol) continue;
          s.add(cellKey(r, c));
        }
      }
    }
    return s;
  }, [merges]);

  const mergeMap = useMemo(() => {
    const m = new Map<string, MergedCellData>();
    for (const mg of merges) m.set(cellKey(mg.startRow, mg.startCol), mg);
    return m;
  }, [merges]);

  // ============ Persistence ============

  const flushCellSaves = useCallback(() => {
    if (pendingCells.current.size === 0) return;
    const payload = Array.from(pendingCells.current.entries()).map(([k, v]) => {
      const [rowIndex, colIndex] = k.split(",").map(Number);
      return { rowIndex, colIndex, cellValue: v };
    });
    pendingCells.current.clear();
    onSaveStatus?.("saving");
    fetch(`/api/sheets/${sheetId}/cells`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cells: payload }),
    })
      .then((r) => onSaveStatus?.(r.ok ? "saved" : "error"))
      .catch(() => onSaveStatus?.("error"));
  }, [sheetId, onSaveStatus]);

  const queueCellSave = useCallback(
    (row: number, col: number, value: string | null) => {
      pendingCells.current.set(cellKey(row, col), value);
      if (cellSaveTimer.current) clearTimeout(cellSaveTimer.current);
      cellSaveTimer.current = setTimeout(flushCellSaves, 500);
    },
    [flushCellSaves]
  );

  // Flush pending saves on page unload (keepalive keeps request alive after navigation)
  useEffect(() => {
    const handleUnload = () => {
      // Include uncommitted edit if any
      if (editingCellRef.current) {
        const { row, col } = editingCellRef.current;
        pendingCells.current.set(cellKey(row, col), editValueRef.current || null);
      }
      if (pendingCells.current.size === 0) return;
      const payload = Array.from(pendingCells.current.entries()).map(([k, v]) => {
        const [rowIndex, colIndex] = k.split(",").map(Number);
        return { rowIndex, colIndex, cellValue: v };
      });
      fetch(`/api/sheets/${sheetId}/cells`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cells: payload }),
        keepalive: true,
      });
    };
    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, [sheetId]);

  const flushColSaves = useCallback(() => {
    if (pendingCols.current.size === 0) return;
    const payload = Array.from(pendingCols.current.entries()).map(([colIndex, widthPx]) => ({
      colIndex,
      widthPx,
    }));
    pendingCols.current.clear();
    fetch(`/api/sheets/${sheetId}/columns`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ columns: payload }),
    }).catch(() => {});
  }, [sheetId]);

  const queueColSave = useCallback(
    (col: number, w: number) => {
      pendingCols.current.set(col, w);
      if (colSaveTimer.current) clearTimeout(colSaveTimer.current);
      colSaveTimer.current = setTimeout(flushColSaves, 300);
    },
    [flushColSaves]
  );

  const flushRowSaves = useCallback(() => {
    if (pendingRows.current.size === 0) return;
    const payload = Array.from(pendingRows.current.entries()).map(([rowIndex, heightPx]) => ({
      rowIndex,
      heightPx,
    }));
    pendingRows.current.clear();
    fetch(`/api/sheets/${sheetId}/rows`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rows: payload }),
    }).catch(() => {});
  }, [sheetId]);

  const queueRowSave = useCallback(
    (row: number, h: number) => {
      pendingRows.current.set(row, h);
      if (rowSaveTimer.current) clearTimeout(rowSaveTimer.current);
      rowSaveTimer.current = setTimeout(flushRowSaves, 300);
    },
    [flushRowSaves]
  );

  // ============ Selection ============

  const selectSingle = useCallback((row: number, col: number) => {
    setSelectedCells(new Set([cellKey(row, col)]));
    setAnchor({ row, col });
  }, []);

  const selectRange = useCallback(
    (r1: number, c1: number, r2: number, c2: number) => {
      const s = new Set<string>();
      const minR = Math.min(r1, r2);
      const maxR = Math.max(r1, r2);
      const minC = Math.min(c1, c2);
      const maxC = Math.max(c1, c2);
      for (let r = minR; r <= maxR; r++) {
        for (let c = minC; c <= maxC; c++) {
          s.add(cellKey(r, c));
        }
      }
      setSelectedCells(s);
    },
    []
  );

  const handleCellMouseDown = useCallback(
    (e: React.MouseEvent, row: number, col: number) => {
      if (editingCell) return;
      if (e.shiftKey && anchor) {
        selectRange(anchor.row, anchor.col, row, col);
      } else if (e.ctrlKey || e.metaKey) {
        setSelectedCells((prev) => {
          const s = new Set(prev);
          const k = cellKey(row, col);
          if (s.has(k)) s.delete(k);
          else s.add(k);
          return s;
        });
        setAnchor({ row, col });
      } else {
        selectSingle(row, col);
      }
    },
    [editingCell, anchor, selectRange, selectSingle]
  );

  // ============ Editing ============

  const startEditing = useCallback(
    (row: number, col: number, initialText?: string) => {
      const existing = cells.get(cellKey(row, col));
      setEditValue(initialText ?? existing?.cellValue ?? "");
      setEditingCell({ row, col });
    },
    [cells]
  );

  const handleUndo = useCallback(() => {
    if (historyIndexRef.current <= 0) return;
    const prevSnapshot = historyRef.current[historyIndexRef.current];
    historyIndexRef.current--;
    const targetSnapshot = historyRef.current[historyIndexRef.current];
    setCells(cloneCells(targetSnapshot));
    saveCellDiff(prevSnapshot, targetSnapshot);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sheetId]);

  const handleRedo = useCallback(() => {
    if (historyIndexRef.current >= historyRef.current.length - 1) return;
    const prevSnapshot = historyRef.current[historyIndexRef.current];
    historyIndexRef.current++;
    const targetSnapshot = historyRef.current[historyIndexRef.current];
    setCells(cloneCells(targetSnapshot));
    saveCellDiff(prevSnapshot, targetSnapshot);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sheetId]);

  const commitEdit = useCallback(() => {
    if (!editingCell) return;
    const { row, col } = editingCell;
    const key = cellKey(row, col);
    const value = editValue || null;
    setCells((prev) => {
      const m = new Map(prev);
      const existing = m.get(key);
      m.set(key, { cellValue: value, style: existing?.style ?? null });
      pushHistory(m);
      return m;
    });
    // Save immediately (no debounce for single-cell commits)
    if (cellSaveTimer.current) clearTimeout(cellSaveTimer.current);
    pendingCells.current.set(key, value);
    flushCellSaves();
    setEditingCell(null);
  }, [editingCell, editValue, flushCellSaves, pushHistory]);

  const cancelEdit = useCallback(() => {
    setEditingCell(null);
  }, []);

  const moveSelection = useCallback(
    (dr: number, dc: number) => {
      if (!anchor) return;
      const newR = Math.max(0, Math.min(rowCount - 1, anchor.row + dr));
      const newC = Math.max(0, Math.min(colCount - 1, anchor.col + dc));
      selectSingle(newR, newC);
    },
    [anchor, rowCount, colCount, selectSingle]
  );

  // ============ Paste from Excel ============

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      if (editingCell) return;
      if (!anchor) return;

      const text = e.clipboardData.getData("text/plain");
      if (!text) return;
      e.preventDefault();

      // Excel copies as TSV: rows separated by \n, cols by \t
      const pasteRows = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
      if (pasteRows[pasteRows.length - 1] === "") pasteRows.pop();

      // ต้องเลือกพื้นที่ก่อนเสมอ
      if (selectedCells.size < 2) return;

      let minR = Infinity, maxR = -Infinity, minC = Infinity, maxC = -Infinity;
      for (const k of selectedCells) {
        const [r, c] = k.split(",").map(Number);
        if (r < minR) minR = r;
        if (r > maxR) maxR = r;
        if (c < minC) minC = c;
        if (c > maxC) maxC = c;
      }
      const maxRows = maxR - minR + 1;
      const maxCols = maxC - minC + 1;

      const payload: Array<{ rowIndex: number; colIndex: number; cellValue: string | null }> = [];

      setCells((prev) => {
        const m = new Map(prev);
        pasteRows.forEach((rowStr, ri) => {
          if (ri >= maxRows) return;
          rowStr.split("\t").forEach((val, ci) => {
            if (ci >= maxCols) return;
            const r = minR + ri;
            const c = minC + ci;
            const k = cellKey(r, c);
            const existing = m.get(k);
            m.set(k, { cellValue: val.trim() || null, style: existing?.style ?? null });
            payload.push({ rowIndex: r, colIndex: c, cellValue: val.trim() || null });
          });
        });
        pushHistory(m);
        return m;
      });

      if (payload.length === 0) return;
      fetch(`/api/sheets/${sheetId}/cells`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cells: payload }),
      }).catch(() => {});
    },
    [editingCell, anchor, selectedCells, sheetId, pushHistory]
  );

  // Handle keyboard on the grid container
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (editingCell) return;
      if (!anchor) return;

      if (e.key === "F2" || e.key === "Enter") {
        e.preventDefault();
        startEditing(anchor.row, anchor.col);
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === "y" || (e.key === "z" && e.shiftKey))) {
        e.preventDefault();
        handleRedo();
        return;
      }
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        setCells((prev) => {
          const m = new Map(prev);
          for (const k of selectedCells) {
            const existing = m.get(k);
            m.set(k, { cellValue: null, style: existing?.style ?? null });
            const [r, c] = k.split(",").map(Number);
            queueCellSave(r, c, null);
          }
          pushHistory(m);
          return m;
        });
        return;
      }
      if (e.key === "ArrowUp") { e.preventDefault(); moveSelection(-1, 0); return; }
      if (e.key === "ArrowDown") { e.preventDefault(); moveSelection(1, 0); return; }
      if (e.key === "ArrowLeft") { e.preventDefault(); moveSelection(0, -1); return; }
      if (e.key === "ArrowRight") { e.preventDefault(); moveSelection(0, 1); return; }
      if (e.key === "Tab") { e.preventDefault(); moveSelection(0, e.shiftKey ? -1 : 1); return; }

      // Start editing on printable character
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        startEditing(anchor.row, anchor.col, e.key);
      }
    },
    [editingCell, anchor, moveSelection, startEditing, selectedCells, queueCellSave, handleUndo, handleRedo, pushHistory]
  );

  const handleEditKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (isComposingRef.current) return;
      if (e.key === "Escape") {
        e.preventDefault();
        cancelEdit();
        containerRef.current?.focus();
      } else if (e.key === "Enter") {
        e.preventDefault();
        commitEdit();
        if (anchor) {
          const newR = Math.min(rowCount - 1, anchor.row + 1);
          selectSingle(newR, anchor.col);
        }
        containerRef.current?.focus();
      } else if (e.key === "Tab") {
        e.preventDefault();
        commitEdit();
        if (anchor) {
          const newC = anchor.col + (e.shiftKey ? -1 : 1);
          if (newC >= 0 && newC < colCount) selectSingle(anchor.row, newC);
        }
        containerRef.current?.focus();
      }
    },
    [commitEdit, cancelEdit, anchor, rowCount, colCount, selectSingle]
  );

  // ============ Resize ============

  useEffect(() => {
    function onMove(e: MouseEvent) {
      const r = resizeRef.current;
      if (!r) return;
      if (r.type === "col") {
        const w = Math.max(30, r.startWidth + (e.clientX - r.startX));
        setColWidths((prev) => {
          const m = new Map(prev);
          m.set(r.index, w);
          return m;
        });
        queueColSave(r.index, w);
      } else {
        const h = Math.max(18, r.startHeight + (e.clientY - r.startY));
        setRowHeights((prev) => {
          const m = new Map(prev);
          m.set(r.index, h);
          return m;
        });
        queueRowSave(r.index, h);
      }
    }
    function onUp() {
      resizeRef.current = null;
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [queueColSave, queueRowSave]);

  // Flush on unmount
  useEffect(() => {
    return () => {
      if (cellSaveTimer.current) clearTimeout(cellSaveTimer.current);
      if (colSaveTimer.current) clearTimeout(colSaveTimer.current);
      if (rowSaveTimer.current) clearTimeout(rowSaveTimer.current);
      flushCellSaves();
      flushColSaves();
      flushRowSaves();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ============ Imperative API ============

  const applyStyle = useCallback(
    (patch: CellStyle) => {
      if (selectedCells.size === 0) return;
      const stylesPayload: Array<{ rowIndex: number; colIndex: number } & CellStyle> = [];
      setCells((prev) => {
        const m = new Map(prev);
        for (const k of selectedCells) {
          const [r, c] = k.split(",").map(Number);
          const existing = m.get(k);
          const merged: CellStyle = { ...(existing?.style ?? {}), ...patch };
          m.set(k, { cellValue: existing?.cellValue ?? null, style: merged });
          stylesPayload.push({ rowIndex: r, colIndex: c, ...patch });
        }
        return m;
      });
      fetch(`/api/sheets/${sheetId}/styles`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ styles: stylesPayload }),
      }).catch(() => {});
    },
    [selectedCells, sheetId]
  );

  const mergeCells = useCallback(() => {
    if (selectedCells.size < 2) return;
    let minR = Infinity, maxR = -Infinity, minC = Infinity, maxC = -Infinity;
    for (const k of selectedCells) {
      const [r, c] = k.split(",").map(Number);
      if (r < minR) minR = r;
      if (r > maxR) maxR = r;
      if (c < minC) minC = c;
      if (c > maxC) maxC = c;
    }
    fetch(`/api/sheets/${sheetId}/merges`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ startRow: minR, startCol: minC, endRow: maxR, endCol: maxC }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.merge) {
          setMerges((prev) => [...prev, data.merge]);
        }
      })
      .catch(() => {});
  }, [selectedCells, sheetId]);

  const unmergeCells = useCallback(() => {
    if (selectedCells.size === 0) return;
    const toRemove: MergedCellData[] = [];
    for (const m of merges) {
      for (const k of selectedCells) {
        const [r, c] = k.split(",").map(Number);
        if (r >= m.startRow && r <= m.endRow && c >= m.startCol && c <= m.endCol) {
          toRemove.push(m);
          break;
        }
      }
    }
    if (toRemove.length === 0) return;
    Promise.all(
      toRemove.map((m) =>
        fetch(`/api/sheets/${sheetId}/merges/${m.id}`, { method: "DELETE" })
      )
    )
      .then(() => {
        setMerges((prev) => prev.filter((m) => !toRemove.some((t) => t.id === m.id)));
      })
      .catch(() => {});
  }, [selectedCells, merges, sheetId]);

  const updateSheetMeta = useCallback(
    (patch: { rowCount?: number; columnCount?: number }) => {
      fetch(`/api/sheets/${sheetId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      }).catch(() => {});
    },
    [sheetId]
  );

  const addRow = useCallback(() => {
    setRowCount((n) => {
      const nn = n + 1;
      updateSheetMeta({ rowCount: nn });
      onRowCountChange?.(nn);
      return nn;
    });
  }, [updateSheetMeta, onRowCountChange]);

  const deleteRow = useCallback(() => {
    if (rowCount <= 1) return;
    // Determine target row = anchor.row (or last)
    const targetRow = anchor ? anchor.row : rowCount - 1;
    // Clear cells in that row
    const toClear: Array<{ rowIndex: number; colIndex: number; cellValue: null }> = [];
    setCells((prev) => {
      const m = new Map(prev);
      for (let c = 0; c < colCount; c++) {
        const k = cellKey(targetRow, c);
        if (m.has(k)) {
          m.delete(k);
          toClear.push({ rowIndex: targetRow, colIndex: c, cellValue: null });
        }
      }
      return m;
    });
    if (toClear.length > 0) {
      fetch(`/api/sheets/${sheetId}/cells`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cells: toClear }),
      }).catch(() => {});
    }
    setRowCount((n) => {
      const nn = n - 1;
      updateSheetMeta({ rowCount: nn });
      onRowCountChange?.(nn);
      return nn;
    });
  }, [anchor, rowCount, colCount, sheetId, updateSheetMeta, onRowCountChange]);

  const addCol = useCallback(() => {
    setColCount((n) => {
      const nn = n + 1;
      updateSheetMeta({ columnCount: nn });
      onColCountChange?.(nn);
      return nn;
    });
  }, [updateSheetMeta, onColCountChange]);

  const deleteCol = useCallback(() => {
    if (colCount <= 1) return;
    const targetCol = anchor ? anchor.col : colCount - 1;
    const toClear: Array<{ rowIndex: number; colIndex: number; cellValue: null }> = [];
    setCells((prev) => {
      const m = new Map(prev);
      for (let r = 0; r < rowCount; r++) {
        const k = cellKey(r, targetCol);
        if (m.has(k)) {
          m.delete(k);
          toClear.push({ rowIndex: r, colIndex: targetCol, cellValue: null });
        }
      }
      return m;
    });
    if (toClear.length > 0) {
      fetch(`/api/sheets/${sheetId}/cells`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cells: toClear }),
      }).catch(() => {});
    }
    setColCount((n) => {
      const nn = n - 1;
      updateSheetMeta({ columnCount: nn });
      onColCountChange?.(nn);
      return nn;
    });
  }, [anchor, colCount, rowCount, sheetId, updateSheetMeta, onColCountChange]);

  useImperativeHandle(ref, () => ({
    getSelection: () =>
      Array.from(selectedCells).map((k) => {
        const [r, c] = k.split(",").map(Number);
        return { row: r, col: c };
      }),
    applyStyle,
    mergeCells,
    unmergeCells,
    addRow,
    deleteRow,
    addCol,
    deleteCol,
    getCurrentStyle: () => currentStyle,
  }));

  // ============ Rendering ============

  const columnIndices = useMemo(
    () => Array.from({ length: colCount }, (_, i) => i),
    [colCount]
  );
  const rowIndices = useMemo(
    () => Array.from({ length: rowCount }, (_, i) => i),
    [rowCount]
  );

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onPaste={handlePaste}
      className="outline-none overflow-auto bg-surface-card"
      style={{ maxHeight: "calc(100vh - 260px)" }}
    >
      <table
        className="border-collapse select-none"
        style={{ tableLayout: "fixed" }}
      >
        <colgroup>
          <col style={{ width: 40 }} />
          {columnIndices.map((c) => (
            <col key={c} style={{ width: getColWidth(c) }} />
          ))}
        </colgroup>
        <thead>
          <tr style={{ height: 24 }}>
            <th className="bg-surface-soft border border-hairline text-xs text-muted sticky top-0 left-0 z-20" />
            {columnIndices.map((c) => (
              <th
                key={c}
                className="bg-surface-soft border border-hairline text-xs text-muted font-medium relative sticky top-0 z-10"
              >
                {colLetter(c)}
                <div
                  onMouseDown={(e) => {
                    resizeRef.current = {
                      type: "col",
                      index: c,
                      startX: e.clientX,
                      startWidth: getColWidth(c),
                    };
                    e.preventDefault();
                  }}
                  className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-coral"
                />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rowIndices.map((r) => (
            <tr key={r} style={{ height: getRowHeight(r) }}>
              <th
                className="bg-surface-soft border border-hairline text-xs text-muted font-medium relative sticky left-0 z-10"
              >
                {r + 1}
                <div
                  onMouseDown={(e) => {
                    resizeRef.current = {
                      type: "row",
                      index: r,
                      startY: e.clientY,
                      startHeight: getRowHeight(r),
                    };
                    e.preventDefault();
                  }}
                  className="absolute bottom-0 left-0 w-full h-1 cursor-row-resize hover:bg-coral"
                />
              </th>
              {columnIndices.map((c) => {
                const k = cellKey(r, c);
                if (hiddenCells.has(k)) return null;
                const merge = mergeMap.get(k);
                const cellData = cells.get(k);
                const isSelected = selectedCells.has(k);
                const isEditing =
                  editingCell?.row === r && editingCell?.col === c;
                const style = cellData?.style ?? {};
                const inlineStyle: React.CSSProperties = {
                  fontFamily: style.fontFamily ?? "Sarabun",
                  fontSize: (style.fontSize ?? 14) + "px",
                  fontWeight: style.isBold ? "bold" : "normal",
                  fontStyle: style.isItalic ? "italic" : "normal",
                  textDecoration: style.isUnderline ? "underline" : "none",
                  textAlign: (style.textAlign ?? "center") as React.CSSProperties["textAlign"],
                  color: style.textColor ?? "#000000",
                  backgroundColor: style.highlightColor ?? undefined,
                  padding: "2px 4px",
                  overflow: "hidden",
                  whiteSpace: "nowrap",
                  textOverflow: "ellipsis",
                };
                return (
                  <td
                    key={c}
                    rowSpan={merge ? merge.endRow - merge.startRow + 1 : undefined}
                    colSpan={merge ? merge.endCol - merge.startCol + 1 : undefined}
                    onMouseDown={(e) => handleCellMouseDown(e, r, c)}
                    onDoubleClick={() => startEditing(r, c)}
                    className={cn(
                      "border border-hairline cursor-cell relative",
                      isSelected && !isEditing && "outline outline-2 outline-coral -outline-offset-2 bg-coral/5"
                    )}
                    style={inlineStyle}
                  >
                    {isEditing ? (
                      <input
                        autoFocus
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={commitEdit}
                        onKeyDown={handleEditKeyDown}
                        onCompositionStart={() => {
                          isComposingRef.current = true;
                        }}
                        onCompositionEnd={() => {
                          isComposingRef.current = false;
                        }}
                        className="w-full h-full outline-none bg-white border border-coral px-1"
                        style={{
                          fontFamily: inlineStyle.fontFamily,
                          fontSize: inlineStyle.fontSize,
                          textAlign: inlineStyle.textAlign,
                        }}
                      />
                    ) : (
                      cellData?.cellValue ?? ""
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});
