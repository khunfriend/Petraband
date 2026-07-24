"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const payload = {
      email: String(form.get("email") || "").trim(),
      password: String(form.get("password") || ""),
      nickname: String(form.get("nickname") || "").trim(),
      generation: String(form.get("generation") || "").trim(),
    };
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "สมัครไม่สำเร็จ");
        setLoading(false);
        return;
      }

      // Run signUp on the browser so Supabase can store the PKCE
      // verifier cookie on this origin — otherwise /auth/callback
      // cannot exchange the code.
      const supabase = getSupabaseBrowser();
      const { error: signUpError } = await supabase.auth.signUp({
        email: payload.email,
        password: payload.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (signUpError) {
        setError(signUpError.message || "ส่งอีเมลยืนยันไม่สำเร็จ");
        setLoading(false);
        return;
      }

      router.push(`/verify-pending?email=${encodeURIComponent(payload.email)}`);
    } catch {
      setError("เกิดข้อผิดพลาด กรุณาลองใหม่");
      setLoading(false);
    }
  }

  return (
    <div>
      <Eyebrow>Register · สมัครสมาชิก</Eyebrow>
      <h1 className="mt-3 text-3xl font-bold text-ink leading-tight">สร้างบัญชีใหม่</h1>
      <p className="mt-2 text-sm text-body leading-[1.7]">
        กรอกข้อมูลเพื่อสมัครสมาชิกวง PETRAband
      </p>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
        <Input label="อีเมล" id="email" name="email" type="email" required autoComplete="email" placeholder="yourname@example.com" />
        <Input label="ชื่อเล่น" id="nickname" name="nickname" type="text" required autoComplete="nickname" />
        <Input label="รุ่น" id="generation" name="generation" type="text" placeholder="#20" />
        <Input
          label="รหัสผ่าน"
          id="password"
          name="password"
          type="password"
          required
          autoComplete="new-password"
          placeholder="อย่างน้อย 8 ตัวอักษร"
          error={error ?? undefined}
        />

        <Button type="submit" variant="primary" disabled={loading} className="mt-2 w-full h-11">
          {loading ? "กำลังสมัคร..." : "สมัครสมาชิก"}
        </Button>
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
