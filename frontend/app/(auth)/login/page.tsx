"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { loginAction } from "./actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant="primary"
      disabled={pending}
      className="mt-2 w-full h-11"
    >
      {pending ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
    </Button>
  );
}

export default function LoginPage() {
  const [state, action] = useActionState(loginAction, null);

  useEffect(() => {
    if (state && "success" in state) {
      window.location.href = "/dashboard";
    }
  }, [state]);

  return (
    <div>
      <Eyebrow>Sign in · เข้าสู่ระบบ</Eyebrow>
      <h1 className="mt-3 text-3xl font-bold text-ink leading-tight">
        ยินดีต้อนรับกลับ
      </h1>
      <p className="mt-2 text-sm text-body leading-[1.7]">
        เข้าสู่ระบบเพื่อดูตารางงานและซ้อมของวง
      </p>

      <form action={action} className="mt-8 flex flex-col gap-4">
        <Input
          label="อีเมล"
          id="email"
          name="email"
          type="email"
          placeholder="yourname@example.com"
          required
          autoComplete="email"
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

      <div className="mt-6 flex items-center justify-between text-sm text-muted">
        <Link
          href="/forgot-password"
          className="text-body-strong font-medium hover:underline underline-offset-4 decoration-primary/50 hover:decoration-primary transition-colors"
        >
          ลืมรหัสผ่าน?
        </Link>
        <Link
          href="/register"
          className="text-body-strong font-medium hover:underline underline-offset-4 decoration-primary/50 hover:decoration-primary transition-colors"
        >
          สมัครสมาชิก
        </Link>
      </div>
    </div>
  );
}
