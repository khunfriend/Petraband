"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { AlertBox } from "@/components/ui/AlertBox";
import { Eyebrow } from "@/components/ui/Eyebrow";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("รหัสผ่านอย่างน้อย 8 ตัวอักษร");
      return;
    }
    if (password !== confirmPassword) {
      setError("รหัสผ่านทั้งสองช่องไม่ตรงกัน");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "เกิดข้อผิดพลาด");
        return;
      }
      setSuccess(true);
      setTimeout(() => router.push("/login"), 2000);
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <AlertBox variant="danger">
        ลิงก์ไม่ถูกต้อง — กรุณาขอลิงก์ใหม่ที่หน้าลืมรหัสผ่าน
      </AlertBox>
    );
  }

  if (success) {
    return (
      <AlertBox variant="success">
        รีเซ็ตรหัสผ่านสำเร็จ กำลังพาไปหน้าเข้าสู่ระบบ...
      </AlertBox>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
      <Input
        label="รหัสผ่านใหม่"
        id="password"
        type="password"
        placeholder="อย่างน้อย 8 ตัวอักษร"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        autoComplete="new-password"
      />
      <Input
        label="ยืนยันรหัสผ่านใหม่"
        id="confirmPassword"
        type="password"
        placeholder="พิมพ์รหัสผ่านซ้ำ"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        required
        autoComplete="new-password"
        error={error}
      />
      <Button
        type="submit"
        variant="primary"
        disabled={loading}
        className="mt-2 w-full h-11"
      >
        {loading ? "กำลังบันทึก..." : "ตั้งรหัสผ่านใหม่"}
      </Button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div>
      <Eyebrow>Reset · รหัสผ่านใหม่</Eyebrow>
      <h1 className="mt-3 text-3xl font-bold text-ink leading-tight">
        ตั้งรหัสผ่านใหม่
      </h1>
      <p className="mt-2 text-sm text-body leading-[1.7]">
        กรอกรหัสผ่านใหม่ที่ต้องการใช้
      </p>

      <Suspense
        fallback={<p className="mt-8 text-sm text-muted">กำลังโหลด...</p>}
      >
        <ResetPasswordForm />
      </Suspense>

      <Link
        href="/login"
        className="mt-6 inline-flex items-center gap-2 text-sm text-body-strong font-medium hover:text-primary transition-colors"
      >
        <ArrowLeft size={16} strokeWidth={1.75} />
        กลับหน้าเข้าสู่ระบบ
      </Link>
    </div>
  );
}
