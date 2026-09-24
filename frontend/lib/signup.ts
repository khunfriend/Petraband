import { z } from "zod";

// What a new member types on /register before going to Google. It rides in a
// short-lived cookie to the signIn callback in auth.ts, which creates the row.
export const SIGNUP_COOKIE = "pb_signup";

export const signupSchema = z.object({
  nickname: z
    .string()
    .trim()
    .regex(/^[฀-๿]{1,30}$/, "ชื่อเล่นต้องเป็นภาษาไทยเท่านั้น (ไม่เกิน 30 ตัวอักษร ไม่มีเว้นวรรค)"),
  generation: z
    .string()
    .trim()
    .regex(/^\d{1,3}$/, "รุ่นต้องเป็นตัวเลขเท่านั้น"),
});

export type Signup = { nickname: string; generation: string };

// Stored the same way the profile page writes it: "#20".
export function parseSignup(raw: unknown): Signup | null {
  const parsed = signupSchema.safeParse(raw);
  if (!parsed.success) return null;
  return {
    nickname: parsed.data.nickname,
    generation: `#${Number(parsed.data.generation)}`,
  };
}
