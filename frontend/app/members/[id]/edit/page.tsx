import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
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
    <div className="w-full max-w-3xl mx-auto px-6 md:px-8 py-8 md:py-10 flex flex-col gap-8">
      <nav
        aria-label="breadcrumb"
        className="flex items-center gap-1.5 text-xs text-muted"
      >
        <Link
          href="/members"
          className="hover:text-ink transition-colors duration-[var(--duration-pb-base)]"
        >
          สมาชิก
        </Link>
        <ChevronRight size={12} strokeWidth={1.75} className="text-muted-soft" />
        <Link
          href={`/members/${user.id}`}
          className="hover:text-ink transition-colors duration-[var(--duration-pb-base)] inline-flex items-center gap-1"
        >
          <ArrowLeft size={12} strokeWidth={1.75} />
          {user.nickname}
        </Link>
        <ChevronRight size={12} strokeWidth={1.75} className="text-muted-soft" />
        <span className="text-ink font-medium">แก้ไข</span>
      </nav>

      <PageHeader
        eyebrow="Edit · แก้ไขโปรไฟล์"
        title={user.nickname}
        description="แก้ไขข้อมูลสมาชิก"
      />

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
    </div>
  );
}
