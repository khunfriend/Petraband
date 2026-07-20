"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";

type Direction = "BORROWED_IN" | "LENT_OUT";

interface EquipmentOption {
  id: string;
  name: string;
  type: string | null;
  quantity: number;
}

interface Loan {
  id: string;
  equipmentId: string | null;
  equipmentName: string;
  direction: Direction;
  quantity: number;
  counterparty: string;
  borrowedAt: string;
  returnedAt: string | null;
  note: string | null;
}

interface Props {
  direction: Direction;
  loans: Loan[];
  equipment: EquipmentOption[];
  canEdit: boolean;
}

const LABELS = {
  BORROWED_IN: {
    title: "ยืมของ",
    counterpartyLabel: "ยืมจาก",
    addLabel: "+ บันทึกการยืม",
    emptyActive: "ยังไม่มีของที่ยืมมาค้างอยู่",
    emptyAll: "ยังไม่มีประวัติการยืม",
  },
  LENT_OUT: {
    title: "ให้ยืมของ",
    counterpartyLabel: "ให้ยืมกับ",
    addLabel: "+ บันทึกการให้ยืม",
    emptyActive: "ยังไม่มีของที่ให้ยืมค้างอยู่",
    emptyAll: "ยังไม่มีประวัติการให้ยืม",
  },
} as const;

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "numeric" });
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

interface FormState {
  equipmentId: string;
  equipmentName: string;
  quantity: string;
  counterparty: string;
  borrowedAt: string;
  note: string;
}

const emptyForm: FormState = {
  equipmentId: "",
  equipmentName: "",
  quantity: "1",
  counterparty: "",
  borrowedAt: todayIso(),
  note: "",
};

export default function LoansClient({ direction, loans: initialLoans, equipment, canEdit }: Props) {
  const confirm = useConfirm();
  const toast = useToast();
  const [isPending, startTransition] = useTransition();
  const L = LABELS[direction];

  const [loans, setLoans] = useState<Loan[]>(initialLoans);
  const [filter, setFilter] = useState<"active" | "returned" | "all">("active");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState<string | null>(null);

  const filtered = loans.filter((l) => {
    if (filter === "active") return l.returnedAt === null;
    if (filter === "returned") return l.returnedAt !== null;
    return true;
  });

  const activeCount = loans.filter((l) => l.returnedAt === null).length;

  async function handleAdd() {
    setError(null);
    const name =
      direction === "LENT_OUT"
        ? equipment.find((e) => e.id === form.equipmentId)?.name ?? ""
        : form.equipmentName.trim();
    if (!name || !form.counterparty.trim()) {
      setError(direction === "LENT_OUT" ? "กรุณาเลือกอุปกรณ์และระบุผู้ยืม" : "กรุณาระบุชื่ออุปกรณ์และผู้ให้ยืม");
      return;
    }
    const qty = parseInt(form.quantity) || 0;
    if (qty <= 0) {
      setError("จำนวนต้องมากกว่า 0");
      return;
    }
    startTransition(async () => {
      const res = await fetch("/api/equipment/loans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          direction,
          equipmentId: direction === "LENT_OUT" ? form.equipmentId : null,
          equipmentName: name,
          quantity: qty,
          counterparty: form.counterparty.trim(),
          borrowedAt: new Date(form.borrowedAt).toISOString(),
          note: form.note.trim() || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "บันทึกไม่สำเร็จ");
        return;
      }
      const { loan } = await res.json();
      setLoans((prev) => [loan, ...prev]);
      setForm(emptyForm);
      setShowForm(false);
      toast.success("บันทึกแล้ว");
    });
  }

  async function handleReturn(loan: Loan) {
    const ok = await confirm({
      title: "ยืนยันการคืน",
      message: `ทำเครื่องหมาย "${loan.equipmentName}" (${loan.quantity} ชิ้น) ว่าคืนแล้ว?`,
      confirmLabel: "คืนแล้ว",
    });
    if (!ok) return;
    startTransition(async () => {
      const res = await fetch(`/api/equipment/loans/${loan.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ returnedAt: new Date().toISOString() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? "บันทึกไม่สำเร็จ");
        return;
      }
      const { loan: updated } = await res.json();
      setLoans((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
      toast.success("คืนแล้ว");
    });
  }

  async function handleUnreturn(loan: Loan) {
    startTransition(async () => {
      const res = await fetch(`/api/equipment/loans/${loan.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ returnedAt: null }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? "บันทึกไม่สำเร็จ");
        return;
      }
      const { loan: updated } = await res.json();
      setLoans((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
    });
  }

  async function handleDelete(loan: Loan) {
    const ok = await confirm({
      title: "ลบรายการยืม",
      message: `ลบรายการนี้ออกจากประวัติ?`,
      confirmLabel: "ลบ",
      variant: "danger",
    });
    if (!ok) return;
    startTransition(async () => {
      const res = await fetch(`/api/equipment/loans/${loan.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? "ลบไม่สำเร็จ");
        return;
      }
      setLoans((prev) => prev.filter((l) => l.id !== loan.id));
      toast.success("ลบแล้ว");
    });
  }

  return (
    <div className="space-y-6">
      <div className="bg-surface-card border border-hairline rounded-[var(--radius-lg)] p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex gap-1 rounded-[var(--radius-md)] bg-surface-cream-strong/50 p-1">
            {(["active", "returned", "all"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 text-xs rounded-[var(--radius-sm)] transition-colors ${
                  filter === f ? "bg-surface-card text-ink font-medium shadow-sm" : "text-muted hover:text-ink"
                }`}
              >
                {f === "active" ? `ค้างอยู่ (${activeCount})` : f === "returned" ? "คืนแล้ว" : "ทั้งหมด"}
              </button>
            ))}
          </div>

          <div className="flex-1" />

          {canEdit && (
            <Button
              variant="coral"
              size="sm"
              onClick={() => {
                setShowForm(true);
                setForm({ ...emptyForm, borrowedAt: todayIso() });
              }}
            >
              {L.addLabel}
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-error/10 border border-error/30 rounded-[var(--radius-md)] px-4 py-3 text-sm text-error">
          {error}
          <button className="ml-3 underline" onClick={() => setError(null)}>ปิด</button>
        </div>
      )}

      {showForm && canEdit && (
        <div className="bg-surface-card border border-hairline rounded-[var(--radius-lg)] p-5">
          <h3 className="text-sm font-bold text-ink mb-4">{L.addLabel.replace("+", "").trim()}</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              {direction === "LENT_OUT" ? (
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-ink">อุปกรณ์ *</label>
                  <select
                    value={form.equipmentId}
                    onChange={(e) => setForm({ ...form, equipmentId: e.target.value })}
                    className="h-10 w-full rounded-[var(--radius-md)] border border-hairline bg-surface-soft px-3.5 text-sm text-ink focus:outline-none focus:border-coral focus:ring-[3px] focus:ring-coral/20"
                  >
                    <option value="">— เลือกอุปกรณ์จากคลัง —</option>
                    {equipment.map((eq) => (
                      <option key={eq.id} value={eq.id}>
                        {eq.name}
                        {eq.type ? ` (${eq.type})` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <Input
                  label="ชื่ออุปกรณ์ *"
                  value={form.equipmentName}
                  onChange={(e) => setForm({ ...form, equipmentName: e.target.value })}
                  placeholder="เช่น เก้าอี้พลาสติก, ขาตั้งไมค์"
                />
              )}
            </div>

            <div>
              <Input
                label="จำนวน *"
                type="number"
                min="1"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              />
            </div>

            <div>
              <Input
                label="วันที่ยืม *"
                type="date"
                value={form.borrowedAt}
                onChange={(e) => setForm({ ...form, borrowedAt: e.target.value })}
              />
            </div>

            <div className="col-span-2">
              <Input
                label={`${L.counterpartyLabel} *`}
                value={form.counterparty}
                onChange={(e) => setForm({ ...form, counterparty: e.target.value })}
                placeholder="เช่น อ.สมชาย / วงพี่เต"
              />
            </div>

            <div className="col-span-2 flex flex-col gap-1.5">
              <label className="text-sm font-medium text-ink">หมายเหตุ</label>
              <textarea
                rows={2}
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                placeholder="รายละเอียดเพิ่มเติม (ถ้ามี)"
                className="w-full rounded-[var(--radius-md)] border border-hairline bg-surface-soft px-3.5 py-2 text-sm text-ink placeholder:text-muted-soft focus:outline-none focus:border-coral focus:ring-[3px] focus:ring-coral/20 resize-none"
              />
            </div>

            <div className="col-span-2 flex justify-end gap-3 pt-1">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => { setShowForm(false); setForm(emptyForm); setError(null); }}
                disabled={isPending}
              >
                ยกเลิก
              </Button>
              <Button variant="coral" size="sm" onClick={handleAdd} disabled={isPending}>
                {isPending ? "กำลังบันทึก..." : "บันทึก"}
              </Button>
            </div>
          </div>
        </div>
      )}

      <p className="text-xs text-muted">แสดง {filtered.length} รายการ</p>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted">
          {filter === "active" ? L.emptyActive : L.emptyAll}
        </div>
      ) : (
        <div className="bg-surface-card border border-hairline rounded-[var(--radius-lg)] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="text-left border-b border-hairline-soft">
                <th className="px-5 py-2.5 text-xs font-semibold text-muted">อุปกรณ์</th>
                <th className="px-4 py-2.5 text-xs font-semibold text-muted text-center w-20">จำนวน</th>
                <th className="px-4 py-2.5 text-xs font-semibold text-muted">{L.counterpartyLabel}</th>
                <th className="px-4 py-2.5 text-xs font-semibold text-muted w-32">วันที่ยืม</th>
                <th className="px-4 py-2.5 text-xs font-semibold text-muted w-32">สถานะ</th>
                <th className="px-4 py-2.5 text-xs font-semibold text-muted">หมายเหตุ</th>
                {canEdit && <th className="px-4 py-2.5 text-xs font-semibold text-muted w-40"></th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map((loan) => (
                <tr key={loan.id} className="border-b border-hairline-soft last:border-0 hover:bg-surface-cream-strong/40 transition-colors">
                  <td className="px-5 py-3 text-sm font-medium text-ink">{loan.equipmentName}</td>
                  <td className="px-4 py-3 text-sm text-ink text-center tabular-nums">{loan.quantity}</td>
                  <td className="px-4 py-3 text-sm text-ink">{loan.counterparty}</td>
                  <td className="px-4 py-3 text-sm text-muted tabular-nums">{formatDate(loan.borrowedAt)}</td>
                  <td className="px-4 py-3 text-sm">
                    {loan.returnedAt ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-[var(--radius-pill)] text-xs font-medium bg-success/15 text-success">
                        คืนแล้ว {formatDate(loan.returnedAt)}
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-[var(--radius-pill)] text-xs font-medium bg-warning/15 text-warning">
                        ค้างอยู่
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted max-w-[240px] whitespace-pre-wrap">{loan.note ?? "—"}</td>
                  {canEdit && (
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        {loan.returnedAt ? (
                          <Button variant="secondary" size="sm" onClick={() => handleUnreturn(loan)} disabled={isPending}>
                            ย้อนสถานะ
                          </Button>
                        ) : (
                          <Button variant="coral" size="sm" onClick={() => handleReturn(loan)} disabled={isPending}>
                            คืนแล้ว
                          </Button>
                        )}
                        <Button
                          variant="text"
                          size="sm"
                          className="text-error hover:bg-error/10"
                          onClick={() => handleDelete(loan)}
                          disabled={isPending}
                        >
                          ลบ
                        </Button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
