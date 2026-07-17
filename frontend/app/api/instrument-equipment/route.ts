import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export async function GET() {
  const rows = await prisma.instrumentEquipment.findMany({
    orderBy: { sortOrder: "asc" },
  });
  return NextResponse.json({ rows });
}

const rowSchema = z.object({
  name: z.string().min(1),
  chairs: z.number().int().min(0),
  tables: z.number().int().min(0).nullable(),
});

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const rows = z.array(rowSchema).safeParse(body);
  if (!rows.success) return NextResponse.json({ error: "Invalid data" }, { status: 400 });

  // delete all and re-insert to handle adds/deletes/reorders
  await prisma.instrumentEquipment.deleteMany();
  await prisma.instrumentEquipment.createMany({
    data: rows.data.map((r, i) => ({
      name: r.name,
      chairs: r.chairs,
      tables: r.tables ?? null,
      sortOrder: i,
    })),
  });

  const updated = await prisma.instrumentEquipment.findMany({ orderBy: { sortOrder: "asc" } });
  return NextResponse.json({ rows: updated });
}
