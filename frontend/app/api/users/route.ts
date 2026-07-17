import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

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

  return NextResponse.json({ users });
}
