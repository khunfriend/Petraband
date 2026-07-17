"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { NotationGrid, type SheetData } from "@/components/songs/NotationGrid";

interface Props {
  song: {
    id: string;
    title: string;
    category: string;
    duration: number | null;
    sheetData: unknown;
  };
  isAdmin: boolean;
}

const CATEGORIES = ["ดนตรีไทย", "เพลงไทยเดิม", "เพลงสากล", "เพลงพื้นบ้าน", "อื่นๆ"];

function formatDuration(seconds: number | null): string {
  if (!seconds) return "N/A";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function secondsToMmSs(seconds: number | null): string {
  if (!seconds) return "";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function mmSsToSeconds(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parts = trimmed.split(":");
  if (parts.length === 2) {
    const m = parseInt(parts[0], 10);
    const s = parseInt(parts[1], 10);
    if (!isNaN(m) && !isNaN(s) && s < 60) return m * 60 + s;
  } else {
    const n = parseInt(trimmed, 10);
    if (!isNaN(n)) return n;
  }
  return null;
}

export default function SongDetailClient({ song, isAdmin }: Props) {
  const [editMode, setEditMode] = useState(false);
  const [sheetData, setSheetData] = useState<SheetData>(
    (song.sheetData as SheetData) ?? { rows: [] }
  );
  const [titleInput, setTitleInput] = useState(song.title);
  const [categoryInput, setCategoryInput] = useState(song.category);
  const [currentDuration, setCurrentDuration] = useState<number | null>(song.duration);
  const [durationInput, setDurationInput] = useState(secondsToMmSs(song.duration));
  const [durationError, setDurationError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [openingNotebook, setOpeningNotebook] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmInput, setDeleteConfirmInput] = useState("");
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = useCallback(async () => {
    if (deleteConfirmInput !== song.title) return;
    setDeleting(true);
    const res = await fetch(`/api/songs/${song.id}`, { method: "DELETE" });
    setDeleting(false);
    if (res.ok) {
      window.location.href = "/songs";
    } else {
      alert("ลบเพลงไม่สำเร็จ กรุณาลองใหม่");
    }
  }, [song.id, song.title, deleteConfirmInput]);

  const handleOpenNotebook = useCallback(async () => {
    setOpeningNotebook(true);
    try {
      const listRes = await fetch(`/api/notebooks?songId=${song.id}`);
      let notebookId: string | null = null;
      if (listRes.ok) {
        const data = await listRes.json();
        notebookId = data.notebooks?.[0]?.id ?? null;
      }
      if (!notebookId) {
        const createRes = await fetch(`/api/notebooks`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ songId: song.id, name: song.title }),
        });
        if (createRes.ok) {
          const data = await createRes.json();
          notebookId = data.notebook?.id ?? null;
        }
      }
      if (notebookId) router.push(`/notebooks/${notebookId}`);
    } finally {
      setOpeningNotebook(false);
    }
  }, [song.id, song.title, router]);

  async function handleSave() {
    const duration = mmSsToSeconds(durationInput);
    if (durationInput.trim() && duration === null) {
      setDurationError("รูปแบบไม่ถูกต้อง (เช่น 3:45)");
      return;
    }
    if (!titleInput.trim()) return;
    setDurationError("");
    setSaving(true);
    const res = await fetch(`/api/songs/${song.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: titleInput.trim(),
        category: categoryInput,
        sheetData,
        duration,
        commitMessage: "แก้ไขข้อมูลเพลง",
      }),
    });
    setSaving(false);
    if (res.ok) {
      setCurrentDuration(duration);
      setSaved(true);
      setEditMode(false);
      setTimeout(() => setSaved(false), 3000);
      router.refresh();
    }
  }

  function handleCancel() {
    setSheetData((song.sheetData as SheetData) ?? { rows: [] });
    setTitleInput(song.title);
    setCategoryInput(song.category);
    setDurationInput(secondsToMmSs(song.duration));
    setDurationError("");
    setEditMode(false);
  }

  return (
    <div>
      {/* Top bar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {/* Notebook button (non-admin) */}
          {!isAdmin && (
            <Button variant="coral" size="sm" onClick={handleOpenNotebook} disabled={openingNotebook}>
              {openingNotebook ? "กำลังเปิด..." : "สมุดโน้ต"}
            </Button>
          )}
          {/* Buttons admin view mode */}
          {isAdmin && !editMode && (
            <>
              <Button variant="secondary" size="sm" onClick={() => setEditMode(true)}>
                แก้ไข
              </Button>
              <Button variant="coral" size="sm" onClick={handleOpenNotebook} disabled={openingNotebook}>
                {openingNotebook ? "กำลังเปิด..." : "สมุดโน้ต"}
              </Button>
              <Button variant="secondary" size="sm" onClick={() => { setShowDeleteModal(true); setDeleteConfirmInput(""); }} className="text-red-600 border-red-200 hover:bg-red-50">
                ลบเพลง
              </Button>
              {saved && <span className="text-sm text-success">บันทึกเรียบร้อยแล้ว</span>}
            </>
          )}
        </div>

        {/* Duration — top right, view mode only */}
        {!editMode && (
          <p className="text-sm text-muted">
            เวลาที่ใช้เล่น:{" "}
            <span className="text-ink font-medium">{formatDuration(currentDuration)}</span>
          </p>
        )}
      </div>

      {/* Edit form (admin only) */}
      {isAdmin && editMode && (
        <div className="border border-hairline-soft rounded-[var(--radius-md)] p-4 bg-surface-soft flex flex-col gap-3 mb-4">
          {/* Title */}
          <div className="flex items-center gap-3">
            <label className="text-xs text-muted w-24 shrink-0">ชื่อเพลง</label>
            <input
              type="text"
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              className="flex-1 text-sm border border-hairline rounded-[var(--radius-sm)] px-3 py-1.5 bg-surface-card text-ink outline-none focus:ring-1 focus:ring-coral/50"
            />
          </div>
          {/* Category */}
          <div className="flex items-center gap-3">
            <label className="text-xs text-muted w-24 shrink-0">หมวดหมู่</label>
            <select
              value={categoryInput}
              onChange={(e) => setCategoryInput(e.target.value)}
              className="flex-1 text-sm border border-hairline rounded-[var(--radius-sm)] px-3 py-1.5 bg-surface-card text-ink outline-none focus:ring-1 focus:ring-coral/50"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          {/* Duration */}
          <div className="flex items-center gap-3">
            <label className="text-xs text-muted w-24 shrink-0">เวลาที่เล่น (ม:วว)</label>
            <input
              type="text"
              value={durationInput}
              onChange={(e) => { setDurationInput(e.target.value); setDurationError(""); }}
              placeholder="3:45"
              className="w-24 text-sm border border-hairline rounded-[var(--radius-sm)] px-3 py-1.5 bg-surface-card text-ink outline-none focus:ring-1 focus:ring-coral/50"
            />
            {durationError && <span className="text-xs text-error">{durationError}</span>}
          </div>
          {/* Actions */}
          <div className="flex items-center gap-2 pt-1">
            <Button variant="primary" size="sm" onClick={handleSave} disabled={saving}>
              {saving ? "กำลังบันทึก..." : "บันทึก"}
            </Button>
            <Button variant="secondary" size="sm" onClick={handleCancel}>
              ยกเลิก
            </Button>
          </div>
        </div>
      )}

      {/* Notation Grid */}
      {sheetData.rows.length > 0 && (
        <NotationGrid sheetData={sheetData} editable={editMode} onChange={setSheetData} />
      )}

      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-surface-card rounded-[var(--radius-lg)] border border-hairline shadow-lg p-6 w-full max-w-sm flex flex-col gap-4">
            <h2 className="text-base font-bold text-ink">ยืนยันการลบเพลง</h2>
            <p className="text-sm text-muted">
              การลบจะลบสมุดโน้ตและข้อมูลทั้งหมดออกถาวร พิมพ์ชื่อเพลงเพื่อยืนยัน
            </p>
            <p className="text-sm font-medium text-ink bg-surface-soft px-3 py-1.5 rounded-[var(--radius-sm)] border border-hairline">
              {song.title}
            </p>
            <input
              type="text"
              autoFocus
              value={deleteConfirmInput}
              onChange={(e) => setDeleteConfirmInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleDelete(); }}
              placeholder="พิมพ์ชื่อเพลงที่นี่"
              className="text-sm border border-hairline rounded-[var(--radius-sm)] px-3 py-1.5 bg-surface-card text-ink outline-none focus:ring-1 focus:ring-red-400"
            />
            <div className="flex gap-2 justify-end">
              <Button variant="secondary" size="sm" onClick={() => setShowDeleteModal(false)} disabled={deleting}>
                ยกเลิก
              </Button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleteConfirmInput !== song.title || deleting}
                className="text-sm px-4 py-1.5 rounded-[var(--radius-sm)] bg-red-500 text-white font-medium disabled:opacity-40 hover:bg-red-600 transition"
              >
                {deleting ? "กำลังลบ..." : "ลบเพลง"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
