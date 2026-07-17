import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canEditPerformance } from "@/lib/permissions";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { id: performanceId } = await params;

  const stages = await prisma.stageLayout.findMany({
    where: { performanceId },
    include: {
      _count: { select: { versions: true, items: true } },
      versions: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { createdAt: true, versionNumber: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ stages });
}

export async function POST(req: Request, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id: performanceId } = await params;
  const allowed = await canEditPerformance(session.user.id, session.user.role, performanceId);
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json();
  const { name, widthUnits, heightUnits, unitLabel, templateId } = body as {
    name: string;
    widthUnits: number;
    heightUnits: number;
    unitLabel: string;
    templateId?: string;
  };

  let initialItems: Array<{
    instrumentId: string;
    x: number;
    y: number;
    rotation: number;
    layerOrder: number;
    label: string;
  }> = [];

  if (templateId) {
    const template = await prisma.stageTemplate.findUnique({
      where: { id: templateId },
    });
    if (template?.placementsJson) {
      initialItems = template.placementsJson as typeof initialItems;
    }
  }

  const stage = await prisma.stageLayout.create({
    data: {
      performanceId,
      name,
      widthUnits,
      heightUnits,
      unitLabel,
      items: {
        create: initialItems.map((item, idx) => ({
          instrumentId: item.instrumentId,
          x: item.x,
          y: item.y,
          rotation: item.rotation ?? 0,
          layerOrder: item.layerOrder ?? idx,
          label: item.label ?? "",
        })),
      },
      versions: {
        create: {
          versionNumber: 1,
          snapshotJson: initialItems,
          changeNote: "สร้างผังเวที",
          createdById: session.user.id,
        },
      },
    },
    include: {
      _count: { select: { versions: true, items: true } },
      versions: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { createdAt: true, versionNumber: true },
      },
    },
  });

  return NextResponse.json({ stage }, { status: 201 });
}
