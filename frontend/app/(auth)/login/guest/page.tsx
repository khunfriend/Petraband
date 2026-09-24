"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { loginAction } from "../actions";

// Password sign-in is only for admin-created temporary accounts (PRD FR-1.5).
// Members use Google on /login.
function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" disabled={pending} className="mt-2 w-full h-11">
      {pending ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
    </Button>
  );
}

export default function GuestLoginPage() {
  const [state, action] = useActionState(loginAction, null);

  useEffect(() => {
    if (state && "success" in state) {
      window.location.href = "/dashboard";
    }
  }, [state]);

  return (
    <div>
      <Eyebrow>Guest sign in</Eyebrow>
      <h1 className="mt-3 text-3xl font-bold text-ink leading-tight">ผู้ร่วมแสดงเฉพาะกิจ</h1>
      <p className="mt-2 text-sm text-body leading-[1.7]">
        ใช้ชื่อผู้ใช้และรหัสผ่านที่ผู้ดูแลวงให้ไว้
      </p>

      <form action={action} className="mt-8 flex flex-col gap-4">
        <Input
          label="ชื่อผู้ใช้"
          id="username"
          name="username"
          type="text"
          required
          autoComplete="username"
        />
        <Input
          label="รหัสผ่าน"
          id="password"
          name="password"
          type="password"
          placeholder="••••••••"
          required
          autoComplete="current-password"
          error={
            "error" in (state ?? {})
              ? (state as { error: string }).error
              : undefined
          }
        />
        <SubmitButton />
      </form>

      <p className="mt-6 text-sm text-muted">
        เป็นสมาชิกวง?{" "}
        <Link
          href="/login"
          className="text-body-strong font-medium hover:underline underline-offset-4 decoration-primary/50 hover:decoration-primary transition-colors"
        >
          เข้าสู่ระบบด้วย Google
        </Link>
      </p>
    </div>
  );
}
