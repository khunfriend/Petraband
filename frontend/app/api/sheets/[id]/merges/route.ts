import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id: sheetId } = await params;

  const sheet = await prisma.sheet.findUnique({ where: { id: sheetId } });
  if (!sheet) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const mergedCells = await prisma.mergedCell.findMany({ where: { sheetId } });

  return NextResponse.json({ mergedCells });
}

const createSchema = z.object({
  startRow: z.number().int().min(0),
  startCol: z.number().int().min(0),
  endRow: z.number().int().min(0),
  endCol: z.number().int().min(0),
});

export async function POST(req: NextRequest, { params }: Params) {
  const { id: sheetId } = await params;
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sheet = await prisma.sheet.findUnique({ where: { id: sheetId } });
  if (!sheet) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง", details: parsed.error.flatten() }, { status: 400 });
  }

  const merge = await prisma.mergedCell.create({
    data: { sheetId, ...parsed.data },
  });

  return NextResponse.json({ merge }, { status: 201 });
}
