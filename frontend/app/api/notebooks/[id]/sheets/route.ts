import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

type Params = { params: Promise<{ id: string }> };

const createSheetSchema = z.object({
  name: z.string().min(1).default("Sheet1"),
  columnCount: z.number().int().min(1).max(100).default(8),
  rowCount: z.number().int().min(1).max(500).default(20),
});

export async function POST(req: NextRequest, { params }: Params) {
  const { id: notebookId } = await params;
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const notebook = await prisma.notebook.findUnique({
    where: { id: notebookId },
    include: { _count: { select: { sheets: true } } },
  });
  if (!notebook) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const parsed = createSheetSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง", details: parsed.error.flatten() }, { status: 400 });
  }

  const sheetOrder = notebook._count.sheets;

  const sheet = await prisma.sheet.create({
    data: {
      notebookId,
      name: parsed.data.name,
      columnCount: parsed.data.columnCount,
      rowCount: parsed.data.rowCount,
      sheetOrder,
    },
  });

  return NextResponse.json({ sheet }, { status: 201 });
}
