import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import CreatePracticeScheduleClient from "./CreatePracticeScheduleClient";

type Params = { params: Promise<{ id: string }> };

export default async function CreatePracticeSchedulePage({ params }: Params) {
  const { id } = await params;
  const session = await auth();
  if (!session) redirect("/login");

  const performance = await prisma.performance.findUnique({
    where: { id },
    select: { id: true, name: true, heads: { select: { userId: true } } },
  });

  if (!performance) notFound();

  const isAdmin = session.user.role === "ADMIN";
  const isHead =
    session.user.role === "HEAD" &&
    performance.heads.some((h) => h.userId === session.user.id);

  if (!isAdmin && !isHead) redirect(`/performances/${id}/practice`);

  const members = await prisma.user.findMany({
    where: {
      rsvps: {
        some: {
          status: "AVAILABLE",
          performanceDate: { performanceId: id },
        },
      },
    },
    select: {
      id: true,
      nickname: true,
      generation: true,
      primaryInstrument: { select: { name: true, nameThai: true } },
    },
    orderBy: { nickname: "asc" },
  });

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
        <span className="text-ink">สร้างตารางซ้อม</span>
      </div>

      <h1 className="text-2xl font-bold text-ink mb-6">สร้างตารางซ้อม</h1>

      <CreatePracticeScheduleClient
        performanceId={id}
        performanceName={performance.name}
        members={members}
      />
    </div>
  );
}
