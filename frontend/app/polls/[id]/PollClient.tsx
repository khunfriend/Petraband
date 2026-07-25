"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

type PollUser = { id: string; nickname: string; generation: string };
type PollSlot = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  availableUsers: PollUser[];
  myResponse: boolean;
};
type Poll = {
  id: string;
  name: string;
  status: "OPEN" | "CLOSED";
  deadline: string | null;
  performanceId: string;
  performanceName: string;
  slots: PollSlot[];
  members: PollUser[];
};

function formatDate(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("th-TH", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

// Green gradient by fraction of members who marked available
function heatColor(count: number, total: number) {
  if (total === 0 || count === 0) return "bg-surface-soft";
  const ratio = Math.min(1, count / total);
  if (ratio >= 0.85) return "bg-emerald-600 text-white";
  if (ratio >= 0.65) return "bg-emerald-500 text-white";
  if (ratio >= 0.45) return "bg-emerald-400 text-emerald-950";
  if (ratio >= 0.25) return "bg-emerald-200 text-emerald-900";
  return "bg-emerald-100 text-emerald-900";
}

export default function PollClient({
  poll,
  currentUserId,
  canManage,
}: {
  poll: Poll;
  currentUserId: string;
  canManage: boolean;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [avail, setAvail] = useState<Record<string, boolean>>(() => {
    const m: Record<string, boolean> = {};
    poll.slots.forEach((s) => (m[s.id] = s.myResponse));
    return m;
  });
  const [pending, setPending] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [scheduleTitle, setScheduleTitle] = useState(`ตารางซ้อม ${poll.performanceName}`);
  const [converting, setConverting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalMembers = poll.members.length || 1;

  // Precompute per-slot availableCount that includes optimistic changes for current user
  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const s of poll.slots) {
      const base = s.availableUsers.filter((u) => u.id !== currentUserId).length;
      map[s.id] = base + (avail[s.id] ? 1 : 0);
    }
    return map;
  }, [avail, poll.slots, currentUserId]);

  async function toggle(slotId: string) {
    if (poll.status === "CLOSED" || pending.has(slotId)) return;
    const current = avail[slotId] ?? false;
    const next = !current;
    setAvail((prev) => ({ ...prev, [slotId]: next }));
    setPending((prev) => new Set(prev).add(slotId));
    try {
      const res = await fetch(`/api/polls/${poll.id}/responses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pollSlotId: slotId, isAvailable: next }),
      });
      if (!res.ok) throw new Error("save failed");
    } catch {
      setAvail((prev) => ({ ...prev, [slotId]: current }));
    } finally {
      setPending((prev) => {
        const n = new Set(prev);
        n.delete(slotId);
        return n;
      });
    }
  }

  function toggleSelect(slotId: string) {
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(slotId)) n.delete(slotId);
      else n.add(slotId);
      return n;
    });
  }

  async function convertToSchedule() {
    if (selected.size === 0) {
      setError("เลือกอย่างน้อย 1 ช่วงเวลา");
      return;
    }
    setError(null);
    setConverting(true);
    try {
      const res = await fetch(`/api/polls/${poll.id}/create-schedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: scheduleTitle, slotIds: Array.from(selected) }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(typeof data.error === "string" ? data.error : "สร้างตารางไม่สำเร็จ");
        setConverting(false);
        return;
      }
      const data = await res.json();
      startTransition(() => {
        router.push(`/performances/${poll.performanceId}/practice/${data.scheduleId}`);
      });
    } catch {
      setError("เกิดข้อผิดพลาด");
      setConverting(false);
    }
  }

  async function closePoll() {
    if (!confirm("ปิดโพลนี้? สมาชิกจะเปลี่ยนคำตอบไม่ได้อีก")) return;
    await fetch(`/api/polls/${poll.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "CLOSED" }),
    });
    router.refresh();
  }

  const groupsByDate = useMemo(() => {
    const map = new Map<string, PollSlot[]>();
    for (const s of poll.slots) {
      if (!map.has(s.date)) map.set(s.date, []);
      map.get(s.date)!.push(s);
    }
    return Array.from(map.entries());
  }, [poll.slots]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink">{poll.name}</h1>
          <p className="text-sm text-muted mt-1">
            {poll.status === "OPEN" ? (
              <>
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 mr-2 align-middle" />
                เปิดรับคำตอบ
                {poll.deadline && (
                  <span className="ml-2 text-muted-soft">
                    หมดเขต {new Date(poll.deadline).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" })}
                  </span>
                )}
              </>
            ) : (
              <>
                <span className="inline-block w-2 h-2 rounded-full bg-muted-soft mr-2 align-middle" />
                ปิดแล้ว
              </>
            )}
            <span className="ml-3 text-muted-soft">สมาชิก {poll.members.length} คน</span>
          </p>
        </div>
        {canManage && poll.status === "OPEN" && (
          <Button size="sm" variant="secondary" onClick={closePoll}>
            ปิดโพล
          </Button>
        )}
      </div>

      {/* Voting grid */}
      <div className="bg-surface-card border border-hairline rounded-[var(--radius-lg)] overflow-hidden">
        <div className="px-5 py-4 border-b border-hairline-soft">
          <h3 className="text-sm font-semibold text-ink">ติ๊กช่องเวลาที่คุณว่าง</h3>
          <p className="text-xs text-muted-soft mt-0.5">คลิกช่องเพื่อสลับ ว่าง / ไม่ว่าง</p>
        </div>
        <div className="p-4 flex flex-col gap-4">
          {groupsByDate.map(([date, slots]) => (
            <div key={date}>
              <p className="text-xs font-semibold tracking-[1.5px] uppercase text-muted mb-2">{formatDate(date)}</p>
              <div className="flex flex-wrap gap-2">
                {slots.map((s) => {
                  const count = counts[s.id] ?? 0;
                  const isSelectedForConvert = selected.has(s.id);
                  const myOn = avail[s.id];
                  const disabled = poll.status === "CLOSED" || pending.has(s.id);
                  return (
                    <div key={s.id} className="flex flex-col gap-1">
                      <button
                        type="button"
                        onClick={() => toggle(s.id)}
                        disabled={disabled}
                        className={`px-3 py-2 rounded-[var(--radius-md)] text-xs font-medium border transition-colors ${
                          myOn
                            ? "bg-primary text-on-primary border-primary"
                            : "bg-canvas text-ink border-hairline hover:border-primary"
                        } ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
                      >
                        {s.startTime}–{s.endTime}
                      </button>
                      <div
                        className={`px-2 py-1 rounded text-[10px] font-semibold text-center ${heatColor(count, totalMembers)}`}
                        title={`ว่าง ${count} / ${totalMembers} คน`}
                      >
                        {count}/{totalMembers}
                      </div>
                      {canManage && (
                        <label className="flex items-center gap-1 text-[10px] text-muted-soft cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isSelectedForConvert}
                            disabled={count === 0}
                            onChange={() => toggleSelect(s.id)}
                            className="accent-primary"
                          />
                          เลือก
                        </label>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Admin: convert to schedule */}
      {canManage && (
        <div className="bg-surface-card border border-hairline rounded-[var(--radius-lg)] p-5">
          <h3 className="text-sm font-semibold text-ink mb-3">สร้างตารางซ้อมจากโพล</h3>
          <p className="text-xs text-muted-soft mb-4">
            เลือกช่วงเวลาที่ต้องการจากด้านบน แล้วกดสร้าง — ระบบจะ seed คำตอบ &quot;ว่าง&quot; ของสมาชิกที่ติ๊กในโพลไปให้เลย
          </p>
          <div className="grid md:grid-cols-[1fr_auto] gap-3 items-end">
            <Input
              label="ชื่อตารางซ้อม"
              value={scheduleTitle}
              onChange={(e) => setScheduleTitle(e.target.value)}
            />
            <Button
              type="button"
              variant="primary"
              disabled={converting || selected.size === 0}
              onClick={convertToSchedule}
            >
              {converting ? "กำลังสร้าง..." : `สร้างตาราง (${selected.size} ช่อง)`}
            </Button>
          </div>
          {error && <p className="mt-3 text-sm text-error">{error}</p>}
        </div>
      )}
    </div>
  );
}
