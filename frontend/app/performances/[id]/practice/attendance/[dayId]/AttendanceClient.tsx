"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import { STATUS_LABEL } from "@/lib/attendance";
import { cn } from "@/lib/utils";

type Status = keyof typeof STATUS_LABEL;
const STATUSES: Status[] = ["PRESENT", "LATE", "EXCUSED", "ABSENT"];
const ACTIVE: Record<Status, string> = {
  PRESENT: "bg-emerald-600 text-white border-emerald-600",
  LATE: "bg-amber-500 text-white border-amber-500",
  EXCUSED: "bg-sky-600 text-white border-sky-600",
  ABSENT: "bg-red-600 text-white border-red-600",
};

/** One row per musician; heads/admins tap มา / สาย / ลา / ขาด. */
export default function AttendanceClient({
  performanceId,
  dayId,
  opened,
  canEdit,
  members,
  initial,
}: {
  performanceId: string;
  dayId: string;
  opened: boolean;
  canEdit: boolean;
  members: { id: string; name: string; fullName: string }[];
  initial: Record<string, Status>;
}) {
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();
  const [marks, setMarks] = useState<Record<string, Status>>(initial);
  const [busy, setBusy] = useState(false);
  const editable = canEdit && opened;

  async function save(changes: { userId: string; status: Status | null }[]) {
    const prev = marks;
    setMarks((m) => {
      const next = { ...m };
      for (const c of changes) {
        if (c.status) next[c.userId] = c.status;
        else delete next[c.userId];
      }
      return next;
    });
    const res = await fetch(`/api/practice-days/${dayId}/attendance`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ marks: changes }),
    }).catch(() => null);
    if (!res?.ok) {
      setMarks(prev);
      toast.error("บันทึกไม่สำเร็จ");
    }
  }

  async function openRollCall() {
    setBusy(true);
    const res = await fetch(`/api/practice-days/${dayId}/attendance`, { method: "POST" }).catch(() => null);
    setBusy(false);
    if (!res?.ok) return toast.error("เปิดเช็คชื่อไม่สำเร็จ");
    router.refresh();
  }

  async function cancelRollCall() {
    const ok = await confirm({
      title: "ยกเลิกการเช็คชื่อ",
      message: "ลบการเช็คชื่อของวันนี้ทั้งหมด?",
      confirmLabel: "ยกเลิกการเช็คชื่อ",
      variant: "danger",
    });
    if (!ok) return;
    setBusy(true);
    const res = await fetch(`/api/practice-days/${dayId}/attendance`, { method: "DELETE" }).catch(() => null);
    setBusy(false);
    if (!res?.ok) return toast.error("ยกเลิกไม่สำเร็จ");
    router.push(`/performances/${performanceId}/practice`);
    router.refresh();
  }

  if (!opened) {
    return (
      <div className="rounded-[var(--radius-md)] border border-hairline bg-surface-card p-6 flex flex-col items-start gap-3">
        <p className="text-sm text-muted">วันนี้ยังไม่ได้เปิดเช็คชื่อ</p>
        {canEdit && (
          <Button variant="primary" disabled={busy} onClick={openRollCall}>
            เช็คชื่อวันนี้
          </Button>
        )}
      </div>
    );
  }

  if (members.length === 0) {
    return <p className="text-sm text-muted">งานนี้ยังไม่มีคนในรายชื่อผู้เล่น</p>;
  }

  const count = (s: Status) => members.filter((m) => marks[m.id] === s).length;
  const unmarked = members.filter((m) => !marks[m.id]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
        {STATUSES.map((s) => (
          <span key={s} className="tabular-nums">
            {STATUS_LABEL[s]} <b className="text-ink">{count(s)}</b>
          </span>
        ))}
        <span className="tabular-nums text-muted">ยังไม่เช็ค {unmarked.length}</span>
        {editable && unmarked.length > 0 && (
          <Button
            size="sm"
            variant="secondary"
            className="ml-auto"
            onClick={() => save(unmarked.map((m) => ({ userId: m.id, status: "PRESENT" })))}
          >
            ที่เหลือมาทั้งหมด
          </Button>
        )}
      </div>

      <ul className="rounded-[var(--radius-md)] border border-hairline bg-surface-card divide-y divide-hairline-soft">
        {members.map((m) => (
          <li key={m.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
            <div className="flex-1 min-w-32">
              <p className="text-sm font-medium text-ink">{m.name}</p>
              {m.fullName && m.fullName !== m.name && <p className="text-xs text-muted">{m.fullName}</p>}
            </div>
            <div className="flex gap-1.5">
              {STATUSES.map((s) => {
                const on = marks[m.id] === s;
                return (
                  <button
                    key={s}
                    type="button"
                    disabled={!editable}
                    aria-pressed={on}
                    onClick={() => save([{ userId: m.id, status: on ? null : s }])}
                    className={cn(
                      "h-9 min-w-12 px-3 rounded-[var(--radius-sm)] border text-sm font-medium transition-colors",
                      on ? ACTIVE[s] : "border-hairline bg-surface-soft text-body",
                      editable ? (on ? "" : "hover:border-primary/50") : "cursor-default",
                      !editable && !on && "opacity-50",
                    )}
                  >
                    {STATUS_LABEL[s]}
                  </button>
                );
              })}
            </div>
          </li>
        ))}
      </ul>

      {canEdit && (
        <div>
          <button type="button" disabled={busy} onClick={cancelRollCall} className="text-xs text-muted hover:text-error">
            ยกเลิกการเช็คชื่อวันนี้
          </button>
        </div>
      )}
    </div>
  );
}
