import { prisma } from "@/lib/prisma";

// A temporary account's nickname is its login name, so no two may share one
// (compared case-insensitively).
export async function tempNicknameTaken(nickname: string, exceptId?: string) {
  const clash = await prisma.user.findFirst({
    where: {
      isTemporary: true,
      nickname: { equals: nickname.trim(), mode: "insensitive" },
      ...(exceptId && { id: { not: exceptId } }),
    },
    select: { id: true },
  });
  return !!clash;
}
