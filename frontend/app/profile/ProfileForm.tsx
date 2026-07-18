"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { useToast } from "@/components/ui/Toast";
import Image from "next/image";

interface Instrument {
  id: string;
  name: string;
  nameThai: string;
}

interface Props {
  user: {
    id: string;
    nickname: string;
    firstName: string | null;
    lastName: string | null;
    avatarUrl: string | null;
    contact: string | null;
    generation: string;
    isTemporary: boolean;
    email: string;
    primaryInstrumentId: string | null;
    secondaryInstrumentIds: string[];
  };
  instruments: Instrument[];
}

function getGenerations() {
  const currentYear = new Date().getFullYear();
  const currentGen = currentYear - 2006;
  const gens: string[] = [];
  for (let i = currentGen; i >= 1; i--) gens.push(`#${i}`);
  gens.push("#สมทบ", "#อาจารย์");
  return gens;
}

export default function ProfileForm({ user, instruments }: Props) {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [nickname, setNickname] = useState(user.nickname);
  const [firstName, setFirstName] = useState(user.firstName ?? "");
  const [lastName, setLastName] = useState(user.lastName ?? "");
  const [contact, setContact] = useState(user.contact ?? "");
  const [generation, setGeneration] = useState(user.generation);
  const [primaryId, setPrimaryId] = useState(user.primaryInstrumentId ?? "");
  const [secondaryIds, setSecondaryIds] = useState<string[]>(user.secondaryInstrumentIds);
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl ?? "");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user.avatarUrl);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const isTemporary = user.isTemporary;

  const GENERATIONS = getGenerations();

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
        const data = await res.json();
        setAvatarUrl(data.url);
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || "อัปโหลดรูปไม่สำเร็จ");
        setAvatarPreview(user.avatarUrl);
      }
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (uploadingAvatar) { setMessage("กรุณารอให้อัปโหลดรูปเสร็จก่อน"); return; }
    setSaving(true);
    setMessage("");

    const res = await fetch(`/api/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nickname,
        contact: contact || null,
        primaryInstrumentId: primaryId || null,
        secondaryInstrumentIds: secondaryIds,
        ...(!isTemporary && {
          firstName: firstName || null,
          lastName: lastName || null,
          avatarUrl: avatarUrl || null,
          generation,
        }),
      }),
    });

    setSaving(false);
    setMessage(res.ok ? "บันทึกเรียบร้อยแล้ว" : "เกิดข้อผิดพลาด กรุณาลองใหม่");
  }

  const secondaryOptions = instruments.filter((i) => i.id !== primaryId);

  return (
    <Card>
      <h2 className="text-base font-semibold text-ink mb-5">ข้อมูลส่วนตัว</h2>
      <form onSubmit={handleSave} className="flex flex-col gap-4">

        {/* Avatar — regular only */}
        {!isTemporary && (
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="relative w-16 h-16 rounded-full bg-surface-cream-strong border-2 border-dashed border-hairline hover:border-coral transition-colors overflow-hidden group shrink-0"
            >
              {avatarPreview ? (
                <Image src={avatarPreview} alt="avatar" fill className="object-cover" />
              ) : (
                <span className="text-xl text-muted group-hover:text-coral transition-colors select-none">+</span>
              )}
              {uploadingAvatar && (
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                  <span className="text-white text-[10px]">อัปโหลด...</span>
                </div>
              )}
            </button>
            <div>
              <p className="text-xs font-medium text-ink">รูปโปรไฟล์</p>
              <p className="text-xs text-muted-soft mt-0.5">jpg, png, webp · สูงสุด 5MB</p>
            </div>
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleAvatarChange} />
          </div>
        )}

        {/* ชื่อ User */}
        <Input label="ชื่อ User (ชื่อเล่น)" id="nickname" value={nickname} onChange={(e) => setNickname(e.target.value)} required />

        {/* ชื่อจริง + นามสกุล — regular only */}
        {!isTemporary && (
          <div className="grid grid-cols-2 gap-3">
            <Input label="ชื่อจริง" id="firstName" placeholder="ชื่อ" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            <Input label="นามสกุล" id="lastName" placeholder="นามสกุล" value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </div>
        )}

        {/* รุ่น — regular only */}
        {!isTemporary && (
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-ink">รุ่น Petra</label>
            <select
              className="h-10 rounded-[var(--radius-md)] border border-hairline bg-surface-soft px-3.5 text-sm text-ink focus:outline-none focus:border-coral focus:ring-[3px] focus:ring-coral/20"
              value={generation}
              onChange={(e) => setGeneration(e.target.value)}
            >
              {GENERATIONS.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
        )}

        {/* เครื่องดนตรีหลัก */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-ink">เครื่องดนตรีหลัก</label>
          <select
            className="h-10 rounded-[var(--radius-md)] border border-hairline bg-surface-soft px-3.5 text-sm text-ink focus:outline-none focus:border-coral focus:ring-[3px] focus:ring-coral/20"
            value={primaryId}
            onChange={(e) => {
              setPrimaryId(e.target.value);
              setSecondaryIds((prev) => prev.filter((id) => id !== e.target.value));
            }}
          >
            <option value="">-- ไม่ระบุ --</option>
            {instruments.map((i) => (
              <option key={i.id} value={i.id}>{i.nameThai}</option>
            ))}
          </select>
        </div>

        {/* เครื่องดนตรีที่เล่นเป็น */}
        {secondaryOptions.length > 0 && (
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
                      selected
                        ? "bg-coral text-white border-coral"
                        : "bg-canvas border-hairline text-ink hover:border-coral hover:text-coral"
                    }`}
                  >
                    {i.nameThai}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Contact */}
        <Input
          label="Contact"
          id="contact"
          placeholder="เบอร์โทร, Line ID, IG ฯลฯ"
          value={contact}
          onChange={(e) => setContact(e.target.value)}
        />

        <div className="flex items-center gap-3 pt-2">
          <Button type="submit" variant="primary" disabled={saving || uploadingAvatar}>
            {saving ? "กำลังบันทึก..." : "บันทึก"}
          </Button>
          {message && (
            <span className={`text-sm ${message.includes("ผิด") || message.includes("รอ") ? "text-error" : "text-success"}`}>
              {message}
            </span>
          )}
        </div>
      </form>
    </Card>
  );
}
