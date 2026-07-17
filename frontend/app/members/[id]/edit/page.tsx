import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import ProfileForm from "@/app/profile/ProfileForm";

export default async function MemberEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role !== "ADMIN") notFound();

  const { id } = await params;

  const [user, instruments] = await Promise.all([
    prisma.user.findUnique({
      where: { id },
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
        primaryInstrumentId: true,
        secondaryInstruments: { select: { instrumentId: true } },
      },
    }),
    prisma.instrument.findMany({
      orderBy: { nameThai: "asc" },
      select: { id: true, name: true, nameThai: true },
    }),
  ]);

  if (!user) notFound();

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-4 py-4 px-8">
      <Link href={`/members/${user.id}`} className="text-sm text-muted hover:text-coral">
        ← กลับหน้าโปรไฟล์
      </Link>
      <h1 className="text-xl font-bold text-ink">แก้ไขโปรไฟล์ · {user.nickname}</h1>
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
    </div>
  );
}
