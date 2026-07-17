"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";

type StageEntry = {
  id: string;
  name: string;
  widthUnits: number;
  heightUnits: number;
  unitLabel: string;
  itemCount: number;
  versionCount: number;
  latestVersion: { versionNumber: number; createdAt: string } | null;
};

type TemplateOption = {
  id: string;
  name: string;
  widthUnits: number;
  heightUnits: number;
  unitLabel: string;
};

type Props = {
  performanceId: string;
  stages: StageEntry[];
  templates: TemplateOption[];
  isAdmin: boolean;
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function StageListClient({ performanceId, stages: initial, templates, isAdmin }: Props) {
  const router = useRouter();
  const [stages, setStages] = useState(initial);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);

  const [newName, setNewName] = useState("ผังเวทีหลัก");
  const [newWidth, setNewWidth] = useState("10");
  const [newHeight, setNewHeight] = useState("8");
  const [newUnit, setNewUnit] = useState("ม.");
  const [newTemplateId, setNewTemplateId] = useState("");

  async function handleCreate() {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch(`/api/performances/${performanceId}/stages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          widthUnits: parseFloat(newWidth) || 10,
          heightUnits: parseFloat(newHeight) || 8,
          unitLabel: newUnit.trim() || "ม.",
          templateId: newTemplateId || undefined,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const s = data.stage;
        setStages((prev) => [
          ...prev,
          {
            id: s.id,
            name: s.name,
            widthUnits: s.widthUnits,
            heightUnits: s.heightUnits,
            unitLabel: s.unitLabel,
            itemCount: s._count?.items ?? 0,
            versionCount: s._count?.versions ?? 1,
            latestVersion: s.versions?.[0]
              ? { versionNumber: s.versions[0].versionNumber, createdAt: s.versions[0].createdAt }
              : null,
          },
        ]);
        setShowCreate(false);
        router.push(`/performances/${performanceId}/stages/${s.id}`);
      }
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {isAdmin && (
        <div>
          {!showCreate ? (
            <Button size="sm" variant="coral" onClick={() => setShowCreate(true)}>
              + สร้างผังเวที
            </Button>
          ) : (
            <div className="border border-hairline-soft rounded-[var(--radius-lg)] bg-surface-card p-5 max-w-lg">
              <p className="text-sm font-semibold text-ink mb-4">สร้างผังเวทีใหม่</p>
              <div className="flex flex-col gap-3">
                <div>
                  <label className="text-xs text-muted mb-1 block">ชื่อผัง</label>
                  <Input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="ผังเวทีหลัก"
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-xs text-muted mb-1 block">กว้าง</label>
                    <Input
                      type="number"
                      value={newWidth}
                      onChange={(e) => setNewWidth(e.target.value)}
                      min="1"
                      step="0.5"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted mb-1 block">ยาว</label>
                    <Input
                      type="number"
                      value={newHeight}
                      onChange={(e) => setNewHeight(e.target.value)}
                      min="1"
                      step="0.5"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted mb-1 block">หน่วย</label>
                    <Input
                      value={newUnit}
                      onChange={(e) => setNewUnit(e.target.value)}
                      placeholder="ม."
                    />
                  </div>
                </div>
                {templates.length > 0 && (
                  <div>
                    <label className="text-xs text-muted mb-1 block">เทมเพลต (ไม่บังคับ)</label>
                    <select
                      value={newTemplateId}
                      onChange={(e) => setNewTemplateId(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-hairline rounded-[var(--radius-md)] bg-canvas text-ink outline-none focus:border-coral focus:ring-[3px] focus:ring-coral/20"
                    >
                      <option value="">— ไม่ใช้เทมเพลต —</option>
                      {templates.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} ({t.widthUnits}×{t.heightUnits} {t.unitLabel})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="flex gap-2 pt-1">
                  <Button size="sm" variant="coral" onClick={handleCreate} disabled={creating || !newName.trim()}>
                    {creating ? "กำลังสร้าง..." : "สร้าง"}
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => setShowCreate(false)}>
                    ยกเลิก
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {stages.length === 0 ? (
        <p className="text-sm text-muted-soft">ยังไม่มีผังเวทีสำหรับงานแสดงนี้</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {stages.map((s) => (
            <Link
              key={s.id}
              href={`/performances/${performanceId}/stages/${s.id}`}
              className="block group"
            >
              <Card className="h-full transition-shadow hover:shadow-md">
                <div className="flex flex-col gap-2">
                  <p className="text-base font-semibold text-ink group-hover:text-coral transition-colors">
                    {s.name}
                  </p>
                  <p className="text-sm text-muted">
                    {s.widthUnits} × {s.heightUnits} {s.unitLabel}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-muted-soft mt-1">
                    <span>{s.itemCount} เครื่องดนตรี</span>
                    <span>·</span>
                    <span>{s.versionCount} เวอร์ชัน</span>
                  </div>
                  {s.latestVersion && (
                    <p className="text-xs text-muted-soft">
                      อัพเดตล่าสุด: {formatDate(s.latestVersion.createdAt)}
                    </p>
                  )}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
