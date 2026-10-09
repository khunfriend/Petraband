"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { PaintGrid } from "@/components/practice/PaintGrid";
import { gridRows } from "@/lib/pollGrid";

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

function formatSlot(s: PollSlot) {
  const day = new Date(s.date + "T00:00:00").toLocaleDateString("th-TH", { weekday: "short", day: "numeric", month: "short" });
  return `${day} ${s.startTime}–${s.endTime}`;
}

// Green gradient by fraction of members who marked available
function heatColor(count: number, total: number) {
  if (total === 0 || count === 0) return "bg-surface-soft";
  const ratio = Math.min(1, count / total);
  if (ratio >= 0.85) return "bg-emerald-600";
  if (ratio >= 0.65) return "bg-emerald-500";
  if (ratio >= 0.45) return "bg-emerald-400";
  if (ratio >= 0.25) return "bg-emerald-200";
  return "bg-emerald-100";
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
  const toast = useToast();
  const [, startTransition] = useTransition();
  const [avail, setAvail] = useState<Record<string, boolean>>(() => {
    const m: Record<string, boolean> = {};
    poll.slots.forEach((s) => (m[s.id] = s.myResponse));
    return m;
  });
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [hovered, setHovered] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);
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

  const isMember = poll.members.some((m) => m.id === currentUserId);
  const canVote = poll.status === "OPEN" && isMember;

  async function paintMine(ids: string[], on: boolean) {
    const changed = ids.filter((id) => (avail[id] ?? false) !== on);
    if (changed.length === 0) return;
    const before = avail;
    setAvail((prev) => {
      const next = { ...prev };
      for (const id of changed) next[id] = on;
      return next;
    });
    try {
      const res = await fetch(`/api/polls/${poll.id}/responses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ changes: changed.map((pollSlotId) => ({ pollSlotId, isAvailable: on })) }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(typeof data.error === "string" ? data.error : "บันทึกไม่สำเร็จ");
      }
    } catch (e) {
      setAvail(before);
      toast.error(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
    }
  }

  function paintSelection(ids: string[], on: boolean) {
    setSelected((prev) => {
      const n = new Set(prev);
      for (const id of ids) {
        if (on && (counts[id] ?? 0) > 0) n.add(id);
        else n.delete(id);
      }
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
        router.push(`/performances/${poll.performanceId}/practice#schedule-${data.scheduleId}`);
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

  const grid = useMemo(() => {
    const byKey = new Map<string, PollSlot>();
    const byId = new Map<string, PollSlot>();
    for (const s of poll.slots) {
      byKey.set(`${s.date}|${s.startTime}|${s.endTime}`, s);
      byId.set(s.id, s);
    }
    return {
      dates: [...new Set(poll.slots.map((s) => s.date))].sort(),
      rows: gridRows(poll.slots),
      cellId: (date: string, r: { startTime: string; endTime: string }) => byKey.get(`${date}|${r.startTime}|${r.endTime}`)?.id,
      byId,
    };
  }, [poll.slots]);

  const hoveredSlot = hovered ? grid.byId.get(hovered) : undefined;
  const hoveredAvailable = hoveredSlot
    ? poll.members.filter((m) => (m.id === currentUserId ? avail[hoveredSlot.id] : hoveredSlot.availableUsers.some((u) => u.id === m.id)))
    : [];
  const hoveredAway = hoveredSlot ? poll.members.filter((m) => !hoveredAvailable.includes(m)) : [];

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

      {/* Voting grids, when2meet style: mine on the left, the group's on the right */}
      <div className="grid lg:grid-cols-2 gap-4 items-start">
        <div className="bg-surface-card border border-hairline rounded-[var(--radius-lg)] p-4">
          <h3 className="text-sm font-semibold text-ink">เวลาที่ฉันว่าง</h3>
          <p className="text-xs text-muted-soft mt-0.5 mb-3">
            {canVote
              ? "กดค้างแล้วลากเพื่อเลือก ลากจากช่องที่เลือกไว้เพื่อลบ"
              : poll.status === "CLOSED"
                ? "โพลปิดแล้ว"
                : "ต้องเข้าร่วมงานก่อนจึงจะโหวตได้"}
          </p>
          <PaintGrid
            dates={grid.dates}
            rows={grid.rows}
            cellId={grid.cellId}
            isOn={(id) => !!avail[id]}
            onPaint={canVote ? paintMine : undefined}
            cellClass={(id, preview) => ((preview ?? avail[id]) ? "bg-primary" : "bg-surface-soft hover:bg-primary/10")}
          />
          <div className="mt-3 flex items-center gap-4 text-[11px] text-muted">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-primary rounded-[2px]" />ว่าง</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-surface-soft border border-hairline rounded-[2px]" />ไม่ว่าง</span>
          </div>
        </div>

        <div className="bg-surface-card border border-hairline rounded-[var(--radius-lg)] p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-ink">ทั้งวง</h3>
              <p className="text-xs text-muted-soft mt-0.5 mb-3">
                {picking ? "ลากเลือกช่วงที่จะใช้สร้างตารางซ้อม" : "ชี้ที่ช่องเพื่อดูว่าใครว่าง"}
              </p>
            </div>
            {canManage && (
              <Button size="sm" variant={picking ? "primary" : "secondary"} onClick={() => setPicking((v) => !v)}>
                {picking ? "เลือกเสร็จ" : "เลือกช่วงซ้อม"}
              </Button>
            )}
          </div>
          <PaintGrid
            dates={grid.dates}
            rows={grid.rows}
            cellId={grid.cellId}
            isOn={(id) => selected.has(id)}
            onPaint={canManage && picking ? paintSelection : undefined}
            onHover={setHovered}
            cellClass={(id, preview) => {
              const on = preview ?? selected.has(id);
              return `${heatColor(counts[id] ?? 0, totalMembers)} ${on ? "outline-2 -outline-offset-2 outline-coral" : ""} ${hovered === id ? "brightness-90" : ""}`;
            }}
          />
          <div className="mt-3 flex items-center gap-1.5 text-[11px] text-muted">
            <span>0/{poll.members.length}</span>
            {["bg-surface-soft border border-hairline", "bg-emerald-100", "bg-emerald-200", "bg-emerald-400", "bg-emerald-500", "bg-emerald-600"].map((c) => (
              <span key={c} className={`w-3 h-3 rounded-[2px] ${c}`} />
            ))}
            <span>{poll.members.length}/{poll.members.length} ว่าง</span>
          </div>

          <div className="mt-3 pt-3 border-t border-hairline-soft min-h-[64px] text-xs">
            {hoveredSlot ? (
              <div className="flex flex-col gap-1.5">
                <p className="font-semibold text-ink">
                  {formatSlot(hoveredSlot)} · ว่าง {hoveredAvailable.length}/{poll.members.length}
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-muted mb-1">ว่าง</p>
                    <p className="text-ink">{hoveredAvailable.map((m) => m.nickname).join(", ") || "–"}</p>
                  </div>
                  <div>
                    <p className="text-muted mb-1">ไม่ว่าง</p>
                    <p className="text-muted-soft">{hoveredAway.map((m) => m.nickname).join(", ") || "–"}</p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-muted-soft">ชี้ที่ช่องเพื่อดูรายชื่อ</p>
            )}
          </div>
        </div>
      </div>

      {/* Admin: convert to schedule */}
      {canManage && (
        <div className="bg-surface-card border border-hairline rounded-[var(--radius-lg)] p-5">
          <h3 className="text-sm font-semibold text-ink mb-3">สร้างตารางซ้อมจากโพล</h3>
          <p className="text-xs text-muted-soft mb-4">
            กด &quot;เลือกช่วงซ้อม&quot; แล้วลากบนตารางทั้งวง ช่องที่ติดกันจะรวมเป็นช่วงเดียว
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
