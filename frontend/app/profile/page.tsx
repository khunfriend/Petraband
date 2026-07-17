import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import ProfileForm from "./ProfileForm";

export default async function ProfilePage() {
  const session = await auth();
  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      primaryInstrument: true,
      secondaryInstrument: true,
    },
  });

  if (!user) redirect("/login");

  const assignments = await prisma.songAssignment.findMany({
    where: { userId: user.id },
    include: {
      performanceSong: {
        include: {
          song: true,
          performance: true,
        },
      },
      instrument: true,
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const instruments = await prisma.instrument.findMany({
    orderBy: { nameThai: "asc" },
    select: { id: true, name: true, nameThai: true },
  });

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6 py-4">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-surface-cream-strong border border-hairline flex items-center justify-center text-lg font-bold text-ink">
          {user.nickname.charAt(0).toUpperCase()}
        </div>
        <div>
          <h1 className="text-xl font-bold text-ink">{user.nickname}</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <Badge variant="pill">{user.generation}</Badge>
            <Badge variant="coral">{user.role}</Badge>
          </div>
        </div>
      </div>

      <ProfileForm
        user={{
          id: user.id,
          nickname: user.nickname,
          generation: user.generation,
          email: user.email,
          primaryInstrumentId: user.primaryInstrumentId,
          secondaryInstrumentId: user.secondaryInstrumentId,
        }}
        instruments={instruments}
      />

      <Card>
        <h2 className="text-base font-semibold text-ink mb-4">ประวัติการแสดง</h2>
        {assignments.length === 0 ? (
          <p className="text-sm text-muted">ยังไม่มีประวัติการแสดง</p>
        ) : (
          <div className="flex flex-col gap-3">
            {assignments.map((a: typeof assignments[number]) => (
              <div
                key={a.id}
                className="flex items-start justify-between gap-4 py-2 border-b border-hairline-soft last:border-0"
              >
                <div>
                  <p className="text-sm font-medium text-ink">
                    {a.performanceSong.song.title}
                  </p>
                  <p className="text-xs text-muted mt-0.5">
                    {a.performanceSong.performance.name}
                  </p>
                </div>
                <Badge variant="pill">{a.instrument.nameThai}</Badge>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
