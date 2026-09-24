import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

async function load() {
  const [accessories, rows] = await Promise.all([
    prisma.accessoryType.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.instrumentEquipment.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);
  return { accessories, rows };
}

export async function GET() {
  return NextResponse.json(await load());
}

const count = z.number().int().min(0).max(99);

// Accessories are sent with a `key`: an existing id, or any placeholder for a
// new one. Rows refer to accessories by that same key.
const bodySchema = z.object({
  accessories: z
    .array(z.object({ key: z.string().min(1), name: z.string().trim().min(1).max(40), perPlayer: count }))
    .max(30),
  rows: z
    .array(z.object({ name: z.string().trim().min(1).max(60), accessories: z.record(z.string(), count) }))
    .max(100),
});

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  const { accessories, rows } = parsed.data;

  const dup = (names: string[]) => names.find((n, i) => names.indexOf(n) !== i);
  const dupAcc = dup(accessories.map((a) => a.name));
  if (dupAcc) return NextResponse.json({ error: `อุปกรณ์เสริม "${dupAcc}" ซ้ำ` }, { status: 400 });
  const dupRow = dup(rows.map((r) => r.name));
  if (dupRow) return NextResponse.json({ error: `เครื่องดนตรี "${dupRow}" ซ้ำ` }, { status: 400 });

  await prisma.$transaction(async (tx) => {
    const existing = await tx.accessoryType.findMany({ select: { id: true } });
    const kept = new Set(accessories.map((a) => a.key));
    await tx.accessoryType.deleteMany({
      where: { id: { in: existing.map((e) => e.id).filter((id) => !kept.has(id)) } },
    });

    // Park names first so a swap of two names can't trip the unique index.
    for (const e of existing.filter((e) => kept.has(e.id))) {
      await tx.accessoryType.update({ where: { id: e.id }, data: { name: `__tmp_${e.id}` } });
    }

    const idOf = new Map<string, string>();
    const existingIds = new Set(existing.map((e) => e.id));
    for (const [i, a] of accessories.entries()) {
      const data = { name: a.name, perPlayer: a.perPlayer, sortOrder: i };
      const saved = existingIds.has(a.key)
        ? await tx.accessoryType.update({ where: { id: a.key }, data })
        : await tx.accessoryType.create({ data });
      idOf.set(a.key, saved.id);
    }

    await tx.instrumentEquipment.deleteMany();
    await tx.instrumentEquipment.createMany({
      data: rows.map((r, i) => ({
        name: r.name,
        sortOrder: i,
        // Keep only accessories that still exist, and skip zeros.
        accessories: Object.fromEntries(
          Object.entries(r.accessories)
            .filter(([k, n]) => idOf.has(k) && n > 0)
            .map(([k, n]) => [idOf.get(k)!, n])
        ),
      })),
    });
  });

  return NextResponse.json(await load());
}
