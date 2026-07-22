import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/Badge";
import ProfileForm from "./ProfileForm";

export default async function ProfilePage() {
  const session = await auth();
  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      nickname: true,
      firstName: true,
      lastName: true,
      avatarUrl: true,
      contact: true,
      generation: true,
      isTemporary: true,
      role: true,
      primaryInstrumentId: true,
      primaryInstrument: true,
      secondaryInstruments: { include: { instrument: true } },
      linkedPerformance: {
        select: {
          id: true,
          name: true,
          dates: { select: { date: true }, orderBy: { date: "asc" }, take: 1 },
        },
      },
    },
  });

  if (!user) redirect("/login");

  const performanceMembers = await prisma.performanceMember.findMany({
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
  });

  const instruments = await prisma.instrument.findMany({
    orderBy: { nameThai: "asc" },
    select: { id: true, name: true, nameThai: true },
  });

  return (
    <div className="w-full max-w-3xl mx-auto px-6 md:px-8 py-8 md:py-10 flex flex-col gap-8">
      {/* Hero — bone bg, no shadow */}
      <header className="bg-bone border border-hairline rounded-[var(--radius-lg)] p-6 md:p-8 flex items-center gap-5 flex-wrap">
        <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-surface-cream-strong border border-hairline overflow-hidden flex items-center justify-center text-2xl font-bold text-ink shrink-0">
          {user.avatarUrl ? (
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
            Profile · {user.role === "ADMIN" ? "Admin" : user.role === "HEAD" ? "Head" : "Member"}
          </p>
          <h1 className="mt-1 text-2xl md:text-3xl font-bold text-ink leading-tight truncate">
            {user.nickname}
            {(user.firstName || user.lastName) && (
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
                {user.linkedPerformance && ` · ${user.linkedPerformance.name}`}
              </Badge>
            )}
          </div>
        </div>
      </header>

      {/* Form section */}
      <section>
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted mb-3">
          แก้ไขโปรไฟล์ · Edit
        </p>
        <ProfileForm
          user={{
            id: user.id,
            nickname: user.nickname,
            firstName: user.firstName,
            lastName: user.lastName,
            avatarUrl: user.avatarUrl,
            contact: user.contact,
            generation: user.generation,
            isTemporary: user.isTemporary,
            email: user.email,
            primaryInstrumentId: user.primaryInstrumentId,
            secondaryInstrumentIds: user.secondaryInstruments.map(
              (s) => s.instrumentId
            ),
          }}
          instruments={instruments}
        />
      </section>

      {/* Performance history */}
      <section>
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted mb-3">
          ประวัติการแสดง · Performance history
        </p>
        <div className="bg-surface-card border border-hairline rounded-[var(--radius-lg)] overflow-hidden">
          {performanceMembers.length === 0 ? (
            <p className="text-sm text-muted p-6">ยังไม่มีประวัติการแสดง</p>
          ) : (
            <ul className="divide-y divide-hairline-soft">
              {performanceMembers.map((m) => {
                const firstDate = m.performance.dates[0]?.date;
                return (
                  <li
                    key={m.id}
                    className="flex items-start justify-between gap-4 px-5 py-4"
                  >
                    <div className="min-w-0">
                      <Link
                        href={`/performances/${m.performance.id}`}
                        className="text-sm font-semibold text-ink hover:text-primary transition-colors duration-[var(--duration-pb-base)] truncate block"
                      >
                        {m.performance.name}
                      </Link>
                      <p className="text-xs text-muted mt-0.5">
                        {m.performance.location && `${m.performance.location} · `}
                        {firstDate
                          ? new Date(firstDate).toLocaleDateString("th-TH", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })
                          : "ยังไม่มีวันที่"}
                      </p>
                    </div>
                    {m.position && (
                      <Badge variant="pill">{m.position}</Badge>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
