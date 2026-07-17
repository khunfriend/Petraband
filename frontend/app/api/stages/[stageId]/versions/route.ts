import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ stageId: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { stageId } = await params;

  const versions = await prisma.stageLayoutVersion.findMany({
    where: { stageLayoutId: stageId },
    orderBy: { createdAt: "desc" },
    include: {
      createdBy: { select: { nickname: true } },
    },
  });

  return NextResponse.json({ versions });
}
