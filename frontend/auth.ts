import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { sendAdminNewPendingEmail } from "@/lib/email";
import { cookies } from "next/headers";
import { SIGNUP_COOKIE, parseSignup } from "@/lib/signup";
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

async function notifyAdminsOfPending(nickname: string, email: string) {
  try {
    const admins = await prisma.user.findMany({
      where: { role: "ADMIN", status: "ACTIVE" },
      select: { email: true, nickname: true },
    });
    await Promise.all(
      admins.map((a) => sendAdminNewPendingEmail(a.email, a.nickname, nickname, email))
    );
  } catch (e) {
    console.error("[google signIn] admin notify failed:", e);
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Google,
    Credentials({
      credentials: {
        username: { label: "ชื่อผู้ใช้", type: "text" },
        password: { label: "Password", type: "password" },
      },
      // Only temporary accounts sign in here (PRD FR-1.5), by nickname.
      // Members use Google.
      authorize: async (credentials) => {
        const username = String(credentials?.username ?? "").trim();
        const password = String(credentials?.password ?? "");
        if (!username || !password) return null;

        let candidates;
        try {
          candidates = await prisma.user.findMany({
            where: { isTemporary: true, nickname: { equals: username, mode: "insensitive" } },
          });
        } catch (e) {
          console.error("[authorize] prisma error:", e);
          return null;
        }

        // Nicknames are unique among temporary accounts for new ones, but
        // older accounts may still share one — the password tells them apart.
        let user = null;
        for (const c of candidates) {
          try {
            if (c.passwordHash && (await bcrypt.compare(password, c.passwordHash))) { user = c; break; }
          } catch (e) {
            console.error("[authorize] bcrypt error:", e);
          }
        }
        if (!user) { console.error("[authorize] no temporary account matches:", username); return null; }

        if (user.status !== "ACTIVE") {
          console.error(`[authorize] account not active (${user.status}):`, username);
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

    // Google is the members' only way in. A first sign-in creates the account
    // but does NOT let it through — an admin still has to approve it.
    async signIn({ user, account, profile }) {
      if (account?.provider !== "google") return true;

      const email = user.email;
      if (!email || profile?.email_verified === false) return "/login?error=google_email";

      const existing = await prisma.user.findUnique({ where: { email } });

      if (!existing) {
        // The nickname and generation come from the /register form, not from
        // Google. Without them (e.g. "sign in" clicked by someone who never
        // registered) no account is made — send them to fill the form.
        const jar = await cookies();
        let signup = null;
        try {
          signup = parseSignup(JSON.parse(jar.get(SIGNUP_COOKIE)?.value ?? "null"));
        } catch { /* malformed cookie → treated as missing */ }
        if (!signup) return "/register?error=need_profile";
        jar.delete(SIGNUP_COOKIE);

        const created = await prisma.user.create({
          data: {
            email,
            // Google carries the identity; nothing signs in with this hash.
            passwordHash: "",
            nickname: signup.nickname,
            generation: signup.generation,
            avatarUrl: user.image ?? null,
            emailVerifiedAt: new Date(),
            status: "PENDING_APPROVAL",
            role: "MEMBER",
          },
        });
        void notifyAdminsOfPending(created.nickname, created.email);
        return "/login?pending=1";
      }

      if (existing.status !== "ACTIVE") {
        return existing.status === "PENDING_APPROVAL"
          ? "/login?pending=1"
          : `/login?error=${existing.status.toLowerCase()}`;
      }

      // Existing member signing in with Google for the first time: record that
      // Google vouched for the address, and drop any leftover password.
      if (!existing.emailVerifiedAt || existing.passwordHash !== "") {
        await prisma.user.update({
          where: { id: existing.id },
          data: {
            emailVerifiedAt: existing.emailVerifiedAt ?? new Date(),
            passwordHash: existing.isTemporary ? existing.passwordHash : "",
          },
        });
      }
      return true;
    },

    async jwt({ token, user, account, trigger }) {
      if (user) {
        // Google hands back its own profile, not our row — look ours up.
        if (account?.provider === "google") {
          const dbUser = await prisma.user.findUnique({
            where: { email: user.email as string },
            select: { id: true, role: true, avatarUrl: true, tokenVersion: true, nickname: true },
          });
          if (!dbUser) return null;
          token.id = dbUser.id;
          token.role = dbUser.role;
          token.avatarUrl = dbUser.avatarUrl;
          token.tokenVersion = dbUser.tokenVersion;
          token.name = dbUser.nickname;
          return token;
        }
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
