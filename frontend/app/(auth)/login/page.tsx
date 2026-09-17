"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { loginAction, googleSignInAction } from "./actions";

// Messages the Google sign-in flow redirects back with.
const NOTICES: Record<string, { text: string; tone: "info" | "error" }> = {
  pending: {
    text: "สมัครเรียบร้อยแล้ว — รอผู้ดูแลอนุมัติบัญชีก่อนจึงจะเข้าใช้งานได้ ระบบแจ้งผู้ดูแลให้แล้ว",
    tone: "info",
  },
  rejected: { text: "บัญชีนี้ถูกปฏิเสธ กรุณาติดต่อผู้ดูแล", tone: "error" },
  suspended: { text: "บัญชีนี้ถูกระงับ กรุณาติดต่อผู้ดูแล", tone: "error" },
  expired: { text: "บัญชีชั่วคราวนี้หมดอายุแล้ว", tone: "error" },
  google_email: { text: "ไม่สามารถยืนยันอีเมลจาก Google ได้", tone: "error" },
};

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
  const params = useSearchParams();
  const notice = params.get("pending")
    ? NOTICES.pending
    : NOTICES[params.get("error") ?? ""];

  useEffect(() => {
    if (state && "success" in state) {
      window.location.href = "/dashboard";
    }
  }, [state]);

  return (
    <div>
      <Eyebrow>Sign in</Eyebrow>
      <h1 className="mt-3 text-3xl font-bold text-ink leading-tight">
        ยินดีต้อนรับกลับ
      </h1>
      <p className="mt-2 text-sm text-body leading-[1.7]">
        เข้าสู่ระบบเพื่อดูตารางงานและซ้อมของวง
      </p>

      {notice && (
        <p
          className={`mt-6 rounded-md border px-4 py-3 text-sm leading-[1.7] ${
            notice.tone === "info"
              ? "border-primary/30 bg-primary/5 text-body-strong"
              : "border-error/30 bg-error/5 text-error"
          }`}
        >
          {notice.text}
        </p>
      )}

      <form action={googleSignInAction} className="mt-8">
        <Button type="submit" variant="secondary" className="w-full h-11">
          เข้าสู่ระบบด้วย Google
        </Button>
      </form>

      <div className="mt-6 flex items-center gap-3">
        <span className="h-px flex-1 bg-hairline" />
        <span className="text-xs text-muted">หรือ สำหรับผู้ร่วมแสดงเฉพาะกิจ</span>
        <span className="h-px flex-1 bg-hairline" />
      </div>

      <form action={action} className="mt-6 flex flex-col gap-4">
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
