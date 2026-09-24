"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { GoogleButton } from "@/components/auth/GoogleButton";

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

const linkClass =
  "text-body-strong font-medium hover:underline underline-offset-4 decoration-primary/50 hover:decoration-primary transition-colors";

export default function LoginPage() {
  const params = useSearchParams();
  const notice = params.get("pending")
    ? NOTICES.pending
    : NOTICES[params.get("error") ?? ""];

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

      <div className="mt-8">
        <GoogleButton label="เข้าสู่ระบบด้วย Google" />
      </div>

      <div className="mt-6 flex items-center justify-between text-sm text-muted">
        <Link href="/login/guest" className={linkClass}>
          ผู้ร่วมแสดงเฉพาะกิจ
        </Link>
        <Link href="/register" className={linkClass}>
          สมัครสมาชิก
        </Link>
      </div>
    </div>
  );
}
