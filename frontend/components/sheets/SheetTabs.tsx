"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface SheetTabInfo {
  id: string;
  name: string;
  sheetOrder: number;
}

interface Props {
  sheets: SheetTabInfo[];
  activeSheetId: string | null;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
}

export function SheetTabs({ sheets, activeSheetId, onSelect, onAdd, onRename, onDelete }: Props) {
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (renamingId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [renamingId]);

  function startRename(sheet: SheetTabInfo) {
    setRenamingId(sheet.id);
    setRenameValue(sheet.name);
  }

  function commitRename() {
    if (renamingId && renameValue.trim()) {
      onRename(renamingId, renameValue.trim());
    }
    setRenamingId(null);
  }

  return (
    <div className="flex items-center gap-1 border-t border-hairline bg-surface-soft px-2 py-1 overflow-x-auto">
      {sheets.map((sheet) => {
        const isActive = sheet.id === activeSheetId;
        const isRenaming = renamingId === sheet.id;
        return (
          <div
            key={sheet.id}
            className={cn(
              "group flex items-center gap-1 rounded-t-md border border-b-0 px-3 py-1.5 text-xs cursor-pointer whitespace-nowrap select-none",
              isActive
                ? "bg-surface-card border-hairline text-ink font-medium"
                : "bg-transparent border-transparent text-muted hover:text-ink hover:bg-surface-cream-strong"
            )}
            onClick={() => !isRenaming && onSelect(sheet.id)}
            onDoubleClick={(e) => { e.preventDefault(); startRename(sheet); }}
          >
            {isRenaming ? (
              <input
                ref={inputRef}
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onBlur={commitRename}
                onKeyDown={(e) => {
                  if (e.key === "Enter") { e.preventDefault(); commitRename(); }
                  else if (e.key === "Escape") setRenamingId(null);
                }}
                onClick={(e) => e.stopPropagation()}
                className="bg-transparent border-b border-coral outline-none text-xs w-28"
              />
            ) : (
              <span>{sheet.name}</span>
            )}
            {isActive && !isRenaming && (
              <>
                <button
                  type="button"
                  className="ml-1 text-muted-soft hover:text-ink opacity-0 group-hover:opacity-100 transition"
                  onClick={(e) => { e.stopPropagation(); startRename(sheet); }}
                  title="เปลี่ยนชื่อ"
                >
                  ✏
                </button>
                {sheets.length > 1 && (
                  <button
                    type="button"
                    className="text-muted-soft hover:text-error opacity-0 group-hover:opacity-100 transition"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`ลบชีต "${sheet.name}"?`)) onDelete(sheet.id);
                    }}
                    title="ลบชีต"
                  >
                    ×
                  </button>
                )}
              </>
            )}
          </div>
        );
      })}
      <button
        type="button"
        onClick={onAdd}
        className="ml-1 px-2 py-1 text-xs text-muted hover:text-ink hover:bg-surface-cream-strong rounded-t-md"
        title="เพิ่มชีตใหม่"
      >
        +
      </button>
    </div>
  );
}
