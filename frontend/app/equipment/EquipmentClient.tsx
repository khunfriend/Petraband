"use client";

import { Fragment, useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";

interface ActiveLoan {
  id: string;
  direction: "BORROWED_IN" | "LENT_OUT";
  quantity: number;
  counterparty: string;
  borrowedAt: string;
  note: string | null;
}

interface Equipment {
  id: string;
  name: string;
  type: string | null;
  quantity: number;
  brokenQuantity: number;
  lengthCm: number | null;
  widthCm: number | null;
  heightCm: number | null;
  note: string | null;
  borrowedIn: number;
  lentOut: number;
  activeLoans: ActiveLoan[];
}

interface Props {
  equipment: Equipment[];
  isAdmin: boolean;
}

function formatDimensions(l: number | null, w: number | null, h: number | null): string {
  const parts = [l, w, h];
  if (parts.every((p) => p === null)) return "—";
  return parts.map((p) => (p !== null ? `${p}` : "—")).join(" × ") + " cm";
}

interface FormState {
  name: string;
  type: string;
  quantity: string;
  lengthCm: string;
  widthCm: string;
  heightCm: string;
  note: string;
}

const emptyForm: FormState = {
  name: "",
  type: "อุปกรณ์",
  quantity: "1",
  lengthCm: "",
  widthCm: "",
  heightCm: "",
  note: "",
};

function equipmentToForm(eq: Equipment): FormState {
  return {
    name: eq.name,
    type: eq.type ?? "",
    quantity: String(eq.quantity),
    lengthCm: eq.lengthCm !== null ? String(eq.lengthCm) : "",
    widthCm: eq.widthCm !== null ? String(eq.widthCm) : "",
    heightCm: eq.heightCm !== null ? String(eq.heightCm) : "",
    note: eq.note ?? "",
  };
}

function parseFormToBody(form: FormState) {
  return {
    name: form.name.trim(),
    type: form.type || null,
    quantity: parseInt(form.quantity) || 0,
    lengthCm: form.lengthCm ? parseFloat(form.lengthCm) : null,
    widthCm: form.widthCm ? parseFloat(form.widthCm) : null,
    heightCm: form.heightCm ? parseFloat(form.heightCm) : null,
    note: form.note.trim() || null,
  };
}

function EquipmentForm({
  form,
  onChange,
  onSubmit,
  onCancel,
  submitLabel,
  isPending,
}: {
  form: FormState;
  onChange: (f: FormState) => void;
  onSubmit: () => void;
  onCancel: () => void;
  submitLabel: string;
  isPending: boolean;
}) {
  const set = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    onChange({ ...form, [key]: e.target.value });

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="col-span-2">
        <Input label="ชื่ออุปกรณ์ *" value={form.name} onChange={set("name")} placeholder="ชื่ออุปกรณ์" />
      </div>

      <div>
        <Input
          label="จำนวนทั้งหมด"
          type="number"
          min="0"
          value={form.quantity}
          onChange={set("quantity")}
        />
      </div>

      <div className="col-span-2 flex flex-col gap-1.5">
        <label className="text-sm font-medium text-ink">ขนาด (ซม.) ก × ว × ส</label>
        <div className="flex gap-2">
          <input
            type="number"
            min="0"
            placeholder="ยาว"
            value={form.lengthCm}
            onChange={set("lengthCm")}
            className="h-10 w-full rounded-[var(--radius-md)] border border-hairline bg-surface-soft px-3 text-sm text-ink placeholder:text-muted-soft focus:outline-none focus:border-coral focus:ring-[3px] focus:ring-coral/20"
          />
          <input
            type="number"
            min="0"
            placeholder="กว้าง"
            value={form.widthCm}
            onChange={set("widthCm")}
            className="h-10 w-full rounded-[var(--radius-md)] border border-hairline bg-surface-soft px-3 text-sm text-ink placeholder:text-muted-soft focus:outline-none focus:border-coral focus:ring-[3px] focus:ring-coral/20"
          />
          <input
            type="number"
            min="0"
            placeholder="สูง"
            value={form.heightCm}
            onChange={set("heightCm")}
            className="h-10 w-full rounded-[var(--radius-md)] border border-hairline bg-surface-soft px-3 text-sm text-ink placeholder:text-muted-soft focus:outline-none focus:border-coral focus:ring-[3px] focus:ring-coral/20"
          />
        </div>
      </div>

      <div className="col-span-2 flex flex-col gap-1.5">
        <label className="text-sm font-medium text-ink">หมายเหตุ</label>
        <textarea
          rows={2}
          value={form.note}
          onChange={set("note")}
          placeholder="หมายเหตุ (ถ้ามี)"
          className="w-full rounded-[var(--radius-md)] border border-hairline bg-surface-soft px-3.5 py-2 text-sm text-ink placeholder:text-muted-soft focus:outline-none focus:border-coral focus:ring-[3px] focus:ring-coral/20 resize-none"
        />
      </div>

      <div className="col-span-2 flex justify-end gap-3 pt-1">
        <Button variant="secondary" size="sm" onClick={onCancel} disabled={isPending}>
          ยกเลิก
        </Button>
        <Button variant="coral" size="sm" onClick={onSubmit} disabled={isPending || !form.name.trim()}>
          {isPending ? "กำลังบันทึก..." : submitLabel}
        </Button>
      </div>
    </div>
  );
}

function LoanSummary({ loans }: { loans: ActiveLoan[] }) {
  if (loans.length === 0) return null;
  const borrowedIn = loans.filter((l) => l.direction === "BORROWED_IN");
  const lentOut = loans.filter((l) => l.direction === "LENT_OUT");

  return (
    <div className="flex flex-col gap-1.5 pt-1 border-t border-hairline-soft">
      {borrowedIn.length > 0 && (
        <div className="flex gap-2 flex-wrap items-start">
          <span className="text-xs text-muted mt-0.5">ยืมมา</span>
          <div className="flex flex-col gap-1">
            {borrowedIn.map((l) => (
              <span key={l.id} className="text-ink text-sm">
                <span className="tabular-nums font-medium">{l.quantity}</span> ชิ้น จาก{" "}
                <span className="font-medium">{l.counterparty}</span>
                {l.note && <span className="text-muted"> — {l.note}</span>}
              </span>
            ))}
          </div>
        </div>
      )}
      {lentOut.length > 0 && (
        <div className="flex gap-2 flex-wrap items-start">
          <span className="text-xs text-muted mt-0.5">ให้ยืม</span>
          <div className="flex flex-col gap-1">
            {lentOut.map((l) => (
              <span key={l.id} className="text-ink text-sm">
                <span className="tabular-nums font-medium">{l.quantity}</span> ชิ้น กับ{" "}
                <span className="font-medium">{l.counterparty}</span>
                {l.note && <span className="text-muted"> — {l.note}</span>}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function BrokenQuantityEditor({
  equipment,
  isAdmin,
  onUpdated,
  onError,
}: {
  equipment: Equipment;
  isAdmin: boolean;
  onUpdated: (eq: Equipment) => void;
  onError: (msg: string) => void;
}) {
  const current = equipment.brokenQuantity ?? 0;
  const [value, setValue] = useState<string>(String(current));
  const [saving, setSaving] = useState(false);

  const parsed = parseInt(value);
  const next = Number.isFinite(parsed) ? parsed : 0;
  const invalid = next < 0 || next > equipment.quantity;
  const dirty = next !== current;

  async function save() {
    if (invalid || !dirty) return;
    setSaving(true);
    const res = await fetch(`/api/equipment/${equipment.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ brokenQuantity: next }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      onError(data.error ?? "บันทึกไม่สำเร็จ");
      return;
    }
    const { equipment: updated } = await res.json();
    onUpdated(updated);
  }

  if (!isAdmin) {
    return (
      <div className="flex gap-2 flex-wrap">
        <span className="text-xs text-muted">ต้องซ่อม</span>
        <span className={current > 0 ? "text-warning font-medium tabular-nums" : "text-ink tabular-nums"}>
          {current} ชิ้น
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs text-muted">จำนวนที่ต้องซ่อม</span>
      <input
        type="number"
        min="0"
        max={equipment.quantity}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="h-8 w-20 rounded-[var(--radius-md)] border border-hairline bg-surface-card px-2 text-sm text-ink tabular-nums text-center focus:outline-none focus:border-coral focus:ring-[3px] focus:ring-coral/20"
      />
      <span className="text-xs text-muted">/ {equipment.quantity}</span>
      <Button variant="coral" size="sm" onClick={save} disabled={saving || invalid || !dirty}>
        {saving ? "บันทึก..." : "บันทึก"}
      </Button>
      {invalid && <span className="text-xs text-error">ต้องอยู่ระหว่าง 0–{equipment.quantity}</span>}
    </div>
  );
}

export default function EquipmentClient({ equipment: initialEquipment, isAdmin }: Props) {
  const confirm = useConfirm();
  const toast = useToast();
  const [isPending, startTransition] = useTransition();

  const [equipment, setEquipment] = useState<Equipment[]>(initialEquipment);
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState<FormState>(emptyForm);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<FormState>(emptyForm);

  const [error, setError] = useState<string | null>(null);

  const filtered = equipment.filter(
    (eq) => !search || eq.name.toLowerCase().includes(search.toLowerCase())
  );

  async function handleAdd() {
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/equipment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parseFormToBody(addForm)),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "เกิดข้อผิดพลาด");
        return;
      }
      const { equipment: newEq } = await res.json();
      setEquipment((prev) => [...prev, newEq]);
      setAddForm(emptyForm);
      setShowAddForm(false);
    });
  }

  async function handleEdit(id: string) {
    setError(null);
    startTransition(async () => {
      const res = await fetch(`/api/equipment/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parseFormToBody(editForm)),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "เกิดข้อผิดพลาด");
        return;
      }
      const { equipment: updated } = await res.json();
      setEquipment((prev) => prev.map((eq) => (eq.id === id ? updated : eq)));
      setEditingId(null);
    });
  }

  async function handleDelete(id: string) {
    const target = equipment.find((eq) => eq.id === id);
    const name = target?.name ?? "";
    const ok = await confirm({
      title: "ลบอุปกรณ์",
      message: `ต้องการลบอุปกรณ์ "${name}" ออกจากคลัง?`,
      confirmLabel: "ลบอุปกรณ์",
      variant: "danger",
      requireText: name,
    });
    if (!ok) return;
    setError(null);
    startTransition(async () => {
      const res = await fetch(`/api/equipment/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        const msg = data.error ?? "เกิดข้อผิดพลาด";
        setError(msg);
        toast.error(msg);
        return;
      }
      setEquipment((prev) => prev.filter((eq) => eq.id !== id));
      toast.success(`ลบ ${name} แล้ว`);
    });
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-surface-card border border-hairline rounded-[var(--radius-lg)] p-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder="ค้นหาชื่ออุปกรณ์..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {isAdmin && (
            <Button
              variant="coral"
              size="sm"
              onClick={() => {
                setShowAddForm(true);
                setEditingId(null);
                setAddForm(emptyForm);
              }}
            >
              + เพิ่มอุปกรณ์
            </Button>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-error/10 border border-error/30 rounded-[var(--radius-md)] px-4 py-3 text-sm text-error">
          {error}
          <button className="ml-3 underline" onClick={() => setError(null)}>ปิด</button>
        </div>
      )}

      {/* Add Form */}
      {showAddForm && isAdmin && (
        <div className="bg-surface-card border border-hairline rounded-[var(--radius-lg)] p-5">
          <h3 className="text-sm font-bold text-ink mb-4">เพิ่มอุปกรณ์ใหม่</h3>
          <EquipmentForm
            form={addForm}
            onChange={setAddForm}
            onSubmit={handleAdd}
            onCancel={() => { setShowAddForm(false); setAddForm(emptyForm); }}
            submitLabel="เพิ่มอุปกรณ์"
            isPending={isPending}
          />
        </div>
      )}

      {/* Summary */}
      <p className="text-xs text-muted">
        แสดง {filtered.length} รายการ จากทั้งหมด {equipment.length} รายการ
      </p>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted">ไม่พบรายการที่ค้นหา</div>
      ) : (
        <div className="bg-surface-card border border-hairline rounded-[var(--radius-lg)] overflow-hidden">
          <table className="w-full">
              <thead>
                <tr className="text-left border-b border-hairline-soft">
                  <th className="px-5 py-2.5 text-xs font-semibold text-muted">ชื่อ</th>
                  <th className="px-4 py-2.5 text-xs font-semibold text-muted text-center w-24">ทั้งหมด</th>
                  <th className="px-4 py-2.5 text-xs font-semibold text-muted text-center w-24">ใช้ได้</th>
                  <th className="px-2 py-2.5 w-8"></th>
                  {isAdmin && <th className="px-4 py-2.5 text-xs font-semibold text-muted w-28"></th>}
                </tr>
              </thead>
              <tbody>
                {filtered.map((eq) => {
                  const broken = eq.brokenQuantity ?? 0;
                  const borrowedIn = eq.borrowedIn ?? 0;
                  const lentOut = eq.lentOut ?? 0;
                  const usable = Math.max(0, eq.quantity - broken + borrowedIn - lentOut);
                  return (
                  <Fragment key={eq.id}>
                    <tr className="border-b border-hairline-soft last:border-0 hover:bg-surface-cream-strong/40 transition-colors">
                      <td
                        className="px-5 py-3 text-sm font-medium text-ink cursor-pointer"
                        onClick={() => setExpandedId((prev) => (prev === eq.id ? null : eq.id))}
                      >
                        {eq.name}
                      </td>
                      <td className="px-4 py-3 text-sm text-ink text-center tabular-nums">
                        {eq.quantity === 0 ? <span className="text-muted">—</span> : eq.quantity}
                      </td>
                      <td className="px-4 py-3 text-sm text-center tabular-nums">
                        {usable === 0 ? (
                          <span className="text-muted">0</span>
                        ) : (
                          <span className="text-ink font-medium">{usable}</span>
                        )}
                      </td>
                      <td className="px-2 py-3 text-center">
                        <button
                          onClick={() => setExpandedId((prev) => (prev === eq.id ? null : eq.id))}
                          aria-label={expandedId === eq.id ? "ซ่อนรายละเอียด" : "แสดงรายละเอียด"}
                          className="text-muted-soft hover:text-ink transition-colors text-xs"
                        >
                          {expandedId === eq.id ? "▲" : "▼"}
                        </button>
                      </td>
                      {isAdmin && (
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => {
                                setEditingId(eq.id);
                                setEditForm(equipmentToForm(eq));
                                setExpandedId(null);
                                setShowAddForm(false);
                              }}
                            >
                              แก้ไข
                            </Button>
                            <Button
                              variant="text"
                              size="sm"
                              className="text-error hover:bg-error/10"
                              onClick={() => handleDelete(eq.id)}
                              disabled={isPending}
                            >
                              ลบ
                            </Button>
                          </div>
                        </td>
                      )}
                    </tr>
                    {expandedId === eq.id && editingId !== eq.id && (
                      <tr className="border-b border-hairline-soft bg-surface-soft">
                        <td colSpan={isAdmin ? 5 : 4} className="px-5 py-3">
                          <div className="flex flex-col gap-3 text-sm">
                            <div className="flex gap-2 flex-wrap">
                              <span className="text-xs text-muted">ขนาด (ยาว × กว้าง × สูง)</span>
                              <span className="text-ink tabular-nums">
                                {formatDimensions(eq.lengthCm, eq.widthCm, eq.heightCm)}
                              </span>
                            </div>
                            <div className="flex gap-2 flex-wrap">
                              <span className="text-xs text-muted">หมายเหตุ</span>
                              <span className="text-ink whitespace-pre-wrap">{eq.note ?? "—"}</span>
                            </div>
                            <LoanSummary loans={eq.activeLoans ?? []} />
                            <BrokenQuantityEditor
                              equipment={eq}
                              isAdmin={isAdmin}
                              onUpdated={(updated) =>
                                setEquipment((prev) => prev.map((x) => (x.id === updated.id ? updated : x)))
                              }
                              onError={(msg) => {
                                setError(msg);
                                toast.error(msg);
                              }}
                            />
                          </div>
                        </td>
                      </tr>
                    )}
                    {editingId === eq.id && isAdmin && (
                      <tr className="border-b border-hairline-soft bg-surface-cream-strong/30">
                        <td colSpan={isAdmin ? 5 : 4} className="px-5 py-4">
                          <EquipmentForm
                            form={editForm}
                            onChange={setEditForm}
                            onSubmit={() => handleEdit(eq.id)}
                            onCancel={() => setEditingId(null)}
                            submitLabel="บันทึกการแก้ไข"
                            isPending={isPending}
                          />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                  );
                })}
              </tbody>
            </table>
        </div>
      )}
    </div>
  );
}
