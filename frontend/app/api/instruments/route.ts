import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const instruments = await prisma.instrument.findMany({
    orderBy: { nameThai: "asc" },
    select: {
      id: true,
      name: true,
      nameThai: true,
      allowsConcurrent: true,
      footprintW: true,
      footprintH: true,
      iconType: true,
    },
  });
  return NextResponse.json({ instruments });
}
