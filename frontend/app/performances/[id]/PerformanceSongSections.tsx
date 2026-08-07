"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Plus, Pencil, Trash2, X } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useConfirm } from "@/components/ui/ConfirmDialog";

export type SongEntry = {
  id: string;
  songId: string;
  order: number;
  title: string;
  songCode: string;
  category: string;
  sectionId: string | null;
  orderInSection: number;
};

export type SectionEntry = {
  id: string;
  name: string;
  sectionOrder: number;
};

type Props = {
  performanceId: string;
  songs: SongEntry[];
  sections: SectionEntry[];
  canEdit: boolean;
  onRemoveSong: (songId: string) => Promise<void>;
  onSongsChanged: (songs: SongEntry[]) => void;
  onSectionsChanged: (sections: SectionEntry[]) => void;
};

const UNSECTIONED_ID = "__unsectioned__";

export function PerformanceSongSections({
  performanceId,
  songs,
  sections,
  canEdit,
  onRemoveSong,
  onSongsChanged,
  onSectionsChanged,
}: Props) {
  const confirm = useConfirm();
  const [addingSection, setAddingSection] = useState(false);
  const [newSectionName, setNewSectionName] = useState("");
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameText, setRenameText] = useState("");
  const [activeDragSong, setActiveDragSong] = useState<SongEntry | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const grouped = useMemo(() => {
    const bySection = new Map<string, SongEntry[]>();
    for (const s of songs) {
      const key = s.sectionId ?? UNSECTIONED_ID;
      const arr = bySection.get(key) ?? [];
      arr.push(s);
      bySection.set(key, arr);
    }
    for (const [, arr] of bySection) {
      arr.sort((a, b) => a.orderInSection - b.orderInSection);
    }
    return bySection;
  }, [songs]);

  const unsectionedSongs = grouped.get(UNSECTIONED_ID) ?? [];

  async function createSection() {
    const name = newSectionName.trim();
    if (!name) return;
    const res = await fetch(`/api/performances/${performanceId}/sections`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) return;
    const data = await res.json();
    onSectionsChanged([...sections, {
      id: data.section.id,
      name: data.section.name,
      sectionOrder: data.section.sectionOrder,
    }]);
    setNewSectionName("");
    setAddingSection(false);
  }

  async function renameSection(id: string) {
    const name = renameText.trim();
    if (!name) {
      setRenamingId(null);
      return;
    }
    const res = await fetch(`/api/performances/${performanceId}/sections/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) return;
    onSectionsChanged(sections.map((s) => (s.id === id ? { ...s, name } : s)));
    setRenamingId(null);
  }

  async function deleteSection(id: string) {
    const ok = await confirm({
      title: "ลบช่วงนี้?",
      message: "เพลงในช่วงจะกลายเป็น 'ยังไม่จัดช่วง' — ไม่ได้ลบเพลง",
      confirmLabel: "ลบ",
      variant: "danger",
    });
    if (!ok) return;
    const res = await fetch(`/api/performances/${performanceId}/sections/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) return;
    onSectionsChanged(sections.filter((s) => s.id !== id));
    onSongsChanged(songs.map((s) => (s.sectionId === id ? { ...s, sectionId: null } : s)));
  }

  async function persistSongsOrder(next: SongEntry[]) {
    const items = next.map((s) => ({
      performanceSongId: s.id,
      sectionId: s.sectionId,
      orderInSection: s.orderInSection,
    }));
    await fetch(`/api/performances/${performanceId}/songs/reorder`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    });
  }

  function handleDragStart(e: DragStartEvent) {
    const song = songs.find((s) => s.id === e.active.id);
    setActiveDragSong(song ?? null);
  }

  function handleDragEnd(e: DragEndEvent) {
    setActiveDragSong(null);
    const { active, over } = e;
    if (!over) return;
    const activeId = String(active.id);
    const overId = String(over.id);
    if (activeId === overId) return;

    const activeSong = songs.find((s) => s.id === activeId);
    if (!activeSong) return;

    // Determine target section: overId may be a song id or a section-drop id
    let targetSectionId: string | null;
    let targetIndex: number;

    if (overId.startsWith("drop:")) {
      const raw = overId.slice("drop:".length);
      targetSectionId = raw === UNSECTIONED_ID ? null : raw;
      targetIndex = (grouped.get(raw) ?? []).length;
    } else {
      const overSong = songs.find((s) => s.id === overId);
      if (!overSong) return;
      targetSectionId = overSong.sectionId;
      const targetGroup = grouped.get(overSong.sectionId ?? UNSECTIONED_ID) ?? [];
      targetIndex = targetGroup.findIndex((s) => s.id === overId);
    }

    const sourceGroup = grouped.get(activeSong.sectionId ?? UNSECTIONED_ID) ?? [];

    const nextGroups = new Map(grouped);

    if (activeSong.sectionId === targetSectionId) {
      const sourceIdx = sourceGroup.findIndex((s) => s.id === activeId);
      const reordered = arrayMove(sourceGroup, sourceIdx, targetIndex);
      nextGroups.set(activeSong.sectionId ?? UNSECTIONED_ID, reordered);
    } else {
      const newSource = sourceGroup.filter((s) => s.id !== activeId);
      nextGroups.set(activeSong.sectionId ?? UNSECTIONED_ID, newSource);
      const targetGroup = [...(nextGroups.get(targetSectionId ?? UNSECTIONED_ID) ?? [])];
      const moved = { ...activeSong, sectionId: targetSectionId };
      targetGroup.splice(targetIndex, 0, moved);
      nextGroups.set(targetSectionId ?? UNSECTIONED_ID, targetGroup);
    }

    const flat: SongEntry[] = [];
    for (const [, arr] of nextGroups) {
      arr.forEach((s, idx) => flat.push({ ...s, orderInSection: idx }));
    }
    onSongsChanged(flat);
    void persistSongsOrder(flat);
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col gap-4">
        {unsectionedSongs.length > 0 && (
          <SectionBlock
            id={UNSECTIONED_ID}
            title="ยังไม่จัดช่วง"
            songs={unsectionedSongs}
            canEdit={canEdit}
            onRemoveSong={onRemoveSong}
            isSpecial
          />
        )}

        {sections.map((sec) => (
          <SectionBlock
            key={sec.id}
            id={sec.id}
            title={sec.name}
            songs={grouped.get(sec.id) ?? []}
            canEdit={canEdit}
            onRemoveSong={onRemoveSong}
            isRenaming={renamingId === sec.id}
            renameText={renameText}
            onStartRename={() => {
              setRenameText(sec.name);
              setRenamingId(sec.id);
            }}
            onRenameChange={setRenameText}
            onRenameCommit={() => renameSection(sec.id)}
            onRenameCancel={() => setRenamingId(null)}
            onDeleteSection={() => deleteSection(sec.id)}
          />
        ))}

        {canEdit && (
          <div>
            {addingSection ? (
              <div className="flex items-center gap-2 p-3 bg-surface-card border border-primary/40 rounded-[var(--radius-md)]">
                <Input
                  value={newSectionName}
                  onChange={(e) => setNewSectionName(e.target.value)}
                  placeholder="ชื่อช่วง เช่น ไหว้ครู"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") createSection();
                    if (e.key === "Escape") { setAddingSection(false); setNewSectionName(""); }
                  }}
                />
                <Button size="sm" variant="primary" onClick={createSection}>
                  เพิ่ม
                </Button>
                <Button size="sm" variant="secondary" onClick={() => { setAddingSection(false); setNewSectionName(""); }}>
                  ยกเลิก
                </Button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setAddingSection(true)}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-body-strong hover:text-primary transition-colors"
              >
                <Plus size={14} strokeWidth={1.75} />
                เพิ่มช่วง
              </button>
            )}
          </div>
        )}
      </div>

      <DragOverlay>
        {activeDragSong && (
          <div className="flex items-center gap-3 px-4 py-3 bg-surface-card border border-primary rounded-[var(--radius-md)] shadow-lg opacity-95">
            <GripVertical size={14} className="text-muted-soft" />
            <p className="text-sm font-medium text-ink truncate">{activeDragSong.title}</p>
            <Badge variant="pill" className="text-[11px]">{activeDragSong.category}</Badge>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}

function SectionBlock({
  id,
  title,
  songs,
  canEdit,
  onRemoveSong,
  isSpecial,
  isRenaming,
  renameText,
  onStartRename,
  onRenameChange,
  onRenameCommit,
  onRenameCancel,
  onDeleteSection,
}: {
  id: string;
  title: string;
  songs: SongEntry[];
  canEdit: boolean;
  onRemoveSong: (songId: string) => Promise<void>;
  isSpecial?: boolean;
  isRenaming?: boolean;
  renameText?: string;
  onStartRename?: () => void;
  onRenameChange?: (v: string) => void;
  onRenameCommit?: () => void;
  onRenameCancel?: () => void;
  onDeleteSection?: () => void;
}) {
  return (
    <div className={[
      "border rounded-[var(--radius-lg)] overflow-hidden",
      isSpecial
        ? "border-dashed border-muted-soft bg-surface-soft"
        : "border-hairline-soft bg-surface-card",
    ].join(" ")}>
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-hairline-soft">
        {isRenaming ? (
          <div className="flex-1 flex items-center gap-2">
            <Input
              value={renameText ?? ""}
              onChange={(e) => onRenameChange?.(e.target.value)}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") onRenameCommit?.();
                if (e.key === "Escape") onRenameCancel?.();
              }}
            />
            <Button size="sm" variant="primary" onClick={onRenameCommit}>บันทึก</Button>
            <Button size="sm" variant="secondary" onClick={onRenameCancel}>ยกเลิก</Button>
          </div>
        ) : (
          <>
            <p className={[
              "text-sm font-bold",
              isSpecial ? "text-muted" : "text-ink",
            ].join(" ")}>
              {title} <span className="text-muted-soft font-medium">({songs.length})</span>
            </p>
            {!isSpecial && canEdit && (
              <div className="flex items-center gap-1">
                <button
                  onClick={onStartRename}
                  className="p-1.5 text-muted hover:text-ink transition-colors"
                  aria-label="เปลี่ยนชื่อช่วง"
                >
                  <Pencil size={13} strokeWidth={1.75} />
                </button>
                <button
                  onClick={onDeleteSection}
                  className="p-1.5 text-muted hover:text-error transition-colors"
                  aria-label="ลบช่วง"
                >
                  <Trash2 size={13} strokeWidth={1.75} />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <SectionDropZone sectionId={id} songCount={songs.length}>
        <SortableContext items={songs.map((s) => s.id)} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-1.5 p-3 min-h-[52px]">
            {songs.length === 0 ? (
              <p className="text-xs text-muted-soft text-center py-3">ช่วงนี้ยังไม่มีเพลง — ลากเพลงมาวาง</p>
            ) : (
              songs.map((s, i) => (
                <SortableSongRow
                  key={s.id}
                  song={s}
                  index={i}
                  canEdit={canEdit}
                  onRemove={() => onRemoveSong(s.songId)}
                />
              ))
            )}
          </div>
        </SortableContext>
      </SectionDropZone>
    </div>
  );
}

function SectionDropZone({
  sectionId,
  songCount,
  children,
}: {
  sectionId: string;
  songCount: number;
  children: React.ReactNode;
}) {
  const { setNodeRef } = useSortable({ id: `drop:${sectionId}`, disabled: songCount > 0 });
  return (
    <div ref={setNodeRef}>{children}</div>
  );
}

function SortableSongRow({
  song,
  index,
  canEdit,
  onRemove,
}: {
  song: SongEntry;
  index: number;
  canEdit: boolean;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: song.id,
    disabled: !canEdit,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 px-3 py-2.5 bg-canvas border border-hairline-soft rounded-[var(--radius-md)]"
    >
      {canEdit && (
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="p-1 text-muted-soft hover:text-ink cursor-grab active:cursor-grabbing touch-none"
          aria-label="ลาก"
        >
          <GripVertical size={14} strokeWidth={1.75} />
        </button>
      )}
      <span className="text-xs text-muted-soft w-5 text-right shrink-0">{index + 1}</span>
      <Link href={`/songs/${song.songId}`} className="flex-1 min-w-0 group">
        <p className="text-sm font-medium text-ink truncate group-hover:text-primary transition-colors">
          {song.title}
        </p>
        <p className="text-xs text-muted-soft">{song.songCode}</p>
      </Link>
      <Badge variant="pill" className="text-[11px]">{song.category}</Badge>
      {canEdit && (
        <button
          onClick={onRemove}
          className="text-muted hover:text-error transition-colors shrink-0 p-1"
          aria-label="ลบเพลง"
        >
          <X size={14} strokeWidth={1.75} />
        </button>
      )}
    </div>
  );
}
