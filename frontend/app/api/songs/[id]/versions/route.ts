import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const versions = await prisma.songVersion.findMany({
    where: { songId: id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      message: true,
      duration: true,
      createdAt: true,
      createdBy: { select: { nickname: true } },
    },
  });
  return NextResponse.json({ versions });
}
