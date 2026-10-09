"use client";

import { PracticeTimetable, type TimetableSchedule } from "@/components/practice/PracticeTimetable";
import { usePracticeEdits } from "@/components/practice/usePracticeEdits";

export default function ManagePracticeClient({
  schedules,
  canEdit,
  canDelete,
  dateRange,
}: {
  schedules: TimetableSchedule[];
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
        </div>
      ))}
    </div>
  );
}
