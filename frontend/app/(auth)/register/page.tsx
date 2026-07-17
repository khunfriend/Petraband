"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface Instrument {
  id: string;
  nameThai: string;
  name: string;
}

const GENERATIONS = ["#17", "#18", "#19", "#20", "#สมทบ", "#อาจารย์"];

export default function RegisterPage() {
  const router = useRouter();
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    email: "",
    password: "",
    nickname: "",
    generation: "#17",
    primaryInstrumentId: "",
    secondaryInstrumentId: "",
  });

  useEffect(() => {
    fetch("/api/instruments")
      .then((r) => r.json())
      .then((data) => setInstruments(data.instruments || []))
      .catch(() => {});
  }, []);

  function setField(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        primaryInstrumentId: form.primaryInstrumentId || undefined,
        secondaryInstrumentId: form.secondaryInstrumentId || undefined,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "เกิดข้อผิดพลาด");
      setLoading(false);
      return;
    }

    router.push("/login?registered=1");
  }

  return (
    <div className="bg-surface-card border border-hairline-soft rounded-[var(--radius-xl)] p-8">
      <h1 className="text-xl font-bold text-ink mb-1">สมัครสมาชิก</h1>
      <p className="text-sm text-muted mb-6">Join PETRAband</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="ชื่อเล่น"
          id="nickname"
          placeholder="เช่น แตน, มิ้น, บอส"
          value={form.nickname}
          onChange={(e) => setField("nickname", e.target.value)}
          required
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-ink">รุ่น</label>
          <select
            className="h-10 rounded-[var(--radius-md)] border border-hairline bg-surface-soft px-3.5 text-sm text-ink focus:outline-none focus:border-coral focus:ring-[3px] focus:ring-coral/20"
            value={form.generation}
            onChange={(e) => setField("generation", e.target.value)}
          >
            {GENERATIONS.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>

        {instruments.length > 0 && (
          <>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-ink">เครื่องดนตรีหลัก</label>
              <select
                className="h-10 rounded-[var(--radius-md)] border border-hairline bg-surface-soft px-3.5 text-sm text-ink focus:outline-none focus:border-coral focus:ring-[3px] focus:ring-coral/20"
                value={form.primaryInstrumentId}
                onChange={(e) => setField("primaryInstrumentId", e.target.value)}
              >
                <option value="">-- เลือกเครื่องดนตรี --</option>
                {instruments.map((i) => (
                  <option key={i.id} value={i.id}>{i.nameThai}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-ink">เครื่องดนตรีรอง (ถ้ามี)</label>
              <select
                className="h-10 rounded-[var(--radius-md)] border border-hairline bg-surface-soft px-3.5 text-sm text-ink focus:outline-none focus:border-coral focus:ring-[3px] focus:ring-coral/20"
                value={form.secondaryInstrumentId}
                onChange={(e) => setField("secondaryInstrumentId", e.target.value)}
              >
                <option value="">-- ไม่มี --</option>
                {instruments
                  .filter((i) => i.id !== form.primaryInstrumentId)
                  .map((i) => (
                    <option key={i.id} value={i.id}>{i.nameThai}</option>
                  ))}
              </select>
            </div>
          </>
        )}

        <div className="border-t border-hairline-soft pt-4 flex flex-col gap-4">
          <Input
            label="อีเมล"
            id="email"
            type="email"
            placeholder="yourname@example.com"
            value={form.email}
            onChange={(e) => setField("email", e.target.value)}
            required
            autoComplete="email"
          />
          <Input
            label="รหัสผ่าน"
            id="password"
            type="password"
            placeholder="อย่างน้อย 8 ตัวอักษร"
            value={form.password}
            onChange={(e) => setField("password", e.target.value)}
            required
            autoComplete="new-password"
            error={error}
          />
        </div>

        <Button type="submit" variant="primary" disabled={loading} className="mt-2 w-full">
          {loading ? "กำลังสมัคร..." : "สมัครสมาชิก"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        มีบัญชีแล้ว?{" "}
        <Link href="/login" className="text-coral font-medium hover:underline">
          เข้าสู่ระบบ
        </Link>
      </p>
    </div>
  );
}
