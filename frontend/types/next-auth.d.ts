import type { DefaultSession } from "next-auth";
import type { Role } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      avatarUrl: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    role: Role;
    avatarUrl?: string | null;
  }
}
