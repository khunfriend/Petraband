import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

type Params = { params: Promise<{ id: string }> };

const putSchema = z.object({
  rowIndex: z.number().int().min(0),
  side: z.enum(["left", "right"]),
  text: z.string().max(100),
});

// Same access as the other sheet edit routes (rows, columns, cells).
export async function PUT(req: NextRequest, { params }: Params) {
  const { id: sheetId } = await params;
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sheet = await prisma.sheet.findUnique({ where: { id: sheetId }, select: { rowCount: true } });
  if (!sheet) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const parsed = putSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  const { rowIndex, side, text } = parsed.data;
  if (rowIndex >= sheet.rowCount) return NextResponse.json({ error: "แถวเกินขอบเขต" }, { status: 400 });

  const field = side === "left" ? "leftText" : "rightText";
  const value = text.trim();
  const note = await prisma.rowNote.upsert({
    where: { sheetId_rowIndex: { sheetId, rowIndex } },
    update: { [field]: value },
    create: { sheetId, rowIndex, [field]: value },
  });
  // Keep the table sparse: a row with no notes left has no record.
  if (!note.leftText && !note.rightText) {
    await prisma.rowNote.delete({ where: { sheetId_rowIndex: { sheetId, rowIndex } } });
  }
  return NextResponse.json({ ok: true, note: { rowIndex, leftText: note.leftText, rightText: note.rightText } });
}
