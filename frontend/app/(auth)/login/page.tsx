"use client";

import { useActionState, Suspense, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { loginAction } from "./actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" disabled={pending} className="mt-2 w-full">
      {pending ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
    </Button>
  );
}

function RegisteredBanner() {
  const searchParams = useSearchParams();
  const registered = searchParams.get("registered") === "1";
  if (!registered) return null;
  return (
    <p className="mb-4 text-sm text-green-600 bg-green-50 border border-green-200 rounded-[var(--radius-md)] px-3 py-2">
      สมัครสมาชิกสำเร็จ กรุณาเข้าสู่ระบบ
    </p>
  );
}

function LoginForm() {
  const [state, action] = useActionState(loginAction, null);

  useEffect(() => {
    if (state && "success" in state) {
      window.location.href = "/dashboard";
    }
  }, [state]);

  return (
    <div className="bg-surface-card border border-hairline-soft rounded-[var(--radius-xl)] p-8">
      <h1 className="text-xl font-bold text-ink mb-1">เข้าสู่ระบบ</h1>
      <p className="text-sm text-muted mb-6">Sign in to PETRAband</p>

      <Suspense>
        <RegisteredBanner />
      </Suspense>

      <form action={action} className="flex flex-col gap-4">
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
          error={"error" in (state ?? {}) ? (state as { error: string }).error : undefined}
        />

        <SubmitButton />
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        ยังไม่มีบัญชี?{" "}
        <Link href="/register" className="text-coral font-medium hover:underline">
          สมัครสมาชิก
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return <LoginForm />;
}
