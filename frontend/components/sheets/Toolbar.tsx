"use client";

import { cn } from "@/lib/utils";
import type { CellRef, CellStyle } from "./types";

interface Props {
  selection: CellRef[];
  currentStyle: CellStyle;
  onStyleChange: (style: CellStyle) => void;
  onMerge: () => void;
  onUnmerge: () => void;
  onExport: () => void;
  onAddRow: () => void;
  onDeleteRow: () => void;
  onAddCol: () => void;
  onDeleteCol: () => void;
}

const FONT_FAMILIES = ["Sarabun", "Roboto", "monospace"];

export function Toolbar({
  selection,
  currentStyle,
  onStyleChange,
  onMerge,
  onUnmerge,
  onExport,
  onAddRow,
  onDeleteRow,
  onAddCol,
  onDeleteCol,
}: Props) {
  const hasSelection = selection.length > 0;
  const canMerge = selection.length > 1;

  const toggleBtn = (active: boolean | undefined, label: string, onClick: () => void, title: string) => (
    <button
      type="button"
      onClick={onClick}
      disabled={!hasSelection}
      title={title}
      className={cn(
        "h-8 w-8 flex items-center justify-center rounded-md text-sm border border-hairline transition-colors",
        "disabled:opacity-40 disabled:cursor-not-allowed",
        active
          ? "bg-primary text-on-primary border-primary"
          : "bg-surface-card text-ink hover:bg-surface-cream-strong"
      )}
    >
      {label}
    </button>
  );

  return (
    <div className="flex items-center gap-1 flex-wrap border-b border-hairline bg-surface-soft px-3 py-2">
      {toggleBtn(currentStyle.isBold, "B", () => onStyleChange({ isBold: !currentStyle.isBold }), "ตัวหนา")}
      {toggleBtn(currentStyle.isItalic, "I", () => onStyleChange({ isItalic: !currentStyle.isItalic }), "ตัวเอียง")}
      {toggleBtn(currentStyle.isUnderline, "U", () => onStyleChange({ isUnderline: !currentStyle.isUnderline }), "ขีดเส้นใต้")}

      <span className="w-px h-6 bg-hairline mx-1" />

      {toggleBtn(currentStyle.textAlign === "left", "⟵", () => onStyleChange({ textAlign: "left" }), "ชิดซ้าย")}
      {toggleBtn(currentStyle.textAlign === "center", "↔", () => onStyleChange({ textAlign: "center" }), "กึ่งกลาง")}
      {toggleBtn(currentStyle.textAlign === "right", "⟶", () => onStyleChange({ textAlign: "right" }), "ชิดขวา")}

      <span className="w-px h-6 bg-hairline mx-1" />

      <label className="flex items-center gap-1 text-xs text-muted">
        <span>ขนาด</span>
        <input
          type="number"
          min={6}
          max={72}
          value={currentStyle.fontSize ?? 14}
          onChange={(e) => onStyleChange({ fontSize: parseInt(e.target.value, 10) || 14 })}
          disabled={!hasSelection}
          className="w-14 h-8 border border-hairline rounded-md px-2 text-xs bg-surface-card text-ink outline-none focus:ring-1 focus:ring-coral/50 disabled:opacity-40"
        />
      </label>

      <label className="flex items-center gap-1 text-xs text-muted">
        <span>ฟอนต์</span>
        <select
          value={currentStyle.fontFamily ?? "Sarabun"}
          onChange={(e) => onStyleChange({ fontFamily: e.target.value })}
          disabled={!hasSelection}
          className="h-8 border border-hairline rounded-md px-2 text-xs bg-surface-card text-ink outline-none focus:ring-1 focus:ring-coral/50 disabled:opacity-40"
        >
          {FONT_FAMILIES.map((f) => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>
      </label>

      <label className="flex items-center gap-1 text-xs text-muted" title="สีพื้นหลัง">
        <span>พื้น</span>
        <input
          type="color"
          value={currentStyle.highlightColor ?? "#ffffff"}
          onChange={(e) => onStyleChange({ highlightColor: e.target.value })}
          disabled={!hasSelection}
          className="w-8 h-8 border border-hairline rounded-md bg-surface-card cursor-pointer disabled:opacity-40"
        />
      </label>

      <label className="flex items-center gap-1 text-xs text-muted" title="สีตัวอักษร">
        <span>อักษร</span>
        <input
          type="color"
          value={currentStyle.textColor ?? "#000000"}
          onChange={(e) => onStyleChange({ textColor: e.target.value })}
          disabled={!hasSelection}
          className="w-8 h-8 border border-hairline rounded-md bg-surface-card cursor-pointer disabled:opacity-40"
        />
      </label>

      <span className="w-px h-6 bg-hairline mx-1" />

      <button
        type="button"
        onClick={onMerge}
        disabled={!canMerge}
        className="h-8 px-3 text-xs border border-hairline rounded-md bg-surface-card text-ink hover:bg-surface-cream-strong disabled:opacity-40 disabled:cursor-not-allowed"
      >
        รวมเซลล์
      </button>
      <button
        type="button"
        onClick={onUnmerge}
        disabled={!hasSelection}
        className="h-8 px-3 text-xs border border-hairline rounded-md bg-surface-card text-ink hover:bg-surface-cream-strong disabled:opacity-40 disabled:cursor-not-allowed"
      >
        แยกเซลล์
      </button>

      <span className="w-px h-6 bg-hairline mx-1" />

      <button
        type="button"
        onClick={onAddRow}
        className="h-8 px-3 text-xs border border-hairline rounded-md bg-surface-card text-ink hover:bg-surface-cream-strong"
      >
        + แถว
      </button>
      <button
        type="button"
        onClick={onDeleteRow}
        disabled={!hasSelection}
        className="h-8 px-3 text-xs border border-hairline rounded-md bg-surface-card text-ink hover:bg-surface-cream-strong disabled:opacity-40 disabled:cursor-not-allowed"
      >
        − แถว
      </button>
      <button
        type="button"
        onClick={onAddCol}
        className="h-8 px-3 text-xs border border-hairline rounded-md bg-surface-card text-ink hover:bg-surface-cream-strong"
      >
        + คอลัมน์
      </button>
      <button
        type="button"
        onClick={onDeleteCol}
        disabled={!hasSelection}
        className="h-8 px-3 text-xs border border-hairline rounded-md bg-surface-card text-ink hover:bg-surface-cream-strong disabled:opacity-40 disabled:cursor-not-allowed"
      >
        − คอลัมน์
      </button>

      <span className="flex-1" />

      <button
        type="button"
        onClick={onExport}
        className="h-8 px-3 text-xs border border-hairline rounded-md bg-coral text-on-primary hover:opacity-90"
      >
        ส่งออก .xlsx
      </button>
    </div>
  );
}
