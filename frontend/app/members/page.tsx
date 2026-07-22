import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import MembersClient from "./MembersClient";

export default async function MembersPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const isAdmin = session.user.role === "ADMIN";
  const isHead = session.user.role === "HEAD";

  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isTemporary: true },
  });
  const isTemp = currentUser?.isTemporary === true;

  const [users, instruments, upcomingPerformances] = await Promise.all([
    prisma.user.findMany({
      where: {
        // Non-admin sees only ACTIVE; Admin can toggle via UI (fetches EXPIRED separately via API)
        ...(!isAdmin && { status: "ACTIVE" }),
        // Temp accounts see only Head/Admin — hide regular members and other temps
        ...(isTemp && { role: { in: ["HEAD", "ADMIN"] } }),
      },
      select: {
        id: true,
        nickname: true,
        generation: true,
        role: true,
        status: true,
        isTemporary: true,
        contact: true,
        primaryInstrument: { select: { id: true, name: true, nameThai: true } },
        secondaryInstruments: {
          select: { instrument: { select: { id: true, nameThai: true } } },
        },
        // Admin/Head see additional identifying fields; Member sees only public fields
        ...((isAdmin || isHead) && { email: true, firstName: true, lastName: true }),
      },
      orderBy: [{ status: "asc" }, { nickname: "asc" }],
    }),
    isAdmin
      ? prisma.instrument.findMany({
          orderBy: { nameThai: "asc" },
          select: { id: true, nameThai: true, name: true },
        })
      : Promise.resolve([]),
    isAdmin
      ? prisma.performance.findMany({
          where: { dates: { some: { date: { gte: new Date() } } } },
          select: {
            id: true,
            name: true,
            dates: { select: { date: true }, orderBy: { date: "asc" }, take: 1 },
          },
          orderBy: { createdAt: "desc" },
        })
      : Promise.resolve([]),
  ]);

  return (
    <div className="w-full max-w-[1200px] mx-auto px-6 md:px-8 py-8 md:py-10">
      <MembersClient
        initialUsers={users}
        currentUserId={session.user.id}
        isAdmin={isAdmin}
        isHead={isHead}
        instruments={instruments}
        upcomingPerformances={upcomingPerformances.map((p) => ({
          id: p.id,
          name: p.name,
          firstDate: p.dates[0]?.date.toISOString() ?? null,
        }))}
      />
    </div>
  );
}
