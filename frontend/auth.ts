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

        if (user.status === "EXPIRED") {
          console.error("[authorize] account expired:", credentials.email);
          return null;
        }

        // Fire-and-forget downgrade of expired temporary accounts
        downgradeExpiredTempAccounts();

        return {
          id: user.id,
          email: user.email,
          name: user.nickname,
          role: user.role,
          tokenVersion: user.tokenVersion,
        };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = (user as { role: Role }).role;
        token.tokenVersion = (user as unknown as { tokenVersion?: number }).tokenVersion ?? 0;
        return token;
      }
      // On subsequent requests, verify token version still matches DB
      if (token.id) {
        try {
          const current = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { tokenVersion: true },
          });
          if (!current || current.tokenVersion !== token.tokenVersion) {
            return null;
          }
        } catch { /* pass through on transient error */ }
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id as string;
      session.user.role = token.role as Role;
      return session;
    },
  },
});
