import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canEditPerformance } from "@/lib/permissions";

type Params = { params: Promise<{ stageId: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { stageId } = await params;

  const stage = await prisma.stageLayout.findUnique({
    where: { id: stageId },
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
  });

  if (!stage) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ stage });
}

export async function PUT(req: Request, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { stageId } = await params;
  const stageForPerm = await prisma.stageLayout.findUnique({ where: { id: stageId }, select: { performanceId: true } });
  if (!stageForPerm) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const allowed = await canEditPerformance(session.user.id, session.user.role, stageForPerm.performanceId);
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json();
  const { name, widthUnits, heightUnits, unitLabel } = body as {
    name?: string;
    widthUnits?: number;
    heightUnits?: number;
    unitLabel?: string;
  };

  const stage = await prisma.stageLayout.update({
    where: { id: stageId },
    data: {
      ...(name !== undefined && { name }),
      ...(widthUnits !== undefined && { widthUnits }),
      ...(heightUnits !== undefined && { heightUnits }),
      ...(unitLabel !== undefined && { unitLabel }),
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
  });

  return NextResponse.json({ stage });
}

export async function DELETE(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { stageId } = await params;
  const stageForPerm = await prisma.stageLayout.findUnique({ where: { id: stageId }, select: { performanceId: true } });
  if (!stageForPerm) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const allowed = await canEditPerformance(session.user.id, session.user.role, stageForPerm.performanceId);
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.stageLayout.delete({ where: { id: stageId } });

  return NextResponse.json({ ok: true });
}
