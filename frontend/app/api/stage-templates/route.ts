import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const templates = await prisma.stageTemplate.findMany({
    orderBy: { name: "asc" },
  });
  return NextResponse.json({ templates });
}

export async function POST(req: Request) {
  const session = await auth();
  if (session?.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { name, description, widthUnits, heightUnits, unitLabel, placementsJson, tags } = body as {
    name: string;
    description?: string;
    widthUnits: number;
    heightUnits: number;
    unitLabel: string;
    placementsJson: object[];
    tags?: string[];
  };

  const template = await prisma.stageTemplate.create({
    data: {
      name,
      description: description ?? null,
      widthUnits,
      heightUnits,
      unitLabel,
      placementsJson: placementsJson as object[],
      tags: tags ?? [],
      createdById: session.user.id,
    },
  });

  return NextResponse.json({ template }, { status: 201 });
}
