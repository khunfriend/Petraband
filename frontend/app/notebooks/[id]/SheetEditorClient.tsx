"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { SheetTabs } from "@/components/sheets/SheetTabs";
import { Toolbar } from "@/components/sheets/Toolbar";
import { SheetGrid, type SheetGridHandle } from "@/components/sheets/SheetGrid";
import type { CellRef, CellStyle, FullSheet, SheetSummary } from "@/components/sheets/types";

interface SongVersion {
  id: string;
  message: string;
  duration: number | null;
  createdAt: string;
  createdBy: { nickname: string };
}

interface NotebookData {
  id: string;
  name: string;
  song: { id: string; title: string; songCode: string } | null;
  sheets: SheetSummary[];
}

interface Props {
  notebook: NotebookData;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("th-TH", {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function SheetEditorClient({ notebook: initialNotebook }: Props) {
  const [notebook, setNotebook] = useState<NotebookData>(initialNotebook);
  const [activeSheetId, setActiveSheetId] = useState<string | null>(
    initialNotebook.sheets[0]?.id ?? null
  );
  const [activeSheetData, setActiveSheetData] = useState<FullSheet | null>(null);
  const [loading, setLoading] = useState(false);
  const [selection, setSelection] = useState<CellRef[]>([]);
  const [currentStyle, setCurrentStyle] = useState<CellStyle>({});
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [showHistory, setShowHistory] = useState(false);
  const [versions, setVersions] = useState<SongVersion[]>([]);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const saveStatusTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const gridRef = useRef<SheetGridHandle>(null);

  const handleSaveStatus = useCallback((status: "saving" | "saved" | "error") => {
    setSaveStatus(status);
    if (saveStatusTimer.current) clearTimeout(saveStatusTimer.current);
    if (status === "saved") {
      saveStatusTimer.current = setTimeout(() => setSaveStatus("idle"), 2000);
    }
  }, []);

  const loadVersions = useCallback(async () => {
    if (!notebook.song) return;
    setLoadingVersions(true);
    const res = await fetch(`/api/songs/${notebook.song.id}/versions`);
    if (res.ok) {
      const data = await res.json();
      setVersions(data.versions ?? []);
    }
    setLoadingVersions(false);
  }, [notebook.song]);

  useEffect(() => {
    if (showHistory) loadVersions();
  }, [showHistory, loadVersions]);

  // Load active sheet data
  useEffect(() => {
    if (!activeSheetId) { setActiveSheetData(null); return; }
    let cancelled = false;
    setLoading(true);
    fetch(`/api/sheets/${activeSheetId}`)
      .then((r) => r.json())
      .then((data) => { if (!cancelled && data.sheet) setActiveSheetData(data.sheet); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [activeSheetId]);

  const handleAddSheet = useCallback(async () => {
    const res = await fetch(`/api/notebooks/${notebook.id}/sheets`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: `Sheet${notebook.sheets.length + 1}` }),
    });
    if (res.ok) {
      const data = await res.json();
      const newSheet: SheetSummary = data.sheet;
      setNotebook((prev) => ({ ...prev, sheets: [...prev.sheets, newSheet] }));
      setActiveSheetId(newSheet.id);
    }
  }, [notebook.id, notebook.sheets.length]);

  const handleRenameSheet = useCallback(async (id: string, name: string) => {
    const res = await fetch(`/api/sheets/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (res.ok) {
      setNotebook((prev) => ({
        ...prev,
        sheets: prev.sheets.map((s) => (s.id === id ? { ...s, name } : s)),
      }));
    }
  }, []);

  const handleDeleteSheet = useCallback(async (id: string) => {
    const res = await fetch(`/api/sheets/${id}`, { method: "DELETE" });
    if (res.ok) {
      setNotebook((prev) => {
        const remaining = prev.sheets.filter((s) => s.id !== id);
        if (activeSheetId === id) setActiveSheetId(remaining[0]?.id ?? null);
        return { ...prev, sheets: remaining };
      });
    }
  }, [activeSheetId]);

  const handleExport = useCallback(async () => {
    if (!activeSheetId) return;
    const res = await fetch(`/api/sheets/${activeSheetId}/export/xlsx`, { method: "POST" });
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${notebook.sheets.find((s) => s.id === activeSheetId)?.name ?? "sheet"}.xlsx`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }, [activeSheetId, notebook.sheets]);

  const handlePublish = useCallback(async () => {
    if (!activeSheetId) return;
    const sheet = notebook.sheets.find((s) => s.id === activeSheetId);
    if (!sheet) return;
    const newVal = !sheet.isPublished;
    const res = await fetch(`/api/sheets/${activeSheetId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPublished: newVal }),
    });
    if (res.ok) {
      setNotebook((prev) => ({
        ...prev,
        sheets: prev.sheets.map((s) =>
          s.id === activeSheetId ? { ...s, isPublished: newVal } : s
        ),
      }));
    }
  }, [activeSheetId, notebook.sheets]);

  const handleRenameNotebook = useCallback(async () => {
    const name = prompt("ชื่อสมุดโน้ต", notebook.name);
    if (!name || name === notebook.name) return;
    const res = await fetch(`/api/notebooks/${notebook.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (res.ok) setNotebook((prev) => ({ ...prev, name }));
  }, [notebook.id, notebook.name]);

  const handleSelectionChange = useCallback((cells: CellRef[], style: CellStyle) => {
    setSelection(cells);
    setCurrentStyle(style);
  }, []);

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-canvas">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-hairline bg-surface-card">
        <div className="flex items-center gap-2 text-sm text-muted">
          <Link href="/songs" className="hover:text-ink">เพลง</Link>
          {notebook.song && (
            <>
              <span>/</span>
              <Link href={`/songs/${notebook.song.id}`} className="hover:text-ink">
                {notebook.song.title}
              </Link>
            </>
          )}
          <span>/</span>
        </div>
        <button
          type="button"
          onClick={handleRenameNotebook}
          className="text-base font-bold text-ink hover:text-coral"
          title="คลิกเพื่อเปลี่ยนชื่อ"
        >
          {notebook.name}
        </button>
        <div className="ml-auto flex items-center gap-3">
          {saveStatus === "saving" && <span className="text-xs text-muted">กำลังบันทึก...</span>}
          {saveStatus === "saved" && <span className="text-xs text-green-600">✓ บันทึกแล้ว</span>}
          {saveStatus === "error" && <span className="text-xs text-red-500">บันทึกไม่สำเร็จ</span>}

          {notebook.song && (
            <button
              type="button"
              onClick={() => setShowHistory((v) => !v)}
              className={`text-xs px-3 py-1 rounded-full border transition ${
                showHistory
                  ? "bg-surface-soft border-coral text-coral"
                  : "bg-surface-soft border-hairline text-muted hover:text-ink"
              }`}
            >
              ประวัติการแก้ไข
            </button>
          )}

          {notebook.song && (
            <Link href={`/songs/${notebook.song.id}`} className="text-xs text-muted hover:text-ink">
              ดูหน้าเพลง →
            </Link>
          )}

          {activeSheetId && (() => {
            const sheet = notebook.sheets.find((s) => s.id === activeSheetId);
            const published = sheet?.isPublished ?? false;
            return (
              <button
                type="button"
                onClick={handlePublish}
                className={`text-xs px-3 py-1 rounded-full border transition ${
                  published
                    ? "bg-green-50 border-green-300 text-green-700 hover:bg-red-50 hover:border-red-300 hover:text-red-600"
                    : "bg-surface-soft border-hairline text-muted hover:text-ink hover:border-coral"
                }`}
                title={published ? "คลิกเพื่อยกเลิกการแสดงในหน้าเพลง" : "คลิกเพื่อส่งออกไปหน้าเพลง"}
              >
                {published ? "✓ แสดงในหน้าเพลงแล้ว" : "ส่งออกไปหน้าเพลง"}
              </button>
            );
          })()}
        </div>
      </div>

      {/* Version History Panel */}
      {showHistory && (
        <div className="border-b border-hairline bg-surface-soft">
          <div className="px-4 py-2 flex items-center gap-2">
            <p className="text-xs font-bold tracking-wide uppercase text-muted">ประวัติการแก้ไข</p>
          </div>
          {loadingVersions ? (
            <p className="text-xs text-muted px-4 pb-3">กำลังโหลด...</p>
          ) : versions.length === 0 ? (
            <p className="text-xs text-muted px-4 pb-3">ยังไม่มีประวัติการแก้ไข</p>
          ) : (
            <ul className="divide-y divide-hairline-soft max-h-40 overflow-y-auto">
              {versions.map((v) => (
                <li key={v.id} className="px-4 py-2">
                  <p className="text-xs font-medium text-ink">{v.message}</p>
                  <p className="text-xs text-muted mt-0.5">
                    {v.createdBy.nickname} · {formatDate(v.createdAt)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Toolbar */}
      <Toolbar
        selection={selection}
        currentStyle={currentStyle}
        onStyleChange={(patch) => gridRef.current?.applyStyle(patch)}
        onMerge={() => gridRef.current?.mergeCells()}
        onUnmerge={() => gridRef.current?.unmergeCells()}
        onExport={handleExport}
        onAddRow={() => gridRef.current?.addRow()}
        onDeleteRow={() => gridRef.current?.deleteRow()}
        onAddCol={() => gridRef.current?.addCol()}
        onDeleteCol={() => gridRef.current?.deleteCol()}
      />

      {/* Grid */}
      <div className="flex-1 overflow-hidden">
        {loading && <p className="text-sm text-muted p-4">กำลังโหลด...</p>}
        {!loading && !activeSheetData && (
          <p className="text-sm text-muted p-4">ยังไม่มีชีต — คลิก + เพื่อสร้าง</p>
        )}
        {!loading && activeSheetData && (
          <SheetGrid
            key={activeSheetData.id}
            ref={gridRef}
            sheetId={activeSheetData.id}
            initialData={activeSheetData}
            onSelectionChange={handleSelectionChange}
            onSaveStatus={handleSaveStatus}
          />
        )}
      </div>

      {/* Tabs */}
      <SheetTabs
        sheets={notebook.sheets}
        activeSheetId={activeSheetId}
        onSelect={setActiveSheetId}
        onAdd={handleAddSheet}
        onRename={handleRenameSheet}
        onDelete={handleDeleteSheet}
      />
    </div>
  );
}
