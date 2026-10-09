"use client";

import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import { useConfirm } from "@/components/ui/ConfirmDialog";

import type { SlotTemplate } from "./PracticeTimetable";

export type PhaseInfo = { title: string; location: string; locationNote: string; dateMode: string };

/** Save handlers for an editable PracticeTimetable. Each returns true on success. */
export function usePracticeEdits() {
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();

  // A merged timetable row stands for the same slot on several days: patch them all.
  async function patchSlots(slotIds: string[], body: Record<string, string>, failMsg: string) {
    const results = await Promise.all(
      slotIds.map((id) =>
        fetch(`/api/practice-slots/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }).then(
          async (r) => (r.ok ? null : ((await r.json().catch(() => ({}))).error as string | undefined) ?? failMsg),
          () => failMsg,
        ),
      ),
    );
    router.refresh();
    const err = results.find((r) => r !== null);
    if (err) toast.error(err);
    return !err;
  }

  return {
    saveLabel: (slotIds: string[], label: string) => patchSlots(slotIds, { label }, "บันทึกรายละเอียดไม่สำเร็จ"),
    saveTimes: (slotIds: string[], startTime: string, endTime: string, location: string) =>
      patchSlots(slotIds, { startTime, endTime, location: location.trim() }, "บันทึกไม่สำเร็จ"),
    async deleteDay(dayId: string, dateLabel: string) {
      const ok = await confirm({
        title: "ลบวันซ้อม",
        message: `ลบ ${dateLabel} และช่วงเวลาทั้งหมดของวันนี้?`,
        confirmLabel: "ลบวัน",
        variant: "danger",
      });
      if (!ok) return false;
      const res = await fetch(`/api/practice-days/${dayId}`, { method: "DELETE" });
      router.refresh();
      if (res.ok) toast.success("ลบวันแล้ว");
      else toast.error("ลบวันไม่สำเร็จ");
      return res.ok;
    },
    async addDay(scheduleId: string, date: string, template: SlotTemplate[]) {
      const res = await fetch(`/api/practice-schedules/${scheduleId}/days`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, slots: template }),
      });
      router.refresh();
      if (!res.ok) toast.error("เพิ่มวันไม่สำเร็จ");
      return res.ok;
    },
    async addSlot(dayIds: string[], slot: SlotTemplate) {
      const results = await Promise.all(
        dayIds.map((id) =>
          fetch(`/api/practice-days/${id}/slots`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(slot),
          }).then((r) => r.ok, () => false),
        ),
      );
      router.refresh();
      if (!results.every(Boolean)) toast.error("เพิ่มช่วงเวลาไม่สำเร็จ");
      return results.every(Boolean);
    },
    async deleteSlot(slotIds: string[]) {
      const ok = await confirm({
        title: "ลบช่วงเวลา",
        message: slotIds.length > 1 ? `ลบช่วงเวลานี้จากทั้ง ${slotIds.length} วัน?` : "ลบช่วงเวลานี้?",
        confirmLabel: "ลบ",
        variant: "danger",
      });
      if (!ok) return false;
      const results = await Promise.all(
        slotIds.map((id) => fetch(`/api/practice-slots/${id}`, { method: "DELETE" }).then((r) => r.ok, () => false)),
      );
      router.refresh();
      if (!results.every(Boolean)) toast.error("ลบไม่สำเร็จ");
      return results.every(Boolean);
    },
    async deleteSchedule(scheduleId: string, title: string) {
      const ok = await confirm({
        title: "ลบตารางซ้อม",
        message: `ลบ "${title}" ทั้งตาราง? กู้คืนไม่ได้`,
        confirmLabel: "ลบตาราง",
        variant: "danger",
      });
      if (!ok) return false;
      const res = await fetch(`/api/practice-schedules/${scheduleId}`, { method: "DELETE" });
      router.refresh();
      if (res.ok) toast.success("ลบตารางแล้ว");
      else toast.error("ลบตารางไม่สำเร็จ");
      return res.ok;
    },
    async savePhase(scheduleId: string, info: PhaseInfo) {
      const res = await fetch(`/api/practice-schedules/${scheduleId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: info.title.trim(),
          location: info.location.trim(),
          locationNote: info.locationNote.trim(),
          dateMode: info.dateMode,
        }),
      });
      router.refresh();
      if (!res.ok) toast.error("บันทึกไม่สำเร็จ");
      return res.ok;
    },
  };
}
