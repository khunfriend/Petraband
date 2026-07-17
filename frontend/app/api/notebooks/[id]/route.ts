import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;

  const notebook = await prisma.notebook.findUnique({
    where: { id },
    include: {
      song: { select: { id: true, title: true, songCode: true } },
      sheets: {
        select: {
          id: true,
          name: true,
          sheetOrder: true,
          columnCount: true,
          rowCount: true,
          createdAt: true,
        },
        orderBy: { sheetOrder: "asc" },
      },
    },
  });

  if (!notebook) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ notebook });
}

const patchSchema = z.object({
  name: z.string().min(1),
});

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const notebook = await prisma.notebook.findUnique({ where: { id } });
  if (!notebook) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง", details: parsed.error.flatten() }, { status: 400 });
  }

  const updated = await prisma.notebook.update({
    where: { id },
    data: { name: parsed.data.name },
  });

  return NextResponse.json({ notebook: updated });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const notebook = await prisma.notebook.findUnique({ where: { id } });
  if (!notebook) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.notebook.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
