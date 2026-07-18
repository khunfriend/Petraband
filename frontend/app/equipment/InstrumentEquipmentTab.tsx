"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";

type InstrumentRow = { name: string; chairs: number; tables: number | null };

export default function InstrumentEquipmentTab({ isAdmin }: { isAdmin: boolean }) {
  const [rows, setRows] = useState<InstrumentRow[]>([]);
  const [editing, setEditing] = useState(false);
  const [editRows, setEditRows] = useState<InstrumentRow[]>([]);
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/instrument-equipment")
      .then((r) => r.json())
      .then((d) => setRows(d.rows ?? []))
      .catch(() => {});
  }, []);

  function openEdit() {
    setEditRows(rows.map((r) => ({ ...r })));
    setNewName("");
    setEditing(true);
  }

  function updateRow(idx: number, field: "chairs" | "tables", value: string) {
    const num = value === "" ? null : Math.max(0, parseInt(value) || 0);
    setEditRows((prev) => prev.map((r, i) => (i === idx ? { ...r, [field]: num } : r)));
  }

  function removeRow(idx: number) {
    setEditRows((prev) => prev.filter((_, i) => i !== idx));
  }

  function addRow() {
    const name = newName.trim();
    if (!name) return;
    setEditRows((prev) => [...prev, { name, chairs: 0, tables: null }]);
    setNewName("");
  }

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/instrument-equipment", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editRows.map((r) => ({ name: r.name, chairs: r.chairs ?? 0, tables: r.tables ?? null }))),
      });
      if (res.ok) {
        const data = await res.json();
        setRows(data.rows ?? editRows);
        setEditing(false);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">กำหนดจำนวนเก้าอี้และโต๊ะที่ใช้ต่อเครื่องดนตรี สำหรับคำนวณในงานแสดง</p>
        {isAdmin && !editing && (
          <Button size="sm" variant="secondary" onClick={openEdit}>แก้ไข</Button>
        )}
      </div>

      <div className="bg-surface-card border border-hairline rounded-[var(--radius-lg)] overflow-hidden">
        {editing ? (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-hairline-soft bg-surface-soft text-xs text-muted uppercase tracking-wide">
                  <th className="px-4 py-2.5 text-left w-8">#</th>
                  <th className="px-4 py-2.5 text-left">ชื่อเครื่องดนตรี</th>
                  <th className="px-4 py-2.5 text-center w-28">เก้าอี้</th>
                  <th className="px-4 py-2.5 text-center w-28">โต๊ะ</th>
                  <th className="px-2 py-2.5 w-8"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline-soft">
                {editRows.map((row, idx) => (
                  <tr key={idx}>
                    <td className="px-4 py-2 text-xs text-muted-soft">{idx + 1}</td>
                    <td className="px-4 py-2 font-medium text-ink">{row.name}</td>
                    <td className="px-4 py-2 text-center">
                      <input
                        type="number"
                        min={0}
                        value={row.chairs}
                        onChange={(e) => updateRow(idx, "chairs", e.target.value)}
                        className="w-16 px-2 py-1 text-sm text-center border border-hairline rounded-[var(--radius-sm)] bg-canvas text-ink outline-none focus:border-coral focus:ring-[2px] focus:ring-coral/20"
                      />
                    </td>
                    <td className="px-4 py-2 text-center">
                      <input
                        type="number"
                        min={0}
                        value={row.tables ?? ""}
                        placeholder="—"
                        onChange={(e) => updateRow(idx, "tables", e.target.value)}
                        className="w-16 px-2 py-1 text-sm text-center border border-hairline rounded-[var(--radius-sm)] bg-canvas text-ink placeholder:text-muted-soft outline-none focus:border-coral focus:ring-[2px] focus:ring-coral/20"
                      />
                    </td>
                    <td className="px-2 py-2 text-center">
                      <button onClick={() => removeRow(idx)} aria-label="ลบแถว" className="text-muted-soft hover:text-error text-xs">✕</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-4 py-3 border-t border-hairline-soft flex items-center gap-2">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addRow()}
                placeholder="ชื่อเครื่องดนตรีใหม่..."
                className="flex-1 px-3 py-1.5 text-sm border border-hairline rounded-[var(--radius-md)] bg-canvas text-ink placeholder:text-muted-soft outline-none focus:border-coral focus:ring-[3px] focus:ring-coral/20"
              />
              <Button size="sm" variant="secondary" onClick={addRow}>+ เพิ่ม</Button>
            </div>
            <div className="px-4 pb-4 flex gap-2">
              <Button size="sm" variant="coral" onClick={save} disabled={saving}>
                {saving ? "กำลังบันทึก..." : "บันทึก"}
              </Button>
              <Button size="sm" variant="secondary" onClick={() => setEditing(false)}>ยกเลิก</Button>
            </div>
          </>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted px-4 py-8 text-center">ยังไม่มีข้อมูล — กด แก้ไข เพื่อเพิ่ม</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-hairline-soft bg-surface-soft text-xs text-muted uppercase tracking-wide">
                <th className="px-4 py-2.5 text-left w-8">#</th>
                <th className="px-4 py-2.5 text-left">ชื่อเครื่องดนตรี</th>
                <th className="px-4 py-2.5 text-center w-28">เก้าอี้</th>
                <th className="px-4 py-2.5 text-center w-28">โต๊ะ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline-soft">
              {rows.map((row, idx) => (
                <tr key={idx}>
                  <td className="px-4 py-2.5 text-xs text-muted-soft">{idx + 1}</td>
                  <td className="px-4 py-2.5 font-medium text-ink">{row.name}</td>
                  <td className="px-4 py-2.5 text-center text-ink">{row.chairs}</td>
                  <td className="px-4 py-2.5 text-center text-muted-soft">{row.tables ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
