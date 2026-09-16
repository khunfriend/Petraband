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
import type { CellData, CellRef, CellRun, CellStyle, FullSheet, MergedCellData } from "./types";
import {
  addFakeSelection,
  applyStyleToSelection,
  domToRuns,
  removeFakeSelection,
  runsToHtml,
  runsToPlainText,
} from "./richText";

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

function escapeForEditor(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

type Axis = "row" | "col";
type StructureOp = { axis: Axis; kind: "insert" | "delete"; at: number };

// Mirrors what /api/sheets/[id]/structure does server-side, so the grid can
// update without refetching. Keep the two in step.
function shiftCells(
  cells: Map<string, CellData>,
  { axis, kind, at }: StructureOp
): Map<string, CellData> {
  const out = new Map<string, CellData>();
  for (const [k, v] of cells) {
    const [r, c] = k.split(",").map(Number);
    const i = axis === "row" ? r : c;
    if (kind === "delete") {
      if (i === at) continue;
      const moved = i > at ? i - 1 : i;
      out.set(axis === "row" ? cellKey(moved, c) : cellKey(r, moved), v);
    } else {
      const moved = i >= at ? i + 1 : i;
      out.set(axis === "row" ? cellKey(moved, c) : cellKey(r, moved), v);
    }
  }
  return out;
}

function shiftSizes(
  sizes: Map<number, number>,
  kind: "insert" | "delete",
  at: number
): Map<number, number> {
  const out = new Map<number, number>();
  for (const [i, px] of sizes) {
    if (kind === "delete") {
      if (i === at) continue;
      out.set(i > at ? i - 1 : i, px);
    } else {
      out.set(i >= at ? i + 1 : i, px);
    }
  }
  return out;
}

function shiftMerges(
  merges: MergedCellData[],
  { axis, kind, at }: StructureOp
): MergedCellData[] {
  const startKey = axis === "row" ? "startRow" : "startCol";
  const endKey = axis === "row" ? "endRow" : "endCol";
  const out: MergedCellData[] = [];
  for (const m of merges) {
    const start = m[startKey];
    const end = m[endKey];
    if (kind === "delete") {
      if (start === at && end === at) continue;
      // `end >= at` on purpose: a merge ending exactly on the removed line
      // still has to lose one column/row.
      if (start <= at && end >= at) out.push({ ...m, [endKey]: end - 1 });
      else if (start > at) out.push({ ...m, [startKey]: start - 1, [endKey]: end - 1 });
      else out.push(m);
    } else {
      if (start < at && end >= at) out.push({ ...m, [endKey]: end + 1 });
      else if (start >= at) out.push({ ...m, [startKey]: start + 1, [endKey]: end + 1 });
      else out.push(m);
    }
  }
  return out;
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
  undo: () => void;
  redo: () => void;
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
        richValue: c.richValue ?? null,
        style: c.style
          ? {
              fontFamily: c.style.fontFamily,
              fontSize: c.style.fontSize,
              isBold: c.style.isBold,
              isItalic: c.style.isItalic,
              isUnderline: c.style.isUnderline,
              textAlign: c.style.textAlign,
              verticalAlign: c.style.verticalAlign,
              wrapText: c.style.wrapText,
              textColor: c.style.textColor,
              highlightColor: c.style.highlightColor,
              borderTop: c.style.borderTop,
              borderRight: c.style.borderRight,
              borderBottom: c.style.borderBottom,
              borderLeft: c.style.borderLeft,
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
  const isComposingRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLDivElement | null>(null);
  // Initial HTML to seed contentEditable on mount; not re-read after typing.
  const editorInitialHtmlRef = useRef<string>("");
  // Track which cell we've already seeded so we don't overwrite typed content
  // when React re-invokes the ref callback on subsequent renders.
  const seededCellKeyRef = useRef<string | null>(null);
  // Preserve the caret/selection range across toolbar clicks that steal focus.
  const savedRangeRef = useRef<Range | null>(null);

  // Track latest edit state for beforeunload flush
  const editingCellRef = useRef<CellRef | null>(null);
  useEffect(() => { editingCellRef.current = editingCell; }, [editingCell]);

  function readEditor(): { text: string; runs: CellRun[] } {
    const el = editorRef.current;
    if (!el) return { text: "", runs: [] };
    const runs = domToRuns(el);
    return { text: runsToPlainText(runs), runs };
  }

  function saveEditorSelection() {
    const el = editorRef.current;
    if (!el) return;
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const r = sel.getRangeAt(0);
    if (el.contains(r.commonAncestorContainer)) {
      savedRangeRef.current = r.cloneRange();
    }
  }

  function restoreEditorSelection(): boolean {
    const el = editorRef.current;
    const r = savedRangeRef.current;
    if (!el || !r) return false;
    if (!el.contains(r.commonAncestorContainer)) return false;
    const sel = window.getSelection();
    if (!sel) return false;
    sel.removeAllRanges();
    sel.addRange(r);
    return true;
  }

  // Undo / Redo history. A snapshot covers everything an edit can change, not
  // just cell values — undoing a merge or a resize has to restore those too.
  // The baseline must be the sheet as loaded; seeding it empty would make the
  // first undo clear the sheet and persist that.
  type Snapshot = {
    cells: Map<string, CellData>;
    merges: MergedCellData[];
    colWidths: Map<number, number>;
    rowHeights: Map<number, number>;
    rowCount: number;
    colCount: number;
    // Set when this entry was produced by an insert/delete. Undo replays the
    // opposite op on the server rather than trying to diff shifted coordinates.
    op?: StructureOp;
  };

  const historyRef = useRef<Snapshot[]>([
    {
      cells,
      merges: initialData.mergedCells,
      colWidths,
      rowHeights,
      rowCount: initialData.rowCount,
      colCount: initialData.columnCount,
    },
  ]);
  const historyIndexRef = useRef(0);

  // Callers pass only the parts they changed; the rest is read from current state.
  const pushHistory = useCallback(
    (patch: Partial<Snapshot>) => {
      const next: Snapshot = {
        cells,
        merges,
        colWidths,
        rowHeights,
        rowCount,
        colCount,
        ...patch,
      };
      historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
      historyRef.current.push(next);
      if (historyRef.current.length > 100) historyRef.current.shift();
      historyIndexRef.current = historyRef.current.length - 1;
    },
    [cells, merges, colWidths, rowHeights, rowCount, colCount]
  );

  function saveCellDiff(prevMap: Map<string, CellData>, nextMap: Map<string, CellData>) {
    const payload: Array<{
      rowIndex: number;
      colIndex: number;
      cellValue: string | null;
      richValue: CellRun[] | null;
    }> = [];
    const allKeys = new Set([...prevMap.keys(), ...nextMap.keys()]);
    for (const k of allKeys) {
      const prev = prevMap.get(k);
      const next = nextMap.get(k);
      const prevVal = prev?.cellValue ?? null;
      const nextVal = next?.cellValue ?? null;
      const prevRich = JSON.stringify(prev?.richValue ?? null);
      const nextRich = JSON.stringify(next?.richValue ?? null);
      if (prevVal !== nextVal || prevRich !== nextRich) {
        const [rowIndex, colIndex] = k.split(",").map(Number);
        payload.push({
          rowIndex,
          colIndex,
          cellValue: nextVal,
          richValue: next?.richValue ?? null,
        });
      }
    }
    if (payload.length === 0) return;
    fetch(`/api/sheets/${sheetId}/cells`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cells: payload }),
    }).catch(() => {});
  }

  // saveCellDiff only carries values; styles live in their own table.
  function saveStyleDiff(prevMap: Map<string, CellData>, nextMap: Map<string, CellData>) {
    const payload: Array<{ rowIndex: number; colIndex: number } & CellStyle> = [];
    for (const k of new Set([...prevMap.keys(), ...nextMap.keys()])) {
      const before = JSON.stringify(prevMap.get(k)?.style ?? null);
      const after = nextMap.get(k)?.style ?? null;
      if (before === JSON.stringify(after)) continue;
      const [rowIndex, colIndex] = k.split(",").map(Number);
      payload.push({ rowIndex, colIndex, ...(after ?? {}) });
    }
    if (payload.length === 0) return;
    fetch(`/api/sheets/${sheetId}/styles`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ styles: payload }),
    }).catch(() => {});
  }

  function saveSizeDiff(
    prev: Map<number, number>,
    next: Map<number, number>,
    kind: "columns" | "rows"
  ) {
    const indexKey = kind === "columns" ? "colIndex" : "rowIndex";
    const sizeKey = kind === "columns" ? "widthPx" : "heightPx";
    const fallback = kind === "columns" ? DEFAULT_COL_WIDTH : DEFAULT_ROW_HEIGHT;
    const payload: Array<Record<string, number>> = [];
    for (const i of new Set([...prev.keys(), ...next.keys()])) {
      const before = prev.get(i) ?? fallback;
      const after = next.get(i) ?? fallback;
      if (before !== after) payload.push({ [indexKey]: i, [sizeKey]: after });
    }
    if (payload.length === 0) return;
    fetch(`/api/sheets/${sheetId}/${kind}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [kind]: payload }),
    }).catch(() => {});
  }

  // Re-created merges come back with a fresh id, so they are matched by
  // geometry rather than by id.
  function mergeGeometry(m: MergedCellData) {
    return `${m.startRow},${m.startCol},${m.endRow},${m.endCol}`;
  }

  function saveMergeDiff(prev: MergedCellData[], next: MergedCellData[]) {
    const nextKeys = new Set(next.map(mergeGeometry));
    const prevKeys = new Set(prev.map(mergeGeometry));

    for (const m of prev) {
      if (!nextKeys.has(mergeGeometry(m))) {
        fetch(`/api/sheets/${sheetId}/merges/${m.id}`, { method: "DELETE" }).catch(() => {});
      }
    }
    for (const m of next) {
      if (prevKeys.has(mergeGeometry(m))) continue;
      fetch(`/api/sheets/${sheetId}/merges`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startRow: m.startRow,
          startCol: m.startCol,
          endRow: m.endRow,
          endCol: m.endCol,
        }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (!data.merge) return;
          // Swap the restored placeholder for the row the server actually created.
          setMerges((cur) =>
            cur.map((x) => (mergeGeometry(x) === mergeGeometry(data.merge) ? data.merge : x))
          );
        })
        .catch(() => {});
    }
  }

  // Debounce refs
  const cellSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  type PendingCell = { cellValue: string | null; richValue: CellRun[] | null };
  const pendingCells = useRef<Map<string, PendingCell>>(new Map());
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
      return { rowIndex, colIndex, cellValue: v.cellValue, richValue: v.richValue };
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
    (row: number, col: number, value: string | null, richValue: CellRun[] | null = null) => {
      pendingCells.current.set(cellKey(row, col), { cellValue: value, richValue });
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
        const { text, runs } = readEditor();
        pendingCells.current.set(cellKey(row, col), {
          cellValue: text || null,
          richValue: runs.length > 0 ? runs : null,
        });
      }
      if (pendingCells.current.size === 0) return;
      const payload = Array.from(pendingCells.current.entries()).map(([k, v]) => {
        const [rowIndex, colIndex] = k.split(",").map(Number);
        return { rowIndex, colIndex, cellValue: v.cellValue, richValue: v.richValue };
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

  const dragStartRef = useRef<CellRef | null>(null);

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
        dragStartRef.current = { row, col };
      }
    },
    [editingCell, anchor, selectRange, selectSingle]
  );

  const handleCellMouseEnter = useCallback(
    (row: number, col: number) => {
      const start = dragStartRef.current;
      if (!start) return;
      if (start.row === row && start.col === col) return;
      selectRange(start.row, start.col, row, col);
    },
    [selectRange]
  );

  useEffect(() => {
    const onUp = () => {
      dragStartRef.current = null;
    };
    window.addEventListener("mouseup", onUp);
    return () => window.removeEventListener("mouseup", onUp);
  }, []);

  // ============ Editing ============

  const startEditing = useCallback(
    (row: number, col: number, initialText?: string) => {
      const existing = cells.get(cellKey(row, col));
      if (initialText != null) {
        // Overwrite via keypress
        editorInitialHtmlRef.current = escapeForEditor(initialText);
      } else if (existing?.richValue && existing.richValue.length > 0) {
        editorInitialHtmlRef.current = runsToHtml(existing.richValue);
      } else {
        editorInitialHtmlRef.current = escapeForEditor(existing?.cellValue ?? "");
      }
      setEditingCell({ row, col });
    },
    [cells]
  );

  // Resolves with the merges the sheet actually has afterwards. Shifting is
  // lossy — a merge shrunk by a delete does not grow back when the line is
  // re-inserted — so undo needs the real state to diff against.
  function applyStructure(op: StructureOp): Promise<MergedCellData[] | null> {
    return fetch(`/api/sheets/${sheetId}/structure`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ axis: op.axis, op: op.kind, at: op.at }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => data?.merges ?? null)
      .catch(() => null);
  }

  const restoreSnapshot = useCallback(
    (from: Snapshot, to: Snapshot, structure?: StructureOp) => {
      setCells(new Map(to.cells));
      setMerges(to.merges);
      setColWidths(new Map(to.colWidths));
      setRowHeights(new Map(to.rowHeights));
      setRowCount(to.rowCount);
      setColCount(to.colCount);
      onRowCountChange?.(to.rowCount);
      onColCountChange?.(to.colCount);

      // Re-shape the sheet first so the writes below land on the coordinates
      // they belong to. The structure endpoint already moves cells, sizes,
      // merges and the counts; a re-inserted row comes back empty, which the
      // cell diff then refills.
      void (structure ? applyStructure(structure) : Promise.resolve(null)).then((shifted) => {
        saveCellDiff(from.cells, to.cells);
        saveStyleDiff(from.cells, to.cells);
        saveSizeDiff(from.colWidths, to.colWidths, "columns");
        saveSizeDiff(from.rowHeights, to.rowHeights, "rows");
        saveMergeDiff(shifted ?? from.merges, to.merges);

        if (structure) return;
        if (from.rowCount !== to.rowCount || from.colCount !== to.colCount) {
          fetch(`/api/sheets/${sheetId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ rowCount: to.rowCount, columnCount: to.colCount }),
          }).catch(() => {});
        }
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sheetId, onRowCountChange, onColCountChange]
  );

  const handleUndo = useCallback(() => {
    if (historyIndexRef.current <= 0) return;
    const from = historyRef.current[historyIndexRef.current];
    historyIndexRef.current--;
    const inverse: StructureOp | undefined = from.op && {
      ...from.op,
      kind: from.op.kind === "insert" ? "delete" : "insert",
    };
    restoreSnapshot(from, historyRef.current[historyIndexRef.current], inverse);
  }, [restoreSnapshot]);

  const handleRedo = useCallback(() => {
    if (historyIndexRef.current >= historyRef.current.length - 1) return;
    const from = historyRef.current[historyIndexRef.current];
    historyIndexRef.current++;
    const to = historyRef.current[historyIndexRef.current];
    restoreSnapshot(from, to, to.op);
  }, [restoreSnapshot]);

  const commitEdit = useCallback(() => {
    if (!editingCell) return;
    const { row, col } = editingCell;
    const key = cellKey(row, col);
    const { text, runs } = readEditor();
    const value = text || null;
    // Only keep richValue if there are actual per-run styles (>1 run or a styled single run)
    const hasStyling =
      runs.length > 1 ||
      (runs.length === 1 &&
        (runs[0].fontSize != null ||
          runs[0].isBold ||
          runs[0].isItalic ||
          runs[0].isUnderline ||
          !!runs[0].textColor));
    const rich = hasStyling ? runs : null;
    const next = new Map(cells);
    const existing = next.get(key);
    next.set(key, { cellValue: value, richValue: rich, style: existing?.style ?? null });
    setCells(next);
    pushHistory({ cells: next });
    // Save immediately (no debounce for single-cell commits)
    if (cellSaveTimer.current) clearTimeout(cellSaveTimer.current);
    pendingCells.current.set(key, { cellValue: value, richValue: rich });
    flushCellSaves();
    setEditingCell(null);
  }, [editingCell, cells, flushCellSaves, pushHistory]);

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

  // ============ Copy / Cut / Paste ============

  const clearSelectedCells = useCallback(() => {
    const next = new Map(cells);
    for (const k of selectedCells) {
      const existing = next.get(k);
      next.set(k, { cellValue: null, richValue: null, style: existing?.style ?? null });
      const [r, c] = k.split(",").map(Number);
      queueCellSave(r, c, null, null);
    }
    setCells(next);
    pushHistory({ cells: next });
  }, [cells, selectedCells, queueCellSave, pushHistory]);

  // Same TSV shape handlePaste reads, so copying round-trips through Excel.
  // A non-rectangular (ctrl-click) selection is emitted as its bounding box.
  const buildTsv = useCallback(() => {
    if (selectedCells.size === 0) return "";
    let minR = Infinity, maxR = -Infinity, minC = Infinity, maxC = -Infinity;
    for (const k of selectedCells) {
      const [r, c] = k.split(",").map(Number);
      if (r < minR) minR = r;
      if (r > maxR) maxR = r;
      if (c < minC) minC = c;
      if (c > maxC) maxC = c;
    }
    const lines: string[] = [];
    for (let r = minR; r <= maxR; r++) {
      const row: string[] = [];
      for (let c = minC; c <= maxC; c++) {
        row.push(cells.get(cellKey(r, c))?.cellValue ?? "");
      }
      lines.push(row.join("\t"));
    }
    return lines.join("\n");
  }, [selectedCells, cells]);

  const handleCopy = useCallback(
    (e: React.ClipboardEvent) => {
      // While editing, let the browser copy the text selection inside the cell.
      if (editingCell) return;
      const tsv = buildTsv();
      if (!tsv) return;
      e.preventDefault();
      e.clipboardData.setData("text/plain", tsv);
    },
    [editingCell, buildTsv]
  );

  const handleCut = useCallback(
    (e: React.ClipboardEvent) => {
      if (editingCell) return;
      const tsv = buildTsv();
      if (!tsv) return;
      e.preventDefault();
      e.clipboardData.setData("text/plain", tsv);
      clearSelectedCells();
    },
    [editingCell, buildTsv, clearSelectedCells]
  );

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
      if (pasteRows.length === 0) return;

      const pasteGrid = pasteRows.map((r) => r.split("\t"));
      const pasteH = pasteGrid.length;
      const pasteW = pasteGrid.reduce((mx, r) => Math.max(mx, r.length), 0);

      // If a range (2+ cells) is selected, clamp paste to that range.
      // Otherwise anchor the paste at the current cell and use the clipboard's own size.
      let minR: number, minC: number, maxRows: number, maxCols: number;
      if (selectedCells.size >= 2) {
        let sMinR = Infinity, sMaxR = -Infinity, sMinC = Infinity, sMaxC = -Infinity;
        for (const k of selectedCells) {
          const [r, c] = k.split(",").map(Number);
          if (r < sMinR) sMinR = r;
          if (r > sMaxR) sMaxR = r;
          if (c < sMinC) sMinC = c;
          if (c > sMaxC) sMaxC = c;
        }
        minR = sMinR;
        minC = sMinC;
        maxRows = sMaxR - sMinR + 1;
        maxCols = sMaxC - sMinC + 1;
      } else {
        minR = anchor.row;
        minC = anchor.col;
        maxRows = pasteH;
        maxCols = pasteW;
      }

      const neededRows = minR + Math.min(pasteH, maxRows);
      const neededCols = minC + Math.min(pasteW, maxCols);

      const metaPatch: { rowCount?: number; columnCount?: number } = {};
      setRowCount((n) => {
        if (neededRows <= n) return n;
        metaPatch.rowCount = neededRows;
        onRowCountChange?.(neededRows);
        return neededRows;
      });
      setColCount((n) => {
        if (neededCols <= n) return n;
        metaPatch.columnCount = neededCols;
        onColCountChange?.(neededCols);
        return neededCols;
      });
      if (metaPatch.rowCount != null || metaPatch.columnCount != null) {
        fetch(`/api/sheets/${sheetId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(metaPatch),
        }).catch(() => {});
      }

      const next = new Map(cells);
      pasteGrid.forEach((rowArr, ri) => {
        if (ri >= maxRows) return;
        rowArr.forEach((val, ci) => {
          if (ci >= maxCols) return;
          const r = minR + ri;
          const c = minC + ci;
          const k = cellKey(r, c);
          const existing = next.get(k);
          const nextVal = val.trim() || null;
          next.set(k, { cellValue: nextVal, richValue: null, style: existing?.style ?? null });
          queueCellSave(r, c, nextVal, null);
        });
      });
      setCells(next);
      pushHistory({ cells: next });
    },
    [editingCell, anchor, cells, selectedCells, sheetId, pushHistory, queueCellSave, onRowCountChange, onColCountChange]
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
        clearSelectedCells();
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
    [editingCell, anchor, moveSelection, startEditing, clearSelectedCells, handleUndo, handleRedo]
  );

  const handleEditKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
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
      // One history entry per drag, not per mousemove.
      if (resizeRef.current) pushHistory({});
      resizeRef.current = null;
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [queueColSave, queueRowSave, pushHistory]);

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
      // If actively editing with a non-collapsed selection, apply per-run style
      // to just the selected text — this is what makes mixed font-sizes possible.
      if (editingCell && editorRef.current) {
        const runPatch: Partial<CellRun> = {};
        if (patch.fontSize != null) runPatch.fontSize = patch.fontSize;
        if (patch.isBold != null) runPatch.isBold = patch.isBold;
        if (patch.isItalic != null) runPatch.isItalic = patch.isItalic;
        if (patch.isUnderline != null) runPatch.isUnderline = patch.isUnderline;
        if (patch.textColor != null) runPatch.textColor = patch.textColor;
        if (Object.keys(runPatch).length > 0) {
          // Toolbar interaction stole focus — unwrap the fake highlight (if any),
          // restore the real range, then apply per-run styling.
          const revived = removeFakeSelection(editorRef.current);
          if (revived) savedRangeRef.current = revived;
          restoreEditorSelection();
          const ok = applyStyleToSelection(editorRef.current, runPatch);
          if (ok) {
            // Update saved range to the new selection wrapping the styled span.
            saveEditorSelection();
            const active = document.activeElement as HTMLElement | null;
            if (active?.closest("[data-sheets-toolbar]")) {
              // Keep the user in the toolbar (they may be mid-typing a number)
              // — redraw the fake highlight over the new range instead of
              // stealing focus back to the editor.
              const r = savedRangeRef.current;
              if (r && !r.collapsed) {
                addFakeSelection(editorRef.current, r.cloneRange());
                // Re-save because addFakeSelection wrapped the range in a marker
                // span; the previous range references detached nodes now.
                const marker = editorRef.current.querySelector<HTMLElement>(
                  "span[data-fake-selection]"
                );
                if (marker) {
                  const nr = document.createRange();
                  nr.selectNodeContents(marker);
                  savedRangeRef.current = nr;
                }
              }
            } else {
              editorRef.current.focus();
            }
            return;
          }
        }
      }

      if (selectedCells.size === 0) return;
      const stylesPayload: Array<{ rowIndex: number; colIndex: number } & CellStyle> = [];
      const next = new Map(cells);
      for (const k of selectedCells) {
        const [r, c] = k.split(",").map(Number);
        const existing = next.get(k);
        const merged: CellStyle = { ...(existing?.style ?? {}), ...patch };
        next.set(k, {
          cellValue: existing?.cellValue ?? null,
          richValue: existing?.richValue ?? null,
          style: merged,
        });
        stylesPayload.push({ rowIndex: r, colIndex: c, ...patch });
      }
      setCells(next);
      pushHistory({ cells: next });
      fetch(`/api/sheets/${sheetId}/styles`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ styles: stylesPayload }),
      }).catch(() => {});
    },
    [editingCell, cells, selectedCells, sheetId, pushHistory]
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
        if (!data.merge) return;
        const next = [...merges, data.merge];
        setMerges(next);
        pushHistory({ merges: next });
      })
      .catch(() => {});
  }, [selectedCells, merges, sheetId, pushHistory]);

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
        const next = merges.filter((m) => !toRemove.some((t) => t.id === m.id));
        setMerges(next);
        pushHistory({ merges: next });
      })
      .catch(() => {});
  }, [selectedCells, merges, sheetId, pushHistory]);

  const runStructure = useCallback(
    (op: StructureOp) => {
      const nextCells = shiftCells(cells, op);
      const nextMerges = shiftMerges(merges, op);
      const delta = op.kind === "insert" ? 1 : -1;
      const nextRowCount = op.axis === "row" ? rowCount + delta : rowCount;
      const nextColCount = op.axis === "col" ? colCount + delta : colCount;
      const nextColWidths =
        op.axis === "col" ? shiftSizes(colWidths, op.kind, op.at) : colWidths;
      const nextRowHeights =
        op.axis === "row" ? shiftSizes(rowHeights, op.kind, op.at) : rowHeights;

      setCells(nextCells);
      setMerges(nextMerges);
      setColWidths(nextColWidths);
      setRowHeights(nextRowHeights);
      setRowCount(nextRowCount);
      setColCount(nextColCount);
      onRowCountChange?.(nextRowCount);
      onColCountChange?.(nextColCount);

      applyStructure(op);
      pushHistory({
        cells: nextCells,
        merges: nextMerges,
        colWidths: nextColWidths,
        rowHeights: nextRowHeights,
        rowCount: nextRowCount,
        colCount: nextColCount,
        op,
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cells, merges, colWidths, rowHeights, rowCount, colCount, pushHistory, onRowCountChange, onColCountChange]
  );

  // Insert below the selected row, or append when nothing is selected.
  const addRow = useCallback(() => {
    runStructure({ axis: "row", kind: "insert", at: anchor ? anchor.row + 1 : rowCount });
  }, [runStructure, anchor, rowCount]);

  const deleteRow = useCallback(() => {
    if (rowCount <= 1) return;
    runStructure({ axis: "row", kind: "delete", at: anchor ? anchor.row : rowCount - 1 });
  }, [runStructure, anchor, rowCount]);

  const addCol = useCallback(() => {
    runStructure({ axis: "col", kind: "insert", at: anchor ? anchor.col + 1 : colCount });
  }, [runStructure, anchor, colCount]);

  const deleteCol = useCallback(() => {
    if (colCount <= 1) return;
    runStructure({ axis: "col", kind: "delete", at: anchor ? anchor.col : colCount - 1 });
  }, [runStructure, anchor, colCount]);

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
    undo: handleUndo,
    redo: handleRedo,
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
      onCopy={handleCopy}
      onCut={handleCut}
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
                  verticalAlign: style.verticalAlign ?? "middle",
                  color: style.textColor ?? "#000000",
                  backgroundColor: style.highlightColor ?? undefined,
                  padding: "2px 4px",
                  overflow: "hidden",
                  whiteSpace: style.wrapText ? "pre-wrap" : "nowrap",
                  wordBreak: style.wrapText ? "break-word" : undefined,
                  textOverflow: style.wrapText ? undefined : "ellipsis",
                  borderTop: style.borderTop || undefined,
                  borderRight: style.borderRight || undefined,
                  borderBottom: style.borderBottom || undefined,
                  borderLeft: style.borderLeft || undefined,
                };
                return (
                  <td
                    key={c}
                    rowSpan={merge ? merge.endRow - merge.startRow + 1 : undefined}
                    colSpan={merge ? merge.endCol - merge.startCol + 1 : undefined}
                    onMouseDown={(e) => handleCellMouseDown(e, r, c)}
                    onMouseEnter={() => handleCellMouseEnter(r, c)}
                    onDoubleClick={() => startEditing(r, c)}
                    className={cn(
                      "border border-hairline cursor-cell relative",
                      isSelected && !isEditing && "outline outline-2 outline-coral -outline-offset-2 bg-coral/5"
                    )}
                    style={inlineStyle}
                  >
                    {isEditing ? (
                      <div
                        ref={(el) => {
                          editorRef.current = el;
                          if (!el) {
                            seededCellKeyRef.current = null;
                            return;
                          }
                          const key = `${r},${c}`;
                          if (seededCellKeyRef.current === key) return;
                          seededCellKeyRef.current = key;
                          el.innerHTML = editorInitialHtmlRef.current;
                          // Place caret at end
                          const range = document.createRange();
                          range.selectNodeContents(el);
                          range.collapse(false);
                          const sel = window.getSelection();
                          sel?.removeAllRanges();
                          sel?.addRange(range);
                          el.focus();
                        }}
                        contentEditable
                        suppressContentEditableWarning
                        onMouseUp={saveEditorSelection}
                        onKeyUp={saveEditorSelection}
                        onFocus={() => {
                          // User clicked back into editor — dissolve the fake highlight
                          // and restore a real selection over the same text.
                          const el = editorRef.current;
                          if (!el) return;
                          const revived = removeFakeSelection(el);
                          if (revived) {
                            const sel = window.getSelection();
                            sel?.removeAllRanges();
                            sel?.addRange(revived);
                            savedRangeRef.current = revived.cloneRange();
                          }
                        }}
                        onBlur={(e) => {
                          // Save selection so toolbar can restore it before applying styles.
                          saveEditorSelection();
                          const related = e.relatedTarget as HTMLElement | null;
                          if (related?.closest("[data-sheets-toolbar]")) {
                            // Draw a visible marker so the user still sees the range
                            // while they interact with the toolbar (browsers hide the
                            // native selection when focus leaves contentEditable).
                            const el = editorRef.current;
                            const r = savedRangeRef.current;
                            if (el && r && !r.collapsed) {
                              addFakeSelection(el, r.cloneRange());
                            }
                            return;
                          }
                          // Committing for real — drop any fake marker.
                          if (editorRef.current) removeFakeSelection(editorRef.current);
                          commitEdit();
                        }}
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
                          whiteSpace: inlineStyle.whiteSpace,
                          minHeight: "1em",
                        }}
                      />
                    ) : cellData?.richValue && cellData.richValue.length > 0 ? (
                      <span dangerouslySetInnerHTML={{ __html: runsToHtml(cellData.richValue) }} />
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
