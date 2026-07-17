import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;

  const sheet = await prisma.sheet.findUnique({
    where: { id },
    include: {
      cells: {
        include: { style: true },
      },
      mergedCells: true,
      columnWidths: { orderBy: { colIndex: "asc" } },
      rowHeights: { orderBy: { rowIndex: "asc" } },
    },
  });

  if (!sheet) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ sheet });
}

const patchSchema = z.object({
  name: z.string().min(1).optional(),
  sheetOrder: z.number().int().min(0).optional(),
  columnCount: z.number().int().min(1).max(100).optional(),
  rowCount: z.number().int().min(1).max(500).optional(),
  isPublished: z.boolean().optional(),
});

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sheet = await prisma.sheet.findUnique({ where: { id } });
  if (!sheet) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง", details: parsed.error.flatten() }, { status: 400 });
  }

  const updated = await prisma.sheet.update({
    where: { id },
    data: parsed.data,
  });

  return NextResponse.json({ sheet: updated });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sheet = await prisma.sheet.findUnique({ where: { id } });
  if (!sheet) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.sheet.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
