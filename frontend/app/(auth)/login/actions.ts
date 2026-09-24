"use server";

import { signIn } from "@/auth";
import { AuthError } from "next-auth";

export async function loginAction(
  _prev: { error: string } | { success: true } | null,
  formData: FormData
): Promise<{ error: string } | { success: true } | null> {
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;

  try {
    await signIn("credentials", { username, password, redirect: false });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" };
    }
    return { error: "เกิดข้อผิดพลาด กรุณาลองใหม่" };
  }

  return { success: true };
}

export async function googleSignInAction() {
  // Redirects to Google; the signIn callback in auth.ts decides what happens
  // when it comes back.
  await signIn("google", { redirectTo: "/dashboard" });
}
