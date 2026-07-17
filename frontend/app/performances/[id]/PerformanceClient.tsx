"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";

// ─── Types ─────────────────────────────────────────────────

type DateEntry = {
  id: string;
  date: string;
  startTime: string | null;
  endTime: string | null;
};

type SongEntry = {
  id: string;
  songId: string;
  order: number;
  title: string;
  songCode: string;
  category: string;
};

type InstrumentRow = { name: string; chairs: number; tables: number | null };

type Performance = {
  id: string;
  name: string;
  location: string | null;
  description: string | null;
  costume: string | null;
  equipmentNotes: Record<string, string> | null;
  dates: DateEntry[];
  songs: SongEntry[];
};

type StageItem = {
  id: string;
  x: number;
  y: number;
  rotation: number;
  label: string;
  instrument: { id: string; name: string; nameThai: string; iconType: string; footprintW: number; footprintH: number };
};

type StageLayout = {
  id: string;
  name: string;
  widthUnits: number;
  heightUnits: number;
  unitLabel: string;
  items: StageItem[];
};

type Participant = {
  memberId: string;
  userId: string;
  nickname: string;
  generation: string;
  primaryInstrumentNameThai: string | null;
  position: string;
};

const POSITIONS = [
  "ระนาดเอก", "ระนาดทุ้ม", "ฆ้องวงเล็ก", "ฆ้องวงใหญ่",
  "จะเข้", "ขิม", "ขิม จิ๋ว",
  "ซออู้", "ซอด้วง", "ซอสามสาย", "ขลุ่ย",
  "แคน", "แคนจิ๋ว", "กลองแขกตัวผู้", "กลองแขกตัวเมีย",
  "ตะโพน", "กลองทัดเสียงต่ำ", "กลองทัดเสียงสูง", "ระฆังราว",
  "ฉาบใหญ่", "ฉิ่ง", "โทนรำมะนา", "คาฮอง",
  "ฉาบเล็ก", "กรับเสภา", "กรับพวง", "แทมบูรีน",
  "ลูกแซ็ก", "อื่นๆ",
];

type AssignedHead = { id: string; nickname: string; generation: string };

type PracticeSlot = { id: string; startTime: string; endTime: string; label: string; isSpecial: boolean };
type PracticeDay = { id: string; date: string; slots: PracticeSlot[] };
type PracticeScheduleEntry = { id: string; title: string; days: PracticeDay[] };

type SongSearchResult = {
  id: string;
  title: string;
  songCode: string;
  category: string;
};

// ─── Helpers ───────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// ─── Stage preview colors ──────────────────────────────────

const ICON_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  ranat:   { bg: "#dbeafe", border: "#3b82f6", text: "#1e40af" },
  khong:   { bg: "#dcfce7", border: "#22c55e", text: "#15803d" },
  pi:      { bg: "#fef9c3", border: "#eab308", text: "#854d0e" },
  so:      { bg: "#ede9fe", border: "#8b5cf6", text: "#5b21b6" },
  khim:    { bg: "#fce7f3", border: "#ec4899", text: "#9d174d" },
  chakhe:  { bg: "#fff7ed", border: "#f97316", text: "#9a3412" },
  drum:    { bg: "#fee2e2", border: "#ef4444", text: "#991b1b" },
  ching:   { bg: "#f0fdf4", border: "#86efac", text: "#166534" },
  default: { bg: "#f1f5f9", border: "#94a3b8", text: "#334155" },
};

// ─── MiniStagePreview ──────────────────────────────────────

function MiniStagePreview({ layout }: { layout: StageLayout }) {
  return (
    <div
      className="relative border border-hairline-soft rounded-[var(--radius-md)] bg-surface-soft overflow-hidden"
      style={{ width: "100%", paddingBottom: `${(layout.heightUnits / layout.widthUnits) * 100}%` }}
    >
      <div className="absolute inset-0">
        {layout.items.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-xs text-muted-soft">ยังไม่มีเครื่องดนตรีในผัง</p>
          </div>
        ) : (
          layout.items.map((item) => {
            const c = ICON_COLORS[item.instrument.iconType] ?? ICON_COLORS.default;
            const wPct = (item.instrument.footprintW / layout.widthUnits) * 100;
            const hPct = (item.instrument.footprintH / layout.heightUnits) * 100;
            const xPct = (item.x / layout.widthUnits) * 100;
            const yPct = (item.y / layout.heightUnits) * 100;
            return (
              <div
                key={item.id}
                className="absolute flex items-center justify-center rounded text-[9px] font-semibold border leading-tight text-center overflow-hidden"
                style={{
                  left: `${xPct}%`,
                  top: `${yPct}%`,
                  width: `${wPct}%`,
                  height: `${hPct}%`,
                  transform: `rotate(${item.rotation}deg)`,
                  backgroundColor: c.bg,
                  borderColor: c.border,
                  color: c.text,
                  minWidth: "20px",
                  minHeight: "16px",
                }}
              >
                <span className="px-0.5 truncate">{item.label || item.instrument.nameThai}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ─── SongPickerPanel ───────────────────────────────────────

type SongPickerPanelProps = {
  addedSongIds: Set<string>;
  onAdd: (song: SongSearchResult) => void;
  onClose: () => void;
};

function SongPickerPanel({ addedSongIds, onAdd, onClose }: SongPickerPanelProps) {
  const [allSongs, setAllSongs] = useState<SongSearchResult[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState("ทั้งหมด");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/songs?limit=500")
      .then((r) => r.json())
      .then((data) => {
        setAllSongs(data.songs ?? []);
        setCategories(data.categories ?? []);
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = allSongs.filter((s) => {
    const matchCat = activeCategory === "ทั้งหมด" || s.category === activeCategory;
    const matchSearch =
      !search.trim() ||
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.songCode.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="border border-hairline-soft rounded-[var(--radius-lg)] bg-surface-card overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-hairline-soft">
        <p className="text-sm font-semibold text-ink">เพิ่มเพลง</p>
        <button onClick={onClose} className="text-muted hover:text-ink text-lg leading-none">×</button>
      </div>
      <div className="px-4 pt-3 pb-2">
        <input
          autoFocus
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ค้นหาชื่อเพลง / รหัส..."
          className="w-full px-3 py-2 text-sm border border-hairline rounded-[var(--radius-md)] bg-canvas text-ink placeholder:text-muted-soft outline-none focus:border-coral focus:ring-[3px] focus:ring-coral/20"
        />
      </div>
      <div className="flex gap-1 px-4 pb-2 overflow-x-auto scrollbar-none">
        {["ทั้งหมด", ...categories].map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`shrink-0 px-3 py-1 text-xs font-medium rounded-full border transition-colors ${
              activeCategory === cat
                ? "bg-primary text-white border-primary"
                : "bg-canvas text-muted border-hairline hover:bg-surface-cream-strong"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>
      <div className="max-h-64 overflow-y-auto divide-y divide-hairline-soft">
        {loading ? (
          <p className="px-4 py-4 text-sm text-muted text-center">กำลังโหลด...</p>
        ) : filtered.length === 0 ? (
          <p className="px-4 py-4 text-sm text-muted text-center">ไม่พบเพลง</p>
        ) : (
          filtered.map((song) => {
            const added = addedSongIds.has(song.id);
            return (
              <button
                key={song.id}
                disabled={added}
                onClick={() => onAdd(song)}
                className="w-full text-left px-4 py-2.5 hover:bg-surface-cream-strong transition-colors flex items-center justify-between gap-3 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <div className="min-w-0">
                  <p className="text-sm text-ink truncate">{song.title}</p>
                  <p className="text-xs text-muted-soft">{song.songCode} · {song.category}</p>
                </div>
                {added && <span className="text-xs text-muted shrink-0">เพิ่มแล้ว</span>}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

// ─── Section header ────────────────────────────────────────

function SectionHeader({ label, children }: { label: string; children?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-sm font-bold tracking-[1.5px] uppercase text-muted">{label}</h2>
      {children}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────

export default function PerformanceClient({
  performance: initial,
  participants: initialParticipants,
  isAdmin,
  isHead,
  hasJoined: initialHasJoined,
  stageLayout,
  practiceSchedules,
}: {
  performance: Performance;
  participants: Participant[];
  isAdmin: boolean;
  isHead: boolean;
  hasJoined: boolean;
  stageLayout: StageLayout | null;
  practiceSchedules: PracticeScheduleEntry[];
}) {
  const router = useRouter();
  const [performance, setPerformance] = useState(initial);
  const [participants, setParticipants] = useState(initialParticipants);
  const [hasJoined, setHasJoined] = useState(initialHasJoined);
  const [joinLoading, setJoinLoading] = useState(false);
  const [allMembers, setAllMembers] = useState<AssignedHead[]>([]);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const canEdit = isAdmin || isHead;

  // ── Equipment notes ──────────────────────────────────────
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesForm, setNotesForm] = useState<Record<string, string>>(initial.equipmentNotes ?? {});
  const [notesLoading, setNotesLoading] = useState(false);

  async function saveEquipmentNotes() {
    setNotesLoading(true);
    try {
      const res = await fetch(`/api/performances/${performance.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ equipmentNotes: notesForm }),
      });
      if (res.ok) {
        setPerformance((prev) => ({ ...prev, equipmentNotes: { ...notesForm } }));
        setEditingNotes(false);
      } else {
        const err = await res.json().catch(() => ({}));
        alert(`บันทึกไม่สำเร็จ: ${err.error ?? res.status}`);
      }
    } finally {
      setNotesLoading(false);
    }
  }

  // ── Section 1 edit: name / location / dates ──────────────
  const [editingInfo, setEditingInfo] = useState(false);
  const [editName, setEditName] = useState(initial.name);
  const [editLocation, setEditLocation] = useState(initial.location ?? "");
  const [infoLoading, setInfoLoading] = useState(false);
  const [editDates, setEditDates] = useState<DateEntry[]>(initial.dates);
  const [newDateStr, setNewDateStr] = useState("");
  const [newStartTime, setNewStartTime] = useState("");
  const [newEndTime, setNewEndTime] = useState("");
  const [dateLoading, setDateLoading] = useState(false);

  function openEditInfo() {
    setEditName(performance.name);
    setEditLocation(performance.location ?? "");
    setEditDates(performance.dates);
    setNewDateStr(""); setNewStartTime(""); setNewEndTime("");
    setEditingInfo(true);
  }

  async function saveInfo() {
    setInfoLoading(true);
    try {
      const res = await fetch(`/api/performances/${performance.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName.trim(),
          location: editLocation.trim() || null,
        }),
      });
      if (res.ok) {
        setPerformance((prev) => ({
          ...prev,
          name: editName.trim(),
          location: editLocation.trim() || null,
          dates: editDates,
        }));
        setEditingInfo(false);
      }
    } finally {
      setInfoLoading(false);
    }
  }

  async function addDate() {
    if (!newDateStr) return;
    setDateLoading(true);
    try {
      const res = await fetch(`/api/performances/${performance.id}/dates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: newDateStr, startTime: newStartTime || undefined, endTime: newEndTime || undefined }),
      });
      if (res.ok) {
        const data = await res.json();
        const d = data.performanceDate;
        const newEntry: DateEntry = { id: d.id, date: d.date, startTime: d.startTime ?? null, endTime: d.endTime ?? null };
        setEditDates((prev) => [...prev, newEntry].sort((a, b) => a.date.localeCompare(b.date)));
        setNewDateStr(""); setNewStartTime(""); setNewEndTime("");
      }
    } finally {
      setDateLoading(false);
    }
  }

  async function deleteDate(dateId: string) {
    const res = await fetch(`/api/performances/${performance.id}/dates?dateId=${dateId}`, { method: "DELETE" });
    if (res.ok) setEditDates((prev) => prev.filter((d) => d.id !== dateId));
  }

  async function updateDateTime(dateId: string, startTime: string, endTime: string) {
    await fetch(`/api/performances/${performance.id}/dates`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dateId, startTime, endTime }),
    });
    setEditDates((prev) => prev.map((d) => d.id === dateId ? { ...d, startTime: startTime || null, endTime: endTime || null } : d));
  }

  // ── Section 2 edit: costume ───────────────────────────────
  const [editingCostume, setEditingCostume] = useState(false);
  const [editCostume, setEditCostume] = useState(initial.costume ?? "");
  const [costumeLoading, setCostumeLoading] = useState(false);

  async function saveCostume() {
    setCostumeLoading(true);
    try {
      const res = await fetch(`/api/performances/${performance.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ costume: editCostume.trim() || null }),
      });
      if (res.ok) {
        setPerformance((prev) => ({ ...prev, costume: editCostume.trim() || null }));
        setEditingCostume(false);
      }
    } finally {
      setCostumeLoading(false);
    }
  }

  // ── Section 5 edit: description (หมายเหตุ) ───────────────
  const [editingDesc, setEditingDesc] = useState(false);
  const [editDescription, setEditDescription] = useState(initial.description ?? "");
  const [descLoading, setDescLoading] = useState(false);

  async function saveDescription() {
    setDescLoading(true);
    try {
      const res = await fetch(`/api/performances/${performance.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: editDescription.trim() || null }),
      });
      if (res.ok) {
        setPerformance((prev) => ({
          ...prev,
          description: editDescription.trim() || null,
        }));
        setEditingDesc(false);
      }
    } finally {
      setDescLoading(false);
    }
  }

  // ── Global instrument equipment ───────────────────────────
  const [globalInstruments, setGlobalInstruments] = useState<InstrumentRow[]>([]);

  useEffect(() => {
    fetch("/api/instrument-equipment")
      .then((r) => r.json())
      .then((d) => setGlobalInstruments(d.rows ?? []))
      .catch(() => {});
  }, []);

  // ── Songs ─────────────────────────────────────────────────
  const [showPicker, setShowPicker] = useState(false);
  const [showAllSongs, setShowAllSongs] = useState(false);
  const PREVIEW_COUNT = 5;
  const visibleSongs = showAllSongs ? performance.songs : performance.songs.slice(0, PREVIEW_COUNT);

  async function addSong(song: SongSearchResult) {
    setShowPicker(false);
    const res = await fetch(`/api/performances/${performance.id}/songs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ songId: song.id }),
    });
    if (!res.ok) return;
    const data = await res.json();
    const ps = data.performanceSong;
    setPerformance((prev) => ({
      ...prev,
      songs: [
        ...prev.songs,
        {
          id: ps.id,
          songId: ps.song.id,
          order: ps.order,
          title: ps.song.title,
          songCode: ps.song.songCode,
          category: ps.song.category,
        },
      ],
    }));
  }

  async function removeSong(songId: string) {
    const res = await fetch(`/api/performances/${performance.id}/songs`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ songId }),
    });
    if (!res.ok) return;
    setPerformance((prev) => ({
      ...prev,
      songs: prev.songs.filter((s) => s.songId !== songId),
    }));
  }

  // ── Join ──────────────────────────────────────────────────
  async function toggleJoin() {
    setJoinLoading(true);
    try {
      const method = hasJoined ? "DELETE" : "POST";
      const res = await fetch(`/api/performances/${performance.id}/join`, { method });
      if (!res.ok) return;
      setHasJoined((v) => !v);
      const membersRes = await fetch(`/api/performances/${performance.id}/members`);
      if (membersRes.ok) {
        const data = await membersRes.json();
        setParticipants(data.members);
      }
    } finally {
      setJoinLoading(false);
    }
  }

  // ── Delete ────────────────────────────────────────────────
  async function deletePerformance() {
    if (!confirm(`ลบงานแสดง "${performance.name}" ใช่หรือไม่?`)) return;
    setDeleteLoading(true);
    const res = await fetch(`/api/performances/${performance.id}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/performances");
    } else {
      setDeleteLoading(false);
    }
  }

  // ── Add member to performance (position="") ──────────────
  const [showAddMember, setShowAddMember] = useState(false);
  const [selectedAddUserIds, setSelectedAddUserIds] = useState<string[]>([]);
  const [addMemberSearch, setAddMemberSearch] = useState("");
  const [addMemberLoading, setAddMemberLoading] = useState(false);

  async function openAddMember() {
    setShowAddMember(true);
    setSelectedAddUserIds([]);
    setAddMemberSearch("");
    if (allMembers.length === 0) {
      const res = await fetch("/api/users");
      if (res.ok) {
        const data = await res.json();
        setAllMembers(
          (data.users as Array<{ id: string; nickname: string; generation: string }>).map((u) => ({
            id: u.id,
            nickname: u.nickname,
            generation: u.generation,
          }))
        );
      }
    }
  }

  function toggleAddUser(userId: string) {
    setSelectedAddUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  }

  async function addMembersToPerformance(joinedMembers: Participant[]) {
    if (selectedAddUserIds.length === 0) return;
    setAddMemberLoading(true);
    try {
      await Promise.all(
        selectedAddUserIds.map((userId) =>
          fetch(`/api/performances/${performance.id}/members`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId, position: "" }),
          })
        )
      );
      const newEntries: Participant[] = selectedAddUserIds
        .filter((uid) => !joinedMembers.some((j) => j.userId === uid))
        .map((uid) => {
          const u = allMembers.find((m) => m.id === uid)!;
          return { memberId: `${uid}-`, userId: uid, nickname: u.nickname, generation: u.generation, primaryInstrumentNameThai: null, position: "" };
        });
      setParticipants((prev) => [...prev, ...newEntries]);
      setShowAddMember(false);
      setSelectedAddUserIds([]);
    } finally {
      setAddMemberLoading(false);
    }
  }

  async function removeMemberFromPerformance(userId: string) {
    const res = await fetch(`/api/performances/${performance.id}/members`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    if (!res.ok) return;
    setParticipants((prev) => prev.filter((p) => p.userId !== userId));
  }

  // ── Position assignment panel ─────────────────────────────
  const [showMemberPanel, setShowMemberPanel] = useState(false);
  const [memberStep, setMemberStep] = useState<1 | 2>(1);
  const [selectedPositions, setSelectedPositions] = useState<string[]>([]);
  const [customPosition, setCustomPosition] = useState("");
  const [positionAssignments, setPositionAssignments] = useState<Record<string, string[]>>({});
  const [saveMembersLoading, setSaveMembersLoading] = useState(false);
  const [memberSearch, setMemberSearch] = useState("");
  const [positionSearch, setPositionSearch] = useState("");

  function openPositionPanel() {
    setShowMemberPanel(true);
    setMemberStep(1);
    setSelectedPositions([]);
    setCustomPosition("");
    setPositionAssignments({});
    setMemberSearch("");
    setPositionSearch("");
  }

  function togglePosition(pos: string) {
    setSelectedPositions((prev) =>
      prev.includes(pos) ? prev.filter((p) => p !== pos) : [...prev, pos]
    );
  }

  function resolvedPositions() {
    return selectedPositions.map((p) => (p === "อื่นๆ" && customPosition.trim() ? customPosition.trim() : p));
  }

  function toggleMemberForPosition(pos: string, userId: string) {
    setPositionAssignments((prev) => {
      const cur = prev[pos] ?? [];
      if (cur.includes(userId)) {
        return { ...prev, [pos]: cur.filter((id) => id !== userId) };
      }
      // remove this userId from any other position first (1 member = 1 position)
      const updated: Record<string, string[]> = {};
      for (const [p, ids] of Object.entries(prev)) {
        updated[p] = ids.filter((id) => id !== userId);
      }
      updated[pos] = [...(updated[pos] ?? []), userId];
      return updated;
    });
  }

  async function savePositionAssignments(joinedMembers: Participant[], currentPositionEntries: Participant[]) {
    setSaveMembersLoading(true);
    const pairs: { userId: string; position: string }[] = [];
    for (const pos of resolvedPositions()) {
      const assignKey = selectedPositions.includes("อื่นๆ") && pos === customPosition.trim() ? "อื่นๆ" : pos;
      const userIds = positionAssignments[assignKey] ?? [];
      for (const userId of userIds) {
        if (!currentPositionEntries.some((p) => p.userId === userId && p.position === pos)) {
          pairs.push({ userId, position: pos });
        }
      }
    }
    if (pairs.length === 0) { setShowMemberPanel(false); setSaveMembersLoading(false); return; }
    try {
      const res = await fetch(`/api/performances/${performance.id}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pairs),
      });
      if (!res.ok) return;
      const newEntries: Participant[] = pairs.map((pair) => {
        const u = joinedMembers.find((m) => m.userId === pair.userId)!;
        return {
          memberId: `${pair.userId}-${pair.position}`,
          userId: pair.userId,
          nickname: u.nickname,
          generation: u.generation,
          primaryInstrumentNameThai: null,
          position: pair.position,
        };
      });
      setParticipants((prev) => [...prev, ...newEntries]);
      setShowMemberPanel(false);
    } finally {
      setSaveMembersLoading(false);
    }
  }

  async function removePositionEntry(userId: string, position: string) {
    const res = await fetch(`/api/performances/${performance.id}/members`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, position }),
    });
    if (!res.ok) return;
    setParticipants((prev) => prev.filter((p) => !(p.userId === userId && p.position === position)));
  }

  // ─── Render ───────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-8">

      {/* Top action bar */}
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-ink">{performance.name}</h1>
        <div className="flex gap-2 shrink-0 items-center">
          <Button
            size="sm"
            variant={hasJoined ? "secondary" : "coral"}
            onClick={toggleJoin}
            disabled={joinLoading}
          >
            {joinLoading ? "..." : hasJoined ? "✓ เข้าร่วมแล้ว" : "เข้าร่วม"}
          </Button>
          {isAdmin && (
            <Button
              size="sm"
              variant="secondary"
              onClick={deletePerformance}
              disabled={deleteLoading}
              className="text-error hover:border-error"
            >
              ลบงานแสดง
            </Button>
          )}
        </div>
      </div>

      {/* ── Section 1: ข้อมูลงาน ── */}
      <section>
        <SectionHeader label="ข้อมูลงาน">
          {canEdit && !editingInfo && (
            <button onClick={openEditInfo} className="text-xs font-medium text-coral hover:underline">
              แก้ไข
            </button>
          )}
        </SectionHeader>

        <div className="border border-hairline-soft rounded-[var(--radius-lg)] bg-surface-card overflow-hidden">
          {editingInfo ? (
            <div className="p-4 flex flex-col gap-4">
              <div>
                <label className="block text-xs font-medium text-muted mb-1">ชื่องาน</label>
                <Input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="ชื่องานแสดง" />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted mb-1">สถานที่</label>
                <Input value={editLocation} onChange={(e) => setEditLocation(e.target.value)} placeholder="สถานที่จัดงาน" />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted mb-2">วันที่และเวลา</label>
                <div className="flex flex-col gap-2">
                  {editDates.map((d) => (
                    <div key={d.id} className="flex items-center gap-2 p-2 bg-surface-soft rounded-[var(--radius-md)] border border-hairline-soft">
                      <span className="text-sm font-medium text-ink w-32 shrink-0">
                        {new Date(d.date).toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "numeric" })}
                      </span>
                      <input
                        type="time"
                        defaultValue={d.startTime ?? ""}
                        onBlur={(e) => updateDateTime(d.id, e.target.value, editDates.find(x => x.id === d.id)?.endTime ?? "")}
                        className="px-2 py-1 text-sm border border-hairline rounded-[var(--radius-sm)] bg-canvas text-ink outline-none focus:border-coral w-28"
                      />
                      <span className="text-muted-soft text-xs">–</span>
                      <input
                        type="time"
                        defaultValue={d.endTime ?? ""}
                        onBlur={(e) => updateDateTime(d.id, editDates.find(x => x.id === d.id)?.startTime ?? "", e.target.value)}
                        className="px-2 py-1 text-sm border border-hairline rounded-[var(--radius-sm)] bg-canvas text-ink outline-none focus:border-coral w-28"
                      />
                      <span className="text-xs text-muted-soft">น.</span>
                      <button onClick={() => deleteDate(d.id)} className="ml-auto text-muted-soft hover:text-red-500 text-xs shrink-0">ลบ</button>
                    </div>
                  ))}
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="date"
                      value={newDateStr}
                      onChange={(e) => setNewDateStr(e.target.value)}
                      className="px-2 py-1 text-sm border border-hairline rounded-[var(--radius-sm)] bg-canvas text-ink outline-none focus:border-coral"
                    />
                    <input
                      type="time"
                      value={newStartTime}
                      onChange={(e) => setNewStartTime(e.target.value)}
                      className="px-2 py-1 text-sm border border-hairline rounded-[var(--radius-sm)] bg-canvas text-ink outline-none focus:border-coral w-28"
                    />
                    <span className="text-muted-soft text-xs">–</span>
                    <input
                      type="time"
                      value={newEndTime}
                      onChange={(e) => setNewEndTime(e.target.value)}
                      className="px-2 py-1 text-sm border border-hairline rounded-[var(--radius-sm)] bg-canvas text-ink outline-none focus:border-coral w-28"
                    />
                    <Button size="sm" variant="secondary" onClick={addDate} disabled={!newDateStr || dateLoading}>+ เพิ่ม</Button>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="coral" onClick={saveInfo} disabled={infoLoading}>
                  {infoLoading ? "กำลังบันทึก..." : "บันทึก"}
                </Button>
                <Button size="sm" variant="secondary" onClick={() => setEditingInfo(false)}>
                  ยกเลิก
                </Button>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-hairline-soft">
              <div className="px-4 py-3 flex items-start gap-4">
                <span className="text-xs text-muted w-24 shrink-0 pt-0.5">ชื่องาน</span>
                <span className="text-sm font-medium text-ink">{performance.name}</span>
              </div>
              {performance.dates.length > 0 && (
                <div className="px-4 py-3 flex items-start gap-4">
                  <span className="text-xs text-muted w-24 shrink-0 pt-0.5">วันที่และเวลา</span>
                  <div className="flex flex-col gap-1">
                    {performance.dates.map((d) => (
                      <div key={d.id}>
                        <span className="text-sm font-medium text-ink">{formatDate(d.date)}</span>
                        {(d.startTime || d.endTime) && (
                          <span className="text-xs text-muted ml-2">
                            {d.startTime}
                            {d.startTime && d.endTime && " – "}
                            {d.endTime} น.
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="px-4 py-3 flex items-start gap-4">
                <span className="text-xs text-muted w-24 shrink-0 pt-0.5">สถานที่</span>
                <span className="text-sm text-ink">
                  {performance.location || <span className="text-muted-soft">—</span>}
                </span>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── Section 2: เครื่องแต่งกาย ── */}
      <section>
        <SectionHeader label="เครื่องแต่งกาย">
          {canEdit && !editingCostume && (
            <button
              onClick={() => { setEditCostume(performance.costume ?? ""); setEditingCostume(true); }}
              className="text-xs font-medium text-coral hover:underline"
            >
              แก้ไข
            </button>
          )}
        </SectionHeader>

        {editingCostume ? (
          <div className="border border-hairline-soft rounded-[var(--radius-lg)] bg-surface-card p-4 flex flex-col gap-3">
            <textarea
              value={editCostume}
              onChange={(e) => setEditCostume(e.target.value)}
              placeholder="รายละเอียดเครื่องแต่งกาย / dress code"
              rows={3}
              className="w-full px-3 py-2 text-sm text-ink bg-canvas border border-hairline rounded-[var(--radius-md)] placeholder:text-muted-soft focus:outline-none focus:border-coral focus:ring-[3px] focus:ring-coral/20 resize-none"
            />
            <div className="flex gap-2">
              <Button size="sm" variant="coral" onClick={saveCostume} disabled={costumeLoading}>
                {costumeLoading ? "กำลังบันทึก..." : "บันทึก"}
              </Button>
              <Button size="sm" variant="secondary" onClick={() => setEditingCostume(false)}>
                ยกเลิก
              </Button>
            </div>
          </div>
        ) : (
          <div className="px-4 py-4 bg-surface-card border border-hairline-soft rounded-[var(--radius-lg)]">
            {performance.costume ? (
              <p className="text-sm text-ink whitespace-pre-wrap">{performance.costume}</p>
            ) : (
              <p className="text-sm text-muted-soft">
                {canEdit ? "ยังไม่ได้ระบุ กด แก้ไข เพื่อเพิ่ม" : "ยังไม่ได้ระบุเครื่องแต่งกาย"}
              </p>
            )}
          </div>
        )}
      </section>

      {/* ── Section 5: หมายเหตุอื่นๆ ── */}
      <section>
        <SectionHeader label="หมายเหตุอื่นๆ">
          {canEdit && !editingDesc && (
            <button
              onClick={() => { setEditDescription(performance.description ?? ""); setEditingDesc(true); }}
              className="text-xs font-medium text-coral hover:underline"
            >
              แก้ไข
            </button>
          )}
        </SectionHeader>

        {editingDesc ? (
          <div className="border border-hairline-soft rounded-[var(--radius-lg)] bg-surface-card p-4 flex flex-col gap-3">
            <textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              placeholder="หมายเหตุเพิ่มเติม"
              rows={3}
              className="w-full px-3 py-2 text-sm text-ink bg-canvas border border-hairline rounded-[var(--radius-md)] placeholder:text-muted-soft focus:outline-none focus:border-coral focus:ring-[3px] focus:ring-coral/20 resize-none"
            />
            <div className="flex gap-2">
              <Button size="sm" variant="coral" onClick={saveDescription} disabled={descLoading}>
                {descLoading ? "กำลังบันทึก..." : "บันทึก"}
              </Button>
              <Button size="sm" variant="secondary" onClick={() => setEditingDesc(false)}>
                ยกเลิก
              </Button>
            </div>
          </div>
        ) : (
          <div className="px-4 py-4 bg-surface-card border border-hairline-soft rounded-[var(--radius-lg)]">
            {performance.description ? (
              <p className="text-sm text-ink whitespace-pre-wrap">{performance.description}</p>
            ) : (
              <p className="text-sm text-muted-soft">
                {canEdit ? "ยังไม่มีหมายเหตุ กด แก้ไข เพื่อเพิ่ม" : "ยังไม่มีหมายเหตุ"}
              </p>
            )}
          </div>
        )}
      </section>

      {/* ── Section 6: รายการเพลง ── */}
      <section>
        <SectionHeader label={`รายการเพลง (${performance.songs.length})`}>
          {performance.songs.length > 0 && (
            <Link
              href={`/performances/${performance.id}/sheets`}
              className="text-xs font-medium text-coral hover:underline"
            >
              ดูโน้ตทั้งหมด →
            </Link>
          )}
        </SectionHeader>

        {canEdit && (
          <div className="mb-4">
            {!showPicker ? (
              <Button size="sm" variant="secondary" onClick={() => setShowPicker(true)}>
                + เพิ่มเพลง
              </Button>
            ) : (
              <SongPickerPanel
                addedSongIds={new Set(performance.songs.map((s) => s.songId))}
                onAdd={addSong}
                onClose={() => setShowPicker(false)}
              />
            )}
          </div>
        )}

        {performance.songs.length === 0 ? (
          <p className="text-sm text-muted-soft">ยังไม่มีเพลงในงานแสดงนี้</p>
        ) : (
          <div className="flex flex-col gap-2">
            {visibleSongs.map((s, i) => (
              <div
                key={s.id}
                className="flex items-center gap-3 px-4 py-3 bg-surface-card border border-hairline-soft rounded-[var(--radius-md)]"
              >
                <span className="text-xs text-muted-soft w-5 text-right shrink-0">{i + 1}</span>
                <Link href={`/songs/${s.songId}`} className="flex-1 min-w-0 group">
                  <p className="text-sm font-medium text-ink truncate group-hover:text-coral transition-colors">
                    {s.title}
                  </p>
                  <p className="text-xs text-muted-soft">{s.songCode}</p>
                </Link>
                <Badge variant="pill" className="text-[11px]">
                  {s.category}
                </Badge>
                {canEdit && (
                  <button
                    onClick={() => removeSong(s.songId)}
                    className="text-muted hover:text-error transition-colors text-lg leading-none shrink-0"
                    aria-label="ลบเพลง"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
            {performance.songs.length > PREVIEW_COUNT && (
              <button
                onClick={() => setShowAllSongs((v) => !v)}
                className="text-sm text-coral hover:underline text-left px-1 mt-1"
              >
                {showAllSongs
                  ? "แสดงน้อยลง"
                  : `แสดงเพลงทั้งหมด ${performance.songs.length} เพลง`}
              </button>
            )}
          </div>
        )}
      </section>

      {/* ── Section 7: รายชื่อสมาชิกและตำแหน่ง ── */}
      <section>
        {(() => {
          const joinedMembers = participants.filter((p) => p.position === "");
          const positionEntries = participants.filter((p) => p.position !== "");
          const positionGroups = positionEntries.reduce<Record<string, Participant[]>>((acc, p) => {
            return { ...acc, [p.position]: [...(acc[p.position] ?? []), p] };
          }, {});

          return (
            <>
              <SectionHeader label={`รายชื่อสมาชิกและตำแหน่ง (${joinedMembers.length})`} />

              {/* ─── สมาชิกในงานทั้งหมด ─── */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-muted uppercase tracking-wide">สมาชิกในงานทั้งหมด</p>
                  {isAdmin && !showAddMember && (
                    <button onClick={openAddMember} className="text-xs font-medium text-coral hover:underline">
                      + เพิ่มสมาชิก
                    </button>
                  )}
                </div>

                {/* add member multi-select */}
                {isAdmin && showAddMember && (
                  <div className="mb-3 border border-hairline-soft rounded-[var(--radius-lg)] bg-surface-card overflow-hidden">
                    <div className="px-4 pt-3 pb-2">
                      <input
                        autoFocus
                        type="text"
                        value={addMemberSearch}
                        onChange={(e) => setAddMemberSearch(e.target.value)}
                        placeholder="ค้นหาสมาชิก..."
                        className="w-full px-3 py-1.5 text-sm border border-hairline rounded-[var(--radius-md)] bg-canvas text-ink placeholder:text-muted-soft outline-none focus:border-coral focus:ring-[3px] focus:ring-coral/20"
                      />
                    </div>
                    <div className="px-4 pb-3 flex flex-wrap gap-1.5">
                      {allMembers
                        .filter((m) =>
                          !joinedMembers.some((j) => j.userId === m.id) &&
                          (m.nickname.toLowerCase().includes(addMemberSearch.toLowerCase()) ||
                           m.generation.toLowerCase().includes(addMemberSearch.toLowerCase()))
                        )
                        .map((m) => {
                          const selected = selectedAddUserIds.includes(m.id);
                          return (
                            <button
                              key={m.id}
                              type="button"
                              onClick={() => toggleAddUser(m.id)}
                              className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                                selected
                                  ? "bg-coral text-white border-coral"
                                  : "bg-canvas border-hairline text-ink hover:border-coral hover:text-coral"
                              }`}
                            >
                              {m.nickname}
                              <span className="opacity-60 ml-0.5">{m.generation}</span>
                            </button>
                          );
                        })}
                    </div>
                    <div className="flex gap-2 px-4 pb-3">
                      <Button size="sm" variant="coral" disabled={selectedAddUserIds.length === 0 || addMemberLoading} onClick={() => addMembersToPerformance(joinedMembers)}>
                        {addMemberLoading ? "กำลังเพิ่ม..." : `เพิ่ม${selectedAddUserIds.length > 0 ? ` (${selectedAddUserIds.length})` : ""}`}
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => { setShowAddMember(false); setSelectedAddUserIds([]); }}>
                        ยกเลิก
                      </Button>
                    </div>
                  </div>
                )}

                {joinedMembers.length === 0 ? (
                  <p className="text-sm text-muted-soft">ยังไม่มีสมาชิกเข้าร่วม</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {joinedMembers.map((p) => (
                      <span
                        key={p.userId}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-surface-cream-strong border border-hairline text-ink"
                      >
                        {p.nickname}
                        <span className="text-xs text-muted-soft">{p.generation}</span>
                        {isAdmin && (
                          <button
                            onClick={() => removeMemberFromPerformance(p.userId)}
                            className="text-muted hover:text-error transition-colors leading-none ml-0.5"
                            aria-label="ลบสมาชิก"
                          >
                            ×
                          </button>
                        )}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* ─── ตำแหน่ง | สมาชิก ─── */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-muted uppercase tracking-wide">ตำแหน่ง · สมาชิก</p>
                  {isAdmin && joinedMembers.length > 0 && !showMemberPanel && (
                    <button onClick={openPositionPanel} className="text-xs font-medium text-coral hover:underline">
                      + เพิ่มตำแหน่ง
                    </button>
                  )}
                </div>

                {/* position assignment panel */}
                {isAdmin && showMemberPanel && (
                  <div className="mb-3 border border-hairline-soft rounded-[var(--radius-lg)] bg-surface-card overflow-hidden">
                    <div className="flex border-b border-hairline-soft">
                      {[1, 2].map((s) => (
                        <div
                          key={s}
                          className={`flex-1 py-2.5 text-center text-xs font-semibold transition-colors ${
                            memberStep === s ? "bg-coral text-white" : "bg-surface-soft text-muted-soft"
                          }`}
                        >
                          {s === 1 ? "1 · เลือกตำแหน่ง" : "2 · เลือกสมาชิก"}
                        </div>
                      ))}
                    </div>

                    {memberStep === 1 && (
                      <div className="p-4">
                        <input
                          type="text"
                          value={positionSearch}
                          onChange={(e) => setPositionSearch(e.target.value)}
                          placeholder="ค้นหาตำแหน่ง..."
                          className="w-full mb-3 px-3 py-1.5 text-sm border border-hairline rounded-[var(--radius-md)] bg-canvas text-ink placeholder:text-muted-soft outline-none focus:border-coral focus:ring-[3px] focus:ring-coral/20"
                        />
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                          {POSITIONS.filter((pos) =>
                            pos.toLowerCase().includes(positionSearch.toLowerCase())
                          ).map((pos) => (
                            <label key={pos} className="flex items-center gap-2 cursor-pointer group">
                              <input
                                type="checkbox"
                                checked={selectedPositions.includes(pos)}
                                onChange={() => togglePosition(pos)}
                                className="accent-coral w-4 h-4 shrink-0"
                              />
                              <span className="text-sm text-ink group-hover:text-coral transition-colors">{pos}</span>
                            </label>
                          ))}
                        </div>
                        {selectedPositions.includes("อื่นๆ") && (
                          <input
                            type="text"
                            value={customPosition}
                            onChange={(e) => setCustomPosition(e.target.value)}
                            placeholder="ระบุตำแหน่งอื่นๆ..."
                            className="mt-3 w-full px-3 py-1.5 text-sm border border-hairline rounded-[var(--radius-md)] bg-canvas text-ink placeholder:text-muted-soft outline-none focus:border-coral focus:ring-[3px] focus:ring-coral/20"
                          />
                        )}
                        <div className="flex gap-2 mt-4">
                          <Button
                            size="sm"
                            variant="coral"
                            disabled={selectedPositions.length === 0 || (selectedPositions.includes("อื่นๆ") && !customPosition.trim())}
                            onClick={() => setMemberStep(2)}
                          >
                            ถัดไป →
                          </Button>
                          <Button size="sm" variant="secondary" onClick={() => setShowMemberPanel(false)}>
                            ยกเลิก
                          </Button>
                        </div>
                      </div>
                    )}

                    {memberStep === 2 && (
                      <div className="p-4 flex flex-col gap-3">
                        <p className="text-xs text-muted">แตะชื่อสมาชิกเพื่อเลือก (เฉพาะสมาชิกในงาน)</p>
                        <input
                          type="text"
                          value={memberSearch}
                          onChange={(e) => setMemberSearch(e.target.value)}
                          placeholder="ค้นหาสมาชิก..."
                          className="w-full px-3 py-1.5 text-sm border border-hairline rounded-[var(--radius-md)] bg-canvas text-ink placeholder:text-muted-soft outline-none focus:border-coral focus:ring-[3px] focus:ring-coral/20"
                        />
                        <div className="border border-hairline-soft rounded-[var(--radius-md)] overflow-hidden">
                          <div className="grid grid-cols-[160px_1fr] bg-surface-soft border-b border-hairline-soft">
                            <div className="px-3 py-2 text-xs font-semibold text-muted uppercase tracking-wide">ตำแหน่ง</div>
                            <div className="px-3 py-2 text-xs font-semibold text-muted uppercase tracking-wide border-l border-hairline-soft">สมาชิก</div>
                          </div>
                          {resolvedPositions().map((pos, idx) => {
                            const assignKey = selectedPositions.includes("อื่นๆ") && pos === customPosition.trim() ? "อื่นๆ" : pos;
                            const assigned = positionAssignments[assignKey] ?? [];
                            const filtered = joinedMembers.filter((m) =>
                              m.nickname.toLowerCase().includes(memberSearch.toLowerCase()) ||
                              m.generation.toLowerCase().includes(memberSearch.toLowerCase())
                            );
                            return (
                              <div key={pos} className={`grid grid-cols-[160px_1fr] ${idx > 0 ? "border-t border-hairline-soft" : ""}`}>
                                <div className="px-3 py-3 flex items-start">
                                  <span className="text-sm font-medium text-ink">{pos}</span>
                                </div>
                                <div className="px-3 py-2.5 border-l border-hairline-soft flex flex-wrap gap-1.5 items-center">
                                  {filtered.length === 0 ? (
                                    <span className="text-xs text-muted-soft">ไม่พบสมาชิก</span>
                                  ) : filtered.map((m) => {
                                    const alreadyIn = positionEntries.some((p) => p.userId === m.userId && p.position === pos);
                                    const takenByOther = !alreadyIn && Object.entries(positionAssignments).some(
                                      ([p, ids]) => p !== assignKey && ids.includes(m.userId)
                                    );
                                    const selected = assigned.includes(m.userId);
                                    const disabled = alreadyIn || takenByOther;
                                    return (
                                      <button
                                        key={m.userId}
                                        type="button"
                                        disabled={disabled}
                                        onClick={() => toggleMemberForPosition(assignKey, m.userId)}
                                        className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                                          alreadyIn
                                            ? "bg-surface-cream-strong border-hairline text-muted-soft cursor-default"
                                            : takenByOther
                                            ? "bg-surface-soft border-hairline text-muted-soft cursor-not-allowed opacity-50"
                                            : selected
                                            ? "bg-coral text-white border-coral"
                                            : "bg-canvas border-hairline text-ink hover:border-coral hover:text-coral"
                                        }`}
                                      >
                                        {m.nickname}
                                        <span className="opacity-60 ml-0.5">{m.generation}</span>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        <div className="flex gap-2 mt-1">
                          <Button size="sm" variant="coral" onClick={() => savePositionAssignments(joinedMembers, positionEntries)} disabled={saveMembersLoading}>
                            {saveMembersLoading ? "กำลังบันทึก..." : "บันทึก"}
                          </Button>
                          <Button size="sm" variant="secondary" onClick={() => setMemberStep(1)}>← ย้อนกลับ</Button>
                          <Button size="sm" variant="secondary" onClick={() => setShowMemberPanel(false)}>ยกเลิก</Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {positionEntries.length === 0 ? (
                  <p className="text-sm text-muted-soft">ยังไม่มีการกำหนดตำแหน่ง</p>
                ) : (
                  <div className="border border-hairline-soft rounded-[var(--radius-lg)] bg-surface-card overflow-hidden">
                    <div className="grid grid-cols-[160px_1fr] bg-surface-soft border-b border-hairline-soft">
                      <div className="px-4 py-2 text-xs font-semibold text-muted uppercase tracking-wide">ตำแหน่ง</div>
                      <div className="px-4 py-2 text-xs font-semibold text-muted uppercase tracking-wide border-l border-hairline-soft">สมาชิก</div>
                    </div>
                    {Object.entries(positionGroups).map(([pos, members], idx) => (
                      <div key={pos} className={`grid grid-cols-[160px_1fr] ${idx > 0 ? "border-t border-hairline-soft" : ""}`}>
                        <div className="px-4 py-3 flex items-start">
                          <span className="text-sm font-medium text-ink">{pos}</span>
                        </div>
                        <div className="px-4 py-2.5 border-l border-hairline-soft flex flex-wrap gap-1.5 items-center">
                          {members.map((p) => (
                            <span
                              key={p.memberId}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-primary/5 border border-primary/20 text-ink"
                            >
                              {p.nickname}
                              <span className="text-muted-soft">{p.generation}</span>
                              {isAdmin && (
                                <button
                                  onClick={() => removePositionEntry(p.userId, p.position)}
                                  className="text-muted hover:text-error transition-colors leading-none ml-0.5"
                                  aria-label="ลบตำแหน่ง"
                                >
                                  ×
                                </button>
                              )}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          );
        })()}
      </section>

      {/* ── ตารางซ้อม ── */}
      <section>
        <SectionHeader label="ตารางซ้อม">
          <Link href={`/performances/${performance.id}/practice`} className="text-xs font-medium text-coral hover:underline">
            {canEdit ? "จัดการตารางซ้อม →" : "ดูตารางซ้อม →"}
          </Link>
        </SectionHeader>

        {practiceSchedules.length === 0 ? (
          <div className="px-4 py-5 bg-surface-card border border-hairline-soft rounded-[var(--radius-md)] flex items-center justify-between gap-4">
            <p className="text-sm text-muted-soft">ยังไม่มีตารางซ้อม</p>
            {canEdit && (
              <Link href={`/performances/${performance.id}/practice`} className="text-xs font-medium text-coral hover:underline shrink-0">
                + สร้างตารางซ้อม
              </Link>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {practiceSchedules.map((sched) => (
              <div key={sched.id} className="border border-hairline-soft rounded-[var(--radius-lg)] bg-surface-card overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-hairline-soft">
                  <p className="text-sm font-semibold text-ink">{sched.title}</p>
                  <Link
                    href={`/performances/${performance.id}/practice/${sched.id}`}
                    className="text-xs text-coral hover:underline"
                  >
                    ดูรายละเอียด →
                  </Link>
                </div>
                {sched.days.length === 0 ? (
                  <p className="px-4 py-3 text-sm text-muted-soft">ยังไม่มีวันซ้อม</p>
                ) : (
                  <div className="divide-y divide-hairline-soft">
                    {sched.days.map((day) => (
                      <div key={day.id} className="px-4 py-3 flex items-start gap-4">
                        <span className="text-sm font-medium text-ink shrink-0 w-28">
                          {new Date(day.date).toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "numeric" })}
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {day.slots.map((slot) => (
                            <span
                              key={slot.id}
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                                slot.isSpecial
                                  ? "bg-coral/10 border-coral/30 text-coral"
                                  : "bg-surface-cream-strong border-hairline text-ink"
                              }`}
                            >
                              {slot.startTime}–{slot.endTime}
                              {slot.label ? ` · ${slot.label}` : ""}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Section 8: ผังการแสดง (Stage Plot) ── */}
      <section>
        <SectionHeader label="ผังการแสดง (Stage Plot)">
          {canEdit && (
            <Link href={`/performances/${performance.id}/stages`} className="text-xs font-medium text-coral hover:underline">
              จัดการผังเวที →
            </Link>
          )}
        </SectionHeader>

        {stageLayout ? (
          <div className="border border-hairline-soft rounded-[var(--radius-lg)] bg-surface-card overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-hairline-soft">
              <p className="text-sm font-semibold text-ink">{stageLayout.name}</p>
              <Link
                href={`/performances/${performance.id}/stages/${stageLayout.id}`}
                className="text-xs text-coral hover:underline"
              >
                {canEdit ? "แก้ไข →" : "ดูเต็ม →"}
              </Link>
            </div>
            <div className="p-3">
              <MiniStagePreview layout={stageLayout} />
            </div>
            <p className="px-4 pb-2.5 text-xs text-muted-soft">
              {stageLayout.widthUnits} × {stageLayout.heightUnits} {stageLayout.unitLabel} · {stageLayout.items.length} ชิ้น
            </p>
          </div>
        ) : (
          <div className="px-4 py-5 bg-surface-card border border-hairline-soft rounded-[var(--radius-md)] flex items-center justify-between gap-4">
            <p className="text-sm text-muted-soft">ยังไม่มีผังเวที</p>
            {canEdit && (
              <Link href={`/performances/${performance.id}/stages`} className="text-xs font-medium text-coral hover:underline shrink-0">
                + สร้างผัง
              </Link>
            )}
          </div>
        )}
      </section>

      {/* ── รายการอุปกรณ์ที่ต้องใช้ ── */}
      {(() => {
        const posEntries = participants.filter((p) => p.position !== "");
        if (posEntries.length === 0) return null;

        // group by position → player count
        const posGroups: Record<string, number> = {};
        for (const p of posEntries) {
          posGroups[p.position] = (posGroups[p.position] ?? 0) + 1;
        }

        const instrData = globalInstruments;
        const getMeta = (name: string) => instrData.find((r) => r.name === name) ?? null;

        const totalPlayers = participants.filter((p) => p.position === "").length;

        const totalChairs = Object.entries(posGroups).reduce((sum, [pos, cnt]) => {
          const m = getMeta(pos);
          return sum + (m?.chairs ?? 0) * cnt;
        }, 0);
        const totalTables = Object.entries(posGroups).reduce((sum, [pos, cnt]) => {
          const m = getMeta(pos);
          return sum + (m?.tables ?? 0) * cnt;
        }, 0);

        return (
          <section>
            <SectionHeader label="รายการอุปกรณ์ที่ต้องใช้" />

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {/* เครื่องดนตรี */}
              <div className="border border-hairline-soft rounded-[var(--radius-lg)] bg-surface-card overflow-hidden">
                <div className="px-4 py-2.5 border-b border-hairline-soft bg-surface-soft">
                  <p className="text-xs font-semibold text-muted uppercase tracking-wide">เครื่องดนตรี</p>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-hairline-soft text-xs text-muted">
                      <th className="px-4 py-2 text-left">ชนิด</th>
                      <th className="px-4 py-2 text-center w-20">จำนวน</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-hairline-soft">
                    {Object.entries(posGroups).map(([pos, cnt]) => (
                      <tr key={pos}>
                        <td className="px-4 py-2 font-medium text-ink">{pos}</td>
                        <td className="px-4 py-2 text-center text-ink">{cnt}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* อุปกรณ์เสริม */}
              <div className="border border-hairline-soft rounded-[var(--radius-lg)] bg-surface-card overflow-hidden">
                <div className="px-4 py-2.5 border-b border-hairline-soft bg-surface-soft flex items-center justify-between">
                  <p className="text-xs font-semibold text-muted uppercase tracking-wide">อุปกรณ์เสริม</p>
                  {canEdit && !editingNotes && (
                    <button
                      onClick={() => { setNotesForm(performance.equipmentNotes ?? {}); setEditingNotes(true); }}
                      className="text-xs text-coral hover:underline"
                    >
                      แก้ไขหมายเหตุ
                    </button>
                  )}
                  {editingNotes && (
                    <div className="flex gap-2">
                      <button onClick={saveEquipmentNotes} disabled={notesLoading} className="text-xs text-coral hover:underline">
                        {notesLoading ? "กำลังบันทึก..." : "บันทึก"}
                      </button>
                      <button onClick={() => setEditingNotes(false)} className="text-xs text-muted hover:underline">ยกเลิก</button>
                    </div>
                  )}
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-hairline-soft text-xs text-muted">
                      <th className="px-4 py-2 text-left">รายการ</th>
                      <th className="px-4 py-2 text-center w-20">จำนวน</th>
                      <th className="px-4 py-2 text-left">หมายเหตุ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-hairline-soft">
                    {[
                      { label: "สแตนโน้ต", count: totalPlayers },
                      { label: "ขาไมค์", count: totalPlayers },
                      { label: "เก้าอี้", count: totalChairs },
                      { label: "โต๊ะ", count: totalTables },
                    ].map(({ label, count }) => (
                      <tr key={label}>
                        <td className="px-4 py-2 text-ink">{label}</td>
                        <td className="px-4 py-2 text-center text-ink">{count}</td>
                        <td className="px-4 py-2">
                          {editingNotes ? (
                            <input
                              type="text"
                              value={notesForm[label] ?? ""}
                              onChange={(e) => setNotesForm((prev) => ({ ...prev, [label]: e.target.value }))}
                              placeholder="หมายเหตุ..."
                              className="w-full text-xs px-2 py-1 border border-hairline rounded-[var(--radius-sm)] bg-canvas text-ink placeholder:text-muted-soft outline-none focus:border-coral focus:ring-[2px] focus:ring-coral/20"
                            />
                          ) : (
                            <span className="text-xs text-muted">
                              {performance.equipmentNotes?.[label] || "—"}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        );
      })()}

    </div>
  );
}
