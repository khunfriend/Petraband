import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

type Params = { params: Promise<{ id: string }> };

const rowSchema = z.object({
  rowIndex: z.number().int().min(0),
  heightPx: z.number().int().min(1).max(2000),
});

const patchSchema = z.object({
  rows: z.array(rowSchema).min(1),
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

  const upserts = parsed.data.rows.map((row) =>
    prisma.rowHeight.upsert({
      where: { sheetId_rowIndex: { sheetId, rowIndex: row.rowIndex } },
      update: { heightPx: row.heightPx },
      create: { sheetId, rowIndex: row.rowIndex, heightPx: row.heightPx },
    })
  );

  const rows = await prisma.$transaction(upserts);

  return NextResponse.json({ rows });
}
