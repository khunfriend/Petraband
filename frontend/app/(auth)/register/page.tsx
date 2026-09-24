import Link from "next/link";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { GoogleButton } from "@/components/auth/GoogleButton";

// Signing up = signing in with Google for the first time. The signIn callback
// in auth.ts creates the account as PENDING_APPROVAL and tells the admins.
export default function RegisterPage() {
  return (
    <div>
      <Eyebrow>Register</Eyebrow>
      <h1 className="mt-3 text-3xl font-bold text-ink leading-tight">สร้างบัญชีใหม่</h1>
      <p className="mt-2 text-sm text-body leading-[1.7]">
        สมัครด้วยบัญชี Google ของคุณ จากนั้นรอผู้ดูแลวงอนุมัติก่อนจึงจะเข้าใช้งานได้
      </p>

      <div className="mt-8">
        <GoogleButton label="สมัครด้วย Google" />
      </div>

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
