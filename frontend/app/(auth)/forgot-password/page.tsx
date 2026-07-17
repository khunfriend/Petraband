"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch("/api/auth/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-surface-card border border-hairline-soft rounded-[var(--radius-xl)] p-8 w-full max-w-md mx-auto">
      <h1 className="text-xl font-bold text-ink mb-1">ลืมรหัสผ่าน</h1>
      <p className="text-sm text-muted mb-6">
        กรอกอีเมลของคุณ ระบบจะส่งลิงก์รีเซ็ตรหัสผ่านให้
      </p>

      {submitted ? (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-[var(--radius-md)] px-3 py-3">
            หากอีเมลนี้อยู่ในระบบ เราได้ส่งลิงก์รีเซ็ตรหัสผ่านให้แล้ว
            <br />
            กรุณาตรวจสอบกล่องขาเข้า (ลิงก์หมดอายุใน 30 นาที)
          </p>
          <Link href="/login" className="text-center text-sm text-coral font-medium hover:underline">
            กลับหน้าเข้าสู่ระบบ
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="อีเมล"
            id="email"
            type="email"
            placeholder="yourname@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          <Button type="submit" variant="primary" disabled={loading} className="mt-2 w-full">
            {loading ? "กำลังส่ง..." : "ส่งลิงก์รีเซ็ตรหัสผ่าน"}
          </Button>

          <Link href="/login" className="text-center text-sm text-muted hover:text-coral">
            กลับหน้าเข้าสู่ระบบ
          </Link>
        </form>
      )}
    </div>
  );
}
