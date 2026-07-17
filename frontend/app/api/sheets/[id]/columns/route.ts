import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

type Params = { params: Promise<{ id: string }> };

const columnSchema = z.object({
  colIndex: z.number().int().min(0),
  widthPx: z.number().int().min(1).max(2000),
});

const patchSchema = z.object({
  columns: z.array(columnSchema).min(1),
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

  const upserts = parsed.data.columns.map((col) =>
    prisma.columnWidth.upsert({
      where: { sheetId_colIndex: { sheetId, colIndex: col.colIndex } },
      update: { widthPx: col.widthPx },
      create: { sheetId, colIndex: col.colIndex, widthPx: col.widthPx },
    })
  );

  const columns = await prisma.$transaction(upserts);

  return NextResponse.json({ columns });
}
