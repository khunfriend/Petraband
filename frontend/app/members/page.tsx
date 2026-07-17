import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import MembersClient from "./MembersClient";

export default async function MembersPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const isAdmin = session.user.role === "ADMIN";

  // All authenticated users can view the member list; only admin sees role controls
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      nickname: true,
      generation: true,
      role: true,
      primaryInstrument: { select: { id: true, name: true, nameThai: true } },
    },
    orderBy: { nickname: "asc" },
  });

  return (
    <div className="w-full max-w-[1200px] mx-auto px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-ink">สมาชิก</h1>
        <span className="text-sm text-muted">{users.length} คน</span>
      </div>

      {isAdmin && (
        <p className="text-sm text-muted mb-4">
          คลิกปุ่มเพื่อเปลี่ยน Role ของสมาชิก (ไม่สามารถเปลี่ยน Role ของตัวเองได้)
        </p>
      )}

      <MembersClient
        initialUsers={users}
        currentUserId={session.user.id}
        isAdmin={isAdmin}
      />
    </div>
  );
}
