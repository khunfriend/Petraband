import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSchema = z.object({
  nickname: z.string().min(1).max(50).optional(),
  firstName: z.string().max(50).nullable().optional(),
  lastName: z.string().max(50).nullable().optional(),
  avatarUrl: z.string().nullable().optional(),
  contact: z.string().max(200).nullable().optional(),
  generation: z.string().optional(),
  primaryInstrumentId: z.string().nullable().optional(),
  secondaryInstrumentIds: z.array(z.string()).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  if (session.user.id !== id && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }

  const { secondaryInstrumentIds, ...rest } = parsed.data;

  const user = await prisma.user.update({
    where: { id },
    data: {
      ...rest,
      ...(secondaryInstrumentIds !== undefined && {
        secondaryInstruments: {
          deleteMany: {},
          create: secondaryInstrumentIds.map((instrumentId) => ({ instrumentId })),
        },
      }),
    },
    select: {
      id: true,
      nickname: true,
      firstName: true,
      lastName: true,
      avatarUrl: true,
      contact: true,
      generation: true,
      isTemporary: true,
      primaryInstrumentId: true,
      secondaryInstruments: { select: { instrumentId: true } },
    },
  });

  return NextResponse.json({ user });
}
