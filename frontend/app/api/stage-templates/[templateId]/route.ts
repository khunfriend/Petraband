import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ templateId: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { templateId } = await params;

  const template = await prisma.stageTemplate.findUnique({
    where: { id: templateId },
  });

  if (!template) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ template });
}

export async function PUT(req: Request, { params }: Params) {
  const session = await auth();
  if (session?.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { templateId } = await params;
  const body = await req.json();
  const { name, description, widthUnits, heightUnits, unitLabel, placementsJson, tags } = body as {
    name?: string;
    description?: string;
    widthUnits?: number;
    heightUnits?: number;
    unitLabel?: string;
    placementsJson?: object[];
    tags?: string[];
  };

  const template = await prisma.stageTemplate.update({
    where: { id: templateId },
    data: {
      ...(name !== undefined && { name }),
      ...(description !== undefined && { description }),
      ...(widthUnits !== undefined && { widthUnits }),
      ...(heightUnits !== undefined && { heightUnits }),
      ...(unitLabel !== undefined && { unitLabel }),
      ...(placementsJson !== undefined && { placementsJson }),
      ...(tags !== undefined && { tags }),
    },
  });

  return NextResponse.json({ template });
}

export async function DELETE(_req: Request, { params }: Params) {
  const session = await auth();
  if (session?.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { templateId } = await params;
  await prisma.stageTemplate.delete({ where: { id: templateId } });

  return NextResponse.json({ ok: true });
}
