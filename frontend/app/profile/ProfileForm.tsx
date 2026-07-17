"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";

interface Instrument {
  id: string;
  name: string;
  nameThai: string;
}

interface Props {
  user: {
    id: string;
    nickname: string;
    generation: string;
    email: string;
    primaryInstrumentId: string | null;
    secondaryInstrumentId: string | null;
  };
  instruments: Instrument[];
}

const GENERATIONS = ["#17", "#18", "#19", "#20", "#สมทบ", "#อาจารย์"];

export default function ProfileForm({ user, instruments }: Props) {
  const [nickname, setNickname] = useState(user.nickname);
  const [generation, setGeneration] = useState(user.generation);
  const [primaryId, setPrimaryId] = useState(user.primaryInstrumentId ?? "");
  const [secondaryId, setSecondaryId] = useState(user.secondaryInstrumentId ?? "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    const res = await fetch(`/api/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nickname,
        generation,
        primaryInstrumentId: primaryId || null,
        secondaryInstrumentId: secondaryId || null,
      }),
    });

    setSaving(false);
    setMessage(res.ok ? "บันทึกเรียบร้อยแล้ว" : "เกิดข้อผิดพลาด กรุณาลองใหม่");
  }

  return (
    <Card>
      <h2 className="text-base font-semibold text-ink mb-4">ข้อมูลส่วนตัว</h2>
      <form onSubmit={handleSave} className="flex flex-col gap-4">
        <Input
          label="ชื่อเล่น"
          id="nickname"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          required
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-ink">รุ่น</label>
          <select
            className="h-10 rounded-[var(--radius-md)] border border-hairline bg-surface-soft px-3.5 text-sm text-ink focus:outline-none focus:border-coral focus:ring-[3px] focus:ring-coral/20"
            value={generation}
            onChange={(e) => setGeneration(e.target.value)}
          >
            {GENERATIONS.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-ink">เครื่องดนตรีหลัก</label>
          <select
            className="h-10 rounded-[var(--radius-md)] border border-hairline bg-surface-soft px-3.5 text-sm text-ink focus:outline-none focus:border-coral focus:ring-[3px] focus:ring-coral/20"
            value={primaryId}
            onChange={(e) => setPrimaryId(e.target.value)}
          >
            <option value="">-- ไม่ระบุ --</option>
            {instruments.map((i) => (
              <option key={i.id} value={i.id}>{i.nameThai}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-ink">เครื่องดนตรีรอง</label>
          <select
            className="h-10 rounded-[var(--radius-md)] border border-hairline bg-surface-soft px-3.5 text-sm text-ink focus:outline-none focus:border-coral focus:ring-[3px] focus:ring-coral/20"
            value={secondaryId}
            onChange={(e) => setSecondaryId(e.target.value)}
          >
            <option value="">-- ไม่มี --</option>
            {instruments
              .filter((i) => i.id !== primaryId)
              .map((i) => (
                <option key={i.id} value={i.id}>{i.nameThai}</option>
              ))}
          </select>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? "กำลังบันทึก..." : "บันทึก"}
          </Button>
          {message && (
            <span className={`text-sm ${message.includes("ผิด") ? "text-error" : "text-success"}`}>
              {message}
            </span>
          )}
        </div>
      </form>
    </Card>
  );
}
