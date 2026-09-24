"use client";

import { useState, useEffect } from "react";
import { Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { POSITIONS } from "@/lib/positions";

type Accessory = { key: string; name: string; perPlayer: number };
type Row = { name: string; accessories: Record<string, number> };

const cellInput =
  "w-14 px-2 py-1 text-sm text-center border border-hairline rounded-[var(--radius-sm)] bg-canvas text-ink outline-none focus:border-primary focus:ring-[2px] focus:ring-primary/15";
const textInput =
  "px-3 py-1.5 text-sm border border-hairline rounded-[var(--radius-md)] bg-canvas text-ink placeholder:text-muted-soft outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/15";

function toCount(value: string) {
  return value === "" ? 0 : Math.min(99, Math.max(0, parseInt(value) || 0));
}

export default function InstrumentEquipmentTab({ isAdmin }: { isAdmin: boolean }) {
  const [accessories, setAccessories] = useState<Accessory[]>([]);
  const [rows, setRows] = useState<Row[]>([]);
  const [loaded, setLoaded] = useState(false);

  const [editing, setEditing] = useState(false);
  const [editAcc, setEditAcc] = useState<Accessory[]>([]);
  const [editRows, setEditRows] = useState<Row[]>([]);
  const [newAccName, setNewAccName] = useState("");
  const [newRowName, setNewRowName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function apply(d: {
    accessories?: { id: string; name: string; perPlayer: number }[];
    rows?: Row[];
  }) {
    setAccessories((d.accessories ?? []).map((a) => ({ key: a.id, name: a.name, perPlayer: a.perPlayer })));
    setRows(d.rows ?? []);
  }

  useEffect(() => {
    fetch("/api/instrument-equipment")
      .then((r) => r.json())
      .then(apply)
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  function openEdit() {
    setEditAcc(accessories.map((a) => ({ ...a })));
    setEditRows(rows.map((r) => ({ ...r, accessories: { ...r.accessories } })));
    setNewAccName("");
    setNewRowName("");
    setError("");
    setEditing(true);
  }

  function addAccessory() {
    const name = newAccName.trim();
    if (!name) return;
    setEditAcc((prev) => [...prev, { key: `new-${crypto.randomUUID()}`, name, perPlayer: 0 }]);
    setNewAccName("");
  }

  function addRow() {
    if (!newRowName) return;
    setEditRows((prev) => [...prev, { name: newRowName, accessories: {} }]);
    setNewRowName("");
  }

  function setCount(rowIdx: number, key: string, value: string) {
    setEditRows((prev) =>
      prev.map((r, i) => (i === rowIdx ? { ...r, accessories: { ...r.accessories, [key]: toCount(value) } } : r))
    );
  }

  async function save() {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/instrument-equipment", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessories: editAcc, rows: editRows }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "บันทึกไม่สำเร็จ");
        return;
      }
      apply(data);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  if (!loaded) return <p className="text-sm text-muted">กำลังโหลด...</p>;

  const acc = editing ? editAcc : accessories;
  const list = editing ? editRows : rows;
  const unusedPositions = POSITIONS.filter((p) => !editRows.some((r) => r.name === p));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted">
          กำหนดอุปกรณ์เสริมที่ใช้ในงานแสดง ใช้คำนวณ &quot;รายการอุปกรณ์ที่ต้องใช้&quot; ในหน้างานแสดง
        </p>
        {isAdmin && !editing && (
          <Button size="sm" variant="secondary" onClick={openEdit}>แก้ไข</Button>
        )}
      </div>

      {/* ── Accessory types ── */}
      <section className="space-y-2">
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted">อุปกรณ์เสริม</p>
        <div className="bg-surface-card border border-hairline rounded-[var(--radius-lg)] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-hairline-soft bg-surface-soft text-xs text-muted">
                <th className="px-4 py-2.5 text-left">รายการ</th>
                <th className="px-4 py-2.5 text-center w-40">ใช้ต่อคน (ทุกคน)</th>
                {editing && <th className="px-2 py-2.5 w-8"></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline-soft">
              {acc.map((a, idx) => (
                <tr key={a.key}>
                  <td className="px-4 py-2">
                    {editing ? (
                      <input
                        value={a.name}
                        maxLength={40}
                        aria-label="ชื่ออุปกรณ์เสริม"
                        onChange={(e) =>
                          setEditAcc((prev) => prev.map((x, i) => (i === idx ? { ...x, name: e.target.value } : x)))
                        }
                        className={`${textInput} w-full max-w-xs`}
                      />
                    ) : (
                      <span className="font-medium text-ink">{a.name}</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-center">
                    {editing ? (
                      <input
                        type="number"
                        min={0}
                        max={99}
                        value={a.perPlayer}
                        aria-label={`${a.name} ต่อคน`}
                        onChange={(e) =>
                          setEditAcc((prev) =>
                            prev.map((x, i) => (i === idx ? { ...x, perPlayer: toCount(e.target.value) } : x))
                          )
                        }
                        className={cellInput}
                      />
                    ) : (
                      <span className={a.perPlayer ? "text-ink" : "text-muted-soft"}>
                        {a.perPlayer || "—"}
                      </span>
                    )}
                  </td>
                  {editing && (
                    <td className="px-2 py-2 text-center">
                      <button
                        onClick={() => setEditAcc((prev) => prev.filter((_, i) => i !== idx))}
                        aria-label={`ลบ ${a.name}`}
                        className="text-muted-soft hover:text-error transition-colors duration-[var(--duration-pb-base)] p-1 rounded-[var(--radius-sm)]"
                      >
                        <Trash2 size={14} strokeWidth={1.75} />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
              {acc.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-muted">ยังไม่มีอุปกรณ์เสริม</td>
                </tr>
              )}
            </tbody>
          </table>
          {editing && (
            <div className="px-4 py-3 border-t border-hairline-soft flex items-center gap-2">
              <input
                value={newAccName}
                maxLength={40}
                onChange={(e) => setNewAccName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addAccessory()}
                placeholder="อุปกรณ์เสริมใหม่ เช่น พรม, ปลั๊กพ่วง"
                className={`${textInput} flex-1`}
              />
              <Button size="sm" variant="secondary" onClick={addAccessory} disabled={!newAccName.trim()}>
                <Plus size={14} strokeWidth={1.75} /> เพิ่ม
              </Button>
            </div>
          )}
        </div>
        <p className="text-xs text-muted-soft">
          &quot;ใช้ต่อคน&quot; นับตามจำนวนคนในงาน เช่น สแตนโน้ต 1 = ทุกคนได้คนละ 1
        </p>
      </section>

      {/* ── Per-instrument counts ── */}
      <section className="space-y-2">
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted">ใช้เพิ่มตามเครื่องดนตรี</p>
        <div className="bg-surface-card border border-hairline rounded-[var(--radius-lg)] overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-hairline-soft bg-surface-soft text-xs text-muted">
                <th className="px-4 py-2.5 text-left">เครื่องดนตรี</th>
                {acc.map((a) => (
                  <th key={a.key} className="px-3 py-2.5 text-center whitespace-nowrap">{a.name}</th>
                ))}
                {editing && <th className="px-2 py-2.5 w-8"></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline-soft">
              {list.map((r, idx) => (
                <tr key={r.name}>
                  <td className="px-4 py-2 font-medium text-ink whitespace-nowrap">{r.name}</td>
                  {acc.map((a) => (
                    <td key={a.key} className="px-3 py-2 text-center">
                      {editing ? (
                        <input
                          type="number"
                          min={0}
                          max={99}
                          value={r.accessories[a.key] ?? 0}
                          aria-label={`${r.name} ${a.name}`}
                          onChange={(e) => setCount(idx, a.key, e.target.value)}
                          className={cellInput}
                        />
                      ) : (
                        <span className={r.accessories[a.key] ? "text-ink" : "text-muted-soft"}>
                          {r.accessories[a.key] || "—"}
                        </span>
                      )}
                    </td>
                  ))}
                  {editing && (
                    <td className="px-2 py-2 text-center">
                      <button
                        onClick={() => setEditRows((prev) => prev.filter((_, i) => i !== idx))}
                        aria-label={`ลบ ${r.name}`}
                        className="text-muted-soft hover:text-error transition-colors duration-[var(--duration-pb-base)] p-1 rounded-[var(--radius-sm)]"
                      >
                        <Trash2 size={14} strokeWidth={1.75} />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
              {list.length === 0 && (
                <tr>
                  <td colSpan={acc.length + 2} className="px-4 py-6 text-center text-muted">
                    {editing ? "เลือกเครื่องดนตรีด้านล่างเพื่อเพิ่ม" : "ยังไม่มีข้อมูล — กด แก้ไข เพื่อเพิ่ม"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          {editing && (
            <div className="px-4 py-3 border-t border-hairline-soft flex items-center gap-2">
              <select
                value={newRowName}
                onChange={(e) => setNewRowName(e.target.value)}
                aria-label="เลือกเครื่องดนตรี"
                className={`${textInput} flex-1 h-9`}
              >
                <option value="">-- เลือกเครื่องดนตรี --</option>
                {unusedPositions.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              <Button size="sm" variant="secondary" onClick={addRow} disabled={!newRowName}>
                <Plus size={14} strokeWidth={1.75} /> เพิ่ม
              </Button>
            </div>
          )}
        </div>
      </section>

      {editing && (
        <div className="flex items-center gap-3">
          <Button size="sm" variant="primary" onClick={save} disabled={saving}>
            {saving ? "กำลังบันทึก..." : "บันทึก"}
          </Button>
          <Button size="sm" variant="secondary" onClick={() => setEditing(false)} disabled={saving}>
            ยกเลิก
          </Button>
          {error && <p className="text-sm text-error">{error}</p>}
        </div>
      )}
    </div>
  );
}
