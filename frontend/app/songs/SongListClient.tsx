"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Search, Music, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn } from "@/lib/utils";

interface Song {
  id: string;
  songCode: string;
  title: string;
  category: string;
  duration: number | null;
}

interface Props {
  songs: Song[];
  categories: string[];
  initialQ: string;
  initialCategory: string;
  isAdmin: boolean;
}

function formatDuration(seconds: number | null) {
  if (!seconds) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function SongListClient({
  songs,
  categories,
  initialQ,
  initialCategory,
  isAdmin,
}: Props) {
  const router = useRouter();
  const [q, setQ] = useState(initialQ);
  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: "",
    category: categories[0] ?? "ดนตรีไทย",
  });
  const [addingNewCategory, setAddingNewCategory] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [createError, setCreateError] = useState("");

  const filtered = useMemo(() => {
    const ql = q.toLowerCase();
    return songs.filter((s) => {
      const matchQ = !ql || s.title.toLowerCase().includes(ql);
      const matchCat = !activeCategory || s.category === activeCategory;
      return matchQ && matchCat;
    });
  }, [songs, q, activeCategory]);

  async function handleCreate() {
    if (!createForm.title.trim()) {
      setCreateError("กรุณากรอกชื่อเพลง");
      return;
    }
    const finalCategory = addingNewCategory
      ? newCategory.trim()
      : createForm.category;
    if (!finalCategory) {
      setCreateError("กรุณากรอกประเภท");
      return;
    }
    setCreating(true);
    setCreateError("");
    try {
      const songRes = await fetch("/api/songs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...createForm, category: finalCategory }),
      });
      if (!songRes.ok) {
        const d = await songRes.json();
        setCreateError(d.error ?? "สร้างเพลงไม่สำเร็จ");
        return;
      }
      const { song } = await songRes.json();
      const nbRes = await fetch("/api/notebooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ songId: song.id, name: song.title }),
      });
      const nbData = await nbRes.json();
      router.push(`/notebooks/${nbData.notebook.id}`);
    } finally {
      setCreating(false);
    }
  }

  function handleCategoryChange(cat: string) {
    setActiveCategory(cat);
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (cat) params.set("category", cat);
    router.replace(`/songs?${params.toString()}`, { scroll: false });
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Songs"
        title="คลังเพลงของวง"
        actions={
          isAdmin && (
            <Button
              variant="primary"
              onClick={() => {
                setCreateForm({ title: "", category: categories[0] ?? "ดนตรีไทย" });
                setAddingNewCategory(categories.length === 0);
                setNewCategory("");
                setShowCreate(true);
              }}
            >
              <Plus size={16} strokeWidth={1.75} />
              สร้างเพลง
            </Button>
          )
        }
      />

      <div className="flex flex-col gap-4">
        {/* Search */}
        <div className="relative max-w-md">
          <Search
            size={16}
            strokeWidth={1.75}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-soft pointer-events-none"
          />
          <Input
            placeholder="ค้นหาเพลง..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Category tabs — navy underline active state */}
        <div className="border-b border-hairline">
          <div className="flex flex-wrap gap-1">
            <CategoryTab
              active={!activeCategory}
              onClick={() => handleCategoryChange("")}
            >
              ทั้งหมด
              <span className="ml-1.5 text-[11px] text-muted-soft">
                {songs.length}
              </span>
            </CategoryTab>
            {categories.map((cat) => {
              const count = songs.filter((s) => s.category === cat).length;
              return (
                <CategoryTab
                  key={cat}
                  active={activeCategory === cat}
                  onClick={() => handleCategoryChange(cat)}
                >
                  {cat}
                  <span className="ml-1.5 text-[11px] text-muted-soft">{count}</span>
                </CategoryTab>
              );
            })}
          </div>
        </div>

        {/* Result count */}
        <p className="text-xs text-muted">
          {filtered.length} เพลง
          {q || activeCategory ? ` · กรองจาก ${songs.length}` : ""}
        </p>

        {/* Song list */}
        {filtered.length === 0 ? (
          <EmptyState
            icon={<Music size={28} strokeWidth={1.75} />}
            title="ไม่พบเพลงที่ค้นหา"
            description="ลองเปลี่ยนคำค้นหาหรือหมวดหมู่"
          />
        ) : (
          <div className="pb-stagger flex flex-col divide-y divide-hairline-soft border border-hairline rounded-[var(--radius-lg)] overflow-hidden bg-surface-card">
            {filtered.map((song) => (
              <Link
                key={song.id}
                href={`/songs/${song.id}`}
                className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-surface-cream-strong transition-colors duration-[var(--duration-pb-base)] group"
              >
                <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                  <span className="text-sm font-semibold text-ink group-hover:text-primary truncate transition-colors">
                    {song.title}
                  </span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <Badge variant="pill">{song.category}</Badge>
                  <span className="text-xs text-muted w-12 text-right tabular-nums">
                    {formatDuration(song.duration)}
                  </span>
                  <ChevronRight
                    size={16}
                    strokeWidth={1.75}
                    className="text-muted-soft transition-transform duration-[var(--duration-pb-base)] group-hover:translate-x-0.5 group-hover:text-primary"
                  />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Create song modal */}
      <Modal
        open={showCreate}
        onClose={() => {
          if (!creating) {
            setShowCreate(false);
            setCreateError("");
          }
        }}
        title="สร้างเพลงใหม่"
        size="sm"
        footer={
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setShowCreate(false);
                setCreateError("");
              }}
              disabled={creating}
            >
              ยกเลิก
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleCreate}
              disabled={creating}
            >
              {creating ? "กำลังสร้าง..." : "สร้างเพลง"}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Input
            label="ชื่อเพลง *"
            placeholder="เช่น โหมโรงยะวา"
            value={createForm.title}
            onChange={(e) =>
              setCreateForm((f) => ({ ...f, title: e.target.value }))
            }
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-ink">ประเภท</label>
            {addingNewCategory ? (
              <div className="flex gap-2">
                <input
                  autoFocus
                  className="h-10 flex-1 rounded-[var(--radius-md)] border border-hairline bg-white px-3.5 text-sm text-ink placeholder:text-muted-soft focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/15"
                  placeholder="เช่น เพลงพระราชนิพนธ์"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                />
                {categories.length > 0 && (
                  <button
                    type="button"
                    className="text-xs text-muted hover:text-ink px-2"
                    onClick={() => {
                      setAddingNewCategory(false);
                      setNewCategory("");
                    }}
                  >
                    ยกเลิก
                  </button>
                )}
              </div>
            ) : (
              <div className="flex gap-2">
                <select
                  className="h-10 flex-1 rounded-[var(--radius-md)] border border-hairline bg-white px-3 text-sm text-ink focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/15"
                  value={createForm.category}
                  onChange={(e) =>
                    setCreateForm((f) => ({ ...f, category: e.target.value }))
                  }
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="text-xs text-primary hover:underline px-2 whitespace-nowrap"
                  onClick={() => {
                    setAddingNewCategory(true);
                    setNewCategory("");
                  }}
                >
                  + เพิ่มประเภทใหม่
                </button>
              </div>
            )}
          </div>
          {createError && (
            <p className="text-xs text-error">{createError}</p>
          )}
        </div>
      </Modal>
    </div>
  );
}

function CategoryTab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "relative px-4 py-2.5 text-sm font-medium transition-colors duration-[var(--duration-pb-base)]",
        active
          ? "text-ink after:content-[''] after:absolute after:left-3 after:right-3 after:-bottom-px after:h-[2px] after:bg-primary"
          : "text-muted hover:text-ink"
      )}
    >
      {children}
    </button>
  );
}
