"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

type DateEntry = { date: string; startTime: string; endTime: string };

export default function CreatePerformancePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [dates, setDates] = useState<DateEntry[]>([{ date: "", startTime: "", endTime: "" }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function addDate() {
    setDates((prev) => [...prev, { date: "", startTime: "", endTime: "" }]);
  }

  function removeDate(i: number) {
    setDates((prev) => prev.filter((_, idx) => idx !== i));
  }

  function updateDate(i: number, field: keyof DateEntry, value: string) {
    setDates((prev) => prev.map((d, idx) => (idx === i ? { ...d, [field]: value } : d)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("กรุณากรอกชื่องานแสดง");
      return;
    }

    const validDates = dates.filter((d) => d.date);
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
    <div className="w-full max-w-[640px] mx-auto px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-ink">สร้างงานแสดงใหม่</h1>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div>
          <label className="block text-sm font-medium text-ink mb-1.5">
            ชื่องาน <span className="text-coral">*</span>
          </label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="เช่น งานไหว้ครูดนตรีไทย 2569"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-ink mb-1.5">สถานที่</label>
          <Input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="เช่น หอประชุมใหญ่ มหาวิทยาลัย..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-ink mb-1.5">รายละเอียด</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="รายละเอียดเพิ่มเติม..."
            rows={3}
            className="w-full px-3 py-2 text-sm text-ink bg-canvas border border-hairline rounded-[var(--radius-md)] placeholder:text-muted-soft focus:outline-none focus:ring-2 focus:ring-coral focus:ring-offset-1 resize-none"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-ink">วันที่แสดง</label>
            <button
              type="button"
              onClick={addDate}
              className="text-xs text-coral hover:underline font-medium"
            >
              + เพิ่มวัน
            </button>
          </div>
          <div className="flex flex-col gap-3">
            {dates.map((d, i) => (
              <div
                key={i}
                className="bg-surface-card border border-hairline-soft rounded-[var(--radius-md)] p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-muted">วันที่ {i + 1}</span>
                  {dates.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeDate(i)}
                      className="text-xs text-muted hover:text-error"
                    >
                      ลบ
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-3">
                    <input
                      type="date"
                      value={d.date}
                      onChange={(e) => updateDate(i, "date", e.target.value)}
                      className="w-full px-3 py-2 text-sm text-ink bg-canvas border border-hairline rounded-[var(--radius-md)] focus:outline-none focus:ring-2 focus:ring-coral focus:ring-offset-1"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-muted mb-1">เริ่ม</label>
                    <input
                      type="time"
                      value={d.startTime}
                      onChange={(e) => updateDate(i, "startTime", e.target.value)}
                      className="w-full px-3 py-2 text-sm text-ink bg-canvas border border-hairline rounded-[var(--radius-md)] focus:outline-none focus:ring-2 focus:ring-coral focus:ring-offset-1"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-muted mb-1">สิ้นสุด</label>
                    <input
                      type="time"
                      value={d.endTime}
                      onChange={(e) => updateDate(i, "endTime", e.target.value)}
                      className="w-full px-3 py-2 text-sm text-ink bg-canvas border border-hairline rounded-[var(--radius-md)] focus:outline-none focus:ring-2 focus:ring-coral focus:ring-offset-1"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {error && (
          <p className="text-sm text-error bg-surface-card border border-hairline-soft rounded-[var(--radius-md)] px-4 py-3">
            {error}
          </p>
        )}

        <div className="flex gap-3 pt-2">
          <Button type="submit" variant="coral" disabled={loading}>
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
