import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Params) {
  const session = await auth();
  if (session?.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const { footprintW, footprintH, iconType } = body as {
    footprintW?: number;
    footprintH?: number;
    iconType?: string;
  };

  const instrument = await prisma.instrument.update({
    where: { id },
    data: {
      ...(footprintW !== undefined && { footprintW }),
      ...(footprintH !== undefined && { footprintH }),
      ...(iconType !== undefined && { iconType }),
    },
  });

  return NextResponse.json({ instrument });
}
