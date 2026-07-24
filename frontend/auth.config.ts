import type { NextAuthConfig } from "next-auth";

// Edge-safe config — ไม่มี import database/bcrypt
export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
  },
  providers: [],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isPublic =
        nextUrl.pathname.startsWith("/login") ||
        nextUrl.pathname.startsWith("/register") ||
        nextUrl.pathname.startsWith("/verify-pending") ||
        nextUrl.pathname.startsWith("/auth/callback") ||
        nextUrl.pathname.startsWith("/forgot-password") ||
        nextUrl.pathname.startsWith("/reset-password") ||
        nextUrl.pathname.startsWith("/api/auth") ||
        nextUrl.pathname.startsWith("/uploads") ||
        nextUrl.pathname.startsWith("/design");

      if (isPublic) return true;
      if (isLoggedIn) return true;

      // Redirect to login with callbackUrl
      const loginUrl = new URL("/login", nextUrl.origin);
      loginUrl.searchParams.set("callbackUrl", nextUrl.pathname);
      return Response.redirect(loginUrl);
    },
  },
};
