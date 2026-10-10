"use client";

import { PracticeTimetable, type TimetableSchedule } from "@/components/practice/PracticeTimetable";
import { usePracticeEdits } from "@/components/practice/usePracticeEdits";
import { AvailabilitySheet, type SheetAnswer, type SheetRow } from "@/components/practice/AvailabilitySheet";

export default function ManagePracticeClient({
  schedules,
  canEdit,
  canDelete,
  dateRange,
  members,
  viewerId,
  sheets,
}: {
  schedules: TimetableSchedule[];
  members: { id: string; name: string }[];
  viewerId: string;
  /** "ใครว่างบ้าง" rows and answers per schedule id. */
  sheets: Record<string, { rows: SheetRow[]; answers: Record<string, Record<string, SheetAnswer>> }>;
  canEdit: boolean;
  /** Deleting a whole schedule is admin-only (the API enforces it too). */
  canDelete: boolean;
  dateRange: { min?: string; max?: string };
}) {
  const edits = usePracticeEdits();
  // One table per schedule so each header can carry its own "ลบตาราง".
  return (
    <div className="flex flex-col gap-4">
      {schedules.map((s) => (
        <div key={s.id} id={`schedule-${s.id}`} className="scroll-mt-24">
          <PracticeTimetable
            schedules={[s]}
            onSaveLabel={canEdit ? edits.saveLabel : undefined}
            onSaveTimes={canEdit ? edits.saveTimes : undefined}
            onSavePhase={canEdit ? edits.savePhase : undefined}
            onDeleteDay={canEdit ? edits.deleteDay : undefined}
            onAddDay={canEdit ? edits.addDay : undefined}
            onAddSlot={canEdit ? edits.addSlot : undefined}
            onDeleteSlot={canEdit ? edits.deleteSlot : undefined}
            onDeleteSchedule={canEdit && canDelete ? edits.deleteSchedule : undefined}
            dateRange={dateRange}
          />
          {sheets[s.id] && (
            <AvailabilitySheet
              scheduleId={s.id}
              rows={sheets[s.id].rows}
              answers={sheets[s.id].answers}
              members={members}
              viewerId={viewerId}
              canEditAll={canEdit}
            />
          )}
        </div>
      ))}
    </div>
  );
}
