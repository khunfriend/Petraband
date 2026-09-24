"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { registerWithGoogleAction } from "./actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" disabled={pending} className="mt-2 w-full h-11">
      {pending ? "กำลังไปที่ Google..." : "สมัครด้วย Google"}
    </Button>
  );
}

// Signing up = these two fields + a first Google sign-in. The signIn callback
// in auth.ts creates the account as PENDING_APPROVAL and tells the admins.
export default function RegisterPage() {
  const [state, action] = useActionState(registerWithGoogleAction, null);
  const params = useSearchParams();
  const needProfile = params.get("error") === "need_profile";

  return (
    <div>
      <Eyebrow>Register</Eyebrow>
      <h1 className="mt-3 text-3xl font-bold text-ink leading-tight">สร้างบัญชีใหม่</h1>
      <p className="mt-2 text-sm text-body leading-[1.7]">
        กรอกชื่อเล่นและรุ่น แล้วยืนยันตัวตนด้วยบัญชี Google จากนั้นรอผู้ดูแลวงอนุมัติ
      </p>

      {needProfile && (
        <p className="mt-6 rounded-md border border-primary/30 bg-primary/5 px-4 py-3 text-sm leading-[1.7] text-body-strong">
          บัญชี Google นี้ยังไม่ได้สมัคร — กรอกชื่อเล่นและรุ่นก่อน แล้วกดสมัครอีกครั้ง
        </p>
      )}

      <form key={JSON.stringify(state?.values)} action={action} className="mt-8 flex flex-col gap-4">
        <Input
          label="ชื่อเล่น (ภาษาไทย)"
          id="nickname"
          name="nickname"
          type="text"
          required
          maxLength={30}
          pattern="[฀-๿]+"
          title="ภาษาไทยเท่านั้น"
          placeholder="เช่น น้ำ"
          defaultValue={state?.values?.nickname}
          error={state?.errors?.nickname}
        />
        <Input
          label="รุ่น (ตัวเลข)"
          id="generation"
          name="generation"
          type="text"
          inputMode="numeric"
          required
          maxLength={3}
          pattern="\d{1,3}"
          title="ตัวเลขเท่านั้น"
          placeholder="เช่น 20"
          defaultValue={state?.values?.generation}
          error={state?.errors?.generation}
        />
        <SubmitButton />
      </form>

      <p className="mt-6 text-sm text-muted">
        มีบัญชีอยู่แล้ว?{" "}
        <Link
          href="/login"
          className="text-body-strong font-medium hover:underline underline-offset-4 decoration-primary/50 hover:decoration-primary transition-colors"
        >
          เข้าสู่ระบบ
        </Link>
      </p>
    </div>
  );
}
