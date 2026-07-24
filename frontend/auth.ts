import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { authConfig } from "./auth.config";
import type { Role } from "@prisma/client";

async function downgradeExpiredTempAccounts() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    await prisma.user.updateMany({
      where: {
        isTemporary: true,
        status: "ACTIVE",
        OR: [
          { linkedPerformanceId: null },
          { linkedPerformance: { dates: { every: { date: { lt: today } } } } },
        ],
      },
      data: { status: "EXPIRED" },
    });
  } catch { /* silent */ }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        if (!credentials?.email || !credentials?.password) return null;

        let user;
        try {
          user = await prisma.user.findUnique({
            where: { email: credentials.email as string },
          });
        } catch (e) {
          console.error("[authorize] prisma error:", e);
          return null;
        }

        if (!user) { console.error("[authorize] user not found:", credentials.email); return null; }

        let isValid;
        try {
          isValid = await bcrypt.compare(credentials.password as string, user.passwordHash);
        } catch (e) {
          console.error("[authorize] bcrypt error:", e);
          return null;
        }
        if (!isValid) { console.error("[authorize] wrong password for:", credentials.email); return null; }

        if (user.status !== "ACTIVE") {
          console.error(`[authorize] account not active (${user.status}):`, credentials.email);
          return null;
        }

        // Fire-and-forget downgrade of expired temporary accounts
        downgradeExpiredTempAccounts();

        return {
          id: user.id,
          email: user.email,
          name: user.nickname,
          role: user.role,
          avatarUrl: user.avatarUrl,
          tokenVersion: user.tokenVersion,
        };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id as string;
        token.role = (user as { role: Role }).role;
        token.avatarUrl = (user as unknown as { avatarUrl?: string | null }).avatarUrl ?? null;
        token.tokenVersion = (user as unknown as { tokenVersion?: number }).tokenVersion ?? 0;
        return token;
      }
      // On subsequent requests, verify token version still matches DB
      // Also refresh avatarUrl on profile updates
      if (token.id) {
        try {
          const current = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { tokenVersion: true, avatarUrl: true, nickname: true },
          });
          if (!current || current.tokenVersion !== token.tokenVersion) {
            return null;
          }
          if (trigger === "update" || token.avatarUrl !== current.avatarUrl) {
            token.avatarUrl = current.avatarUrl;
            token.name = current.nickname;
          }
        } catch { /* pass through on transient error */ }
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id as string;
      session.user.role = token.role as Role;
      session.user.avatarUrl = (token.avatarUrl as string | null) ?? null;
      return session;
    },
  },
});
