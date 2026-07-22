import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";

type Params = { params: Promise<{ id: string }> };

export default async function PracticeListPage({ params }: Params) {
  const { id } = await params;
  const session = await auth();

  const performance = await prisma.performance.findUnique({
    where: { id },
    select: { id: true, name: true, heads: { select: { userId: true } } },
  });

  if (!performance) notFound();

  const isAdmin = session?.user.role === "ADMIN";
  const isHead =
    session?.user.role === "HEAD" &&
    performance.heads.some((h) => h.userId === session?.user.id);
  const canEdit = isAdmin || isHead;

  const schedules = await prisma.practiceSchedule.findMany({
    where: { performanceId: id },
    include: {
      days: { select: { id: true, date: true, slots: { select: { id: true } } }, orderBy: { date: "asc" } },
    },
    orderBy: { createdAt: "asc" },
  });

  if (schedules.length === 0) {
    if (canEdit) redirect(`/performances/${id}/practice/create`);
    redirect(`/performances/${id}`);
  }

  return (
    <div className="w-full max-w-[1200px] mx-auto px-8 py-8">
      <div className="flex items-center gap-2 text-sm text-muted mb-6">
        <Link href="/performances" className="hover:text-ink transition-colors">
          งานแสดง
        </Link>
        <span>/</span>
        <Link href={`/performances/${id}`} className="hover:text-ink transition-colors">
          {performance.name}
        </Link>
        <span>/</span>
        <span className="text-ink">ตารางซ้อม</span>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-ink">ตารางซ้อมทั้งหมด</h1>
        {canEdit && (
          <Link
            href={`/performances/${id}/practice/create`}
            className="px-4 py-2 bg-primary text-on-primary text-sm font-medium rounded-[var(--radius-md)] hover:bg-primary-active transition-colors duration-[var(--duration-pb-base)]"
          >
            + สร้างตารางซ้อมเพิ่ม
          </Link>
        )}
      </div>

      <div className="flex flex-col gap-3">
        {schedules.map((s) => {
          const slotCount = s.days.reduce((acc, d) => acc + d.slots.length, 0);
          return (
            <Link
              key={s.id}
              href={`/performances/${id}/practice/${s.id}`}
              className="block px-5 py-4 border border-hairline-soft rounded-[var(--radius-lg)] bg-surface-card hover:border-primary transition-colors duration-[var(--duration-pb-base)]"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-base font-semibold text-ink mb-1">{s.title}</p>
                  <p className="text-xs text-muted-soft">
                    {s.days.length} วัน · {slotCount} ช่วงเวลา
                  </p>
                </div>
                <span className="text-xs text-body-strong shrink-0">ดูรายละเอียด →</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
