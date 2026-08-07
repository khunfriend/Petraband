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
  showDivider?: boolean;
  showHeading?: boolean;
  /** Controlled: selected sheet name. If provided, overrides internal state. */
  controlledSheetName?: string | null;
  /** Fires when user clicks a tab. In controlled mode, parent decides whether to update. */
  onChangeSheet?: (sheetName: string) => void;
}

export function NotebookSection({
  sheets,
  showDivider = true,
  showHeading = true,
  controlledSheetName,
  onChangeSheet,
}: Props) {
  const controlled = controlledSheetName !== undefined;

  const initialActiveId =
    sheets.find((s) => s.name === "เครื่องนำ")?.id ?? sheets[0]?.id ?? "";
  const [internalActiveId, setInternalActiveId] = useState<string>(initialActiveId);

  if (sheets.length === 0) return null;

  const requestedName = controlled ? controlledSheetName : null;
  const requestedSheet = requestedName
    ? sheets.find((s) => s.name === requestedName)
    : null;
  const fellBack = controlled && !!requestedName && !requestedSheet;

  const activeId = controlled
    ? (requestedSheet?.id ?? sheets[0].id)
    : internalActiveId;
  const activeSheet = sheets.find((s) => s.id === activeId);

  function handleClick(s: SheetTab) {
    if (controlled) {
      onChangeSheet?.(s.name);
    } else {
      setInternalActiveId(s.id);
    }
  }

  return (
    <div className={showDivider ? "mt-10 pt-8 border-t border-hairline-soft" : ""}>
      {showHeading && (
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted mb-4">
          โน้ตเพลง · Sheets
        </p>
      )}
      {fellBack && activeSheet && (
        <p className="text-[11px] text-muted-soft italic mb-2">
          ใช้ {activeSheet.name} แทน — ไม่มี {requestedName}
        </p>
      )}
      <div className="flex gap-1 mb-4 flex-wrap border-b border-hairline">
        {sheets.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => handleClick(s)}
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
      {activeId && <SheetViewer key={activeId} sheetId={activeId} />}
    </div>
  );
}
