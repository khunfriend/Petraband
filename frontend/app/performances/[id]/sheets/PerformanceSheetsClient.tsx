"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BookMarked, Save } from "lucide-react";
import { NotationGrid, type SheetData } from "@/components/songs/NotationGrid";
import { NotebookSection } from "@/app/songs/[id]/NotebookSection";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

type SheetTab = { id: string; name: string; sheetOrder: number };

type PerformanceSongEntry = {
  id: string;                  // performanceSongId
  sectionId: string | null;
  song: {
    id: string;
    songCode: string;
    title: string;
    category: string;
    duration: number | null;
    sheetData: SheetData | null;
    publishedSheets: SheetTab[];
  };
};

type SectionEntry = { id: string; name: string };

type Props = {
  performanceId: string;
  songs: PerformanceSongEntry[];
  sections: SectionEntry[];
  initialDefaultSheet: string | null;
  initialOverrides: { performanceSongId: string; sheetName: string }[];
};

function formatDuration(s: number | null) {
  if (!s) return null;
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
}

export default function PerformanceSheetsClient({
  performanceId,
  songs,
  sections,
  initialDefaultSheet,
  initialOverrides,
}: Props) {
  const toast = useToast();

  const [defaultSheet, setDefaultSheet] = useState<string | null>(initialDefaultSheet);
  const [overrides, setOverrides] = useState<Record<string, string>>(() => {
    const m: Record<string, string> = {};
    for (const o of initialOverrides) m[o.performanceSongId] = o.sheetName;
    return m;
  });
  const [saving, setSaving] = useState(false);
  const [savedSnapshot, setSavedSnapshot] = useState(() =>
    snapshot(initialDefaultSheet, initialOverrides)
  );

  const currentSnapshot = snapshot(defaultSheet, buildOverrideList(overrides));
  const dirty = currentSnapshot !== savedSnapshot;

  const availableSheetNames = useMemo(() => {
    const set = new Set<string>();
    for (const ps of songs) for (const sh of ps.song.publishedSheets) set.add(sh.name);
    return Array.from(set).sort();
  }, [songs]);

  useEffect(() => {
    if (!dirty) return;
    function onBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault();
      e.returnValue = "";
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  async function save() {
    setSaving(true);
    try {
      const cleaned = buildOverrideList(overrides).filter(
        (o) => o.sheetName !== defaultSheet
      );
      const res = await fetch(`/api/performances/${performanceId}/sheet-prefs`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ defaultSheet, overrides: cleaned }),
      });
      if (!res.ok) {
        toast.error("บันทึกไม่สำเร็จ");
        return;
      }
      setSavedSnapshot(snapshot(defaultSheet, cleaned));
      // Trim redundant overrides in local state too
      const trimmed: Record<string, string> = {};
      for (const o of cleaned) trimmed[o.performanceSongId] = o.sheetName;
      setOverrides(trimmed);
      toast.success("บันทึกเรียบร้อย");
    } finally {
      setSaving(false);
    }
  }

  const groups: { key: string; label: string | null; songs: PerformanceSongEntry[] }[] = [];
  const unsectioned = songs.filter((ps) => !ps.sectionId);
  if (unsectioned.length > 0) {
    groups.push({ key: "__unsectioned__", label: "ยังไม่จัดช่วง", songs: unsectioned });
  }
  for (const sec of sections) {
    groups.push({
      key: sec.id,
      label: sec.name,
      songs: songs.filter((ps) => ps.sectionId === sec.id),
    });
  }

  let globalIndex = 0;

  return (
    <>
      {availableSheetNames.length > 0 && (
        <div className="sticky top-0 z-10 -mx-8 px-8 py-3 bg-canvas/95 backdrop-blur border-b border-hairline mb-6">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 text-sm font-semibold text-ink">
              <BookMarked size={14} strokeWidth={1.75} className="text-muted" />
              <span>ค่าเริ่มต้น</span>
            </div>
            <select
              value={defaultSheet ?? ""}
              onChange={(e) => setDefaultSheet(e.target.value || null)}
              className="px-3 py-1.5 text-sm border border-hairline rounded-[var(--radius-md)] bg-canvas text-ink outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/15"
            >
              <option value="">— ไม่กำหนด —</option>
              {availableSheetNames.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
            <div className="ml-auto flex items-center gap-2">
              {dirty && <span className="text-xs text-coral font-medium">มีการเปลี่ยนแปลง</span>}
              <Button
                variant="primary"
                size="sm"
                onClick={save}
                disabled={!dirty || saving}
              >
                <Save size={14} strokeWidth={1.75} />
                {saving ? "กำลังบันทึก..." : "บันทึก"}
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-14">
        {groups.map((g) => (
          <div key={g.key}>
            {g.label && (
              <h2 className="text-lg font-bold text-primary mb-6 pb-2 border-b-2 border-primary/30">
                {g.label}
              </h2>
            )}
            {g.songs.length === 0 ? (
              <p className="text-sm text-muted-soft italic pl-2">ช่วงนี้ยังไม่มีเพลง</p>
            ) : (
              <div className="flex flex-col gap-12">
                {g.songs.map((ps) => {
                  globalIndex += 1;
                  const { song } = ps;
                  const publishedSheets = song.publishedSheets;
                  const requested = overrides[ps.id] ?? defaultSheet ?? null;
                  return (
                    <div key={ps.id}>
                      <div className="flex items-baseline gap-3 mb-4 pb-3 border-b-2 border-primary/20">
                        <span className="text-sm font-bold text-muted-soft w-6 shrink-0">{globalIndex}</span>
                        <div className="flex-1 min-w-0">
                          <Link
                            href={`/songs/${song.id}`}
                            className="text-xl font-bold text-ink hover:text-primary transition-colors duration-[var(--duration-pb-base)]"
                          >
                            {song.title}
                          </Link>
                          <span className="ml-3 text-sm text-muted-soft">{song.songCode}</span>
                          {formatDuration(song.duration) && (
                            <span className="ml-3 text-sm text-muted-soft">· {formatDuration(song.duration)}</span>
                          )}
                        </div>
                        <span className="text-xs text-muted bg-surface-soft px-2 py-1 rounded-full border border-hairline shrink-0">
                          {song.category}
                        </span>
                      </div>
                      <div className="pl-9">
                        {publishedSheets.length > 0 ? (
                          <div className="bg-surface-card border border-hairline-soft rounded-[var(--radius-lg)] p-6">
                            <NotebookSection
                              sheets={publishedSheets}
                              showDivider={false}
                              showHeading={false}
                              controlledSheetName={requested}
                              onChangeSheet={(name) => {
                                setOverrides((prev) => ({ ...prev, [ps.id]: name }));
                              }}
                            />
                          </div>
                        ) : song.sheetData && song.sheetData.rows.length > 0 ? (
                          <div className="bg-surface-card border border-hairline-soft rounded-[var(--radius-lg)] p-6">
                            <NotationGrid sheetData={song.sheetData} editable={false} />
                          </div>
                        ) : (
                          <p className="text-sm text-muted-soft">ยังไม่มีโน้ตเพลง</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}

function buildOverrideList(map: Record<string, string>) {
  return Object.entries(map).map(([performanceSongId, sheetName]) => ({
    performanceSongId,
    sheetName,
  }));
}

function snapshot(
  defaultSheet: string | null,
  overrides: { performanceSongId: string; sheetName: string }[]
) {
  const sorted = [...overrides].sort((a, b) =>
    a.performanceSongId.localeCompare(b.performanceSongId)
  );
  return JSON.stringify({ defaultSheet, overrides: sorted });
}
