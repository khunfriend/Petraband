"use server";

import { cookies } from "next/headers";
import { signIn } from "@/auth";
import { SIGNUP_COOKIE, signupSchema } from "@/lib/signup";

type State = {
  errors: { nickname?: string; generation?: string };
  values: { nickname: string; generation: string };
} | null;

export async function registerWithGoogleAction(_prev: State, formData: FormData): Promise<State> {
  const values = {
    nickname: String(formData.get("nickname") ?? ""),
    generation: String(formData.get("generation") ?? ""),
  };
  const parsed = signupSchema.safeParse(values);
  if (!parsed.success) {
    const f = parsed.error.flatten().fieldErrors;
    // values go back so the form (reset by React after an action) keeps them
    return { errors: { nickname: f.nickname?.[0], generation: f.generation?.[0] }, values };
  }

  (await cookies()).set(SIGNUP_COOKIE, JSON.stringify(parsed.data), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 10,
  });

  // Throws a redirect to Google; the signIn callback picks the cookie up.
  await signIn("google", { redirectTo: "/dashboard" });
  return null;
}
