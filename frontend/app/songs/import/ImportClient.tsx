"use client";

import { useState, useCallback } from "react";
import * as XLSX from "xlsx";
import { Check, FileSpreadsheet, Upload } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { AlertBox } from "@/components/ui/AlertBox";
import { cn } from "@/lib/utils";

interface ParsedSong {
  songCode: string;
  title: string;
  category: string;
  duration: number | null;
  valid: boolean;
  errors: string[];
}

const CATEGORIES = [
  "ดนตรีไทย",
  "ไทย สมัยเก่า",
  "ตะวันตก สมัยเก่า",
  "ตะวันตก สมัยใหม่",
  "ออริจินัล",
  "เซต",
];

function parseRows(rows: unknown[][]): ParsedSong[] {
  return rows
    .slice(1)
    .map((row) => {
      const errors: string[] = [];
      const songCode = String(row[0] ?? "").trim();
      const title = String(row[1] ?? "").trim();
      const category = String(row[2] ?? "ดนตรีไทย").trim();
      const durationRaw = row[3];

      if (!songCode) errors.push("ไม่มีรหัสเพลง");
      if (!title) errors.push("ไม่มีชื่อเพลง");
      if (category && !CATEGORIES.includes(category))
        errors.push(`ประเภทไม่ถูกต้อง: "${category}"`);

      let duration: number | null = null;
      if (durationRaw !== undefined && durationRaw !== "") {
        const n = Number(durationRaw);
        if (isNaN(n) || n < 0)
          errors.push("เวลา (วินาที) ต้องเป็นตัวเลขบวก");
        else duration = n;
      }

      return {
        songCode,
        title,
        category: category || "ดนตรีไทย",
        duration,
        valid: errors.length === 0,
        errors,
      };
    })
    .filter((r) => r.songCode || r.title);
}

export default function ImportClient() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ParsedSong[] | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ success: number; failed: number } | null>(null);
  const [dragging, setDragging] = useState(false);

  const processFile = useCallback((f: File) => {
    setFile(f);
    setResult(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = e.target?.result;
      const wb = XLSX.read(data, { type: "binary" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1 });
      setPreview(parseRows(rows));
    };
    reader.readAsBinaryString(f);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const f = e.dataTransfer.files[0];
      if (f?.name.endsWith(".xlsx") || f?.name.endsWith(".xls")) processFile(f);
    },
    [processFile]
  );

  async function handleImport() {
    if (!preview) return;
    const valid = preview.filter((s) => s.valid);
    setImporting(true);

    const res = await fetch("/api/songs/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ songs: valid }),
    });

    setImporting(false);
    if (res.ok) {
      const data = await res.json();
      setResult(data);
      setPreview(null);
      setFile(null);
    }
  }

  const validCount = preview?.filter((s) => s.valid).length ?? 0;
  const errorCount = preview?.filter((s) => !s.valid).length ?? 0;

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        className={cn(
          "border-2 border-dashed rounded-[var(--radius-xl)] p-10 md:p-12 text-center transition-colors duration-[var(--duration-pb-base)] cursor-pointer flex flex-col items-center gap-3",
          dragging
            ? "border-primary bg-primary/5"
            : "border-hairline hover:border-primary bg-surface-soft"
        )}
        onClick={() => document.getElementById("file-input")?.click()}
      >
        <input
          id="file-input"
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) processFile(f);
          }}
        />
        <div className="w-12 h-12 rounded-[var(--radius-lg)] bg-surface-cream-strong text-primary flex items-center justify-center">
          {file ? (
            <FileSpreadsheet size={24} strokeWidth={1.75} />
          ) : (
            <Upload size={24} strokeWidth={1.75} />
          )}
        </div>
        <p className="text-sm font-semibold text-ink">
          {file ? file.name : "วาง .xlsx ที่นี่ หรือคลิกเพื่อเลือกไฟล์"}
        </p>
        <p className="text-xs text-muted leading-[1.7]">
          รูปแบบ: คอลัมน์ A=รหัสเพลง · B=ชื่อเพลง · C=ประเภท · D=เวลา (วินาที)
        </p>
      </div>

      {/* Preview */}
      {preview && preview.length > 0 && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Badge variant="success">{validCount} แถวถูกต้อง</Badge>
            {errorCount > 0 && (
              <Badge variant="danger">{errorCount} แถวมีข้อผิดพลาด</Badge>
            )}
          </div>

          <div className="border border-hairline rounded-[var(--radius-lg)] overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-surface-cream-strong">
                <tr>
                  {["รหัส", "ชื่อเพลง", "ประเภท", "เวลา", "สถานะ"].map((h) => (
                    <th
                      key={h}
                      className="text-left px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.12em] text-muted"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline-soft">
                {preview.map((song, i) => (
                  <tr
                    key={i}
                    className={cn(
                      !song.valid && "bg-[color:var(--color-danger-bg)]/40"
                    )}
                  >
                    <td className="px-4 py-2 text-muted-soft font-mono text-xs">
                      {song.songCode}
                    </td>
                    <td className="px-4 py-2 text-ink">{song.title}</td>
                    <td className="px-4 py-2 text-muted">{song.category}</td>
                    <td className="px-4 py-2 text-muted tabular-nums">
                      {song.duration ?? "—"}
                    </td>
                    <td className="px-4 py-2">
                      {song.valid ? (
                        <span className="inline-flex items-center gap-1 text-[color:var(--color-success-fg)] text-xs font-medium">
                          <Check size={14} strokeWidth={1.75} />
                          ถูกต้อง
                        </span>
                      ) : (
                        <span className="text-[color:var(--color-danger-fg)] text-xs">
                          {song.errors.join(", ")}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {validCount > 0 && (
            <div className="flex gap-2">
              <Button
                variant="primary"
                onClick={handleImport}
                disabled={importing}
              >
                {importing ? "กำลัง Import..." : `Import ${validCount} เพลง`}
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setPreview(null);
                  setFile(null);
                }}
              >
                ยกเลิก
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Result */}
      {result && (
        <AlertBox variant="success">
          Import เสร็จแล้ว — สำเร็จ {result.success} เพลง
          {result.failed > 0 && ` · ล้มเหลว ${result.failed} เพลง`}
        </AlertBox>
      )}
    </div>
  );
}
