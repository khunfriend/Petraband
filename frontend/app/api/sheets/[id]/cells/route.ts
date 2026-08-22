import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

type Params = { params: Promise<{ id: string }> };

const runSchema = z.object({
  text: z.string(),
  fontSize: z.number().int().min(1).max(200).optional(),
  isBold: z.boolean().optional(),
  isItalic: z.boolean().optional(),
  isUnderline: z.boolean().optional(),
  textColor: z.string().optional(),
});

const cellSchema = z.object({
  rowIndex: z.number().int().min(0),
  colIndex: z.number().int().min(0),
  cellValue: z.string().nullable().optional(),
  richValue: z.array(runSchema).nullable().optional(),
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

  // Bulk upsert in a single SQL statement — Prisma's per-row upsert
  // is O(N) round-trips and times out for large pastes.
  const values = parsed.data.cells.map((c) => {
    const richJson = c.richValue == null ? null : JSON.stringify(c.richValue);
    return Prisma.sql`(${randomUUID()}, ${sheetId}, ${c.rowIndex}, ${c.colIndex}, ${
      c.cellValue ?? null
    }, ${richJson}::jsonb)`;
  });

  await prisma.$executeRaw`
    INSERT INTO "Cell" ("id", "sheetId", "rowIndex", "colIndex", "cellValue", "richValue")
    VALUES ${Prisma.join(values)}
    ON CONFLICT ("sheetId", "rowIndex", "colIndex")
    DO UPDATE SET
      "cellValue" = EXCLUDED."cellValue",
      "richValue" = EXCLUDED."richValue"
  `;

  return NextResponse.json({ ok: true });
}
