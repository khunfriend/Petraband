"use client";

import { useState, useRef, useEffect } from "react";
import { toPng } from "html-to-image";
import { RotateCw, User, X, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { getInstrumentColor as getColors } from "@/lib/instrumentColors";

// ─── Types ──────────────────────────────────────────────────────────────────

type InstrumentInfo = {
  id: string;
  name: string;
  nameThai: string;
  footprintW: number;
  footprintH: number;
  iconType: string;
};

type StageItemData = {
  id: string;
  instrumentId: string | null;
  x: number;
  y: number;
  rotation: number;
  layerOrder: number;
  label: string;
  customName: string | null;
  customWidth: number | null;
  customHeight: number | null;
  instrument: InstrumentInfo | null;
};

type StageData = {
  id: string;
  name: string;
  widthUnits: number;
  heightUnits: number;
  unitLabel: string;
  items: StageItemData[];
};

type VersionEntry = {
  id: string;
  versionNumber: number;
  changeNote: string | null;
  createdAt: string;
  snapshotJson: unknown;
  createdBy: { nickname: string } | null;
};

type Participant = {
  userId: string;
  nickname: string;
  generation: string;
  primaryInstrumentId: string | null;
};

type Props = {
  stageId: string;
  performanceId: string;
  initialStage: StageData;
  instruments: InstrumentInfo[];
  participants: Participant[];
  isAdmin: boolean;
};


// ─── SVG Icons ───────────────────────────────────────────────────────────────

function InstrumentIcon({ iconType, color }: { iconType: string; color: { bg: string; border: string; text: string } }) {
  switch (iconType) {
    case "ranat":
      return (
        <svg viewBox="0 0 100 40" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <rect x="2" y="2" width="96" height="36" rx="4" fill={color.bg} stroke={color.border} strokeWidth="2.5"/>
          {[12, 22, 32, 42, 52, 62, 72, 82].map((x) => (
            <rect key={x} x={x} y="8" width="8" height="24" rx="1.5" fill={color.border} opacity="0.8"/>
          ))}
        </svg>
      );
    case "khong":
      return (
        <svg viewBox="0 0 100 100" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <ellipse cx="50" cy="50" rx="46" ry="46" fill={color.bg} stroke={color.border} strokeWidth="3"/>
          <ellipse cx="50" cy="50" rx="36" ry="36" fill="none" stroke={color.border} strokeWidth="1.5" opacity="0.4"/>
          {Array.from({ length: 14 }).map((_, i) => {
            const angle = (i * 360) / 14;
            const rad = (angle * Math.PI) / 180;
            const cx = (50 + 34 * Math.cos(rad)).toFixed(3);
            const cy = (50 + 34 * Math.sin(rad)).toFixed(3);
            return <circle key={i} cx={cx} cy={cy} r="5" fill={color.border} opacity="0.85"/>;
          })}
          <circle cx="50" cy="50" r="8" fill={color.border} opacity="0.5"/>
        </svg>
      );
    case "pi":
      return (
        <svg viewBox="0 0 40 100" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <rect x="14" y="4" width="12" height="92" rx="5" fill={color.bg} stroke={color.border} strokeWidth="2.5"/>
          {[20, 35, 50, 65, 80].map((y) => (
            <circle key={y} cx="20" cy={y} r="3" fill={color.border} opacity="0.7"/>
          ))}
        </svg>
      );
    case "so":
      return (
        <svg viewBox="0 0 60 100" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <ellipse cx="30" cy="75" rx="22" ry="20" fill={color.bg} stroke={color.border} strokeWidth="2.5"/>
          <line x1="30" y1="10" x2="30" y2="56" stroke={color.border} strokeWidth="4" strokeLinecap="round"/>
          <ellipse cx="30" cy="10" rx="8" ry="5" fill={color.border} opacity="0.6"/>
          <line x1="8" y1="75" x2="52" y2="75" stroke={color.border} strokeWidth="1.5" opacity="0.5"/>
        </svg>
      );
    case "khim":
      return (
        <svg viewBox="0 0 120 70" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <polygon points="10,65 110,65 100,5 20,5" fill={color.bg} stroke={color.border} strokeWidth="2.5"/>
          {[20, 35, 50, 65, 80, 95].map((x, i) => (
            <line key={i} x1={x} y1="60" x2={x - 5 + 10} y2="10" stroke={color.border} strokeWidth="1.5" opacity="0.6"/>
          ))}
        </svg>
      );
    case "chakhe":
      return (
        <svg viewBox="0 0 150 50" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <ellipse cx="75" cy="25" rx="70" ry="18" fill={color.bg} stroke={color.border} strokeWidth="2.5"/>
          <line x1="5" y1="25" x2="145" y2="25" stroke={color.border} strokeWidth="1.5" opacity="0.4"/>
          {[25, 50, 75, 100, 125].map((x) => (
            <line key={x} x1={x} y1="12" x2={x} y2="38" stroke={color.border} strokeWidth="1.5" opacity="0.6"/>
          ))}
          <ellipse cx="75" cy="25" rx="8" ry="8" fill={color.border} opacity="0.35"/>
        </svg>
      );
    case "drum":
      return (
        <svg viewBox="0 0 80 80" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <ellipse cx="40" cy="40" rx="36" ry="36" fill={color.bg} stroke={color.border} strokeWidth="3"/>
          <ellipse cx="40" cy="40" rx="24" ry="24" fill="none" stroke={color.border} strokeWidth="1.5" opacity="0.5"/>
          <ellipse cx="40" cy="40" rx="10" ry="10" fill={color.border} opacity="0.4"/>
        </svg>
      );
    case "ching":
      return (
        <svg viewBox="0 0 80 40" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <circle cx="20" cy="20" r="14" fill={color.bg} stroke={color.border} strokeWidth="2.5"/>
          <circle cx="20" cy="20" r="5" fill={color.border} opacity="0.6"/>
          <circle cx="60" cy="20" r="14" fill={color.bg} stroke={color.border} strokeWidth="2.5"/>
          <circle cx="60" cy="20" r="5" fill={color.border} opacity="0.6"/>
          <line x1="34" y1="20" x2="46" y2="20" stroke={color.border} strokeWidth="2" strokeDasharray="3,2" opacity="0.5"/>
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 80 80" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <rect x="4" y="4" width="72" height="72" rx="8" fill={color.bg} stroke={color.border} strokeWidth="2.5"/>
        </svg>
      );
  }
}

// ─── Snap helper ─────────────────────────────────────────────────────────────

function snap(v: number, grid = 0.1) {
  if (grid === 0) return v;
  return Math.round(v / grid) * grid;
}

// ─── Main component ──────────────────────────────────────────────────────────

export default function StageEditor({ stageId, initialStage, instruments, participants, isAdmin }: Props) {
  const confirm = useConfirm();
  const toast = useToast();

  const [stage, setStage] = useState<StageData>(initialStage);
  const [items, setItems] = useState<StageItemData[]>(initialStage.items);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showMemberPicker, setShowMemberPicker] = useState(false);
  const [equipmentInput, setEquipmentInput] = useState("");
  const [equipmentW, setEquipmentW] = useState("2");
  const [equipmentH, setEquipmentH] = useState("1");
  const [dirty, setDirty] = useState(false);
  const [snapGrid, setSnapGrid] = useState(0.1);
  const newItemCounter = useRef(0);

  // Canvas sizing
  const canvasRef = useRef<HTMLDivElement>(null);
  const [canvasPx, setCanvasPx] = useState({ w: 600, h: 400 });

  useEffect(() => {
    if (!canvasRef.current) return;
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        const w = entry.contentRect.width;
        const h = w * (stage.heightUnits / stage.widthUnits);
        setCanvasPx({ w, h });
      }
    });
    ro.observe(canvasRef.current);
    return () => ro.disconnect();
  }, [stage.widthUnits, stage.heightUnits]);

  const cellW = canvasPx.w / stage.widthUnits;
  const cellH = canvasPx.h / stage.heightUnits;

  // ── Drag state ─────────────────────────────────────────────────────────────
  const dragRef = useRef<{
    itemId: string;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
  } | null>(null);

  function onItemPointerDown(e: React.PointerEvent, item: StageItemData) {
    if (!isAdmin) return;
    e.preventDefault();
    e.stopPropagation();
    setSelectedId(item.id);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = {
      itemId: item.id,
      startX: e.clientX,
      startY: e.clientY,
      origX: item.x,
      origY: item.y,
    };
  }

  function onCanvasPointerMove(e: React.PointerEvent) {
    if (!dragRef.current) return;
    const d = dragRef.current;
    const dx = (e.clientX - d.startX) / cellW;
    const dy = (e.clientY - d.startY) / cellH;
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== d.itemId) return it;
        const instr = it.instrumentId
          ? (instruments.find((i) => i.id === it.instrumentId) ?? it.instrument)
          : null;
        const fpW = instr?.footprintW ?? it.customWidth ?? 2;
        const fpH = instr?.footprintH ?? it.customHeight ?? 1;
        const newX = snap(Math.max(0, Math.min(stage.widthUnits - fpW, d.origX + dx)), snapGrid);
        const newY = snap(Math.max(0, Math.min(stage.heightUnits - fpH, d.origY + dy)), snapGrid);
        return { ...it, x: newX, y: newY };
      })
    );
    setDirty(true);
  }

  function onCanvasPointerUp() {
    dragRef.current = null;
  }

  // ── Add from palette ────────────────────────────────────────────────────────
  function addInstrument(instr: InstrumentInfo) {
    if (!isAdmin) return;
    const x = snap(Math.max(0, stage.widthUnits / 2 - instr.footprintW / 2), snapGrid);
    const y = snap(Math.max(0, stage.heightUnits / 2 - instr.footprintH / 2), snapGrid);
    const maxLayer = items.reduce((m, it) => Math.max(m, it.layerOrder), 0);
    const newItem: StageItemData = {
      id: `new-${++newItemCounter.current}`,
      instrumentId: instr.id,
      x,
      y,
      rotation: 0,
      layerOrder: maxLayer + 1,
      label: "",
      customName: null,
      customWidth: null,
      customHeight: null,
      instrument: instr,
    };
    setItems((prev) => [...prev, newItem]);
    setSelectedId(newItem.id);
    setDirty(true);
  }

  function addEquipment(name: string, widthInput: number, heightInput: number) {
    if (!isAdmin) return;
    const trimmed = name.trim();
    if (!trimmed) return;
    const width = Math.max(0.5, Math.min(stage.widthUnits, widthInput || 2));
    const height = Math.max(0.5, Math.min(stage.heightUnits, heightInput || 1));
    const x = snap(Math.max(0, stage.widthUnits / 2 - width / 2), snapGrid);
    const y = snap(Math.max(0, stage.heightUnits / 2 - height / 2), snapGrid);
    const maxLayer = items.reduce((m, it) => Math.max(m, it.layerOrder), 0);
    const newItem: StageItemData = {
      id: `new-${++newItemCounter.current}`,
      instrumentId: null,
      x,
      y,
      rotation: 0,
      layerOrder: maxLayer + 1,
      label: "",
      customName: trimmed,
      customWidth: width,
      customHeight: height,
      instrument: null,
    };
    setItems((prev) => [...prev, newItem]);
    setSelectedId(newItem.id);
    setDirty(true);
  }

  // ── Item controls ───────────────────────────────────────────────────────────
  function rotateItem(id: string) {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, rotation: (it.rotation + 90) % 360 } : it))
    );
    setDirty(true);
  }

  function deleteItem(id: string) {
    setItems((prev) => prev.filter((it) => it.id !== id));
    if (selectedId === id) {
      setSelectedId(null);
      setShowMemberPicker(false);
    }
    setDirty(true);
  }

  function setItemLabel(id: string, label: string) {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, label } : it)));
    setDirty(true);
  }

  // Close picker when selection changes / is cleared
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!selectedId) setShowMemberPicker(false);
  }, [selectedId]);

  // Which member is currently assigned to which stage item (by label match)
  const assignedByUser = new Map<string, string>();
  for (const it of items) {
    const p = participants.find((pp) => pp.nickname === it.label);
    if (p) assignedByUser.set(p.userId, it.id);
  }

  // ── Save ────────────────────────────────────────────────────────────────────
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [changeNote, setChangeNote] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/stages/${stageId}/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((it, idx) => ({
            instrumentId: it.instrumentId,
            x: it.x,
            y: it.y,
            rotation: it.rotation,
            layerOrder: it.layerOrder ?? idx,
            label: it.label ?? "",
            customName: it.customName,
            customWidth: it.customWidth,
            customHeight: it.customHeight,
          })),
          changeNote: changeNote.trim() || undefined,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        // Refresh items with server IDs
        const serverItems: StageItemData[] = data.stage.items.map(
          (si: {
            id: string;
            instrumentId: string | null;
            x: number;
            y: number;
            rotation: number;
            layerOrder: number;
            label: string;
            customName: string | null;
            customWidth: number | null;
            customHeight: number | null;
            instrument: InstrumentInfo | null;
          }) => ({
            ...si,
            instrument: si.instrumentId
              ? (instruments.find((i) => i.id === si.instrumentId) ?? si.instrument)
              : null,
          })
        );
        setItems(serverItems);
        setDirty(false);
        setShowSaveDialog(false);
        setChangeNote("");
        toast.success("บันทึกผังเวทีแล้ว");
      } else {
        toast.error("บันทึกไม่สำเร็จ");
      }
    } finally {
      setSaving(false);
    }
  }

  // ── Stage size edit ─────────────────────────────────────────────────────────
  const [editingSize, setEditingSize] = useState(false);
  const [editW, setEditW] = useState(String(stage.widthUnits));
  const [editH, setEditH] = useState(String(stage.heightUnits));
  const [editUnit, setEditUnit] = useState(stage.unitLabel);
  const [sizeUpdating, setSizeUpdating] = useState(false);

  async function saveSize() {
    const w = parseFloat(editW) || stage.widthUnits;
    const h = parseFloat(editH) || stage.heightUnits;
    const outOfBounds = items.filter((it) => {
      const fpW = it.instrument?.footprintW ?? it.customWidth ?? 2;
      const fpH = it.instrument?.footprintH ?? it.customHeight ?? 1;
      return it.x + fpW > w || it.y + fpH > h;
    });
    if (outOfBounds.length > 0) {
      const ok = await confirm({
        title: "ปรับขนาดเวที",
        message: `${outOfBounds.length} ชิ้นจะอยู่นอกขอบเวทีใหม่ ต้องการดำเนินการต่อหรือไม่?`,
        confirmLabel: "ปรับขนาด",
        variant: "danger",
      });
      if (!ok) return;
    }
    setSizeUpdating(true);
    try {
      const res = await fetch(`/api/stages/${stageId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ widthUnits: w, heightUnits: h, unitLabel: editUnit }),
      });
      if (res.ok) {
        setStage((prev) => ({ ...prev, widthUnits: w, heightUnits: h, unitLabel: editUnit }));
        setEditingSize(false);
      }
    } finally {
      setSizeUpdating(false);
    }
  }

  // ── Version history ─────────────────────────────────────────────────────────
  const [showHistory, setShowHistory] = useState(false);
  const [versions, setVersions] = useState<VersionEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [previewVersion, setPreviewVersion] = useState<VersionEntry | null>(null);
  const [restoring, setRestoring] = useState(false);

  async function loadHistory() {
    setHistoryLoading(true);
    try {
      const res = await fetch(`/api/stages/${stageId}/versions`);
      if (res.ok) {
        const data = await res.json();
        setVersions(data.versions);
      }
    } finally {
      setHistoryLoading(false);
    }
  }

  function toggleHistory() {
    if (!showHistory) loadHistory();
    setShowHistory((v) => !v);
    setPreviewVersion(null);
  }

  async function restoreVersion(version: VersionEntry) {
    const ok = await confirm({
      title: "กู้คืนเวอร์ชัน",
      message: `กู้คืนเวอร์ชัน #${version.versionNumber}? การเปลี่ยนแปลงปัจจุบันจะถูกทับ`,
      confirmLabel: "กู้คืน",
    });
    if (!ok) return;
    setRestoring(true);
    try {
      const res = await fetch(`/api/stages/${stageId}/versions/${version.id}/restore`, {
        method: "POST",
      });
      if (res.ok) {
        const stageRes = await fetch(`/api/stages/${stageId}`);
        if (stageRes.ok) {
          const { stage: restored } = await stageRes.json();
          setItems(restored.items);
          setStage(restored);
        }
        setShowHistory(false);
        setPreviewVersion(null);
        setDirty(false);
      }
    } finally {
      setRestoring(false);
    }
  }

  // ── Export ──────────────────────────────────────────────────────────────────
  const [showExport, setShowExport] = useState(false);

  async function exportPng() {
    if (!canvasRef.current) return;
    setShowExport(false);
    try {
      const dataUrl = await toPng(canvasRef.current, { cacheBust: true });
      const a = document.createElement("a");
      a.download = `${stage.name}.png`;
      a.href = dataUrl;
      a.click();
    } catch (err) {
      console.error("Export PNG failed", err);
    }
  }

  function exportPdf() {
    setShowExport(false);
    window.print();
  }

  // ── Canvas grid CSS ─────────────────────────────────────────────────────────
  const gridStyle = {
    backgroundImage: `
      repeating-linear-gradient(0deg, rgba(0,0,0,0.08) 0px, rgba(0,0,0,0.08) 1px, transparent 1px, transparent ${cellH}px),
      repeating-linear-gradient(90deg, rgba(0,0,0,0.08) 0px, rgba(0,0,0,0.08) 1px, transparent 1px, transparent ${cellW}px)
    `,
  };

  // ── Preview canvas for a version ────────────────────────────────────────────
  type SnapshotItem = {
    instrumentId: string | null;
    x: number;
    y: number;
    rotation: number;
    layerOrder: number;
    label: string;
    customName?: string | null;
    customWidth?: number | null;
    customHeight?: number | null;
  };

  function renderVersionPreview(version: VersionEntry) {
    const snap = (version.snapshotJson as SnapshotItem[]) ?? [];
    const previewW = 300;
    const previewH = previewW * (stage.heightUnits / stage.widthUnits);
    const cW = previewW / stage.widthUnits;
    const cH = previewH / stage.heightUnits;

    return (
      <div
        className="relative border border-hairline rounded-[var(--radius-md)] overflow-hidden"
        style={{ width: previewW, height: previewH, background: "#e8e0d0" }}
      >
        {snap.map((si, idx) => {
          const instr = si.instrumentId ? instruments.find((i) => i.id === si.instrumentId) : null;
          const isCustom = !instr;
          const colors = instr ? getColors(instr.iconType) : { bg: "#f1f5f9", border: "#94a3b8", text: "#334155" };
          const fpW = instr?.footprintW ?? si.customWidth ?? 2;
          const fpH = instr?.footprintH ?? si.customHeight ?? 1;
          return (
            <div
              key={idx}
              style={{
                position: "absolute",
                left: si.x * cW,
                top: si.y * cH,
                width: fpW * cW,
                height: fpH * cH,
                transform: `rotate(${si.rotation}deg)`,
                transformOrigin: "center",
                background: isCustom ? "transparent" : colors.bg,
                border: `1px ${isCustom ? "dashed" : "solid"} ${colors.border}`,
                borderRadius: 3,
              }}
            />
          );
        })}
      </div>
    );
  }

  // ────────────────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-0 print:block">
      {/* ── Toolbar ── */}
      <div className="flex items-center gap-3 flex-wrap py-3 px-1 border-b border-hairline-soft bg-surface-card rounded-t-[var(--radius-lg)] print:hidden">
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold text-ink truncate">{stage.name}</h1>
        </div>

        {/* Size display / edit */}
        {editingSize ? (
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              value={editW}
              onChange={(e) => setEditW(e.target.value)}
              className="w-16 px-2 py-1 text-sm border border-hairline rounded-[var(--radius-md)] bg-canvas text-ink outline-none focus:border-primary"
              min="1"
              step="0.5"
            />
            <span className="text-muted text-sm">×</span>
            <input
              type="number"
              value={editH}
              onChange={(e) => setEditH(e.target.value)}
              className="w-16 px-2 py-1 text-sm border border-hairline rounded-[var(--radius-md)] bg-canvas text-ink outline-none focus:border-primary"
              min="1"
              step="0.5"
            />
            <input
              type="text"
              value={editUnit}
              onChange={(e) => setEditUnit(e.target.value)}
              className="w-12 px-2 py-1 text-sm border border-hairline rounded-[var(--radius-md)] bg-canvas text-ink outline-none focus:border-primary"
            />
            <Button size="sm" variant="coral" onClick={saveSize} disabled={sizeUpdating}>
              {sizeUpdating ? "..." : "ตกลง"}
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setEditingSize(false)}>ยกเลิก</Button>
          </div>
        ) : (
          <button
            onClick={() => { if (isAdmin) { setEditW(String(stage.widthUnits)); setEditH(String(stage.heightUnits)); setEditUnit(stage.unitLabel); setEditingSize(true); } }}
            className={`text-sm text-muted px-2 py-1 rounded-[var(--radius-md)] hover:bg-surface-cream-strong transition-colors ${!isAdmin ? "cursor-default" : "cursor-pointer"}`}
          >
            {stage.widthUnits} × {stage.heightUnits} {stage.unitLabel}
          </button>
        )}

        {/* Snap grid selector */}
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-soft shrink-0">snap</span>
          {[0.5, 0.1, 0.05, 0].map((g) => (
            <button
              key={g}
              onClick={() => setSnapGrid(g)}
              className={`px-2 py-0.5 text-xs rounded border transition-colors ${
                snapGrid === g
                  ? "bg-primary text-white border-primary"
                  : "bg-canvas text-muted border-hairline hover:bg-surface-cream-strong"
              }`}
            >
              {g === 0 ? "ไม่snap" : g === 0.5 ? "50cm" : g === 0.1 ? "10cm" : "5cm"}
            </button>
          ))}
        </div>

        {isAdmin && (
          <Button
            size="sm"
            variant="coral"
            onClick={() => setShowSaveDialog(true)}
            disabled={!dirty}
          >
            บันทึก{dirty ? " *" : ""}
          </Button>
        )}

        <Button size="sm" variant="secondary" onClick={toggleHistory}>
          {showHistory ? "ปิดประวัติ" : "ประวัติ"}
        </Button>

        {/* Export dropdown */}
        <div className="relative">
          <Button size="sm" variant="secondary" onClick={() => setShowExport((v) => !v)}>
            Export ▾
          </Button>
          {showExport && (
            <div className="absolute right-0 top-full mt-1 z-50 bg-surface-card border border-hairline rounded-[var(--radius-md)] overflow-hidden min-w-[130px]">
              <button
                onClick={exportPng}
                className="w-full text-left px-4 py-2 text-sm text-ink hover:bg-surface-cream-strong transition-colors"
              >
                Export PNG
              </button>
              <button
                onClick={exportPdf}
                className="w-full text-left px-4 py-2 text-sm text-ink hover:bg-surface-cream-strong transition-colors"
              >
                Export PDF
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Save dialog ── */}
      {showSaveDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 print:hidden">
          <div className="bg-surface-card border border-hairline rounded-[var(--radius-lg)] p-6 w-full max-w-sm">
            <p className="text-base font-semibold text-ink mb-3">บันทึกผังเวที</p>
            <label className="text-xs text-muted block mb-1">หมายเหตุการแก้ไข (ไม่บังคับ)</label>
            <input
              autoFocus
              type="text"
              value={changeNote}
              onChange={(e) => setChangeNote(e.target.value)}
              placeholder="เช่น เพิ่มระนาด, จัดเรียงใหม่"
              className="w-full px-3 py-2 text-sm border border-hairline rounded-[var(--radius-md)] bg-canvas text-ink placeholder:text-muted-soft outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/15 mb-4"
              onKeyDown={(e) => { if (e.key === "Enter") handleSave(); }}
            />
            <div className="flex gap-2">
              <Button variant="coral" size="sm" onClick={handleSave} disabled={saving}>
                {saving ? "กำลังบันทึก..." : "บันทึก"}
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setShowSaveDialog(false)}>
                ยกเลิก
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Main layout ── */}
      <div className="flex gap-0 min-h-[calc(100vh-180px)]">
        {/* ── Palette ── */}
        {isAdmin && (
          <div className="w-44 shrink-0 border-r border-hairline-soft bg-surface-soft overflow-y-auto print:hidden">
            <p className="text-[11px] font-semibold text-muted uppercase tracking-[1.5px] px-3 pt-3 pb-2">
              เครื่องดนตรี
            </p>
            <div className="flex flex-col gap-1 px-2 pb-4">
              {instruments.map((instr) => {
                const colors = getColors(instr.iconType);
                return (
                  <button
                    key={instr.id}
                    onClick={() => addInstrument(instr)}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-[var(--radius-md)] hover:bg-surface-cream-strong transition-colors text-left group"
                    title={`เพิ่ม ${instr.nameThai}`}
                  >
                    <div
                      className="w-7 h-7 shrink-0 rounded flex items-center justify-center overflow-hidden"
                      style={{ background: colors.bg, border: `1px solid ${colors.border}` }}
                    >
                      <div className="w-full h-full p-0.5">
                        <InstrumentIcon iconType={instr.iconType} color={colors} />
                      </div>
                    </div>
                    <span className="text-xs text-ink truncate">{instr.nameThai}</span>
                  </button>
                );
              })}
            </div>

            <p className="text-[11px] font-semibold text-muted uppercase tracking-[1.5px] px-3 pt-2 pb-2 border-t border-hairline-soft">
              อุปกรณ์
            </p>
            <div className="px-2 pb-4 flex flex-col gap-2">
              <input
                type="text"
                value={equipmentInput}
                onChange={(e) => setEquipmentInput(e.target.value)}
                placeholder="เช่น โต๊ะ, ไมค์"
                className="w-full px-2 py-1.5 text-xs border border-hairline rounded-[var(--radius-md)] bg-canvas text-ink placeholder:text-muted-soft outline-none focus:border-primary"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && equipmentInput.trim()) {
                    addEquipment(equipmentInput, parseFloat(equipmentW), parseFloat(equipmentH));
                    setEquipmentInput("");
                  }
                }}
              />
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={equipmentW}
                  onChange={(e) => setEquipmentW(e.target.value)}
                  min="0.5"
                  step="0.5"
                  aria-label="กว้าง"
                  className="w-full min-w-0 px-2 py-1.5 text-xs border border-hairline rounded-[var(--radius-md)] bg-canvas text-ink outline-none focus:border-primary"
                />
                <span className="text-xs text-muted-soft shrink-0">×</span>
                <input
                  type="number"
                  value={equipmentH}
                  onChange={(e) => setEquipmentH(e.target.value)}
                  min="0.5"
                  step="0.5"
                  aria-label="ยาว"
                  className="w-full min-w-0 px-2 py-1.5 text-xs border border-hairline rounded-[var(--radius-md)] bg-canvas text-ink outline-none focus:border-primary"
                />
                <span className="text-[10px] text-muted-soft shrink-0">{stage.unitLabel}</span>
              </div>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  addEquipment(equipmentInput, parseFloat(equipmentW), parseFloat(equipmentH));
                  setEquipmentInput("");
                }}
                disabled={!equipmentInput.trim()}
              >
                + เพิ่ม
              </Button>
              <p className="text-[10px] text-muted-soft px-1 leading-relaxed">
                อุปกรณ์นี้อยู่ในผังนี้เท่านั้น ไม่ข้ามงานแสดงอื่น
              </p>
            </div>
          </div>
        )}

        {/* ── Canvas area ── */}
        <div
          className="flex-1 overflow-auto bg-canvas p-4 flex items-start justify-center print:p-0"
          onClick={() => { setSelectedId(null); setShowExport(false); }}
        >
          <div className="w-full max-w-4xl">
            <div
              ref={canvasRef}
              className="relative w-full bg-[#e8e0d0] rounded-[var(--radius-md)] border border-hairline overflow-hidden select-none print:rounded-none print:border-0"
              style={{
                height: canvasPx.h > 0 ? canvasPx.h : undefined,
                paddingBottom: canvasPx.h === 0 ? `${(stage.heightUnits / stage.widthUnits) * 100}%` : 0,
                ...gridStyle,
              }}
              onPointerMove={onCanvasPointerMove}
              onPointerUp={onCanvasPointerUp}
              onPointerLeave={onCanvasPointerUp}
              onClick={(e) => { e.stopPropagation(); setSelectedId(null); }}
            >
              {items.map((item) => {
                const instr = item.instrumentId
                  ? (instruments.find((i) => i.id === item.instrumentId) ?? item.instrument)
                  : null;
                const isCustom = !instr;
                const colors = getColors(instr?.iconType ?? "default");
                const selected = selectedId === item.id;
                const fpW = instr?.footprintW ?? item.customWidth ?? 2;
                const fpH = instr?.footprintH ?? item.customHeight ?? 1;
                const w = fpW * cellW;
                const h = fpH * cellH;
                const centerX = item.x * cellW + w / 2;
                const bottomY = item.y * cellH + h;

                return (
                  <div key={item.id} style={{ display: "contents" }}>
                  <div
                    style={{
                      position: "absolute",
                      left: item.x * cellW,
                      top: item.y * cellH,
                      width: w,
                      height: h,
                      transform: `rotate(${item.rotation}deg)`,
                      transformOrigin: "center",
                      zIndex: selected ? 20 : item.layerOrder + 1,
                      cursor: isAdmin ? "grab" : "default",
                    }}
                    onPointerDown={(e) => onItemPointerDown(e, item)}
                    onClick={(e) => { e.stopPropagation(); setSelectedId(item.id); }}
                  >
                    {/* Icon box */}
                    <div
                      className="w-full h-full rounded flex flex-col items-center justify-center overflow-hidden"
                      style={{
                        background: isCustom ? "transparent" : colors.bg,
                        border: `${selected ? "2px" : "1px"} ${isCustom ? "dashed" : "solid"} ${selected ? "#dd5085" : (isCustom ? "#5c6b80" : colors.border)}`,
                        boxShadow: selected ? "0 0 0 3px rgba(221,80,133,0.25)" : undefined,
                      }}
                    >
                      {isCustom ? (
                        <span
                          className="text-center leading-tight font-semibold px-1 truncate w-full text-ink"
                          style={{ fontSize: Math.max(10, Math.min(16, h * 0.28)) }}
                          title={item.customName ?? ""}
                        >
                          {item.customName}
                        </span>
                      ) : (
                        <>
                          <div style={{ width: "80%", height: "60%" }}>
                            <InstrumentIcon iconType={instr?.iconType ?? "default"} color={colors} />
                          </div>
                          <span
                            className="text-center leading-tight font-medium mt-0.5 px-0.5 truncate w-full"
                            style={{ fontSize: Math.max(8, Math.min(11, h * 0.18)), color: colors.text }}
                          >
                            {instr?.nameThai ?? ""}
                          </span>
                        </>
                      )}
                    </div>


                    {/* Controls when selected */}
                    {selected && isAdmin && (
                      <>
                        <div
                          className="absolute flex gap-1 z-30"
                          style={{ top: -28, left: "50%", transform: "translateX(-50%)" }}
                          onPointerDown={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={(e) => { e.stopPropagation(); rotateItem(item.id); }}
                            className="w-6 h-6 rounded-[var(--radius-sm)] bg-primary text-on-primary flex items-center justify-center hover:bg-primary-active transition-colors duration-[var(--duration-pb-base)]"
                            title="หมุน 90°"
                            aria-label="หมุน 90 องศา"
                          >
                            <RotateCw size={12} strokeWidth={1.75} />
                          </button>
                          {!isCustom && (
                            <button
                              onClick={(e) => { e.stopPropagation(); setShowMemberPicker((v) => !v); }}
                              className={`w-6 h-6 rounded-[var(--radius-sm)] flex items-center justify-center transition-colors duration-[var(--duration-pb-base)] ${
                                item.label
                                  ? "bg-primary text-on-primary hover:bg-primary-active"
                                  : "bg-surface-card border border-hairline text-ink hover:border-primary"
                              }`}
                              title="กำหนดสมาชิก"
                              aria-label="กำหนดสมาชิก"
                            >
                              <User size={12} strokeWidth={1.75} />
                            </button>
                          )}
                          <button
                            onClick={(e) => { e.stopPropagation(); deleteItem(item.id); }}
                            className="w-6 h-6 rounded-[var(--radius-sm)] bg-error text-white flex items-center justify-center hover:opacity-80 transition-opacity duration-[var(--duration-pb-base)]"
                            title="ลบ"
                            aria-label="ลบ"
                          >
                            <X size={12} strokeWidth={1.75} />
                          </button>
                        </div>
                        {showMemberPicker && !isCustom && (
                          <div
                            className="absolute z-40 bg-surface-card border border-hairline rounded-[var(--radius-md)] p-2 w-52 max-h-64 overflow-y-auto"
                            style={{ top: h + 6, left: "50%", transform: "translateX(-50%)" }}
                            onPointerDown={(e) => e.stopPropagation()}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <p className="text-[11px] font-semibold text-muted uppercase tracking-[1.5px] px-1 pb-1">
                              สมาชิกที่เข้าร่วม
                            </p>
                            {participants.length === 0 ? (
                              <p className="text-xs text-muted-soft px-1 py-2">
                                ยังไม่มีสมาชิกในงานแสดง
                              </p>
                            ) : (
                              <>
                                {item.label && (
                                  <button
                                    onClick={() => { setItemLabel(item.id, ""); setShowMemberPicker(false); }}
                                    className="w-full text-left text-xs px-2 py-1 rounded hover:bg-surface-cream-strong text-error"
                                  >
                                    เอาออก ({item.label})
                                  </button>
                                )}
                                {participants.map((p) => {
                                  const assignedTo = assignedByUser.get(p.userId);
                                  const isHere = assignedTo === item.id;
                                  const isElsewhere = assignedTo && !isHere;
                                  return (
                                    <button
                                      key={p.userId}
                                      onClick={() => { setItemLabel(item.id, p.nickname); setShowMemberPicker(false); }}
                                      disabled={isHere}
                                      className={`w-full text-left text-xs px-2 py-1 rounded-[var(--radius-sm)] flex items-center justify-between gap-2 transition-colors duration-[var(--duration-pb-base)] ${
                                        isHere
                                          ? "bg-primary/10 text-primary cursor-default"
                                          : "hover:bg-surface-cream-strong text-ink"
                                      }`}
                                    >
                                      <span className="truncate">
                                        {p.nickname}
                                        <span className="text-muted-soft ml-1">·{p.generation}</span>
                                      </span>
                                      {isElsewhere && <span className="text-[10px] text-muted-soft shrink-0">อยู่แล้ว</span>}
                                      {isHere && <Check size={12} strokeWidth={1.75} className="shrink-0" />}
                                    </button>
                                  );
                                })}
                              </>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Member label — sibling, unaffected by item rotation, centered under item */}
                  {item.label && !isCustom && (
                    <div
                      className="absolute pointer-events-none flex justify-center"
                      style={{
                        left: centerX,
                        top: bottomY + 6,
                        transform: "translateX(-50%)",
                        zIndex: selected ? 21 : (item.layerOrder + 1),
                      }}
                    >
                      <span
                        className="inline-block bg-surface-card border border-hairline text-ink text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap"
                        title={item.label}
                      >
                        {item.label}
                      </span>
                    </div>
                  )}
                  </div>
                );
              })}
            </div>

            {/* Stage label */}
            <p className="text-center text-xs text-muted-soft mt-2 print:block">
              {stage.name} — {stage.widthUnits} × {stage.heightUnits} {stage.unitLabel}
            </p>
          </div>
        </div>

        {/* ── History panel ── */}
        {showHistory && (
          <div className="w-72 shrink-0 border-l border-hairline-soft bg-surface-soft overflow-y-auto print:hidden">
            <div className="px-4 pt-4 pb-2 border-b border-hairline-soft flex items-center justify-between">
              <p className="text-sm font-semibold text-ink">ประวัติเวอร์ชัน</p>
              <button onClick={() => setShowHistory(false)} aria-label="ปิด" className="text-muted hover:text-ink text-lg">×</button>
            </div>

            {previewVersion && (
              <div className="p-4 border-b border-hairline-soft bg-canvas">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-ink">
                    ดูตัวอย่าง v{previewVersion.versionNumber}
                  </p>
                  <button
                    onClick={() => setPreviewVersion(null)}
                    className="text-xs text-muted hover:text-ink"
                  >
                    ปิด
                  </button>
                </div>
                {renderVersionPreview(previewVersion)}
                {isAdmin && (
                  <Button
                    size="sm"
                    variant="secondary"
                    className="mt-2 w-full"
                    onClick={() => restoreVersion(previewVersion)}
                    disabled={restoring}
                  >
                    {restoring ? "กำลังกู้คืน..." : "กู้คืนเวอร์ชันนี้"}
                  </Button>
                )}
              </div>
            )}

            <div className="divide-y divide-hairline-soft">
              {historyLoading ? (
                <p className="px-4 py-4 text-sm text-muted text-center">กำลังโหลด...</p>
              ) : versions.length === 0 ? (
                <p className="px-4 py-4 text-sm text-muted-soft text-center">ยังไม่มีประวัติ</p>
              ) : (
                versions.map((v) => (
                  <div key={v.id} className="px-4 py-3 hover:bg-canvas transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-ink">v{v.versionNumber}</p>
                        {v.changeNote && (
                          <p className="text-xs text-muted truncate">{v.changeNote}</p>
                        )}
                        <p className="text-xs text-muted-soft">
                          {v.createdBy?.nickname ?? "ไม่ทราบ"} ·{" "}
                          {new Date(v.createdAt).toLocaleDateString("th-TH", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      <button
                        onClick={() => setPreviewVersion(previewVersion?.id === v.id ? null : v)}
                        className="text-xs text-body-strong hover:text-primary transition-colors duration-[var(--duration-pb-base)] shrink-0"
                      >
                        {previewVersion?.id === v.id ? "ปิด" : "ดู"}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
