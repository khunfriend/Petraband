import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import CreatePollClient from "./CreatePollClient";

type Params = { params: Promise<{ id: string }> };

export default async function CreatePollPage({ params }: Params) {
  const { id } = await params;
  const session = await auth();
  if (!session) redirect("/login");

  const performance = await prisma.performance.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      heads: { select: { userId: true } },
      dates: { select: { date: true }, orderBy: { date: "asc" } },
    },
  });
  if (!performance) notFound();

  const isAdmin = session.user.role === "ADMIN";
  const isHead =
    session.user.role === "HEAD" &&
    performance.heads.some((h) => h.userId === session.user.id);
  if (!isAdmin && !isHead) redirect(`/performances/${id}`);

  return (
    <div className="w-full max-w-[900px] mx-auto px-6 md:px-8 py-8">
      <div className="flex items-center gap-2 text-sm text-muted mb-6">
        <Link href="/performances" className="hover:text-ink transition-colors">งานแสดง</Link>
        <span>/</span>
        <Link href={`/performances/${id}`} className="hover:text-ink transition-colors">{performance.name}</Link>
        <span>/</span>
        <span className="text-ink">โพลตารางว่าง</span>
      </div>
      <h1 className="text-2xl font-bold text-ink mb-1">สร้างโพลตารางว่าง</h1>
      <p className="text-sm text-muted mb-6">ให้สมาชิกเลือกช่วงที่ว่าง ก่อนสร้างตารางซ้อม</p>

      <CreatePollClient
        performanceId={id}
        performanceName={performance.name}
        performanceDates={performance.dates.map((d) => d.date.toISOString().slice(0, 10))}
      />
    </div>
  );
}
