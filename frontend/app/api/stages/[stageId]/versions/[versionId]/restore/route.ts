import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canEditPerformance } from "@/lib/permissions";

type Params = { params: Promise<{ stageId: string; versionId: string }> };

type ItemSnapshot = {
  instrumentId: string;
  x: number;
  y: number;
  rotation: number;
  layerOrder: number;
  label: string;
};

export async function POST(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { stageId, versionId } = await params;
  const stageForPerm = await prisma.stageLayout.findUnique({ where: { id: stageId }, select: { performanceId: true } });
  if (!stageForPerm) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const allowed = await canEditPerformance(session.user.id, session.user.role, stageForPerm.performanceId);
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const version = await prisma.stageLayoutVersion.findUnique({
    where: { id: versionId },
  });

  if (!version || version.stageLayoutId !== stageId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const items = (version.snapshotJson ?? []) as ItemSnapshot[];

  const lastVersion = await prisma.stageLayoutVersion.findFirst({
    where: { stageLayoutId: stageId },
    orderBy: { createdAt: "desc" },
    select: { versionNumber: true },
  });
  const nextVersionNumber = (lastVersion?.versionNumber ?? 0) + 1;

  const [, , stage] = await prisma.$transaction([
    prisma.stageItem.deleteMany({ where: { stageLayoutId: stageId } }),
    prisma.stageLayoutVersion.create({
      data: {
        stageLayoutId: stageId,
        versionNumber: nextVersionNumber,
        snapshotJson: items,
        changeNote: `กู้คืนเวอร์ชัน #${version.versionNumber}`,
        createdById: session.user.id,
      },
    }),
    prisma.stageLayout.update({
      where: { id: stageId },
      data: {
        items: {
          create: items.map((item, idx) => ({
            instrumentId: item.instrumentId,
            x: item.x,
            y: item.y,
            rotation: item.rotation ?? 0,
            layerOrder: item.layerOrder ?? idx,
            label: item.label ?? "",
          })),
        },
      },
      include: {
        items: {
          include: {
            instrument: {
              select: {
                id: true,
                name: true,
                nameThai: true,
                footprintW: true,
                footprintH: true,
                iconType: true,
              },
            },
          },
          orderBy: { layerOrder: "asc" },
        },
      },
    }),
  ]);

  return NextResponse.json({ stage, restoredFromVersion: version.versionNumber });
}
