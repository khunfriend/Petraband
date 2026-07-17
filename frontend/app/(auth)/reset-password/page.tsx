"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

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
      <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-[var(--radius-md)] px-3 py-3">
        ลิงก์ไม่ถูกต้อง — กรุณาขอลิงก์ใหม่ที่หน้าลืมรหัสผ่าน
      </p>
    );
  }

  if (success) {
    return (
      <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-[var(--radius-md)] px-3 py-3">
        รีเซ็ตรหัสผ่านสำเร็จ กำลังพาไปหน้าเข้าสู่ระบบ...
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
      <Button type="submit" variant="primary" disabled={loading} className="mt-2 w-full">
        {loading ? "กำลังบันทึก..." : "ตั้งรหัสผ่านใหม่"}
      </Button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="bg-surface-card border border-hairline-soft rounded-[var(--radius-xl)] p-8 w-full max-w-md mx-auto">
      <h1 className="text-xl font-bold text-ink mb-1">ตั้งรหัสผ่านใหม่</h1>
      <p className="text-sm text-muted mb-6">กรอกรหัสผ่านใหม่ที่ต้องการใช้</p>

      <Suspense fallback={<p className="text-sm text-muted">กำลังโหลด...</p>}>
        <ResetPasswordForm />
      </Suspense>

      <p className="mt-6 text-center text-sm text-muted">
        <Link href="/login" className="hover:text-coral">กลับหน้าเข้าสู่ระบบ</Link>
      </p>
    </div>
  );
}
