import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export default async function MemberDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const { id } = await params;

  const viewer = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isTemporary: true },
  });
  if (viewer?.isTemporary) notFound();

  const isAdmin = session.user.role === "ADMIN";
  const isHead = session.user.role === "HEAD";
  const canSeeFull = isAdmin || isHead;
  const isSelf = session.user.id === id;

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      nickname: true,
      generation: true,
      contact: true,
      role: true,
      status: true,
      isTemporary: true,
      // Full-view-only fields
      email: canSeeFull ? true : false,
      firstName: canSeeFull ? true : false,
      lastName: canSeeFull ? true : false,
      avatarUrl: canSeeFull ? true : false,
      linkedPerformance: canSeeFull
        ? { select: { id: true, name: true } }
        : false,
      primaryInstrument: { select: { id: true, nameThai: true } },
      secondaryInstruments: {
        select: { instrument: { select: { id: true, nameThai: true } } },
      },
    },
  });

  if (!user) notFound();

  const performanceMembers = canSeeFull
    ? await prisma.performanceMember.findMany({
        where: { userId: user.id },
        include: {
          performance: {
            select: {
              id: true,
              name: true,
              location: true,
              dates: { select: { date: true }, orderBy: { date: "asc" }, take: 1 },
            },
          },
        },
        orderBy: { joinedAt: "desc" },
        take: 20,
      })
    : [];

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6 py-4 px-8">
      <Link href="/members" className="text-sm text-muted hover:text-coral">← กลับหน้าสมาชิก</Link>

      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-surface-cream-strong border border-hairline overflow-hidden flex items-center justify-center text-xl font-bold text-ink shrink-0">
          {canSeeFull && user.avatarUrl ? (
            <Image src={user.avatarUrl} alt={user.nickname} width={56} height={56} className="object-cover w-full h-full" />
          ) : (
            user.nickname.charAt(0).toUpperCase()
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-ink">
            {user.nickname}
            {canSeeFull && (user.firstName || user.lastName) && (
              <span className="ml-2 text-sm font-normal text-muted">
                ({[user.firstName, user.lastName].filter(Boolean).join(" ")})
              </span>
            )}
          </h1>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            {user.generation && <Badge variant="pill">{user.generation}</Badge>}
            {user.isTemporary && (
              <Badge variant="pill">
                บัญชีชั่วคราว
                {canSeeFull && user.linkedPerformance && ` · ${user.linkedPerformance.name}`}
              </Badge>
            )}
            {user.status === "EXPIRED" && (
              <Badge variant="pill">หมดอายุ</Badge>
            )}
            <Badge variant="coral">{user.role}</Badge>
          </div>
        </div>
        {isAdmin && !isSelf && (
          <Link href={`/members/${user.id}/edit`}>
            <Button size="sm" variant="secondary">แก้ไข</Button>
          </Link>
        )}
        {isSelf && (
          <Link href="/profile">
            <Button size="sm" variant="secondary">แก้ไขโปรไฟล์</Button>
          </Link>
        )}
      </div>

      {/* Info */}
      <Card>
        <h2 className="text-base font-semibold text-ink mb-4">ข้อมูล</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          {canSeeFull && (
            <>
              <div>
                <p className="text-xs text-muted mb-0.5">ชื่อจริง - นามสกุล</p>
                <p className="text-ink">
                  {user.firstName || user.lastName
                    ? [user.firstName, user.lastName].filter(Boolean).join(" ")
                    : <span className="text-muted-soft">ไม่ได้ระบุ</span>}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted mb-0.5">อีเมล</p>
                <p className="text-ink">{user.email || <span className="text-muted-soft">ไม่ได้ระบุ</span>}</p>
              </div>
            </>
          )}
          <div>
            <p className="text-xs text-muted mb-0.5">Contact</p>
            <p className="text-ink">{user.contact || <span className="text-muted-soft">ไม่ได้ระบุ</span>}</p>
          </div>
          <div>
            <p className="text-xs text-muted mb-0.5">รุ่น Petra</p>
            <p className="text-ink">{user.generation || <span className="text-muted-soft">ไม่ได้ระบุ</span>}</p>
          </div>
          <div>
            <p className="text-xs text-muted mb-0.5">เครื่องดนตรีหลัก</p>
            <p className="text-ink">
              {user.primaryInstrument?.nameThai || <span className="text-muted-soft">ไม่ได้ระบุ</span>}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted mb-0.5">เครื่องดนตรีที่เล่นเป็น</p>
            <p className="text-ink">
              {user.secondaryInstruments.length > 0
                ? user.secondaryInstruments.map((s) => s.instrument.nameThai).join(", ")
                : <span className="text-muted-soft">ไม่ได้ระบุ</span>}
            </p>
          </div>
        </div>
      </Card>

      {/* Performance history — Admin/Head only */}
      {canSeeFull && (
        <Card>
          <h2 className="text-base font-semibold text-ink mb-4">ประวัติการแสดง</h2>
          {performanceMembers.length === 0 ? (
            <p className="text-sm text-muted">ยังไม่มีประวัติการแสดง</p>
          ) : (
            <div className="flex flex-col gap-3">
              {performanceMembers.map((m) => {
                const firstDate = m.performance.dates[0]?.date;
                return (
                  <div key={m.id} className="flex items-start justify-between gap-4 py-2 border-b border-hairline-soft last:border-0">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-ink truncate">{m.performance.name}</p>
                      <p className="text-xs text-muted mt-0.5">
                        {m.performance.location && `${m.performance.location} · `}
                        {firstDate
                          ? new Date(firstDate).toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "numeric" })
                          : "ยังไม่มีวันที่"}
                      </p>
                    </div>
                    {m.position && <Badge variant="pill">{m.position}</Badge>}
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
