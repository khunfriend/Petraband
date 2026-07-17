"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import PracticeGrid from "@/components/practice/PracticeGrid";
import { Button } from "@/components/ui/Button";

type Availability = {
  id: string;
  slotId: string;
  userId: string;
  isAvailable: boolean;
};

type Slot = {
  id: string;
  startTime: string;
  endTime: string;
  label: string;
  isSpecial: boolean;
  slotOrder: number;
  availabilities: Availability[];
};

type Day = {
  id: string;
  date: string;
  dayOrder: number;
  slots: Slot[];
};

type GroupMember = {
  id: string;
  groupId: string;
  userId: string;
  user: { id: string; nickname: string; generation: string };
};

type MemberGroup = {
  id: string;
  name: string;
  displayOrder: number;
  members: GroupMember[];
};

type Schedule = {
  id: string;
  title: string;
  performanceId: string;
  days: Day[];
  memberGroups: MemberGroup[];
};

type ResponseStatus = {
  responded: { id: string; nickname: string; generation: string }[];
  notResponded: { id: string; nickname: string; generation: string }[];
};

type Member = { id: string; nickname: string; generation: string };

type Props = {
  schedule: Schedule;
  allMembers: Member[];
  performanceId: string;
  performanceDates: string[];
  currentUserId: string | null;
  isAdmin: boolean;
  isHead: boolean;
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("th-TH", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

export default function PracticeScheduleClient({
  schedule,
  allMembers,
  performanceDates,
  currentUserId,
  isAdmin,
  isHead,
}: Props) {
  const canEdit = isAdmin || isHead;
  const router = useRouter();
  const [responseStatus, setResponseStatus] = useState<ResponseStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState(schedule.title);
  const [titleLoading, setTitleLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [editMode, setEditMode] = useState(false);
  const [addDayOpen, setAddDayOpen] = useState(false);
  const [newDate, setNewDate] = useState("");
  const [busy, setBusy] = useState(false);
  const [addSlotForDay, setAddSlotForDay] = useState<string | null>(null);
  const [newSlot, setNewSlot] = useState({ startTime: "18:00", endTime: "20:00", label: "" });

  const maxDate = performanceDates.length > 0 ? performanceDates[performanceDates.length - 1] : null;

  useEffect(() => {
    if (!canEdit) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoadingStatus(true);
    fetch(`/api/practice-schedules/${schedule.id}/response-status`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data) setResponseStatus(data); })
      .finally(() => setLoadingStatus(false));
  }, [schedule.id, canEdit]);

  async function saveTitle() {
    if (!editTitle.trim()) return;
    setTitleLoading(true);
    try {
      const res = await fetch(`/api/practice-schedules/${schedule.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editTitle.trim() }),
      });
      if (res.ok) {
        setEditingTitle(false);
        router.refresh();
      }
    } finally {
      setTitleLoading(false);
    }
  }

  async function deleteSchedule() {
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/practice-schedules/${schedule.id}`, { method: "DELETE" });
      if (res.ok) router.push(`/performances/${schedule.performanceId}/practice`);
    } finally {
      setDeleteLoading(false);
    }
  }

  async function addDay() {
    if (!newDate) return;
    setBusy(true);
    try {
      const templateSlots = schedule.days.length > 0
        ? schedule.days[schedule.days.length - 1].slots.map((s) => ({
            startTime: s.startTime,
            endTime: s.endTime,
            label: s.label,
            isSpecial: s.isSpecial,
          }))
        : [{ startTime: "18:00", endTime: "20:00", label: "", isSpecial: false }];
      const res = await fetch(`/api/practice-schedules/${schedule.id}/days`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: newDate, slots: templateSlots }),
      });
      if (res.ok) {
        setAddDayOpen(false);
        setNewDate("");
        router.refresh();
      } else {
        const err = await res.json().catch(() => ({}));
        alert(`เพิ่มวันไม่สำเร็จ: ${err.error ?? res.status}`);
      }
    } finally {
      setBusy(false);
    }
  }

  async function deleteDay(dayId: string) {
    if (!confirm("ลบวันนี้ ยืนยันมั้ย? (ข้อมูลการตอบรับในวันนี้จะหายทั้งหมด)")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/practice-days/${dayId}`, { method: "DELETE" });
      if (res.ok) router.refresh();
      else alert("ลบไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }

  async function addSlot(dayId: string) {
    if (!newSlot.startTime || !newSlot.endTime) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/practice-days/${dayId}/slots`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSlot),
      });
      if (res.ok) {
        setAddSlotForDay(null);
        setNewSlot({ startTime: "18:00", endTime: "20:00", label: "" });
        router.refresh();
      } else {
        alert("เพิ่มช่วงเวลาไม่สำเร็จ");
      }
    } finally {
      setBusy(false);
    }
  }

  async function deleteSlot(slotId: string) {
    if (!confirm("ลบช่วงเวลานี้ ยืนยันมั้ย?")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/practice-slots/${slotId}`, { method: "DELETE" });
      if (res.ok) router.refresh();
      else alert("ลบไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        {editingTitle ? (
          <div className="flex items-center gap-2 flex-1">
            <input
              autoFocus
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") saveTitle(); if (e.key === "Escape") setEditingTitle(false); }}
              className="text-2xl font-bold text-ink bg-transparent border-b-2 border-coral outline-none flex-1"
            />
            <Button size="sm" variant="coral" onClick={saveTitle} disabled={titleLoading}>บันทึก</Button>
            <Button size="sm" variant="secondary" onClick={() => setEditingTitle(false)}>ยกเลิก</Button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-ink">{editTitle || schedule.title}</h1>
            {canEdit && (
              <button onClick={() => { setEditTitle(editTitle || schedule.title); setEditingTitle(true); }} className="text-xs text-muted hover:text-coral transition-colors">
                แก้ไขชื่อ
              </button>
            )}
          </div>
        )}
        {canEdit && !editingTitle && (
          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              variant={editMode ? "coral" : "secondary"}
              onClick={() => setEditMode((v) => !v)}
            >
              {editMode ? "เสร็จสิ้น" : "แก้ไขวัน/ช่วงเวลา"}
            </Button>
            {confirmDelete ? (
              <>
                <span className="text-xs text-red-600">ยืนยันลบ?</span>
                <Button size="sm" variant="coral" onClick={deleteSchedule} disabled={deleteLoading}>
                  {deleteLoading ? "กำลังลบ..." : "ลบ"}
                </Button>
                <Button size="sm" variant="secondary" onClick={() => setConfirmDelete(false)}>ยกเลิก</Button>
              </>
            ) : (
              <Button size="sm" variant="secondary" onClick={() => setConfirmDelete(true)}>
                ลบตารางซ้อม
              </Button>
            )}
          </div>
        )}
      </div>

      {canEdit && editMode && (
        <div className="p-4 bg-surface-card border border-hairline-soft rounded-[var(--radius-md)]">
          <p className="text-xs font-bold tracking-[1.5px] uppercase text-muted mb-3">
            แก้ไขวันและช่วงเวลา
          </p>

          <div className="flex flex-col gap-3">
            {schedule.days.map((day) => (
              <div key={day.id} className="border border-hairline-soft rounded-[var(--radius-md)] overflow-hidden">
                <div className="flex items-center justify-between gap-3 px-3 py-2 bg-surface-cream-strong">
                  <span className="text-sm font-semibold text-ink">{formatDate(day.date)}</span>
                  <button
                    onClick={() => deleteDay(day.id)}
                    disabled={busy}
                    className="text-xs text-red-600 hover:underline disabled:opacity-50"
                  >
                    ลบวัน
                  </button>
                </div>
                <div className="px-3 py-2 flex flex-wrap gap-1.5">
                  {day.slots.map((slot) => (
                    <span
                      key={slot.id}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                        slot.isSpecial
                          ? "bg-coral/10 border-coral/30 text-coral"
                          : "bg-canvas border-hairline text-ink"
                      }`}
                    >
                      {slot.startTime}–{slot.endTime}
                      {slot.label && ` · ${slot.label}`}
                      <button
                        onClick={() => deleteSlot(slot.id)}
                        disabled={busy}
                        className="ml-0.5 text-muted hover:text-red-600 disabled:opacity-50"
                        aria-label="ลบ"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  {addSlotForDay === day.id ? (
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-canvas border border-coral rounded-[var(--radius-md)]">
                      <input
                        type="time"
                        value={newSlot.startTime}
                        onChange={(e) => setNewSlot((s) => ({ ...s, startTime: e.target.value }))}
                        className="text-xs bg-transparent outline-none w-[70px]"
                      />
                      <span className="text-xs text-muted">–</span>
                      <input
                        type="time"
                        value={newSlot.endTime}
                        onChange={(e) => setNewSlot((s) => ({ ...s, endTime: e.target.value }))}
                        className="text-xs bg-transparent outline-none w-[70px]"
                      />
                      <input
                        type="text"
                        value={newSlot.label}
                        onChange={(e) => setNewSlot((s) => ({ ...s, label: e.target.value }))}
                        placeholder="label (ไม่บังคับ)"
                        className="text-xs bg-transparent outline-none w-[100px] border-l border-hairline pl-1.5"
                      />
                      <button
                        onClick={() => addSlot(day.id)}
                        disabled={busy}
                        className="text-xs text-coral font-medium hover:underline disabled:opacity-50"
                      >
                        เพิ่ม
                      </button>
                      <button
                        onClick={() => { setAddSlotForDay(null); setNewSlot({ startTime: "18:00", endTime: "20:00", label: "" }); }}
                        className="text-xs text-muted hover:text-ink"
                      >
                        ยกเลิก
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setAddSlotForDay(day.id)}
                      className="text-xs text-coral hover:underline px-2 py-1"
                    >
                      + เพิ่มช่วงเวลา
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3 pt-3 border-t border-hairline-soft">
            {addDayOpen ? (
              <div className="flex items-center gap-2 flex-wrap">
                <input
                  type="date"
                  value={newDate}
                  max={maxDate ?? undefined}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="text-sm px-3 py-1.5 border border-hairline rounded-[var(--radius-md)] bg-canvas outline-none focus:border-coral"
                />
                <Button size="sm" variant="coral" onClick={addDay} disabled={busy || !newDate}>
                  เพิ่มวัน
                </Button>
                <Button size="sm" variant="secondary" onClick={() => { setAddDayOpen(false); setNewDate(""); }}>
                  ยกเลิก
                </Button>
                {maxDate && (
                  <span className="text-xs text-muted-soft">เลือกได้ถึงวันแสดง ({maxDate})</span>
                )}
              </div>
            ) : (
              <button
                onClick={() => setAddDayOpen(true)}
                className="text-sm font-medium text-coral hover:underline"
              >
                + เพิ่มวัน
              </button>
            )}
          </div>
        </div>
      )}

      {canEdit && (
        <div className="p-4 bg-surface-card border border-hairline-soft rounded-[var(--radius-md)]">
          <p className="text-xs font-bold tracking-[1.5px] uppercase text-muted mb-2">
            สถานะการตอบ
          </p>
          {loadingStatus ? (
            <p className="text-sm text-muted-soft">กำลังโหลด...</p>
          ) : responseStatus ? (
            <div>
              <p className="text-sm font-medium text-ink mb-2">
                ตอบแล้ว {responseStatus.responded.length}/
                {responseStatus.responded.length + responseStatus.notResponded.length} คน
              </p>
              {responseStatus.notResponded.length > 0 && (
                <div>
                  <p className="text-xs text-muted mb-1">ยังไม่ตอบ:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {responseStatus.notResponded.map((m) => (
                      <span
                        key={m.id}
                        className="px-2 py-0.5 text-xs bg-canvas border border-hairline rounded-full text-muted"
                      >
                        {m.nickname}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>
      )}

      <PracticeGrid
        schedule={schedule}
        allMembers={allMembers}
        currentUserId={currentUserId}
      />
    </div>
  );
}
