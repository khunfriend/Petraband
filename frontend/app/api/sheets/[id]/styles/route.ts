import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

type Params = { params: Promise<{ id: string }> };

const styleSchema = z.object({
  rowIndex: z.number().int().min(0),
  colIndex: z.number().int().min(0),
  fontFamily: z.string().optional(),
  fontSize: z.number().int().min(1).max(200).optional(),
  isBold: z.boolean().optional(),
  isItalic: z.boolean().optional(),
  isUnderline: z.boolean().optional(),
  textAlign: z.enum(["left", "center", "right"]).optional(),
  textColor: z.string().optional(),
  highlightColor: z.string().nullable().optional(),
});

const patchSchema = z.object({
  styles: z.array(styleSchema).min(1),
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

  const styles: unknown[] = [];

  // Process sequentially to ensure cell exists before upserting style
  for (const { rowIndex, colIndex, ...styleData } of parsed.data.styles) {
    const cell = await prisma.cell.upsert({
      where: { sheetId_rowIndex_colIndex: { sheetId, rowIndex, colIndex } },
      update: {},
      create: { sheetId, rowIndex, colIndex },
    });

    const style = await prisma.cellStyle.upsert({
      where: { cellId: cell.id },
      update: styleData,
      create: { cellId: cell.id, ...styleData },
    });

    styles.push(style);
  }

  return NextResponse.json({ styles });
}
