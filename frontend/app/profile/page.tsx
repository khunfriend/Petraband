import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import Image from "next/image";
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
      linkedPerformance: { select: { id: true, name: true, dates: { select: { date: true }, orderBy: { date: "asc" }, take: 1 } } },
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
    <div className="max-w-2xl mx-auto flex flex-col gap-6 py-4">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-surface-cream-strong border border-hairline overflow-hidden flex items-center justify-center text-xl font-bold text-ink shrink-0">
          {user.avatarUrl ? (
            <Image src={user.avatarUrl} alt={user.nickname} width={56} height={56} className="object-cover w-full h-full" />
          ) : (
            user.nickname.charAt(0).toUpperCase()
          )}
        </div>
        <div>
          <h1 className="text-xl font-bold text-ink">
            {user.nickname}
            {(user.firstName || user.lastName) && (
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
                {user.linkedPerformance && ` · ${user.linkedPerformance.name}`}
              </Badge>
            )}
            <Badge variant="coral">{user.role}</Badge>
          </div>
        </div>
      </div>

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
          secondaryInstrumentIds: user.secondaryInstruments.map((s) => s.instrumentId),
        }}
        instruments={instruments}
      />

      <Card>
        <h2 className="text-base font-semibold text-ink mb-4">ประวัติการแสดง</h2>
        {performanceMembers.length === 0 ? (
          <p className="text-sm text-muted">ยังไม่มีประวัติการแสดง</p>
        ) : (
          <div className="flex flex-col gap-3">
            {performanceMembers.map((m) => {
              const firstDate = m.performance.dates[0]?.date;
              return (
                <div
                  key={m.id}
                  className="flex items-start justify-between gap-4 py-2 border-b border-hairline-soft last:border-0"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink truncate">{m.performance.name}</p>
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
                  {m.position && <Badge variant="pill">{m.position}</Badge>}
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
