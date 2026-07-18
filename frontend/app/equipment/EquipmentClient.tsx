"use client";

import { Fragment, useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";

type EquipmentCondition = "GOOD" | "FAIR" | "NEEDS_REPAIR" | "RETIRED";

interface Equipment {
  id: string;
  name: string;
  type: string | null;
  quantity: number;
  condition: EquipmentCondition;
  lengthCm: number | null;
  widthCm: number | null;
  heightCm: number | null;
  note: string | null;
}

interface Props {
  equipment: Equipment[];
  isAdmin: boolean;
}

const CONDITION_LABELS: Record<EquipmentCondition, string> = {
  GOOD: "พร้อมใช้งาน",
  FAIR: "ใช้งานระวัง",
  NEEDS_REPAIR: "ต้องซ่อม",
  RETIRED: "ปลดระวาง",
};

const CONDITION_CLASSES: Record<EquipmentCondition, string> = {
  GOOD: "bg-success/15 text-success",
  FAIR: "bg-warning/15 text-warning",
  NEEDS_REPAIR: "bg-error/15 text-error",
  RETIRED: "bg-surface-cream-strong text-muted",
};

const EQUIPMENT_TYPES = [
  "เครื่องดนตรี ปี่พาทย์",
  "เครื่องดนตรี เครื่องสาย",
  "เครื่องดนตรี เครื่องเป่า",
  "เครื่องดนตรี ประกอบจังหวะ",
  "อุปกรณ์",
];

const CONDITIONS: EquipmentCondition[] = ["GOOD", "FAIR", "NEEDS_REPAIR", "RETIRED"];

function ConditionBadge({ condition }: { condition: EquipmentCondition }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-[var(--radius-pill)] text-xs font-medium ${CONDITION_CLASSES[condition]}`}
    >
      {CONDITION_LABELS[condition]}
    </span>
  );
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
  condition: EquipmentCondition;
  lengthCm: string;
  widthCm: string;
  heightCm: string;
  note: string;
}

const emptyForm: FormState = {
  name: "",
  type: "อุปกรณ์",
  quantity: "1",
  condition: "GOOD",
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
    condition: eq.condition,
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
    condition: form.condition,
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

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-ink">ประเภท</label>
        <select
          value={form.type}
          onChange={set("type")}
          className="h-10 w-full rounded-[var(--radius-md)] border border-hairline bg-surface-soft px-3.5 text-sm text-ink focus:outline-none focus:border-coral focus:ring-[3px] focus:ring-coral/20"
        >
          <option value="">— ไม่ระบุ —</option>
          {EQUIPMENT_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-ink">สภาพ</label>
        <select
          value={form.condition}
          onChange={set("condition")}
          className="h-10 w-full rounded-[var(--radius-md)] border border-hairline bg-surface-soft px-3.5 text-sm text-ink focus:outline-none focus:border-coral focus:ring-[3px] focus:ring-coral/20"
        >
          {CONDITIONS.map((c) => (
            <option key={c} value={c}>{CONDITION_LABELS[c]}</option>
          ))}
        </select>
      </div>

      <div>
        <Input
          label="จำนวน"
          type="number"
          min="0"
          value={form.quantity}
          onChange={set("quantity")}
        />
      </div>

      <div className="flex flex-col gap-1.5">
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

export default function EquipmentClient({ equipment: initialEquipment, isAdmin }: Props) {
  const confirm = useConfirm();
  const toast = useToast();
  const [isPending, startTransition] = useTransition();

  const [equipment, setEquipment] = useState<Equipment[]>(initialEquipment);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [conditionFilter, setConditionFilter] = useState("");

  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState<FormState>(emptyForm);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<FormState>(emptyForm);

  const [error, setError] = useState<string | null>(null);

  // Client-side filtering
  const filtered = equipment.filter((eq) => {
    const matchSearch =
      !search || eq.name.toLowerCase().includes(search.toLowerCase());
    const matchType = !typeFilter || eq.type === typeFilter;
    const matchCondition = !conditionFilter || eq.condition === conditionFilter;
    return matchSearch && matchType && matchCondition;
  });

  // Group by type
  const grouped = filtered.reduce<Record<string, Equipment[]>>((acc, eq) => {
    const key = eq.type ?? "ไม่ระบุประเภท";
    if (!acc[key]) acc[key] = [];
    acc[key].push(eq);
    return acc;
  }, {});

  const typeOrder = [
    "เครื่องดนตรี ปี่พาทย์",
    "เครื่องดนตรี เครื่องสาย",
    "เครื่องดนตรี เครื่องเป่า",
    "เครื่องดนตรี ประกอบจังหวะ",
    "อุปกรณ์",
    "ไม่ระบุประเภท",
  ];
  const sortedGroups = Object.keys(grouped).sort(
    (a, b) => typeOrder.indexOf(a) - typeOrder.indexOf(b)
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

          <div className="flex flex-col gap-1.5">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="h-10 rounded-[var(--radius-md)] border border-hairline bg-surface-soft px-3.5 text-sm text-ink focus:outline-none focus:border-coral focus:ring-[3px] focus:ring-coral/20"
            >
              <option value="">ทุกประเภท</option>
              {EQUIPMENT_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <select
              value={conditionFilter}
              onChange={(e) => setConditionFilter(e.target.value)}
              className="h-10 rounded-[var(--radius-md)] border border-hairline bg-surface-soft px-3.5 text-sm text-ink focus:outline-none focus:border-coral focus:ring-[3px] focus:ring-coral/20"
            >
              <option value="">ทุกสภาพ</option>
              {CONDITIONS.map((c) => (
                <option key={c} value={c}>{CONDITION_LABELS[c]}</option>
              ))}
            </select>
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

      {/* Grouped Tables */}
      {sortedGroups.length === 0 ? (
        <div className="text-center py-12 text-muted">ไม่พบรายการที่ค้นหา</div>
      ) : (
        sortedGroups.map((groupType) => (
          <div key={groupType} className="bg-surface-card border border-hairline rounded-[var(--radius-lg)] overflow-hidden">
            <div className="px-5 py-3 border-b border-hairline-soft bg-surface-cream-strong">
              <h2 className="text-xs font-bold tracking-[1px] uppercase text-muted">{groupType}</h2>
            </div>

            <table className="w-full">
              <thead>
                <tr className="text-left border-b border-hairline-soft">
                  <th className="px-5 py-2.5 text-xs font-semibold text-muted w-[35%]">ชื่อ</th>
                  <th className="px-4 py-2.5 text-xs font-semibold text-muted text-center w-16">จำนวน</th>
                  <th className="px-4 py-2.5 text-xs font-semibold text-muted w-28">สภาพ</th>
                  <th className="px-4 py-2.5 text-xs font-semibold text-muted">ขนาด (ยาว × กว้าง × สูง)</th>
                  <th className="px-4 py-2.5 text-xs font-semibold text-muted">หมายเหตุ</th>
                  {isAdmin && <th className="px-4 py-2.5 text-xs font-semibold text-muted w-28"></th>}
                </tr>
              </thead>
              <tbody>
                {grouped[groupType].map((eq) => (
                  <Fragment key={eq.id}>
                    <tr className="border-b border-hairline-soft last:border-0 hover:bg-surface-cream-strong/40 transition-colors">
                      <td className="px-5 py-3 text-sm font-medium text-ink">{eq.name}</td>
                      <td className="px-4 py-3 text-sm text-ink text-center tabular-nums">
                        {eq.quantity === 0 ? (
                          <span className="text-muted">—</span>
                        ) : (
                          eq.quantity
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <ConditionBadge condition={eq.condition} />
                      </td>
                      <td className="px-4 py-3 text-sm text-muted tabular-nums">
                        {formatDimensions(eq.lengthCm, eq.widthCm, eq.heightCm)}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted max-w-[200px] truncate" title={eq.note ?? undefined}>
                        {eq.note ?? "—"}
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
                    {editingId === eq.id && isAdmin && (
                      <tr className="border-b border-hairline-soft bg-surface-cream-strong/30">
                        <td colSpan={isAdmin ? 6 : 5} className="px-5 py-4">
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
                ))}
              </tbody>
            </table>
          </div>
        ))
      )}
    </div>
  );
}
