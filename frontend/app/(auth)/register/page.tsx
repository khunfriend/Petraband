"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import Image from "next/image";

interface Instrument {
  id: string;
  nameThai: string;
  name: string;
}

interface UpcomingPerformance {
  id: string;
  name: string;
  dates: { date: string }[];
}

function getGenerations() {
  const currentYear = new Date().getFullYear();
  const currentGen = currentYear - 2006;
  const gens: string[] = [];
  for (let i = currentGen; i >= 1; i--) gens.push(`#${i}`);
  gens.push("#สมทบ", "#อาจารย์");
  return gens;
}

const selectClass =
  "h-10 rounded-[var(--radius-md)] border border-hairline bg-surface-soft px-3.5 text-sm text-ink focus:outline-none focus:border-coral focus:ring-[3px] focus:ring-coral/20";

export default function RegisterPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isTemporary, setIsTemporary] = useState(false);
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [upcomingPerformances, setUpcomingPerformances] = useState<UpcomingPerformance[]>([]);
  const [linkedPerformanceId, setLinkedPerformanceId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // avatar
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // instruments
  const [primaryId, setPrimaryId] = useState("");
  const [secondaryIds, setSecondaryIds] = useState<string[]>([]);

  const [form, setForm] = useState({
    email: "",
    password: "",
    nickname: "",
    firstName: "",
    lastName: "",
    contact: "",
    generation: `#${new Date().getFullYear() - 2006}`,
  });

  const GENERATIONS = getGenerations();

  useEffect(() => {
    fetch("/api/instruments")
      .then((r) => r.json())
      .then((data) => setInstruments(data.instruments || []))
      .catch(() => {});
    fetch("/api/performances/upcoming")
      .then((r) => r.json())
      .then((data) => setUpcomingPerformances(data.performances || []))
      .catch(() => {});
  }, []);

  function setField(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function toggleSecondary(id: string) {
    setSecondaryIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarPreview(URL.createObjectURL(file));
    setUploadingAvatar(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload/avatar", { method: "POST", body: fd });
      if (res.ok) {
        setAvatarUrl((await res.json()).url);
      } else {
        alert((await res.json().catch(() => ({}))).error || "อัปโหลดรูปไม่สำเร็จ");
        setAvatarPreview(null);
      }
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (uploadingAvatar) { setError("กรุณารอให้อัปโหลดรูปเสร็จก่อน"); return; }
    setLoading(true);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: form.email,
        password: form.password,
        nickname: form.nickname,
        contact: form.contact || undefined,
        isTemporary,
        // regular-only fields
        ...(!isTemporary && {
          firstName: form.firstName || undefined,
          lastName: form.lastName || undefined,
          avatarUrl: avatarUrl || undefined,
          generation: form.generation,
          secondaryInstrumentIds: secondaryIds,
        }),
        // temp-only fields
        ...(isTemporary && {
          linkedPerformanceId: linkedPerformanceId || undefined,
        }),
        primaryInstrumentId: primaryId || undefined,
        secondaryInstrumentIds: isTemporary ? [] : secondaryIds,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) { setError(data.error || "เกิดข้อผิดพลาด"); return; }
    router.push("/login?registered=1");
  }

  const secondaryOptions = instruments.filter((i) => i.id !== primaryId);

  return (
    <div className="bg-surface-card border border-hairline-soft rounded-[var(--radius-xl)] p-8 w-full max-w-md mx-auto">
      <h1 className="text-xl font-bold text-ink mb-1">สมัครสมาชิก</h1>
      <p className="text-sm text-muted mb-5">Join PETRAband</p>

      {/* Mode toggle */}
      <div className="flex rounded-[var(--radius-md)] border border-hairline overflow-hidden mb-6">
        <button
          type="button"
          onClick={() => setIsTemporary(false)}
          className={`flex-1 py-2 text-sm font-medium transition-colors ${
            !isTemporary ? "bg-coral text-white" : "bg-canvas text-muted hover:text-ink"
          }`}
        >
          บัญชีทั่วไป
        </button>
        <button
          type="button"
          onClick={() => setIsTemporary(true)}
          className={`flex-1 py-2 text-sm font-medium transition-colors border-l border-hairline ${
            isTemporary ? "bg-coral text-white" : "bg-canvas text-muted hover:text-ink"
          }`}
        >
          บัญชีชั่วคราว
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">

        {/* Avatar — regular only */}
        {!isTemporary && (
          <div className="flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="relative w-20 h-20 rounded-full bg-surface-cream-strong border-2 border-dashed border-hairline hover:border-coral transition-colors overflow-hidden group"
            >
              {avatarPreview ? (
                <Image src={avatarPreview} alt="avatar" fill className="object-cover" />
              ) : (
                <span className="text-3xl text-muted group-hover:text-coral transition-colors select-none">+</span>
              )}
              {uploadingAvatar && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <span className="text-white text-[11px]">อัปโหลด...</span>
                </div>
              )}
            </button>
            <span className="text-xs text-muted-soft">รูปโปรไฟล์ (ไม่บังคับ)</span>
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleAvatarChange} />
          </div>
        )}

        {/* ชื่อ User */}
        <Input
          label="ชื่อ User (ชื่อเล่น)"
          id="nickname"
          placeholder="เช่น แตน, มิ้น, บอส"
          value={form.nickname}
          onChange={(e) => setField("nickname", e.target.value)}
          required
        />

        {/* ชื่อจริง + นามสกุล — regular only */}
        {!isTemporary && (
          <div className="grid grid-cols-2 gap-3">
            <Input label="ชื่อจริง" id="firstName" placeholder="ชื่อ" value={form.firstName} onChange={(e) => setField("firstName", e.target.value)} />
            <Input label="นามสกุล" id="lastName" placeholder="นามสกุล" value={form.lastName} onChange={(e) => setField("lastName", e.target.value)} />
          </div>
        )}

        {/* รุ่น — regular only */}
        {!isTemporary && (
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-ink">รุ่น Petra</label>
            <select className={selectClass} value={form.generation} onChange={(e) => setField("generation", e.target.value)}>
              {GENERATIONS.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
        )}

        {/* เครื่องดนตรีหลัก */}
        {instruments.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-ink">เครื่องดนตรีหลัก</label>
            <select
              className={selectClass}
              value={primaryId}
              onChange={(e) => {
                setPrimaryId(e.target.value);
                setSecondaryIds((prev) => prev.filter((id) => id !== e.target.value));
              }}
            >
              <option value="">-- เลือกเครื่องดนตรี --</option>
              {instruments.map((i) => <option key={i.id} value={i.id}>{i.nameThai}</option>)}
            </select>
          </div>
        )}

        {/* เครื่องดนตรีที่เล่นเป็น — regular only */}
        {!isTemporary && secondaryOptions.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-ink">
              เครื่องดนตรีที่เล่นเป็น
              <span className="ml-1 text-xs text-muted-soft font-normal">(เลือกได้มากกว่า 1)</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {secondaryOptions.map((i) => {
                const selected = secondaryIds.includes(i.id);
                return (
                  <button
                    key={i.id}
                    type="button"
                    onClick={() => toggleSecondary(i.id)}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                      selected ? "bg-coral text-white border-coral" : "bg-canvas border-hairline text-ink hover:border-coral hover:text-coral"
                    }`}
                  >
                    {i.nameThai}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* งานที่แสดง — temp only */}
        {isTemporary && (
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-ink">
              งานที่แสดง
              <span className="ml-1 text-xs text-red-500 font-normal">*</span>
            </label>
            {upcomingPerformances.length === 0 ? (
              <p className="text-xs text-muted-soft">ไม่มีงานแสดงที่กำลังจะมา</p>
            ) : (
              <select
                className={selectClass}
                value={linkedPerformanceId}
                onChange={(e) => setLinkedPerformanceId(e.target.value)}
                required={isTemporary}
              >
                <option value="">-- เลือกงานแสดง --</option>
                {upcomingPerformances.map((p) => {
                  const date = p.dates[0]?.date
                    ? new Date(p.dates[0].date).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" })
                    : "";
                  return (
                    <option key={p.id} value={p.id}>
                      {p.name}{date ? ` (${date})` : ""}
                    </option>
                  );
                })}
              </select>
            )}
          </div>
        )}

        {/* Contact */}
        <Input
          label="Contact"
          id="contact"
          placeholder="เบอร์โทร, Line ID, IG ฯลฯ"
          value={form.contact}
          onChange={(e) => setField("contact", e.target.value)}
        />

        {/* อีเมล + รหัสผ่าน */}
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

        {isTemporary && (
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-[var(--radius-md)] px-3 py-2">
            บัญชีชั่วคราวใช้สำหรับนักดนตรีรับเชิญ — account จะถูกลบอัตโนมัติหลังวันแสดงผ่านไป
          </p>
        )}

        <Button type="submit" variant="primary" disabled={loading || uploadingAvatar} className="w-full">
          {loading ? "กำลังสมัคร..." : "สมัครสมาชิก"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        มีบัญชีแล้ว?{" "}
        <Link href="/login" className="text-coral font-medium hover:underline">เข้าสู่ระบบ</Link>
      </p>
    </div>
  );
}
