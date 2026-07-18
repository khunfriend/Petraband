"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
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
  if (!seconds) return "N/A";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function SongListClient({ songs, categories, initialQ, initialCategory, isAdmin }: Props) {
  const router = useRouter();
  const [q, setQ] = useState(initialQ);
  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({ title: "", songCode: "", category: "ดนตรีไทย" });
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
    if (!createForm.title.trim() || !createForm.songCode.trim()) {
      setCreateError("กรุณากรอกชื่อเพลงและรหัสเพลง");
      return;
    }
    setCreating(true);
    setCreateError("");
    try {
      const songRes = await fetch("/api/songs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createForm),
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
    <div className="flex flex-col gap-4">
      {/* Create Song Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-canvas rounded-[var(--radius-lg)] border border-hairline-soft w-full max-w-sm mx-4 p-6 flex flex-col gap-4">
            <h2 className="text-base font-bold text-ink">สร้างเพลงใหม่</h2>
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-xs text-muted mb-1 block">ชื่อเพลง *</label>
                <input
                  type="text"
                  placeholder="เช่น โหมโรงยะวา"
                  value={createForm.title}
                  onChange={(e) => setCreateForm((f) => ({ ...f, title: e.target.value }))}
                  className="w-full text-sm border border-hairline rounded-[var(--radius-sm)] px-3 py-2 bg-surface-card text-ink outline-none focus:ring-1 focus:ring-coral/50"
                />
              </div>
              <div>
                <label className="text-xs text-muted mb-1 block">รหัสเพลง *</label>
                <input
                  type="text"
                  placeholder="เช่น S4360CB02"
                  value={createForm.songCode}
                  onChange={(e) => setCreateForm((f) => ({ ...f, songCode: e.target.value }))}
                  className="w-full text-sm border border-hairline rounded-[var(--radius-sm)] px-3 py-2 bg-surface-card text-ink outline-none focus:ring-1 focus:ring-coral/50"
                />
              </div>
              <div>
                <label className="text-xs text-muted mb-1 block">ประเภท</label>
                <input
                  type="text"
                  placeholder="ดนตรีไทย"
                  value={createForm.category}
                  onChange={(e) => setCreateForm((f) => ({ ...f, category: e.target.value }))}
                  className="w-full text-sm border border-hairline rounded-[var(--radius-sm)] px-3 py-2 bg-surface-card text-ink outline-none focus:ring-1 focus:ring-coral/50"
                />
              </div>
              {createError && <p className="text-xs text-error">{createError}</p>}
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="secondary" size="sm" onClick={() => { setShowCreate(false); setCreateError(""); }} disabled={creating}>
                ยกเลิก
              </Button>
              <Button variant="coral" size="sm" onClick={handleCreate} disabled={creating}>
                {creating ? "กำลังสร้าง..." : "สร้างเพลง"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Search + Create button row */}
      <div className="flex items-center gap-3">
        <Input
          placeholder="ค้นหาเพลง..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="max-w-sm"
        />
        {isAdmin && (
          <Button
            variant="coral"
            size="sm"
            onClick={() => { setCreateForm({ title: "", songCode: "", category: "ดนตรีไทย" }); setShowCreate(true); }}
          >
            + สร้างเพลง
          </Button>
        )}
      </div>

      {/* Category tabs */}
      <div className="flex flex-wrap gap-1.5">
        <button
          onClick={() => handleCategoryChange("")}
          className={cn(
            "px-3.5 py-1.5 rounded-[var(--radius-md)] text-sm font-medium transition-colors",
            !activeCategory
              ? "bg-surface-cream-strong text-ink"
              : "text-muted hover:text-ink hover:bg-surface-cream-strong"
          )}
        >
          ทั้งหมด ({songs.length})
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => handleCategoryChange(cat)}
            className={cn(
              "px-3.5 py-1.5 rounded-[var(--radius-md)] text-sm font-medium transition-colors",
              activeCategory === cat
                ? "bg-surface-cream-strong text-ink"
                : "text-muted hover:text-ink hover:bg-surface-cream-strong"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Result count */}
      <p className="text-sm text-muted">
        {filtered.length} เพลง{q || activeCategory ? ` (กรองจาก ${songs.length})` : ""}
      </p>

      {/* Song list */}
      <div className="flex flex-col divide-y divide-hairline-soft border border-hairline-soft rounded-[var(--radius-lg)] overflow-hidden bg-surface-card">
        {filtered.length === 0 ? (
          <div className="px-6 py-12 text-center text-muted text-sm">
            ไม่พบเพลงที่ค้นหา
          </div>
        ) : (
          filtered.map((song) => (
            <Link
              key={song.id}
              href={`/songs/${song.id}`}
              className="flex items-center justify-between px-6 py-4 hover:bg-surface-cream-strong transition-colors group"
            >
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="text-sm font-medium text-ink group-hover:text-primary truncate">
                  {song.title}
                </span>
                <span className="text-xs text-muted-soft">{song.songCode}</span>
              </div>
              <div className="flex items-center gap-3 shrink-0 ml-4">
                <Badge variant="pill">{song.category}</Badge>
                <span className="text-xs text-muted w-10 text-right">
                  {formatDuration(song.duration)}
                </span>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
