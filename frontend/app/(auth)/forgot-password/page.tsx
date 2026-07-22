"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { AlertBox } from "@/components/ui/AlertBox";
import { Eyebrow } from "@/components/ui/Eyebrow";

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
    <div>
      <Eyebrow>Recover · ลืมรหัสผ่าน</Eyebrow>
      <h1 className="mt-3 text-3xl font-bold text-ink leading-tight">
        ตั้งรหัสผ่านใหม่
      </h1>
      <p className="mt-2 text-sm text-body leading-[1.7]">
        กรอกอีเมลของคุณ ระบบจะส่งลิงก์รีเซ็ตรหัสผ่านให้
      </p>

      {submitted ? (
        <div className="mt-8 flex flex-col gap-4">
          <AlertBox variant="success">
            หากอีเมลนี้อยู่ในระบบ เราได้ส่งลิงก์รีเซ็ตรหัสผ่านให้แล้ว
            <br />
            กรุณาตรวจสอบกล่องขาเข้า (ลิงก์หมดอายุใน 30 นาที)
          </AlertBox>
          <BackToLogin />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
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
          <Button
            type="submit"
            variant="primary"
            disabled={loading}
            className="mt-2 w-full h-11"
          >
            {loading ? "กำลังส่ง..." : "ส่งลิงก์รีเซ็ตรหัสผ่าน"}
          </Button>

          <BackToLogin />
        </form>
      )}
    </div>
  );
}

function BackToLogin() {
  return (
    <Link
      href="/login"
      className="inline-flex items-center gap-2 text-sm text-body-strong font-medium hover:text-primary transition-colors self-start"
    >
      <ArrowLeft size={16} strokeWidth={1.75} />
      กลับหน้าเข้าสู่ระบบ
    </Link>
  );
}
