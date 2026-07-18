import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canEditPerformance } from "@/lib/permissions";

type Params = { params: Promise<{ stageId: string }> };

type ItemInput = {
  instrumentId: string | null;
  x: number;
  y: number;
  rotation: number;
  layerOrder: number;
  label: string;
  customName?: string | null;
  customWidth?: number | null;
  customHeight?: number | null;
};

export async function POST(req: Request, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { stageId } = await params;
  const stageForPerm = await prisma.stageLayout.findUnique({ where: { id: stageId }, select: { performanceId: true } });
  if (!stageForPerm) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const allowed = await canEditPerformance(session.user.id, session.user.role, stageForPerm.performanceId);
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json();
  const { items, changeNote } = body as {
    items: ItemInput[];
    changeNote?: string;
  };

  // Get current max version number
  const lastVersion = await prisma.stageLayoutVersion.findFirst({
    where: { stageLayoutId: stageId },
    orderBy: { createdAt: "desc" },
    select: { versionNumber: true },
  });
  const nextVersionNumber = (lastVersion?.versionNumber ?? 0) + 1;

  // Replace all items and create new version in a transaction
  const [, version, stage] = await prisma.$transaction([
    prisma.stageItem.deleteMany({ where: { stageLayoutId: stageId } }),
    prisma.stageLayoutVersion.create({
      data: {
        stageLayoutId: stageId,
        versionNumber: nextVersionNumber,
        snapshotJson: items,
        changeNote: changeNote ?? undefined,
        createdById: session.user.id,
      },
    }),
    prisma.stageLayout.update({
      where: { id: stageId },
      data: {
        items: {
          create: items.map((item, idx) => ({
            instrumentId: item.instrumentId ?? null,
            x: item.x,
            y: item.y,
            rotation: item.rotation ?? 0,
            layerOrder: item.layerOrder ?? idx,
            label: item.label ?? "",
            customName: item.customName ?? null,
            customWidth: item.customWidth ?? null,
            customHeight: item.customHeight ?? null,
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
        versions: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { versionNumber: true, createdAt: true },
        },
      },
    }),
  ]);

  return NextResponse.json({ stage, version });
}
