import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

// PATCH: update single cell in sheetData (micro-adjust)
export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const { sheetData } = await req.json();

  if (!sheetData) {
    return NextResponse.json({ error: "sheetData required" }, { status: 400 });
  }

  const song = await prisma.song.update({
    where: { id },
    data: { sheetData },
    select: { id: true, sheetData: true, updatedAt: true },
  });

  return NextResponse.json({ song });
}
