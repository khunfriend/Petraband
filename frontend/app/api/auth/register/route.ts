import { NextResponse } from "next/server";

// Sign-up now happens through Google (see the signIn callback in auth.ts).
// Accounts made here would have a password nobody can use — Credentials
// sign-in only accepts temporary accounts — so the endpoint is closed.
export async function POST() {
  return NextResponse.json(
    { error: "สมัครสมาชิกด้วย Google ที่หน้า /register" },
    { status: 410 }
  );
}
