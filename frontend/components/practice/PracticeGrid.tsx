"use client";

import React, { useState } from "react";

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
  days: Day[];
  memberGroups: MemberGroup[];
};

type Props = {
  schedule: Schedule;
  allMembers: { id: string; nickname: string; generation: string }[];
  currentUserId: string | null;
};

const DAY_COLORS = [
  "bg-blue-50",
  "bg-green-50",
  "bg-amber-50",
  "bg-purple-50",
  "bg-pink-50",
  "bg-cyan-50",
  "bg-orange-50",
];

const DAY_BORDER_COLORS = [
  "border-blue-200",
  "border-green-200",
  "border-amber-200",
  "border-purple-200",
  "border-pink-200",
  "border-cyan-200",
  "border-orange-200",
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("th-TH", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export default function PracticeGrid({ schedule, allMembers, currentUserId }: Props) {

  const [avail, setAvail] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    for (const day of schedule.days) {
      for (const slot of day.slots) {
        for (const a of slot.availabilities) {
          map[`${slot.id}:${a.userId}`] = a.isAvailable;
        }
      }
    }
    return map;
  });

  const [pending, setPending] = useState<Set<string>>(new Set());

  async function toggleAvailability(slotId: string) {
    if (!currentUserId) return;
    const key = `${slotId}:${currentUserId}`;
    if (pending.has(key)) return;

    const current = avail[key] ?? false;
    const next = !current;

    setAvail((prev) => ({ ...prev, [key]: next }));
    setPending((prev) => new Set(prev).add(key));

    try {
      await fetch(`/api/practice-schedules/${schedule.id}/availability`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slotId, isAvailable: next }),
      });
    } catch {
      setAvail((prev) => ({ ...prev, [key]: current }));
    } finally {
      setPending((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  }

  const assignedUserIds = new Set(
    schedule.memberGroups.flatMap((g) => g.members.map((m) => m.userId))
  );

  type Row = { userId: string; nickname: string; generation: string };

  const rows: { groupName: string | null; members: Row[] }[] = schedule.memberGroups.map((g) => {
    const seen = new Set<string>();
    return {
      groupName: g.name,
      members: g.members
        .filter((m) => { if (seen.has(m.userId)) return false; seen.add(m.userId); return true; })
        .map((m) => ({ userId: m.userId, nickname: m.user.nickname, generation: m.user.generation })),
    };
  });

  const ungrouped = allMembers.filter((m) => !assignedUserIds.has(m.id)).map((m) => ({
    userId: m.id,
    nickname: m.nickname,
    generation: m.generation,
  }));

  if (ungrouped.length > 0) {
    rows.push({
      groupName: rows.length > 0 ? "ไม่มีกลุ่ม" : null,
      members: ungrouped,
    });
  }

  const memberCountPerSlot: Record<string, number> = {};
  for (const day of schedule.days) {
    for (const slot of day.slots) {
      let count = 0;
      for (const a of slot.availabilities) {
        const key = `${slot.id}:${a.userId}`;
        if (avail[key] ?? a.isAvailable) count++;
      }
      memberCountPerSlot[slot.id] = count;
    }
  }

  const totalMembersInGrid = allMembers.length;

  if (schedule.days.length === 0) {
    return <p className="text-sm text-muted-soft">ยังไม่มีวันซ้อม</p>;
  }

  return (
    <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-hairline-soft">
      <table className="border-collapse text-sm" style={{ minWidth: "600px" }}>
        <thead>
          <tr>
            <th
              className="sticky left-0 z-10 bg-canvas border-b border-r border-hairline-soft px-4 py-3 text-left text-xs font-bold tracking-[1.5px] uppercase text-muted whitespace-nowrap"
              style={{ minWidth: "140px" }}
            >
              สมาชิก
            </th>
            {schedule.days.map((day, dayIndex) => {
              const colorClass = DAY_COLORS[dayIndex % DAY_COLORS.length];
              const borderClass = DAY_BORDER_COLORS[dayIndex % DAY_BORDER_COLORS.length];
              return (
                <th
                  key={day.id}
                  colSpan={day.slots.length}
                  className={`${colorClass} border-b ${borderClass} px-3 py-2 text-center text-xs font-semibold text-ink`}
                >
                  {formatDate(day.date)}
                </th>
              );
            })}
          </tr>
          <tr>
            <th className="sticky left-0 z-10 bg-canvas border-b border-r border-hairline-soft px-4 py-2" />
            {schedule.days.map((day, dayIndex) => {
              const colorClass = DAY_COLORS[dayIndex % DAY_COLORS.length];
              const borderClass = DAY_BORDER_COLORS[dayIndex % DAY_BORDER_COLORS.length];
              return day.slots.map((slot, slotIndex) => (
                <th
                  key={slot.id}
                  className={`${slot.isSpecial ? "bg-coral/10 border-coral/30" : `${colorClass} ${borderClass}`} border-b px-2 py-1.5 text-center whitespace-nowrap`}
                  style={{ minWidth: "80px" }}
                >
                  <p className={`text-[11px] font-semibold ${slot.isSpecial ? "text-coral" : "text-ink"}`}>
                    {slot.startTime}–{slot.endTime}
                  </p>
                  {slot.label && (
                    <p className="text-[10px] text-muted-soft mt-0.5">{slot.label}</p>
                  )}
                  {slotIndex === day.slots.length - 1 && dayIndex < schedule.days.length - 1 && (
                    <span />
                  )}
                </th>
              ));
            })}
          </tr>
        </thead>
        <tbody>
          {rows.map(({ groupName, members }, groupIndex) => (
            <React.Fragment key={groupIndex}>
              {groupName !== null && (
                <tr key={`group-${groupIndex}`}>
                  <td
                    colSpan={1 + schedule.days.reduce((acc, d) => acc + d.slots.length, 0)}
                    className="sticky left-0 bg-surface-cream-strong border-b border-hairline-soft px-4 py-1.5"
                  >
                    <span className="text-[11px] font-bold tracking-[1.5px] uppercase text-muted">
                      {groupName}
                    </span>
                  </td>
                </tr>
              )}
              {members.map((member) => (
                <tr
                  key={`${groupIndex}:${member.userId}`}
                  className={member.userId === currentUserId ? "bg-primary/5" : "hover:bg-surface-cream-strong/50"}
                >
                  <td className="sticky left-0 z-10 bg-inherit border-b border-r border-hairline-soft px-4 py-2 whitespace-nowrap">
                    <span className="text-sm font-medium text-ink">{member.nickname}</span>
                    {member.generation && (
                      <span className="text-xs text-muted-soft ml-1.5">{member.generation}</span>
                    )}
                  </td>
                  {schedule.days.map((day) =>
                    day.slots.map((slot) => {
                      const key = `${slot.id}:${member.userId}`;
                      const isChecked = avail[key] ?? false;
                      const isMe = member.userId === currentUserId;
                      const isPending = pending.has(key);
                      return (
                        <td
                          key={`${day.id}:${slot.id}`}
                          className="border-b border-hairline-soft px-2 py-2 text-center"
                        >
                          {isMe ? (
                            <button
                              onClick={() => toggleAvailability(slot.id)}
                              disabled={isPending}
                              className={`w-6 h-6 rounded border-2 flex items-center justify-center mx-auto transition-all ${
                                isChecked
                                  ? "bg-primary border-primary text-white"
                                  : "bg-canvas border-hairline hover:border-primary"
                              } ${isPending ? "opacity-50" : ""}`}
                              aria-label={isChecked ? "ว่าง" : "ไม่ว่าง"}
                            >
                              {isChecked && (
                                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                  <path
                                    d="M2 6l3 3 5-5"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              )}
                            </button>
                          ) : (
                            <div
                              className={`w-5 h-5 rounded border flex items-center justify-center mx-auto ${
                                isChecked
                                  ? "bg-primary/20 border-primary/40"
                                  : "bg-canvas border-hairline"
                              }`}
                            >
                              {isChecked && (
                                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                                  <path
                                    d="M1.5 5l2.5 2.5 4.5-4.5"
                                    stroke="#4f46e5"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              )}
                            </div>
                          )}
                        </td>
                      );
                    })
                  )}
                </tr>
              ))}
            </React.Fragment>
          ))}
          <tr className="bg-surface-cream-strong">
            <td className="sticky left-0 z-10 bg-surface-cream-strong border-t border-hairline-soft px-4 py-2">
              <span className="text-xs font-bold tracking-[1.5px] uppercase text-muted">รวม</span>
            </td>
            {schedule.days.map((day) =>
              day.slots.map((slot) => (
                <td
                  key={`total:${day.id}:${slot.id}`}
                  className="border-t border-hairline-soft px-2 py-2 text-center"
                >
                  <span className="text-xs font-semibold text-ink">
                    {memberCountPerSlot[slot.id] ?? 0}
                    <span className="text-muted-soft font-normal">/{totalMembersInGrid}</span>
                  </span>
                </td>
              ))
            )}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
