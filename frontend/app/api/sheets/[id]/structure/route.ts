import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

type Params = { params: Promise<{ id: string }> };

const bodySchema = z.object({
  axis: z.enum(["row", "col"]),
  op: z.enum(["insert", "delete"]),
  at: z.number().int().min(0),
});

// Cell and RowHeight/ColumnWidth are keyed on their coordinate, so a plain
// `index = index + 1` collides with the neighbour mid-statement. Everything is
// parked above this offset first and brought back in a second pass.
const PARK = 1_000_000;

export async function POST(req: NextRequest, { params }: Params) {
  const { id: sheetId } = await params;
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sheet = await prisma.sheet.findUnique({ where: { id: sheetId } });
  if (!sheet) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }
  const { axis, op, at } = parsed.data;

  const isRow = axis === "row";
  const count = isRow ? sheet.rowCount : sheet.columnCount;
  if (op === "delete" && count <= 1) {
    return NextResponse.json({ error: "ต้องเหลืออย่างน้อย 1 แถว/คอลัมน์" }, { status: 400 });
  }
  if (at >= count + (op === "insert" ? 1 : 0)) {
    return NextResponse.json({ error: "ตำแหน่งเกินขอบเขต" }, { status: 400 });
  }

  await prisma.$transaction(async (tx) => {
    if (isRow) {
      if (op === "delete") {
        await tx.$executeRaw`DELETE FROM "Cell" WHERE "sheetId" = ${sheetId} AND "rowIndex" = ${at}`;
        await tx.$executeRaw`UPDATE "Cell" SET "rowIndex" = "rowIndex" + ${PARK} WHERE "sheetId" = ${sheetId} AND "rowIndex" > ${at}`;
        await tx.$executeRaw`UPDATE "Cell" SET "rowIndex" = "rowIndex" - ${PARK + 1} WHERE "sheetId" = ${sheetId} AND "rowIndex" >= ${PARK}`;

        await tx.$executeRaw`DELETE FROM "RowHeight" WHERE "sheetId" = ${sheetId} AND "rowIndex" = ${at}`;
        await tx.$executeRaw`UPDATE "RowHeight" SET "rowIndex" = "rowIndex" + ${PARK} WHERE "sheetId" = ${sheetId} AND "rowIndex" > ${at}`;
        await tx.$executeRaw`UPDATE "RowHeight" SET "rowIndex" = "rowIndex" - ${PARK + 1} WHERE "sheetId" = ${sheetId} AND "rowIndex" >= ${PARK}`;

        // A merge sitting entirely on this row goes; one spanning it shrinks.
        await tx.$executeRaw`DELETE FROM "MergedCell" WHERE "sheetId" = ${sheetId} AND "startRow" = ${at} AND "endRow" = ${at}`;
        await tx.$executeRaw`UPDATE "MergedCell" SET "endRow" = "endRow" - 1 WHERE "sheetId" = ${sheetId} AND "startRow" <= ${at} AND "endRow" >= ${at}`;
        await tx.$executeRaw`UPDATE "MergedCell" SET "startRow" = "startRow" - 1, "endRow" = "endRow" - 1 WHERE "sheetId" = ${sheetId} AND "startRow" > ${at}`;

        await tx.sheet.update({ where: { id: sheetId }, data: { rowCount: count - 1 } });
      } else {
        await tx.$executeRaw`UPDATE "Cell" SET "rowIndex" = "rowIndex" + ${PARK} WHERE "sheetId" = ${sheetId} AND "rowIndex" >= ${at}`;
        await tx.$executeRaw`UPDATE "Cell" SET "rowIndex" = "rowIndex" - ${PARK - 1} WHERE "sheetId" = ${sheetId} AND "rowIndex" >= ${PARK}`;

        await tx.$executeRaw`UPDATE "RowHeight" SET "rowIndex" = "rowIndex" + ${PARK} WHERE "sheetId" = ${sheetId} AND "rowIndex" >= ${at}`;
        await tx.$executeRaw`UPDATE "RowHeight" SET "rowIndex" = "rowIndex" - ${PARK - 1} WHERE "sheetId" = ${sheetId} AND "rowIndex" >= ${PARK}`;

        await tx.$executeRaw`UPDATE "MergedCell" SET "endRow" = "endRow" + 1 WHERE "sheetId" = ${sheetId} AND "startRow" < ${at} AND "endRow" >= ${at}`;
        await tx.$executeRaw`UPDATE "MergedCell" SET "startRow" = "startRow" + 1, "endRow" = "endRow" + 1 WHERE "sheetId" = ${sheetId} AND "startRow" >= ${at}`;

        await tx.sheet.update({ where: { id: sheetId }, data: { rowCount: count + 1 } });
      }
    } else {
      if (op === "delete") {
        await tx.$executeRaw`DELETE FROM "Cell" WHERE "sheetId" = ${sheetId} AND "colIndex" = ${at}`;
        await tx.$executeRaw`UPDATE "Cell" SET "colIndex" = "colIndex" + ${PARK} WHERE "sheetId" = ${sheetId} AND "colIndex" > ${at}`;
        await tx.$executeRaw`UPDATE "Cell" SET "colIndex" = "colIndex" - ${PARK + 1} WHERE "sheetId" = ${sheetId} AND "colIndex" >= ${PARK}`;

        await tx.$executeRaw`DELETE FROM "ColumnWidth" WHERE "sheetId" = ${sheetId} AND "colIndex" = ${at}`;
        await tx.$executeRaw`UPDATE "ColumnWidth" SET "colIndex" = "colIndex" + ${PARK} WHERE "sheetId" = ${sheetId} AND "colIndex" > ${at}`;
        await tx.$executeRaw`UPDATE "ColumnWidth" SET "colIndex" = "colIndex" - ${PARK + 1} WHERE "sheetId" = ${sheetId} AND "colIndex" >= ${PARK}`;

        await tx.$executeRaw`DELETE FROM "MergedCell" WHERE "sheetId" = ${sheetId} AND "startCol" = ${at} AND "endCol" = ${at}`;
        await tx.$executeRaw`UPDATE "MergedCell" SET "endCol" = "endCol" - 1 WHERE "sheetId" = ${sheetId} AND "startCol" <= ${at} AND "endCol" >= ${at}`;
        await tx.$executeRaw`UPDATE "MergedCell" SET "startCol" = "startCol" - 1, "endCol" = "endCol" - 1 WHERE "sheetId" = ${sheetId} AND "startCol" > ${at}`;

        await tx.sheet.update({ where: { id: sheetId }, data: { columnCount: count - 1 } });
      } else {
        await tx.$executeRaw`UPDATE "Cell" SET "colIndex" = "colIndex" + ${PARK} WHERE "sheetId" = ${sheetId} AND "colIndex" >= ${at}`;
        await tx.$executeRaw`UPDATE "Cell" SET "colIndex" = "colIndex" - ${PARK - 1} WHERE "sheetId" = ${sheetId} AND "colIndex" >= ${PARK}`;

        await tx.$executeRaw`UPDATE "ColumnWidth" SET "colIndex" = "colIndex" + ${PARK} WHERE "sheetId" = ${sheetId} AND "colIndex" >= ${at}`;
        await tx.$executeRaw`UPDATE "ColumnWidth" SET "colIndex" = "colIndex" - ${PARK - 1} WHERE "sheetId" = ${sheetId} AND "colIndex" >= ${PARK}`;

        await tx.$executeRaw`UPDATE "MergedCell" SET "endCol" = "endCol" + 1 WHERE "sheetId" = ${sheetId} AND "startCol" < ${at} AND "endCol" >= ${at}`;
        await tx.$executeRaw`UPDATE "MergedCell" SET "startCol" = "startCol" + 1, "endCol" = "endCol" + 1 WHERE "sheetId" = ${sheetId} AND "startCol" >= ${at}`;

        await tx.sheet.update({ where: { id: sheetId }, data: { columnCount: count + 1 } });
      }
    }
  });

  const merges = await prisma.mergedCell.findMany({
    where: { sheetId },
    select: { id: true, startRow: true, startCol: true, endRow: true, endCol: true },
  });
  return NextResponse.json({ ok: true, merges });
}
