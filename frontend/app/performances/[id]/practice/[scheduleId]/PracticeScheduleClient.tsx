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
  currentUserId: string | null;
  isAdmin: boolean;
  isHead: boolean;
};

export default function PracticeScheduleClient({
  schedule,
  allMembers,
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

  useEffect(() => {
    if (!canEdit) return;
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
      if (res.ok) setEditingTitle(false);
    } finally {
      setTitleLoading(false);
    }
  }

  async function deleteSchedule() {
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/practice-schedules/${schedule.id}`, { method: "DELETE" });
      if (res.ok) router.push(`/performances/${schedule.performanceId}`);
    } finally {
      setDeleteLoading(false);
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
          confirmDelete ? (
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-red-600">ยืนยันลบ?</span>
              <Button size="sm" variant="coral" onClick={deleteSchedule} disabled={deleteLoading}>
                {deleteLoading ? "กำลังลบ..." : "ลบ"}
              </Button>
              <Button size="sm" variant="secondary" onClick={() => setConfirmDelete(false)}>ยกเลิก</Button>
            </div>
          ) : (
            <Button size="sm" variant="secondary" onClick={() => setConfirmDelete(true)} className="shrink-0">
              ลบตารางซ้อม
            </Button>
          )
        )}
      </div>

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
