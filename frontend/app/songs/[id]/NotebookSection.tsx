"use client";

import { useState } from "react";
import { SheetViewer } from "@/components/sheets/SheetViewer";
import { cn } from "@/lib/utils";

interface SheetTab {
  id: string;
  name: string;
}

interface Props {
  sheets: SheetTab[];
}

export function NotebookSection({ sheets }: Props) {
  const [activeId, setActiveId] = useState<string>(sheets[0]?.id ?? "");

  if (sheets.length === 0) return null;

  return (
    <div className="mt-10 pt-8 border-t border-hairline-soft">
      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted mb-4">
        โน้ตเพลง · Sheets
      </p>
      {/* Sheet tabs — navy underline active state */}
      <div className="flex gap-1 mb-4 flex-wrap border-b border-hairline">
        {sheets.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setActiveId(s.id)}
            aria-pressed={s.id === activeId}
            className={cn(
              "relative px-4 py-2.5 text-sm font-medium transition-colors duration-[var(--duration-pb-base)]",
              s.id === activeId
                ? "text-ink after:content-[''] after:absolute after:left-3 after:right-3 after:-bottom-px after:h-[2px] after:bg-primary"
                : "text-muted hover:text-ink"
            )}
          >
            {s.name}
          </button>
        ))}
      </div>
      {/* Viewer */}
      {activeId && <SheetViewer key={activeId} sheetId={activeId} />}
    </div>
  );
}
