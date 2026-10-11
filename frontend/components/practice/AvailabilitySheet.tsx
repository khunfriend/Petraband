"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import { THAI_DAY_TINT, type Availability } from "@/lib/practiceAvailability";
import { cn } from "@/lib/utils";

export type SheetRow = {
  slotId: string;
  /** "YYYY-MM-DD" */
  date: string;
  startTime: string;
  endTime: string;
  label: string;
  supervisor: string;
};

export type SheetAnswer = { value: Availability; /** Set on the timetable (not from a poll). */ manual: boolean };

const FREE = "#4caf6a";
const BUSY = "#e05555";
const UNKNOWN = "#c9c9c9";

const WEEKDAY = ["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์"];

/** "ศุกร์ 16 ต.ค." as on the printed sheet. */
function dayLabel(date: string) {
  const d = new Date(`${date}T00:00:00Z`);
  const dayMonth = d.toLocaleDateString("th-TH", { day: "numeric", month: "short", timeZone: "UTC" });
  return `${WEEKDAY[d.getUTCDay()]} ${dayMonth}`;
}

/**
 * Printed-sheet style "who is free" table: one row per practice session, one
 * column per member. Members click their own cells; admins any cell.
 */
export function AvailabilitySheet({
  scheduleId,
  rows,
  members,
  answers: initialAnswers,
  viewerId,
  canEditAll,
  canEditSupervisor,
}: {
  scheduleId: string;
  rows: SheetRow[];
  members: { id: string; name: string }[];
  /** answers[slotId][userId] */
  answers: Record<string, Record<string, SheetAnswer>>;
  viewerId: string;
  /** Admins: anyone's cells. Everyone else only their own. */
  canEditAll: boolean;
  /** "คุมซ้อม" is part of the timetable: heads and admins. */
  canEditSupervisor: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [answers, setAnswers] = useState(initialAnswers);
  const [editingSupervisor, setEditingSupervisor] = useState<string | null>(null);
  const [supervisorDraft, setSupervisorDraft] = useState("");

  if (rows.length === 0 || members.length === 0) return null;

  async function toggle(slotId: string, userId: string) {
    const current = answers[slotId]?.[userId]?.value ?? null;
    const next = current !== "yes";
    const prev = answers;
    setAnswers((a) => ({ ...a, [slotId]: { ...a[slotId], [userId]: { value: next ? "yes" : "no", manual: true } } }));
    const res = await fetch(`/api/practice-schedules/${scheduleId}/availability`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slotId, isAvailable: next, ...(userId !== viewerId && { userId }) }),
    }).catch(() => null);
    if (!res?.ok) {
      setAnswers(prev);
      toast.error("บันทึกไม่สำเร็จ");
    }
  }

  async function saveSupervisor(slotId: string) {
    setEditingSupervisor(null);
    const res = await fetch(`/api/practice-slots/${slotId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ supervisor: supervisorDraft.trim() }),
    }).catch(() => null);
    if (!res?.ok) toast.error("บันทึกผู้คุมซ้อมไม่สำเร็จ");
    router.refresh();
  }

  const listId = `members-${scheduleId}`;
  const th = "border border-[#0b1a3a] bg-primary text-white font-semibold px-2 py-1.5 whitespace-nowrap";
  const td = "border border-[#0b1a3a]/70 px-2 py-1.5 whitespace-nowrap";

  return (
    <section className="mt-3">
      <div className="flex items-baseline justify-between mb-2">
        <h3 className="text-base font-semibold text-ink">ใครว่างบ้าง</h3>
        <p className="text-xs text-muted">กดช่องของตัวเองเพื่อสลับ ว่าง / ไม่ว่าง</p>
      </div>
      <datalist id={listId}>
        {members.map((m) => (
          <option key={m.id} value={m.name} />
        ))}
      </datalist>
      <div className="overflow-x-auto rounded-[var(--radius-md)] border border-hairline">
        <table className="border-collapse text-sm text-ink min-w-full">
          <thead>
            <tr>
              <th rowSpan={2} className={cn(th, "sticky left-0 z-10")}>วัน</th>
              <th rowSpan={2} className={th}>เวลา</th>
              <th rowSpan={2} className={th}>รายละเอียด</th>
              <th rowSpan={2} className={th}>คุมซ้อม</th>
              <th colSpan={members.length} className={th}>ตัวว่างนักดนตรี</th>
              <th rowSpan={2} className={th}>ว่าง</th>
            </tr>
            <tr>
              {members.map((m) => (
                <th key={m.id} className={cn(th, "font-medium", m.id === viewerId && "underline underline-offset-4")}>
                  {m.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const tint = THAI_DAY_TINT[new Date(`${r.date}T00:00:00Z`).getUTCDay()];
              const free = members.filter((m) => answers[r.slotId]?.[m.id]?.value === "yes").length;
              return (
                <tr key={r.slotId} style={{ background: tint }}>
                  <td className={cn(td, "sticky left-0 z-10")} style={{ background: tint }}>
                    {dayLabel(r.date)}
                  </td>
                  <td className={cn(td, "tabular-nums")}>
                    {r.startTime.replace(":", ".")} – {r.endTime.replace(":", ".")}
                  </td>
                  <td className={cn(td, "max-w-[220px] truncate")} title={r.label}>
                    {r.label.split("\n")[0] || "—"}
                  </td>
                  <td className={cn(td, "text-center")}>
                    {editingSupervisor === r.slotId ? (
                      <input
                        autoFocus
                        list={listId}
                        value={supervisorDraft}
                        onChange={(e) => setSupervisorDraft(e.target.value)}
                        onBlur={() => saveSupervisor(r.slotId)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") e.currentTarget.blur();
                          if (e.key === "Escape") setEditingSupervisor(null);
                        }}
                        className="w-24 bg-white/80 px-1 outline-none rounded-sm"
                      />
                    ) : canEditSupervisor ? (
                      <button
                        type="button"
                        onClick={() => {
                          setSupervisorDraft(r.supervisor);
                          setEditingSupervisor(r.slotId);
                        }}
                        className="w-full min-w-12 hover:underline"
                        title="แก้ผู้คุมซ้อม"
                      >
                        {r.supervisor || <span className="text-muted-soft">+</span>}
                      </button>
                    ) : (
                      r.supervisor || "—"
                    )}
                  </td>
                  {members.map((m) => {
                    const a = answers[r.slotId]?.[m.id];
                    const editable = canEditAll || m.id === viewerId;
                    const state = a?.value === "yes" ? "ว่าง" : a?.value === "no" ? "ไม่ว่าง" : "ไม่ตอบ";
                    return (
                      <td
                        key={m.id}
                        className="border border-[#0b1a3a]/70 p-0 min-w-14"
                        style={{ background: a?.value === "yes" ? FREE : a?.value === "no" ? BUSY : UNKNOWN }}
                      >
                        <button
                          type="button"
                          disabled={!editable}
                          onClick={() => toggle(r.slotId, m.id)}
                          aria-label={`${m.name} ${dayLabel(r.date)} ${r.startTime}: ${state}`}
                          title={`${m.name}: ${state}${a && !a.manual ? " (จากโพล)" : ""}`}
                          className={cn("block w-full h-8", editable ? "cursor-pointer hover:ring-2 hover:ring-inset hover:ring-primary" : "cursor-default")}
                        />
                      </td>
                    );
                  })}
                  <td className={cn(td, "text-center tabular-nums")}>
                    {free}/{members.length}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-muted">
        <Legend color={FREE} label="ว่าง" />
        <Legend color={BUSY} label="ไม่ว่าง" />
        <Legend color={UNKNOWN} label="ไม่ตอบ" />
        <span>ค่าเริ่มต้นมาจากโพลตารางว่าง กดแก้ทับได้</span>
      </div>
    </section>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="inline-block w-3.5 h-3.5 border border-[#0b1a3a]/50" style={{ background: color }} />
      {label}
    </span>
  );
}
