import { redirect } from "next/navigation";

type Params = { params: Promise<{ id: string; scheduleId: string }> };

// Schedules are viewed and edited together on the practice page; keep old links working.
export default async function PracticeSchedulePage({ params }: Params) {
  const { id, scheduleId } = await params;
  redirect(`/performances/${id}/practice#schedule-${scheduleId}`);
}
