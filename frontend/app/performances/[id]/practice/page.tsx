import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";

type Params = { params: Promise<{ id: string }> };

export default async function PracticeListPage({ params }: Params) {
  const { id } = await params;
  const session = await auth();

  const performance = await prisma.performance.findUnique({
    where: { id },
    select: { id: true, heads: { select: { userId: true } } },
  });

  if (!performance) notFound();

  const schedule = await prisma.practiceSchedule.findFirst({
    where: { performanceId: id },
    orderBy: { createdAt: "asc" },
  });

  if (schedule) {
    redirect(`/performances/${id}/practice/${schedule.id}`);
  }

  const isAdmin = session?.user.role === "ADMIN";
  const isHead =
    session?.user.role === "HEAD" &&
    performance.heads.some((h) => h.userId === session?.user.id);

  if (isAdmin || isHead) {
    redirect(`/performances/${id}/practice/create`);
  }

  redirect(`/performances/${id}`);
}
