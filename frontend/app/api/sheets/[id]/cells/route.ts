import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

type Params = { params: Promise<{ id: string }> };

const cellSchema = z.object({
  rowIndex: z.number().int().min(0),
  colIndex: z.number().int().min(0),
  cellValue: z.string().nullable().optional(),
});

const patchSchema = z.object({
  cells: z.array(cellSchema).min(1),
});

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id: sheetId } = await params;
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sheet = await prisma.sheet.findUnique({ where: { id: sheetId } });
  if (!sheet) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง", details: parsed.error.flatten() }, { status: 400 });
  }

  const upserts = parsed.data.cells.map((cell) =>
    prisma.cell.upsert({
      where: {
        sheetId_rowIndex_colIndex: {
          sheetId,
          rowIndex: cell.rowIndex,
          colIndex: cell.colIndex,
        },
      },
      update: { cellValue: cell.cellValue ?? null },
      create: {
        sheetId,
        rowIndex: cell.rowIndex,
        colIndex: cell.colIndex,
        cellValue: cell.cellValue ?? null,
      },
    })
  );

  const cells = await prisma.$transaction(upserts);

  return NextResponse.json({ cells });
}
