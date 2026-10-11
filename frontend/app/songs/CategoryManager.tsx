"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

type Editing = { kind: "rename"; name: string; draft: string } | { kind: "delete"; name: string; moveTo: string };

const field =
  "h-9 rounded-[var(--radius-sm)] border border-hairline bg-surface-soft px-2 text-sm text-ink outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/15";

/** Admin dialog: rename a song category, or delete it by moving its songs elsewhere. */
export function CategoryManager({
  open,
  onClose,
  counts,
  onRenamed,
}: {
  open: boolean;
  onClose: () => void;
  /** Songs per category, over the whole library. */
  counts: Record<string, number>;
  /** The selected tab follows a renamed/deleted category. */
  onRenamed: (from: string, to: string) => void;
}) {
  const router = useRouter();
  const toast = useToast();
  const [editing, setEditing] = useState<Editing | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const names = Object.keys(counts).sort((a, b) => a.localeCompare(b, "th"));

  async function send(method: "PATCH" | "DELETE", body: object, done: string, from: string, to: string) {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/song-categories", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "บันทึกไม่สำเร็จ");
        return;
      }
      setEditing(null);
      toast.success(done);
      onRenamed(from, to);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  function rename(e: Extract<Editing, { kind: "rename" }>) {
    const to = e.draft.trim();
    if (!to || to === e.name) return setEditing(null);
    send("PATCH", { from: e.name, to }, counts[to] ? `รวม "${e.name}" เข้ากับ "${to}" แล้ว` : `เปลี่ยนชื่อเป็น "${to}" แล้ว`, e.name, to);
  }

  return (
    <Modal open={open} onClose={() => !busy && onClose()} title="จัดการประเภทเพลง" size="md">
      <div className="flex flex-col">
        {names.length === 0 && <p className="text-sm text-muted">ยังไม่มีประเภท</p>}
        {names.map((name) => {
          const e = editing?.name === name ? editing : null;
          return (
            <div key={name} className="flex flex-col gap-2 border-b border-hairline-soft py-3 last:border-0">
              {e?.kind === "rename" ? (
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    autoFocus
                    value={e.draft}
                    onChange={(ev) => setEditing({ ...e, draft: ev.target.value })}
                    onKeyDown={(ev) => {
                      if (ev.key === "Enter") rename(e);
                      if (ev.key === "Escape") setEditing(null);
                    }}
                    className={`${field} flex-1 min-w-40`}
                  />
                  <Button size="sm" variant="primary" disabled={busy} onClick={() => rename(e)}>
                    บันทึก
                  </Button>
                  <Button size="sm" variant="secondary" disabled={busy} onClick={() => setEditing(null)}>
                    ยกเลิก
                  </Button>
                  {counts[e.draft.trim()] && e.draft.trim() !== name ? (
                    <p className="w-full text-xs text-muted">มีประเภทนี้อยู่แล้ว เพลงทั้ง {counts[name]} เพลงจะรวมเข้าไป</p>
                  ) : null}
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <span className="flex-1 text-sm font-medium text-ink">{name}</span>
                  <span className="text-xs text-muted">{counts[name]} เพลง</span>
                  <button
                    type="button"
                    onClick={() => {
                      setError("");
                      setEditing({ kind: "rename", name, draft: name });
                    }}
                    className="text-xs text-muted hover:text-primary"
                  >
                    เปลี่ยนชื่อ
                  </button>
                  {names.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        setError("");
                        setEditing({ kind: "delete", name, moveTo: names.find((n) => n !== name) ?? "" });
                      }}
                      className="text-xs text-muted hover:text-error"
                    >
                      ลบ
                    </button>
                  )}
                </div>
              )}
              {e?.kind === "delete" && (
                <div className="flex flex-wrap items-center gap-2 rounded-[var(--radius-sm)] bg-surface-cream-strong px-3 py-2 text-sm text-body">
                  <span>ย้ายเพลง {counts[name]} เพลงไปที่</span>
                  <select value={e.moveTo} onChange={(ev) => setEditing({ ...e, moveTo: ev.target.value })} className={field}>
                    {names
                      .filter((n) => n !== name)
                      .map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                  </select>
                  <span>แล้วลบ &quot;{name}&quot;</span>
                  <div className="flex gap-2 ml-auto">
                    <Button
                      size="sm"
                      variant="coral"
                      disabled={busy || !e.moveTo}
                      onClick={() => send("DELETE", { name, moveTo: e.moveTo }, `ลบ "${name}" แล้ว`, name, e.moveTo)}
                    >
                      ลบประเภท
                    </Button>
                    <Button size="sm" variant="secondary" disabled={busy} onClick={() => setEditing(null)}>
                      ยกเลิก
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {error && <p className="mt-2 text-sm text-error">{error}</p>}
        <p className="mt-3 text-xs text-muted-soft">เพลงไม่หายไปไหน — เปลี่ยนชื่อแล้วเพลงตามไปด้วย ลบแล้วเพลงย้ายไปประเภทที่เลือก</p>
      </div>
    </Modal>
  );
}
