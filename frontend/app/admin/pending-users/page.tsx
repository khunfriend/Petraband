import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import PendingUsersClient from "./PendingUsersClient";

export const dynamic = "force-dynamic";

export default async function PendingUsersPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/");

  const users = await prisma.user.findMany({
    where: { status: "PENDING_APPROVAL" },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      email: true,
      nickname: true,
      generation: true,
      createdAt: true,
      emailVerifiedAt: true,
    },
  });

  return (
    <div className="max-w-[900px] mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold text-ink">อนุมัติสมาชิกใหม่</h1>
      <p className="mt-1 text-sm text-muted">
        สมาชิกที่ยืนยันอีเมลแล้ว รอการอนุมัติจาก admin
      </p>
      <div className="mt-6">
        <PendingUsersClient
          users={users.map((u) => ({
            ...u,
            createdAt: u.createdAt.toISOString(),
            emailVerifiedAt: u.emailVerifiedAt?.toISOString() ?? null,
          }))}
        />
      </div>
    </div>
  );
}
