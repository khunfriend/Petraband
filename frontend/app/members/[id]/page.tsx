import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ChevronRight, ArrowLeft } from "lucide-react";
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

  const assignments = canSeeFull
    ? await prisma.songAssignment.findMany({
        where: { userId: user.id },
        include: {
          instrument: { select: { nameThai: true } },
          performanceSong: {
            select: {
              performance: {
                select: {
                  id: true,
                  name: true,
                  location: true,
                  dates: {
                    select: { date: true },
                    orderBy: { date: "asc" },
                    take: 1,
                  },
                },
              },
            },
          },
        },
      })
    : [];

  const performanceHistory = Array.from(
    assignments
      .reduce((acc, a) => {
        const perf = a.performanceSong.performance;
        const existing = acc.get(perf.id);
        if (existing) {
          existing.instruments.add(a.instrument.nameThai);
        } else {
          acc.set(perf.id, {
            id: perf.id,
            name: perf.name,
            location: perf.location,
            firstDate: perf.dates[0]?.date ?? null,
            instruments: new Set([a.instrument.nameThai]),
          });
        }
        return acc;
      }, new Map<string, { id: string; name: string; location: string | null; firstDate: Date | null; instruments: Set<string> }>())
      .values()
  )
    .sort(
      (a, b) =>
        (b.firstDate?.getTime() ?? 0) - (a.firstDate?.getTime() ?? 0)
    )
    .slice(0, 20);

  return (
    <div className="w-full max-w-3xl mx-auto px-6 md:px-8 py-8 md:py-10 flex flex-col gap-8">
      {/* Breadcrumb */}
      <nav
        aria-label="breadcrumb"
        className="flex items-center gap-1.5 text-xs text-muted"
      >
        <Link
          href="/members"
          className="hover:text-ink transition-colors duration-[var(--duration-pb-base)] inline-flex items-center gap-1"
        >
          <ArrowLeft size={12} strokeWidth={1.75} />
          สมาชิก
        </Link>
        <ChevronRight size={12} strokeWidth={1.75} className="text-muted-soft" />
        <span className="text-ink font-medium truncate">{user.nickname}</span>
      </nav>

      {/* Hero — bone bg + hairline (no shadow), avatar + name + meta */}
      <header className="bg-bone border border-hairline rounded-[var(--radius-lg)] p-6 md:p-8 flex items-center gap-5 flex-wrap">
        <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-surface-cream-strong border border-hairline overflow-hidden flex items-center justify-center text-2xl font-bold text-ink shrink-0">
          {canSeeFull && user.avatarUrl ? (
            <Image
              src={user.avatarUrl}
              alt={user.nickname}
              width={80}
              height={80}
              className="object-cover w-full h-full"
            />
          ) : (
            user.nickname.charAt(0).toUpperCase()
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted">
            {user.role === "ADMIN"
              ? "Admin"
              : user.role === "HEAD"
              ? "Head"
              : "Member"}
          </p>
          <h1 className="mt-1 text-2xl md:text-3xl font-bold text-ink leading-tight truncate">
            {user.nickname}
            {canSeeFull && (user.firstName || user.lastName) && (
              <span className="ml-2 text-base font-normal text-muted">
                ({[user.firstName, user.lastName].filter(Boolean).join(" ")})
              </span>
            )}
          </h1>
          <div className="flex items-center gap-1.5 mt-3 flex-wrap">
            {user.generation && <Badge variant="pill">{user.generation}</Badge>}
            {user.primaryInstrument && (
              <Badge variant="pill">{user.primaryInstrument.nameThai}</Badge>
            )}
            {user.isTemporary && (
              <Badge variant="warning">
                ชั่วคราว
                {canSeeFull &&
                  user.linkedPerformance &&
                  ` · ${user.linkedPerformance.name}`}
              </Badge>
            )}
            {user.status === "EXPIRED" && <Badge variant="slate">หมดอายุ</Badge>}
          </div>
        </div>
        {isAdmin && !isSelf && (
          <Link href={`/members/${user.id}/edit`}>
            <Button size="sm" variant="secondary">
              แก้ไข
            </Button>
          </Link>
        )}
        {isSelf && (
          <Link href="/profile">
            <Button size="sm" variant="secondary">
              แก้ไขโปรไฟล์
            </Button>
          </Link>
        )}
      </header>

      {/* Info */}
      <section>
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted mb-3">
          ข้อมูล · Info
        </p>
        <div className="bg-surface-card border border-hairline rounded-[var(--radius-lg)] p-5 md:p-6">
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
            {canSeeFull && (
              <>
                <InfoRow label="ชื่อจริง - นามสกุล">
                  {user.firstName || user.lastName
                    ? [user.firstName, user.lastName].filter(Boolean).join(" ")
                    : null}
                </InfoRow>
                <InfoRow label="อีเมล">{user.email || null}</InfoRow>
              </>
            )}
            <InfoRow label="Contact">{user.contact || null}</InfoRow>
            <InfoRow label="รุ่น Petra">{user.generation || null}</InfoRow>
            <InfoRow label="เครื่องดนตรีหลัก">
              {user.primaryInstrument?.nameThai || null}
            </InfoRow>
            <InfoRow label="เครื่องดนตรีที่เล่นเป็น">
              {user.secondaryInstruments.length > 0
                ? user.secondaryInstruments
                    .map((s) => s.instrument.nameThai)
                    .join(", ")
                : null}
            </InfoRow>
          </dl>
        </div>
      </section>

      {/* Performance history */}
      {canSeeFull && (
        <section>
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted mb-3">
            ประวัติการแสดง · Performance history
          </p>
          <div className="bg-surface-card border border-hairline rounded-[var(--radius-lg)] overflow-hidden">
            {performanceHistory.length === 0 ? (
              <p className="text-sm text-muted p-6">ยังไม่มีประวัติการแสดง</p>
            ) : (
              <ul className="divide-y divide-hairline-soft">
                {performanceHistory.map((p) => (
                  <li
                    key={p.id}
                    className="flex items-start justify-between gap-4 px-5 py-4"
                  >
                    <div className="min-w-0">
                      <Link
                        href={`/performances/${p.id}`}
                        className="text-sm font-semibold text-ink hover:text-primary transition-colors duration-[var(--duration-pb-base)] truncate block"
                      >
                        {p.name}
                      </Link>
                      <p className="text-xs text-muted mt-0.5">
                        {p.location && `${p.location} · `}
                        {p.firstDate
                          ? new Date(p.firstDate).toLocaleDateString("th-TH", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })
                          : "ยังไม่มีวันที่"}
                      </p>
                    </div>
                    <div className="flex flex-wrap justify-end gap-1 shrink-0">
                      {Array.from(p.instruments).map((inst) => (
                        <Badge key={inst} variant="pill">
                          {inst}
                        </Badge>
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      )}
    </div>
  );
}

function InfoRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-xs text-muted mb-1">{label}</dt>
      <dd className="text-ink">
        {children ?? <span className="text-muted-soft">ไม่ได้ระบุ</span>}
      </dd>
    </div>
  );
}
