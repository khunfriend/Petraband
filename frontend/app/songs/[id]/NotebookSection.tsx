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
    <div className="mt-8">
      <h2 className="text-sm font-bold tracking-wide uppercase text-muted mb-3">โน้ตเพลง</h2>
      {/* Sheet tabs */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {sheets.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setActiveId(s.id)}
            className={cn(
              "px-4 py-1.5 rounded-full text-sm border transition",
              s.id === activeId
                ? "bg-coral text-white border-coral font-medium"
                : "bg-surface-soft border-hairline text-muted hover:text-ink hover:border-coral"
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
