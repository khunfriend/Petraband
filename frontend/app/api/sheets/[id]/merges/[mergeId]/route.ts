import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string; mergeId: string }> };

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id: sheetId, mergeId } = await params;
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const merge = await prisma.mergedCell.findUnique({ where: { id: mergeId } });
  if (!merge || merge.sheetId !== sheetId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.mergedCell.delete({ where: { id: mergeId } });

  return NextResponse.json({ success: true });
}
