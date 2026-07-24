"use client";

import { useCallback, useState } from "react";
import Cropper, { Area } from "react-easy-crop";
import { Button } from "@/components/ui/Button";

type Props = {
  imageSrc: string;
  onCancel: () => void;
  onConfirm: (blob: Blob) => void;
};

async function cropToBlob(imageSrc: string, area: Area): Promise<Blob> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.crossOrigin = "anonymous";
    el.onload = () => resolve(el);
    el.onerror = reject;
    el.src = imageSrc;
  });

  const size = Math.min(area.width, area.height);
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, area.x, area.y, area.width, area.height, 0, 0, size, size);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), "image/jpeg", 0.92);
  });
}

export default function AvatarCropDialog({ imageSrc, onCancel, onConfirm }: Props) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [pixels, setPixels] = useState<Area | null>(null);
  const [saving, setSaving] = useState(false);

  const onCropComplete = useCallback((_area: Area, areaPixels: Area) => {
    setPixels(areaPixels);
  }, []);

  async function handleConfirm() {
    if (!pixels) return;
    setSaving(true);
    try {
      const blob = await cropToBlob(imageSrc, pixels);
      onConfirm(blob);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ backgroundColor: "var(--color-scrim)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !saving) onCancel();
      }}
    >
      <div className="bg-surface-card border border-hairline rounded-[var(--radius-lg)] w-full max-w-md flex flex-col overflow-hidden">
        <div className="px-5 py-4 border-b border-hairline-soft">
          <h3 className="text-sm font-semibold text-ink">ปรับรูปโปรไฟล์</h3>
          <p className="text-xs text-muted-soft mt-0.5">ลากเพื่อจัดตำแหน่ง · เลื่อนแถบเพื่อซูม</p>
        </div>

        <div className="relative bg-surface-cream-strong" style={{ height: 320 }}>
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>

        <div className="px-5 py-3 border-t border-hairline-soft flex items-center gap-3">
          <span className="text-xs text-muted-soft w-10">ซูม</span>
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="flex-1 accent-primary"
          />
        </div>

        <div className="px-5 py-4 border-t border-hairline-soft flex justify-end gap-2">
          <Button type="button" size="sm" variant="secondary" onClick={onCancel} disabled={saving}>
            ยกเลิก
          </Button>
          <Button type="button" size="sm" variant="primary" onClick={handleConfirm} disabled={saving || !pixels}>
            {saving ? "กำลังบันทึก..." : "ยืนยัน"}
          </Button>
        </div>
      </div>
    </div>
  );
}
