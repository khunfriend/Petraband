import Link from "next/link";
import { Eyebrow } from "@/components/ui/Eyebrow";

type Props = { searchParams: Promise<{ email?: string }> };

export default async function VerifyPendingPage({ searchParams }: Props) {
  const { email } = await searchParams;

  return (
    <div>
      <Eyebrow>Check your inbox · ตรวจสอบอีเมล</Eyebrow>
      <h1 className="mt-3 text-3xl font-bold text-ink leading-tight">ยืนยันอีเมลของคุณ</h1>
      <p className="mt-4 text-sm text-body leading-[1.7]">
        เราส่งลิงก์ยืนยันไปที่ <span className="font-semibold text-ink">{email || "อีเมลที่คุณระบุ"}</span> แล้ว
        กรุณาคลิกลิงก์ในอีเมลเพื่อดำเนินการต่อ
      </p>
      <p className="mt-3 text-sm text-muted leading-[1.7]">
        หลังจากยืนยันอีเมล บัญชีของคุณจะรอการอนุมัติจากผู้ดูแลระบบ (Admin) จึงจะเข้าใช้งานได้
      </p>

      <p className="mt-8 text-sm text-muted">
        <Link
          href="/login"
          className="text-body-strong font-medium hover:underline underline-offset-4 decoration-primary/50 hover:decoration-primary transition-colors"
        >
          ← กลับไปหน้าเข้าสู่ระบบ
        </Link>
      </p>
    </div>
  );
}
