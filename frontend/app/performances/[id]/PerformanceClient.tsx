"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, Download, Star } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { TimeRangePicker } from "@/components/ui/TimeRangePicker";
import { PerformanceSongSections } from "./PerformanceSongSections";
import { POSITIONS } from "@/lib/positions";
import { accessoryTotals, type AccessoryType, type InstrumentAccessories } from "@/lib/accessories";
import { getInstrumentColor } from "@/lib/instrumentColors";

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
  sectionId: string | null;
  orderInSection: number;
};

type SectionEntry = {
  id: string;
  name: string;
  sectionOrder: number;
};


type Performance = {
  id: string;
  name: string;
  location: string | null;
  description: string | null;
  costume: string | null;
  equipmentNotes: Record<string, string> | null;
  dates: DateEntry[];
  songs: SongEntry[];
  sections: SectionEntry[];
};

type StageItem = {
  id: string;
  x: number;
  y: number;
  rotation: number;
  label: string;
  customName?: string | null;
  customWidth?: number | null;
  customHeight?: number | null;
  instrument: { id: string; name: string; nameThai: string; iconType: string; footprintW: number; footprintH: number } | null;
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
            const isCustom = !item.instrument;
            const c = getInstrumentColor(item.instrument?.iconType ?? "default");
            const fpW = item.instrument?.footprintW ?? item.customWidth ?? 2;
            const fpH = item.instrument?.footprintH ?? item.customHeight ?? 1;
            const wPct = (fpW / layout.widthUnits) * 100;
            const hPct = (fpH / layout.heightUnits) * 100;
            const xPct = (item.x / layout.widthUnits) * 100;
            const yPct = (item.y / layout.heightUnits) * 100;
            return (
              <div
                key={item.id}
                className="absolute flex items-center justify-center rounded text-[9px] font-semibold leading-tight text-center overflow-hidden"
                style={{
                  left: `${xPct}%`,
                  top: `${yPct}%`,
                  width: `${wPct}%`,
                  height: `${hPct}%`,
                  transform: `rotate(${item.rotation}deg)`,
                  backgroundColor: isCustom ? "transparent" : c.bg,
                  border: `1px ${isCustom ? "dashed" : "solid"} ${c.border}`,
                  color: c.text,
                  minWidth: "20px",
                  minHeight: "16px",
                }}
              >
                <span className="px-0.5 truncate">{item.customName || item.label || item.instrument?.nameThai || ""}</span>
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
        <button onClick={onClose} aria-label="ปิด" className="text-muted hover:text-ink text-lg leading-none">×</button>
      </div>
      <div className="px-4 pt-3 pb-2">
        <input
          autoFocus
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ค้นหาชื่อเพลง / รหัส..."
          className="w-full px-3 py-2 text-sm border border-hairline rounded-[var(--radius-md)] bg-canvas text-ink placeholder:text-muted-soft outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/15"
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
                  <p className="text-xs text-muted-soft">{song.category}</p>
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

type PollEntry = {
  id: string;
  name: string;
  status: "OPEN" | "CLOSED";
  deadline: string | null;
  slotCount: number;
  responseCount: number;
};

export default function PerformanceClient({
  performance: initial,
  participants: initialParticipants,
  isAdmin,
  isHead,
  hasJoined: initialHasJoined,
  stageLayout,
  practiceSchedules,
  polls,
}: {
  performance: Performance;
  participants: Participant[];
  isAdmin: boolean;
  isHead: boolean;
  hasJoined: boolean;
  stageLayout: StageLayout | null;
  practiceSchedules: PracticeScheduleEntry[];
  polls: PollEntry[];
}) {
  const router = useRouter();
  const confirm = useConfirm();
  const toast = useToast();
  const [performance, setPerformance] = useState(initial);
  const [participants, setParticipants] = useState(initialParticipants);
  const [hasJoined, setHasJoined] = useState(initialHasJoined);
  const [joinLoading, setJoinLoading] = useState(false);
  const [allMembers, setAllMembers] = useState<AssignedHead[]>([]);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Past performances are frozen — hide all edit UI once ended
  const [todayStr] = useState(() => new Date(Date.now() + 7 * 3600 * 1000).toISOString().slice(0, 10));
  const hasEnded = (() => {
    if (performance.dates.length === 0) return false;
    const latestStr = performance.dates[performance.dates.length - 1].date.slice(0, 10);
    return latestStr < todayStr;
  })();
  const canEdit = (isAdmin || isHead) && !hasEnded;

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
        toast.success("บันทึกหมายเหตุอุปกรณ์แล้ว");
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(`บันทึกไม่สำเร็จ: ${err.error ?? res.status}`);
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

  function openEditInfo() {
    setEditName(performance.name);
    setEditLocation(performance.location ?? "");
    setEditDates(performance.dates);
    setEditingInfo(true);
  }

  async function saveInfo() {
    setInfoLoading(true);
    try {
      const infoRes = await fetch(`/api/performances/${performance.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName.trim(),
          location: editLocation.trim() || null,
        }),
      });
      if (!infoRes.ok) {
        const err = await infoRes.json().catch(() => ({}));
        toast.error(`บันทึกไม่สำเร็จ: ${err.error ?? infoRes.status}`);
        return;
      }

      // Only time changes are persisted here — dates are locked after creation
      const original = new Map(performance.dates.map((d) => [d.id, d]));
      const dirtyDates = editDates.filter((d) => {
        const orig = original.get(d.id);
        if (!orig) return false;
        return (
          (orig.startTime ?? "") !== (d.startTime ?? "") ||
          (orig.endTime ?? "") !== (d.endTime ?? "")
        );
      });
      for (const d of dirtyDates) {
        const r = await fetch(`/api/performances/${performance.id}/dates`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            dateId: d.id,
            startTime: d.startTime ?? "",
            endTime: d.endTime ?? "",
          }),
        });
        if (!r.ok) {
          const err = await r.json().catch(() => ({}));
          toast.error(`บันทึกวัน/เวลาไม่สำเร็จ: ${err.error ?? r.status}`);
          return;
        }
      }

      setPerformance((prev) => ({
        ...prev,
        name: editName.trim(),
        location: editLocation.trim() || null,
        dates: editDates,
      }));
      setEditingInfo(false);
      router.refresh();
      toast.success("บันทึกข้อมูลงานแล้ว");
    } finally {
      setInfoLoading(false);
    }
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
        toast.success("บันทึกเครื่องแต่งกายแล้ว");
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(`บันทึกไม่สำเร็จ: ${err.error ?? res.status}`);
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
        toast.success("บันทึกหมายเหตุแล้ว");
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(`บันทึกไม่สำเร็จ: ${err.error ?? res.status}`);
      }
    } finally {
      setDescLoading(false);
    }
  }

  // ── Global instrument equipment ───────────────────────────
  const [accessorySettings, setAccessorySettings] = useState<{
    accessories: AccessoryType[];
    rows: InstrumentAccessories[];
  }>({ accessories: [], rows: [] });

  useEffect(() => {
    fetch("/api/instrument-equipment")
      .then((r) => r.json())
      .then((d) => setAccessorySettings({ accessories: d.accessories ?? [], rows: d.rows ?? [] }))
      .catch(() => {});
  }, []);

  // ── Songs ─────────────────────────────────────────────────
  const [showPicker, setShowPicker] = useState(false);

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
          sectionId: ps.sectionId ?? null,
          orderInSection: ps.orderInSection ?? 0,
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
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || "ไม่สำเร็จ");
        return;
      }
      setHasJoined((v) => !v);
      toast.success(hasJoined ? "ยกเลิกการเข้าร่วมแล้ว" : "เข้าร่วมงานแสดงแล้ว");
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
    const ok = await confirm({
      title: "ลบงานแสดง",
      message: `ต้องการลบ "${performance.name}" ใช่หรือไม่? ข้อมูลการเข้าร่วมทั้งหมดจะหายไป`,
      confirmLabel: "ลบงานแสดง",
      variant: "danger",
      requireText: performance.name,
    });
    if (!ok) return;
    setDeleteLoading(true);
    const res = await fetch(`/api/performances/${performance.id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("ลบงานแสดงแล้ว");
      router.push("/performances");
    } else {
      toast.error("ลบไม่สำเร็จ");
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
      const res = await fetch(`/api/users?performanceId=${performance.id}`);
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
    const target = participants.find((p) => p.userId === userId);
    const nickname = target?.nickname ?? "";
    const ok = await confirm({
      title: "ลบสมาชิกออกจากงานแสดง",
      message: `ต้องการลบ "${nickname}" ออกจากงานแสดงนี้? การเข้าร่วมทั้งหมดของสมาชิกคนนี้จะถูกลบ`,
      confirmLabel: "ลบสมาชิก",
      variant: "danger",
      requireText: nickname,
    });
    if (!ok) return;
    const res = await fetch(`/api/performances/${performance.id}/members`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    if (!res.ok) {
      toast.error("ลบสมาชิกไม่สำเร็จ");
      return;
    }
    setParticipants((prev) => prev.filter((p) => p.userId !== userId));
    toast.success(`ลบ ${nickname} แล้ว`);
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
    const target = participants.find((p) => p.userId === userId && p.position === position);
    const nickname = target?.nickname ?? "";
    const ok = await confirm({
      title: "ลบสมาชิกจากตำแหน่ง",
      message: `ลบ "${nickname}" ออกจากตำแหน่ง "${position}"?`,
      confirmLabel: "ลบ",
      variant: "danger",
      requireText: nickname,
    });
    if (!ok) return;
    const res = await fetch(`/api/performances/${performance.id}/members`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, position }),
    });
    if (!res.ok) {
      toast.error("ลบไม่สำเร็จ");
      return;
    }
    setParticipants((prev) => prev.filter((p) => !(p.userId === userId && p.position === position)));
    toast.success(`ลบ ${nickname} ออกจาก ${position}`);
  }

  // ─── Render ───────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-8">

      {/* Top action bar */}
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-ink">{performance.name}</h1>
        <div className="flex gap-2 shrink-0 items-center">
          {(() => {
            if (hasEnded) {
              return (
                <span className="inline-flex items-center h-9 px-3 rounded-[var(--radius-md)] border border-hairline-soft bg-surface-cream-strong text-sm text-muted">
                  งานแสดงสิ้นสุดแล้ว
                </span>
              );
            }
            return (
              <Button
                size="sm"
                variant={hasJoined ? "secondary" : "primary"}
                onClick={toggleJoin}
                disabled={joinLoading}
              >
                {joinLoading ? (
                  "..."
                ) : hasJoined ? (
                  <>
                    <Check size={14} strokeWidth={1.75} />
                    เข้าร่วมแล้ว
                  </>
                ) : (
                  "เข้าร่วม"
                )}
              </Button>
            );
          })()}
          {canEdit && (
            <a
              href={`/api/performances/${performance.id}/export`}
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-[var(--radius-md)] border border-hairline bg-canvas text-sm font-medium text-ink hover:border-primary hover:text-primary transition-colors duration-[var(--duration-pb-base)]"
            >
              <Download size={14} strokeWidth={1.75} />
              Export
            </a>
          )}
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
            <button onClick={openEditInfo} className="text-xs font-medium text-body-strong hover:text-primary transition-colors duration-[var(--duration-pb-base)]">
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
                    <div key={d.id} className="flex flex-col gap-2 p-3 bg-surface-soft rounded-[var(--radius-md)] border border-hairline-soft">
                      <span className="text-sm font-medium text-ink">
                        {new Date(d.date).toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "numeric", timeZone: "Asia/Bangkok" })}
                      </span>
                      <TimeRangePicker
                        startTime={d.startTime ?? ""}
                        endTime={d.endTime ?? ""}
                        onChange={(s, e) =>
                          setEditDates((prev) =>
                            prev.map((x) => (x.id === d.id ? { ...x, startTime: s, endTime: e } : x))
                          )
                        }
                      />
                    </div>
                  ))}
                  <p className="text-[11px] text-muted-soft pt-1">
                    วันที่กำหนดตอนสร้างงาน แก้ไม่ได้ — แก้ได้เฉพาะเวลาของแต่ละวัน
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="primary" onClick={saveInfo} disabled={infoLoading}>
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
              className="text-xs font-medium text-body-strong hover:text-primary transition-colors duration-[var(--duration-pb-base)]"
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
              className="w-full px-3 py-2 text-sm text-ink bg-canvas border border-hairline rounded-[var(--radius-md)] placeholder:text-muted-soft focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/15 resize-none"
            />
            <div className="flex gap-2">
              <Button size="sm" variant="primary" onClick={saveCostume} disabled={costumeLoading}>
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
              className="text-xs font-medium text-body-strong hover:text-primary transition-colors duration-[var(--duration-pb-base)]"
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
              className="w-full px-3 py-2 text-sm text-ink bg-canvas border border-hairline rounded-[var(--radius-md)] placeholder:text-muted-soft focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/15 resize-none"
            />
            <div className="flex gap-2">
              <Button size="sm" variant="primary" onClick={saveDescription} disabled={descLoading}>
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
              className="text-xs font-medium text-body-strong hover:text-primary transition-colors duration-[var(--duration-pb-base)]"
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

        {performance.songs.length === 0 && performance.sections.length === 0 ? (
          <p className="text-sm text-muted-soft">ยังไม่มีเพลงในงานแสดงนี้</p>
        ) : (
          <PerformanceSongSections
            performanceId={performance.id}
            songs={performance.songs}
            sections={performance.sections}
            canEdit={canEdit}
            onRemoveSong={removeSong}
            onSongsChanged={(next) => setPerformance((prev) => ({ ...prev, songs: next }))}
            onSectionsChanged={(next) => setPerformance((prev) => ({ ...prev, sections: next }))}
          />
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
                    <button onClick={openAddMember} className="text-xs font-medium text-body-strong hover:text-primary transition-colors duration-[var(--duration-pb-base)]">
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
                        className="w-full px-3 py-1.5 text-sm border border-hairline rounded-[var(--radius-md)] bg-canvas text-ink placeholder:text-muted-soft outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/15"
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
                                  ? "bg-primary text-on-primary border-primary"
                                  : "bg-canvas border-hairline text-ink hover:border-primary hover:text-primary"
                              }`}
                            >
                              {m.nickname}
                              <span className="opacity-60 ml-0.5">{m.generation}</span>
                            </button>
                          );
                        })}
                    </div>
                    <div className="flex gap-2 px-4 pb-3">
                      <Button size="sm" variant="primary" disabled={selectedAddUserIds.length === 0 || addMemberLoading} onClick={() => addMembersToPerformance(joinedMembers)}>
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
                    <button onClick={openPositionPanel} className="text-xs font-medium text-body-strong hover:text-primary transition-colors duration-[var(--duration-pb-base)]">
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
                            memberStep === s ? "bg-primary text-on-primary" : "bg-surface-soft text-muted-soft"
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
                          className="w-full mb-3 px-3 py-1.5 text-sm border border-hairline rounded-[var(--radius-md)] bg-canvas text-ink placeholder:text-muted-soft outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/15"
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
                                className="accent-[color:var(--color-primary)] w-4 h-4 shrink-0"
                              />
                              <span className="text-sm text-ink group-hover:text-primary transition-colors">{pos}</span>
                            </label>
                          ))}
                        </div>
                        {selectedPositions.includes("อื่นๆ") && (
                          <input
                            type="text"
                            value={customPosition}
                            onChange={(e) => setCustomPosition(e.target.value)}
                            placeholder="ระบุตำแหน่งอื่นๆ..."
                            className="mt-3 w-full px-3 py-1.5 text-sm border border-hairline rounded-[var(--radius-md)] bg-canvas text-ink placeholder:text-muted-soft outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/15"
                          />
                        )}
                        <div className="flex gap-2 mt-4">
                          <Button
                            size="sm"
                            variant="primary"
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
                          className="w-full px-3 py-1.5 text-sm border border-hairline rounded-[var(--radius-md)] bg-canvas text-ink placeholder:text-muted-soft outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/15"
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
                                            ? "bg-primary text-on-primary border-primary"
                                            : "bg-canvas border-hairline text-ink hover:border-primary hover:text-primary"
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
                          <Button size="sm" variant="primary" onClick={() => savePositionAssignments(joinedMembers, positionEntries)} disabled={saveMembersLoading}>
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
                              key={`${p.userId}-${p.position}`}
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

      {/* ── โพลตารางว่าง ── */}
      {polls.length > 0 && (
        <section>
          <SectionHeader label="โพลตารางว่าง" />
          <div className="flex flex-col gap-2">
            {polls.map((p) => (
              <Link
                key={p.id}
                href={`/polls/${p.id}`}
                className="flex items-center justify-between px-4 py-3 bg-surface-card border border-hairline-soft rounded-[var(--radius-md)] hover:border-primary transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className={`inline-block w-2 h-2 rounded-full ${p.status === "OPEN" ? "bg-emerald-500" : "bg-muted-soft"}`} />
                  <div>
                    <p className="text-sm font-medium text-ink">{p.name}</p>
                    <p className="text-xs text-muted-soft mt-0.5">
                      {p.status === "OPEN" ? "เปิดรับคำตอบ" : "ปิดแล้ว"} · {p.slotCount} ช่วง · {p.responseCount} คำตอบ
                      {p.deadline && p.status === "OPEN" && (
                        <> · หมดเขต {new Date(p.deadline).toLocaleString("th-TH", { dateStyle: "short", timeStyle: "short" })}</>
                      )}
                    </p>
                  </div>
                </div>
                <span className="text-xs text-body-strong">เปิด →</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── ตารางซ้อม ── */}
      <section>
        <SectionHeader label="ตารางซ้อม">
          <div className="flex items-center gap-4">
            {canEdit && (
              <Link href={`/performances/${performance.id}/polls/new`} className="text-xs font-medium text-body-strong hover:text-primary transition-colors duration-[var(--duration-pb-base)]">
                + โพลตารางว่าง
              </Link>
            )}
            <Link href={`/performances/${performance.id}/practice`} className="text-xs font-medium text-body-strong hover:text-primary transition-colors duration-[var(--duration-pb-base)]">
              {canEdit ? "จัดการตารางซ้อม →" : "ดูตารางซ้อม →"}
            </Link>
          </div>
        </SectionHeader>

        {practiceSchedules.length === 0 ? (
          <div className="px-4 py-5 bg-surface-card border border-hairline-soft rounded-[var(--radius-md)] flex items-center justify-between gap-4">
            <p className="text-sm text-muted-soft">ยังไม่มีตารางซ้อม</p>
            {canEdit && (
              <Link href={`/performances/${performance.id}/practice`} className="text-xs font-medium text-body-strong hover:text-primary transition-colors duration-[var(--duration-pb-base)] shrink-0">
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
                    className="text-xs text-body-strong hover:text-primary transition-colors duration-[var(--duration-pb-base)]"
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
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[var(--radius-pill)] text-xs font-medium border ${
                                slot.isSpecial
                                  ? "bg-primary/5 border-primary/40 text-primary"
                                  : "bg-surface-cream-strong border-hairline text-ink"
                              }`}
                            >
                              {slot.isSpecial && (
                                <Star size={10} strokeWidth={1.75} />
                              )}
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
            <Link href={`/performances/${performance.id}/stages`} className="text-xs font-medium text-body-strong hover:text-primary transition-colors duration-[var(--duration-pb-base)]">
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
                className="text-xs text-body-strong hover:text-primary transition-colors duration-[var(--duration-pb-base)]"
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
              <Link href={`/performances/${performance.id}/stages`} className="text-xs font-medium text-body-strong hover:text-primary transition-colors duration-[var(--duration-pb-base)] shrink-0">
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

        // Each member has one position="" entry, so these are the people.
        const totalPlayers = participants.filter((p) => p.position === "").length;
        const totals = accessoryTotals(
          accessorySettings.accessories,
          accessorySettings.rows,
          totalPlayers,
          posGroups
        );

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
                      className="text-xs text-body-strong hover:text-primary transition-colors duration-[var(--duration-pb-base)]"
                    >
                      แก้ไขหมายเหตุ
                    </button>
                  )}
                  {editingNotes && (
                    <div className="flex gap-2">
                      <button onClick={saveEquipmentNotes} disabled={notesLoading} className="text-xs text-body-strong hover:text-primary transition-colors duration-[var(--duration-pb-base)]">
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
                    {totals.map(({ name: label, count }) => (
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
                              className="w-full text-xs px-2 py-1 border border-hairline rounded-[var(--radius-sm)] bg-canvas text-ink placeholder:text-muted-soft outline-none focus:border-primary focus:ring-[2px] focus:ring-coral/20"
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
