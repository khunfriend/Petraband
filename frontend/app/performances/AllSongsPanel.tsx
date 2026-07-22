"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronDown, ChevronUp, Search } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

type SongRow = {
  id: string;
  songCode: string;
  title: string;
  category: string;
  duration: number | null;
  performances: { id: string; name: string }[];
};

function formatDuration(s: number | null) {
  if (!s) return null;
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
}

export default function AllSongsPanel() {
  const [open, setOpen] = useState(false);
  const [songs, setSongs] = useState<SongRow[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState("ทั้งหมด");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (open && !loaded) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(true);
      fetch("/api/performances/songs")
        .then((r) => r.json())
        .then((data) => {
          setSongs(data.songs ?? []);
          setCategories(data.categories ?? []);
          setLoaded(true);
        })
        .finally(() => setLoading(false));
    }
  }, [open, loaded]);

  const filtered = songs.filter((s) => {
    const matchCat =
      activeCategory === "ทั้งหมด" || s.category === activeCategory;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      s.title.toLowerCase().includes(q) ||
      s.songCode.toLowerCase().includes(q);
    return matchCat && matchSearch;
  });

  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-body-strong hover:text-primary transition-colors duration-[var(--duration-pb-base)]"
      >
        {open
          ? "ซ่อนรายการเพลงรวม"
          : `ดูเพลงรวมทุกงานแสดง${loaded ? ` (${songs.length} เพลง)` : ""}`}
        {open ? (
          <ChevronUp size={14} strokeWidth={1.75} />
        ) : (
          <ChevronDown size={14} strokeWidth={1.75} />
        )}
      </button>

      {open && (
        <div className="mt-4 border border-hairline rounded-[var(--radius-lg)] bg-surface-card overflow-hidden">
          {/* Header + search */}
          <div className="px-5 py-4 border-b border-hairline-soft">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted mb-3">
              เพลงรวมทุกงานแสดง
            </p>
            <div className="relative">
              <Search
                size={16}
                strokeWidth={1.75}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-soft pointer-events-none"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ค้นหาชื่อเพลง / รหัส..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-hairline rounded-[var(--radius-md)] bg-white text-ink placeholder:text-muted-soft outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/15 transition-colors duration-[var(--duration-pb-base)]"
              />
            </div>
          </div>

          {/* Category tabs — navy filled pills */}
          <div className="flex gap-1.5 px-5 py-3 border-b border-hairline-soft overflow-x-auto scrollbar-none">
            {["ทั้งหมด", ...categories].map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  "shrink-0 px-3 py-1 text-xs font-medium rounded-[var(--radius-pill)] border transition-colors duration-[var(--duration-pb-base)]",
                  activeCategory === cat
                    ? "bg-primary text-on-primary border-primary"
                    : "bg-canvas text-muted border-hairline hover:bg-surface-cream-strong hover:text-ink"
                )}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Song list */}
          {loading ? (
            <p className="px-5 py-6 text-sm text-muted text-center">
              กำลังโหลด...
            </p>
          ) : filtered.length === 0 ? (
            <p className="px-5 py-6 text-sm text-muted text-center">
              ไม่พบเพลง
            </p>
          ) : (
            <div className="divide-y divide-hairline-soft max-h-[480px] overflow-y-auto">
              {filtered.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center gap-4 px-5 py-3 hover:bg-surface-cream-strong transition-colors duration-[var(--duration-pb-base)]"
                >
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/songs/${s.id}`}
                      className="text-sm font-semibold text-ink hover:text-primary transition-colors duration-[var(--duration-pb-base)]"
                    >
                      {s.title}
                    </Link>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-xs text-muted-soft font-mono">
                        {s.songCode}
                      </span>
                      {formatDuration(s.duration) && (
                        <span className="text-xs text-muted-soft tabular-nums">
                          · {formatDuration(s.duration)}
                        </span>
                      )}
                      {s.performances.map((p) => (
                        <Link
                          key={p.id}
                          href={`/performances/${p.id}`}
                          className="text-[11px] px-2 py-0.5 rounded-[var(--radius-pill)] bg-surface-soft border border-hairline text-muted hover:text-primary hover:border-primary/50 transition-colors duration-[var(--duration-pb-base)]"
                        >
                          {p.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                  <Badge variant="pill" className="text-[11px] shrink-0">
                    {s.category}
                  </Badge>
                </div>
              ))}
            </div>
          )}

          <div className="px-5 py-2 border-t border-hairline-soft">
            <p className="text-xs text-muted-soft">{filtered.length} เพลง</p>
          </div>
        </div>
      )}
    </div>
  );
}
