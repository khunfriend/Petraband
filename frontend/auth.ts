import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { authConfig } from "./auth.config";
import type { Role } from "@prisma/client";

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

        return {
          id: user.id,
          email: user.email,
          name: user.nickname,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = user.role as Role;
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
