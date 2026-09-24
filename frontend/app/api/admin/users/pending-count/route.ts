import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// Number of sign-ups waiting for approval, for the badge in TopNav.
export async function GET() {
  const session = await auth();
  if (session?.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const count = await prisma.user.count({ where: { status: "PENDING_APPROVAL" } });
  return NextResponse.json({ count });
}
