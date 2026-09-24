"use client";

import { useEffect, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { InstrumentIcon, ICON_TYPES } from "@/components/stage/InstrumentIcon";
import { getInstrumentColor } from "@/lib/instrumentColors";
import { cn } from "@/lib/utils";

type Item = {
  id: string;
  nameThai: string;
  iconType: string;
  footprintW: number;
  footprintH: number;
  isPlayable: boolean;
};

type Draft = {
  nameThai: string;
  iconType: string;
  footprintW: string;
  footprintH: string;
  isPlayable: boolean;
};

const EMPTY_DRAFT: Draft = {
  nameThai: "",
  iconType: "default",
  footprintW: "1",
  footprintH: "0.5",
  isPlayable: false,
};

function toDraft(it: Item): Draft {
  return {
    nameThai: it.nameThai,
    iconType: it.iconType,
    footprintW: String(it.footprintW),
    footprintH: String(it.footprintH),
    isPlayable: it.isPlayable,
  };
}

function Swatch({ iconType, size = 40 }: { iconType: string; size?: number }) {
  const c = getInstrumentColor(iconType);
  return (
    <div
      className="shrink-0 rounded-[var(--radius-md)] p-1"
      style={{ width: size, height: size, background: c.bg, border: `1.5px solid ${c.border}` }}
    >
      <InstrumentIcon iconType={iconType} color={c} />
    </div>
  );
}

// Top-down footprint drawn to scale, so width/depth edits are easy to judge.
function FootprintPreview({ draft }: { draft: Draft }) {
  const w = parseFloat(draft.footprintW) || 0;
  const h = parseFloat(draft.footprintH) || 0;
  const c = getInstrumentColor(draft.iconType);
  const box = 120;
  const scale = w > 0 && h > 0 ? box / Math.max(w, h, 1.5) : 0;
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div
        className="flex items-center justify-center rounded-[var(--radius-md)] border border-dashed border-hairline bg-canvas"
        style={{ width: box + 16, height: box + 16 }}
      >
        {scale > 0 && (
          <div
            style={{
              width: w * scale,
              height: h * scale,
              background: c.bg,
              border: `1.5px solid ${c.border}`,
            }}
            className="rounded-sm p-0.5"
          >
            <InstrumentIcon iconType={draft.iconType} color={c} />
          </div>
        )}
      </div>
      <p className="text-[11px] text-muted-soft">ตัวอย่างตามสัดส่วน (กรอบ = {Math.max(w, h, 1.5)} ม.)</p>
    </div>
  );
}

function Editor({
  draft,
  setDraft,
  error,
  saving,
  onSave,
  onCancel,
  saveLabel,
}: {
  draft: Draft;
  setDraft: (d: Draft) => void;
  error: string;
  saving: boolean;
  onSave: () => void;
  onCancel: () => void;
  saveLabel: string;
}) {
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft({ ...draft, [k]: v });
  return (
    <div className="flex flex-col md:flex-row gap-5">
      <div className="flex-1 flex flex-col gap-4 min-w-0">
        <Input
          label="ชื่อ"
          id="nameThai"
          value={draft.nameThai}
          onChange={(e) => set("nameThai", e.target.value)}
          placeholder="เช่น โต๊ะวางโน้ต"
          maxLength={60}
        />

        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-ink">รูปไอคอน</span>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {ICON_TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => set("iconType", t.value)}
                aria-pressed={draft.iconType === t.value}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-[var(--radius-md)] border p-2 transition-colors",
                  draft.iconType === t.value
                    ? "border-primary ring-[3px] ring-primary/15 bg-canvas"
                    : "border-hairline hover:border-primary/40"
                )}
              >
                <Swatch iconType={t.value} size={36} />
                <span className="text-[11px] text-body leading-tight text-center">{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="กว้าง (เมตร)"
            id="footprintW"
            type="number"
            step="0.05"
            min="0.1"
            max="10"
            value={draft.footprintW}
            onChange={(e) => set("footprintW", e.target.value)}
          />
          <Input
            label="ลึก (เมตร)"
            id="footprintH"
            type="number"
            step="0.05"
            min="0.1"
            max="10"
            value={draft.footprintH}
            onChange={(e) => set("footprintH", e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-ink">ประเภท</span>
          <div className="flex rounded-[var(--radius-md)] border border-hairline overflow-hidden w-fit">
            {[
              { v: true, label: "เครื่องดนตรี" },
              { v: false, label: "อุปกรณ์บนเวที" },
            ].map((o, i) => (
              <button
                key={o.label}
                type="button"
                onClick={() => set("isPlayable", o.v)}
                className={cn(
                  "px-4 py-2 text-sm font-medium transition-colors",
                  i > 0 && "border-l border-hairline",
                  draft.isPlayable === o.v
                    ? "bg-primary text-on-primary"
                    : "bg-canvas text-muted hover:text-ink"
                )}
              >
                {o.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-soft">
            เครื่องดนตรีจะให้สมาชิกเลือกเป็นเครื่องที่เล่นได้ ส่วนอุปกรณ์บนเวทีจะแสดงแค่ในผังเวที
          </p>
        </div>

        {error && <p className="text-sm text-error">{error}</p>}

        <div className="flex gap-2">
          <Button type="button" variant="primary" size="sm" onClick={onSave} disabled={saving}>
            {saving ? "กำลังบันทึก..." : saveLabel}
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={onCancel} disabled={saving}>
            ยกเลิก
          </Button>
        </div>
      </div>
      <FootprintPreview draft={draft} />
    </div>
  );
}

export default function StageLibraryTab({ isAdmin }: { isAdmin: boolean }) {
  const confirm = useConfirm();
  const toast = useToast();
  const [items, setItems] = useState<Item[] | null>(null);
  const [editingId, setEditingId] = useState<string | "new" | null>(null);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/instruments")
      .then((r) => r.json())
      .then((d) => setItems(d.instruments ?? []))
      .catch(() => setItems([]));
  }, []);

  function startEdit(id: string | "new", d: Draft) {
    setEditingId(id);
    setDraft(d);
    setError("");
  }

  async function save() {
    const w = parseFloat(draft.footprintW);
    const h = parseFloat(draft.footprintH);
    if (!draft.nameThai.trim()) return setError("กรอกชื่อ");
    if (!(w >= 0.1 && w <= 10) || !(h >= 0.1 && h <= 10))
      return setError("ขนาดต้องอยู่ระหว่าง 0.1–10 เมตร");

    setSaving(true);
    setError("");
    try {
      const isNew = editingId === "new";
      const res = await fetch(isNew ? "/api/instruments" : `/api/instruments/${editingId}`, {
        method: isNew ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nameThai: draft.nameThai.trim(),
          iconType: draft.iconType,
          footprintW: w,
          footprintH: h,
          isPlayable: draft.isPlayable,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return setError(data.error || "บันทึกไม่สำเร็จ");
      const saved: Item = data.instrument;
      setItems((prev) => {
        const list = prev ?? [];
        const next = isNew ? [...list, saved] : list.map((it) => (it.id === saved.id ? saved : it));
        return next.sort((a, b) => a.nameThai.localeCompare(b.nameThai, "th"));
      });
      setEditingId(null);
      toast.success(isNew ? `เพิ่ม ${saved.nameThai} แล้ว` : `บันทึก ${saved.nameThai} แล้ว`);
    } finally {
      setSaving(false);
    }
  }

  async function remove(it: Item) {
    const ok = await confirm({
      title: "ลบออกจากคลัง",
      message: `ต้องการลบ "${it.nameThai}" ออกจากคลัง?`,
      confirmLabel: "ลบ",
      variant: "danger",
    });
    if (!ok) return;
    const res = await fetch(`/api/instruments/${it.id}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return toast.error(data.error || "ลบไม่สำเร็จ");
    setItems((prev) => (prev ?? []).filter((x) => x.id !== it.id));
    toast.success(`ลบ ${it.nameThai} แล้ว`);
  }

  if (!items) return <p className="text-sm text-muted">กำลังโหลด...</p>;

  const groups = [
    { title: "เครื่องดนตรี", list: items.filter((i) => i.isPlayable) },
    { title: "อุปกรณ์บนเวที", list: items.filter((i) => !i.isPlayable) },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <p className="text-sm text-body leading-[1.7]">
          รูปและขนาดของแต่ละชิ้นที่ใช้วางบนผังเวที ขนาดคือพื้นที่ที่วางจริงบนพื้นเวที (มองจากด้านบน)
        </p>
        {isAdmin && editingId !== "new" && (
          <Button
            variant="primary"
            size="sm"
            className="shrink-0"
            onClick={() => startEdit("new", EMPTY_DRAFT)}
          >
            <Plus size={16} strokeWidth={2} /> เพิ่มในคลัง
          </Button>
        )}
      </div>

      {editingId === "new" && (
        <div className="bg-surface-card border border-primary/40 rounded-[var(--radius-lg)] p-5">
          <p className="text-sm font-semibold text-ink mb-4">เพิ่มชิ้นใหม่</p>
          <Editor
            draft={draft}
            setDraft={setDraft}
            error={error}
            saving={saving}
            onSave={save}
            onCancel={() => setEditingId(null)}
            saveLabel="เพิ่ม"
          />
        </div>
      )}

      {groups.map((g) => (
        <section key={g.title} className="flex flex-col gap-2">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted">
            {g.title} · {g.list.length}
          </p>
          {g.list.length === 0 && (
            <p className="text-sm text-muted-soft">ยังไม่มี</p>
          )}
          {g.list.map((it) =>
            editingId === it.id ? (
              <div
                key={it.id}
                className="bg-surface-card border border-primary/40 rounded-[var(--radius-lg)] p-5"
              >
                <Editor
                  draft={draft}
                  setDraft={setDraft}
                  error={error}
                  saving={saving}
                  onSave={save}
                  onCancel={() => setEditingId(null)}
                  saveLabel="บันทึก"
                />
              </div>
            ) : (
              <div
                key={it.id}
                className="flex items-center gap-4 px-4 py-3 bg-surface-card border border-hairline rounded-[var(--radius-lg)]"
              >
                <Swatch iconType={it.iconType} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ink truncate">{it.nameThai}</p>
                  <p className="text-xs text-muted">
                    {ICON_TYPES.find((t) => t.value === it.iconType)?.label ?? "ทั่วไป"}
                  </p>
                </div>
                <p className="text-sm text-body tabular-nums shrink-0">
                  {it.footprintW} × {it.footprintH} ม.
                </p>
                {isAdmin && (
                  <div className="flex gap-1 shrink-0">
                    <Button
                      size="sm"
                      variant="secondary"
                      aria-label={`แก้ไข ${it.nameThai}`}
                      onClick={() => startEdit(it.id, toDraft(it))}
                    >
                      <Pencil size={14} strokeWidth={2} />
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      aria-label={`ลบ ${it.nameThai}`}
                      onClick={() => remove(it)}
                    >
                      <Trash2 size={14} strokeWidth={2} />
                    </Button>
                  </div>
                )}
              </div>
            )
          )}
        </section>
      ))}
    </div>
  );
}
