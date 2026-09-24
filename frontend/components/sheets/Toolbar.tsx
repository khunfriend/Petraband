"use client";

import { useEffect, useState } from "react";
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
  onUndo: () => void;
  onRedo: () => void;
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
  onUndo,
  onRedo,
}: Props) {
  const hasSelection = selection.length > 0;
  const canMerge = selection.length > 1;

  const [borderWidth, setBorderWidth] = useState("1px");
  const [borderStyle, setBorderStyle] = useState("solid");

  const borderBtn = (
    label: string,
    title: string,
    sides: { top?: boolean; right?: boolean; bottom?: boolean; left?: boolean },
    clear = false
  ) => {
    const value = clear ? "" : `${borderWidth} ${borderStyle} #000000`;
    const patch: CellStyle = {};
    if (sides.top) patch.borderTop = value;
    if (sides.right) patch.borderRight = value;
    if (sides.bottom) patch.borderBottom = value;
    if (sides.left) patch.borderLeft = value;
    return (
      <button
        type="button"
        onClick={() => onStyleChange(patch)}
        disabled={!hasSelection}
        title={title}
        className="h-8 w-8 rounded-md border border-hairline bg-surface-card text-ink text-sm hover:border-primary disabled:opacity-40 transition-colors duration-[var(--duration-pb-base)]"
      >
        {label}
      </button>
    );
  };

  // Local state so typing multi-digit sizes doesn't fire onChange per keystroke
  // (which would re-apply style + steal focus back to the editor after digit 1).
  const [sizeInput, setSizeInput] = useState<string>(String(currentStyle.fontSize ?? 14));
  useEffect(() => {
    setSizeInput(String(currentStyle.fontSize ?? 14));
  }, [currentStyle.fontSize]);
  // Every valid value is already applied live by handleSizeChange, so leaving
  // the box only has to put the cell's size back on display. Re-applying here
  // would run after focus has gone elsewhere and drag it back into the cell.
  const commitSize = () => {
    setSizeInput(String(currentStyle.fontSize ?? 14));
  };
  // Push a live size update every time the value parses to a valid number so
  // the selection reflows in real time as the user types / holds arrow keys.
  const handleSizeChange = (raw: string) => {
    setSizeInput(raw);
    const n = parseInt(raw, 10);
    // No "differs from the cell's size" check here: with part of a cell's text
    // selected, setting it back to the cell's own size is a real change.
    if (Number.isFinite(n) && n > 0 && n <= 200) {
      onStyleChange({ fontSize: n });
    }
  };

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
    <div
      data-sheets-toolbar
      className="flex items-center gap-1 flex-wrap border-b border-hairline bg-surface-soft px-3 py-2"
    >
      <button
        type="button"
        onClick={onUndo}
        title="ย้อนกลับ (Ctrl+Z)"
        className="h-8 w-8 rounded-md border border-hairline bg-surface-card text-ink text-sm hover:border-primary transition-colors duration-[var(--duration-pb-base)]"
      >
        ↶
      </button>
      <button
        type="button"
        onClick={onRedo}
        title="ทำซ้ำ (Ctrl+Y)"
        className="h-8 w-8 rounded-md border border-hairline bg-surface-card text-ink text-sm hover:border-primary transition-colors duration-[var(--duration-pb-base)]"
      >
        ↷
      </button>

      <span className="w-px h-6 bg-hairline mx-1" />

      {toggleBtn(currentStyle.isBold, "B", () => onStyleChange({ isBold: !currentStyle.isBold }), "ตัวหนา")}
      {toggleBtn(currentStyle.isItalic, "I", () => onStyleChange({ isItalic: !currentStyle.isItalic }), "ตัวเอียง")}
      {toggleBtn(currentStyle.isUnderline, "U", () => onStyleChange({ isUnderline: !currentStyle.isUnderline }), "ขีดเส้นใต้")}

      <span className="w-px h-6 bg-hairline mx-1" />

      {toggleBtn(currentStyle.textAlign === "left", "⟵", () => onStyleChange({ textAlign: "left" }), "ชิดซ้าย")}
      {toggleBtn(currentStyle.textAlign === "center", "↔", () => onStyleChange({ textAlign: "center" }), "กึ่งกลาง")}
      {toggleBtn(currentStyle.textAlign === "right", "⟶", () => onStyleChange({ textAlign: "right" }), "ชิดขวา")}

      <span className="w-px h-6 bg-hairline mx-1" />

      {toggleBtn(currentStyle.verticalAlign === "top", "⤒", () => onStyleChange({ verticalAlign: "top" }), "ชิดบน")}
      {toggleBtn(
        (currentStyle.verticalAlign ?? "middle") === "middle",
        "⇳",
        () => onStyleChange({ verticalAlign: "middle" }),
        "กึ่งกลางแนวตั้ง"
      )}
      {toggleBtn(currentStyle.verticalAlign === "bottom", "⤓", () => onStyleChange({ verticalAlign: "bottom" }), "ชิดล่าง")}
      {toggleBtn(
        !!currentStyle.wrapText,
        "↵",
        () => onStyleChange({ wrapText: !currentStyle.wrapText }),
        "ตัดคำขึ้นบรรทัดใหม่"
      )}

      <span className="w-px h-6 bg-hairline mx-1" />

      <label className="flex items-center gap-1 text-xs text-muted">
        <span>ขนาด</span>
        <input
          type="number"
          min={1}
          max={200}
          value={sizeInput}
          onChange={(e) => handleSizeChange(e.target.value)}
          onBlur={commitSize}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              (e.currentTarget as HTMLInputElement).blur();
            }
          }}
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

      <label className="flex items-center gap-1 text-xs text-muted" title="ความหนาเส้นขอบ">
        <span>เส้น</span>
        <select
          value={borderWidth}
          onChange={(e) => setBorderWidth(e.target.value)}
          disabled={!hasSelection}
          className="h-8 border border-hairline rounded-md px-1 text-xs bg-surface-card text-ink outline-none focus:ring-1 focus:ring-coral/50 disabled:opacity-40"
        >
          {["1px", "2px", "3px"].map((w) => (
            <option key={w} value={w}>{w}</option>
          ))}
        </select>
      </label>

      <select
        value={borderStyle}
        onChange={(e) => setBorderStyle(e.target.value)}
        disabled={!hasSelection}
        title="รูปแบบเส้นขอบ"
        className="h-8 border border-hairline rounded-md px-1 text-xs bg-surface-card text-ink outline-none focus:ring-1 focus:ring-coral/50 disabled:opacity-40"
      >
        <option value="solid">ทึบ</option>
        <option value="dashed">ประ</option>
        <option value="dotted">จุด</option>
        <option value="double">คู่</option>
      </select>

      {borderBtn("⊞", "รอบทั้งหมด", { top: true, right: true, bottom: true, left: true })}
      {borderBtn("⎺", "ด้านบน", { top: true })}
      {borderBtn("⎽", "ด้านล่าง", { bottom: true })}
      {borderBtn("▏", "ด้านซ้าย", { left: true })}
      {borderBtn("▕", "ด้านขวา", { right: true })}
      {borderBtn("⊘", "ลบเส้นขอบ", { top: true, right: true, bottom: true, left: true }, true)}

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
