"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Trash2, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { AlertBox } from "@/components/ui/AlertBox";
import { PageHeader } from "@/components/ui/PageHeader";
import { DateRowPicker } from "@/components/ui/DateRowPicker";
import { TimeRangePicker } from "@/components/ui/TimeRangePicker";

type DateEntry = { date: string; startTime: string; endTime: string };

const fieldClass =
  "w-full px-3 py-2 text-sm text-ink bg-white border border-hairline rounded-[var(--radius-md)] placeholder:text-muted-soft transition-colors duration-[var(--duration-pb-base)] focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/15";

export default function CreatePerformancePage() {
  const router = useRouter();
  const [todayStr] = useState(() => new Date(Date.now() + 7 * 3600 * 1000).toISOString().slice(0, 10));
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [dates, setDates] = useState<DateEntry[]>([
    { date: "", startTime: "", endTime: "" },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function addDate() {
    setDates((prev) => [...prev, { date: "", startTime: "", endTime: "" }]);
  }

  function removeDate(i: number) {
    setDates((prev) => prev.filter((_, idx) => idx !== i));
  }

  function updateDate(i: number, field: keyof DateEntry, value: string) {
    setDates((prev) =>
      prev.map((d, idx) => (idx === i ? { ...d, [field]: value } : d))
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("กรุณากรอกชื่องานแสดง");
      return;
    }
    if (!location.trim()) {
      setError("กรุณากรอกสถานที่");
      return;
    }
    if (dates.length === 0 || !dates.some((d) => d.date)) {
      setError("กรุณาเพิ่มวันที่แสดงอย่างน้อย 1 วัน");
      return;
    }
    for (let i = 0; i < dates.length; i++) {
      const d = dates[i];
      if (!d.date) {
        setError(`กรุณาเลือกวันที่สำหรับวันที่ ${i + 1}`);
        return;
      }
      if (d.date < todayStr) {
        setError(`ห้ามสร้างงานย้อนหลัง (วันที่ ${i + 1})`);
        return;
      }
      if (!d.startTime || !d.endTime) {
        setError(`กรุณากรอกเวลาเริ่มและเวลาสิ้นสุดสำหรับวันที่ ${i + 1}`);
        return;
      }
      if (d.startTime >= d.endTime) {
        setError(`เวลาสิ้นสุดต้องมากกว่าเวลาเริ่ม (วันที่ ${i + 1})`);
        return;
      }
    }

    const validDates = dates;
    setLoading(true);

    try {
      const res = await fetch("/api/performances", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          location: location.trim() || undefined,
          description: description.trim() || undefined,
          dates: validDates.map((d) => ({
            date: d.date,
            startTime: d.startTime || undefined,
            endTime: d.endTime || undefined,
          })),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "เกิดข้อผิดพลาด");
        return;
      }

      const data = await res.json();
      router.push(`/performances/${data.performance.id}`);
    } catch {
      setError("เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto px-6 md:px-8 py-8 md:py-10 flex flex-col gap-8">
      <nav
        aria-label="breadcrumb"
        className="flex items-center gap-1.5 text-xs text-muted"
      >
        <Link
          href="/performances"
          className="hover:text-ink transition-colors duration-[var(--duration-pb-base)]"
        >
          งานแสดง
        </Link>
        <ChevronRight size={12} strokeWidth={1.75} className="text-muted-soft" />
        <span className="text-ink font-medium">สร้างใหม่</span>
      </nav>

      <PageHeader
        eyebrow="Create"
        title="สร้างงานแสดงใหม่"
        description="เพิ่มเพลงและสมาชิกได้ภายหลัง"
      />

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <Field label="ชื่องาน" required>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="เช่น งานไหว้ครูดนตรีไทย 2569"
            required
          />
        </Field>

        <Field label="สถานที่" required>
          <Input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="เช่น หอประชุมใหญ่ มหาวิทยาลัย..."
            required
          />
        </Field>

        <Field label="รายละเอียด">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="รายละเอียดเพิ่มเติม..."
            rows={3}
            className={`${fieldClass} resize-none`}
          />
        </Field>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-ink">
              วันที่แสดง <span className="text-error ml-0.5">*</span>
            </label>
            <button
              type="button"
              onClick={addDate}
              className="inline-flex items-center gap-1 text-xs font-medium text-body-strong hover:text-primary transition-colors duration-[var(--duration-pb-base)]"
            >
              <Plus size={12} strokeWidth={1.75} />
              เพิ่มวัน
            </button>
          </div>
          <div className="flex flex-col gap-3">
            {dates.map((d, i) => (
              <div
                key={i}
                className="bg-surface-card border border-hairline rounded-[var(--radius-lg)] p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted">
                    วันที่ {i + 1}
                  </span>
                  {dates.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeDate(i)}
                      aria-label={`ลบวันที่ ${i + 1}`}
                      className="text-muted hover:text-error transition-colors duration-[var(--duration-pb-base)] p-1 rounded-[var(--radius-sm)]"
                    >
                      <Trash2 size={14} strokeWidth={1.75} />
                    </button>
                  )}
                </div>
                <div className="flex flex-col gap-4">
                  <DateRowPicker
                    mode="single"
                    value={d.date || null}
                    onChange={(iso) => updateDate(i, "date", iso)}
                    minDate={todayStr}
                  />
                  <TimeRangePicker
                    startTime={d.startTime}
                    endTime={d.endTime}
                    onChange={(s, e) => {
                      updateDate(i, "startTime", s);
                      updateDate(i, "endTime", e);
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {error && <AlertBox variant="danger">{error}</AlertBox>}

        <div className="flex gap-2 pt-2">
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? "กำลังบันทึก..." : "สร้างงานแสดง"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.push("/performances")}
          >
            ยกเลิก
          </Button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-ink mb-1.5">
        {label}
        {required && <span className="text-error ml-1">*</span>}
      </label>
      {children}
    </div>
  );
}
