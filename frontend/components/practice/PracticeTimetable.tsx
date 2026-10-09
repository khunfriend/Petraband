"use client";

import Link from "next/link";
import { Fragment, useState, type ReactNode } from "react";
import { buildTimetable, formatDateLines, type TimetableDay } from "@/lib/practiceTimetable";
import { MapPin } from "lucide-react";
import type { PhaseInfo } from "./usePracticeEdits";

export type TimetableSchedule = {
  id: string;
  title: string;
  location: string;
  locationNote: string;
  dateMode: string; // "ALL" | "ANY"
  days: TimetableDay[];
};

type Editing =
  | { kind: "label"; id: string; draft: string }
  | { kind: "time"; id: string; start: string; end: string; location: string }
  | { kind: "phase"; id: string; info: PhaseInfo; newDate: string }
  | { kind: "dateCell"; id: string }
  | { kind: "addSlot"; id: string; start: string; end: string; location: string };

export type SlotTemplate = { startTime: string; endTime: string; label: string; location: string; isSpecial: boolean };

const cell = "border border-hairline px-2 sm:px-3 py-1.5 align-middle";
const editableCell = "cursor-text hover:bg-primary/5 transition-colors";
const field =
  "w-full rounded-[var(--radius-sm)] border border-hairline bg-surface-soft px-2 py-1 text-ink outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/15 disabled:opacity-60";

function SaveCancel({ onSave, onCancel, busy }: { onSave: () => void; onCancel: () => void; busy: boolean }) {
  return (
    <div className="flex items-center gap-3 text-xs">
      <button type="button" onClick={onSave} disabled={busy} className="font-semibold text-primary hover:underline disabled:opacity-50">
        {busy ? "กำลังบันทึก…" : "บันทึก"}
      </button>
      <button type="button" onClick={onCancel} disabled={busy} className="text-muted hover:text-ink">
        ยกเลิก
      </button>
    </div>
  );
}

function Phase({
  s,
  href,
  actions,
}: {
  s: TimetableSchedule;
  href?: string;
  actions: { label: string; onClick: () => void; danger?: boolean }[];
}) {
  return (
    <div className="flex flex-col gap-0.5">
      {href ? (
        <Link href={href} className="font-semibold text-ink hover:text-primary transition-colors duration-[var(--duration-pb-base)]">
          {s.title}
        </Link>
      ) : (
        <span className="font-semibold text-ink">{s.title}</span>
      )}
      {s.location && <span className="text-body">{s.location}</span>}
      {s.locationNote && <span className="text-xs text-muted-soft">({s.locationNote})</span>}
      {actions.length > 0 && (
        <div className="mt-1 flex flex-wrap text-xs sm:justify-end" style={{ columnGap: 12, rowGap: 2 }}>
          {actions.map((a) => (
            <button
              key={a.label}
              type="button"
              onClick={a.onClick}
              className={a.danger ? "text-muted hover:text-error" : "text-muted hover:text-primary"}
            >
              {a.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function DateCell({ lines, any }: { lines: string[]; any: boolean }) {
  return (
    <div className="flex flex-col items-center gap-0.5 font-semibold text-ink text-center leading-snug">
      {lines.map((line, i) => (
        <Fragment key={i}>
          {any && i > 0 && <span className="text-xs font-medium text-muted">หรือ</span>}
          <span className="sm:whitespace-nowrap">{line}</span>
        </Fragment>
      ))}
    </div>
  );
}

/**
 * Printed-sheet style timetable: phase | date | start | end | details.
 * Each on* handler turns on one kind of editing; an existing day's date is never changed.
 */
export function PracticeTimetable({
  schedules,
  hrefFor,
  dateRange,
  onSaveLabel,
  onSaveTimes,
  onSavePhase,
  onDeleteDay,
  onAddDay,
  onDeleteSchedule,
  onAddSlot,
  onDeleteSlot,
}: {
  schedules: TimetableSchedule[];
  /** Link for the phase title. */
  hrefFor?: (scheduleId: string) => string;
  /** Each save receives every merged day's slot id and returns true on success. */
  onSaveLabel?: (slotIds: string[], label: string) => Promise<boolean>;
  onSaveTimes?: (slotIds: string[], start: string, end: string, location: string) => Promise<boolean>;
  onSavePhase?: (scheduleId: string, info: PhaseInfo) => Promise<boolean>;
  onDeleteDay?: (dayId: string, dateLabel: string) => Promise<boolean>;
  /** New days copy the slots of the schedule's last day. */
  onAddDay?: (scheduleId: string, date: string, template: SlotTemplate[]) => Promise<boolean>;
  dateRange?: { min?: string; max?: string };
  /** Shown in the header, so only offered when the table holds a single schedule. */
  onDeleteSchedule?: (scheduleId: string, title: string) => Promise<boolean>;
  onAddSlot?: (dayIds: string[], slot: SlotTemplate) => Promise<boolean>;
  onDeleteSlot?: (slotIds: string[]) => Promise<boolean>;
}) {
  const [editing, setEditing] = useState<Editing | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function run(save: () => Promise<boolean>) {
    if (saving) return;
    setSaving(true);
    const ok = await save();
    setSaving(false);
    if (ok) setEditing(null);
  }

  function startEdit(e: Editing) {
    setError("");
    setEditing(e);
  }

  function phaseEditor(s: TimetableSchedule) {
    if (editing?.kind !== "phase" || editing.id !== s.id || !onSavePhase) return null;
    const { info, newDate } = editing;
    const set = (patch: Partial<PhaseInfo>) => setEditing({ ...editing, info: { ...info, ...patch } });
    const last = [...s.days].sort((a, b) => a.date.localeCompare(b.date)).at(-1);
    const template = (last?.slots ?? []).map((sl) => ({
      startTime: sl.startTime,
      endTime: sl.endTime,
      label: sl.label,
      location: sl.location ?? "",
      isSpecial: sl.isSpecial,
    }));
    const submit = () => {
      if (!info.title.trim()) return setError("ต้องมีชื่อ");
      if (newDate && s.days.some((d) => d.date.slice(0, 10) === newDate)) return setError("มีวันนี้อยู่แล้ว");
      const changed =
        info.title !== s.title || info.location !== s.location || info.locationNote !== s.locationNote || info.dateMode !== s.dateMode;
      run(async () => {
        if (changed && !(await onSavePhase(s.id, info))) return false;
        if (newDate && onAddDay) return onAddDay(s.id, newDate, template);
        return true;
      });
    };
    return (
      <div
        className="flex flex-col gap-1.5 text-left"
        onKeyDown={(e) => {
          if (e.key === "Escape") setEditing(null);
          if (e.key === "Enter") submit();
        }}
      >
        <input autoFocus value={info.title} onChange={(e) => set({ title: e.target.value })} placeholder="ชื่อ เช่น ซ้อมรวม" className={`${field} font-semibold`} />
        <input value={info.location} onChange={(e) => set({ location: e.target.value })} placeholder="สถานที่" className={field} />
        <input value={info.locationNote} onChange={(e) => set({ locationNote: e.target.value })} placeholder="หมายเหตุ" className={field} />
        <label className="flex items-center gap-1.5 text-xs text-body">
          <input type="checkbox" checked={info.dateMode === "ANY"} onChange={(e) => set({ dateMode: e.target.checked ? "ANY" : "ALL" })} />
          วันใดวันหนึ่ง (&quot;หรือ&quot;)
        </label>
        {onAddDay && (
          <label className="flex flex-col gap-0.5 text-xs text-muted">
            เพิ่มวัน
            <input
              type="date"
              value={newDate}
              min={dateRange?.min}
              max={dateRange?.max}
              onChange={(e) => setEditing({ ...editing, newDate: e.target.value })}
              className={field}
            />
            {newDate && (
              <span className="text-[11px] text-muted-soft">
                {template.length > 0 ? `ใช้ช่วงเวลาเดียวกับวันสุดท้าย (${template.length} ช่วง)` : "ยังไม่มีช่วงเวลา"}
              </span>
            )}
          </label>
        )}
        {error && <p className="text-xs text-error">{error}</p>}
        <SaveCancel onSave={submit} onCancel={() => setEditing(null)} busy={saving} />
      </div>
    );
  }

  const deleteOnly = onDeleteSchedule && schedules.length === 1 ? schedules[0] : null;
  const deleteButton = deleteOnly ? (
    <button
      type="button"
      onClick={() => onDeleteSchedule!(deleteOnly.id, deleteOnly.title)}
      className="rounded-[var(--radius-sm)] border border-on-primary/40 px-3 py-1 text-xs font-semibold text-on-primary hover:bg-error hover:border-error transition-colors"
    >
      ลบตาราง
    </button>
  ) : null;
  const linkBtn = "text-xs text-muted hover:text-primary transition-colors";

  return (
    <div className="overflow-x-auto rounded-[var(--radius-md)] border border-hairline bg-surface-card">
      <table className="w-full sm:min-w-[560px] border-collapse text-xs sm:text-sm tabular-nums">
        <thead>
          <tr className="bg-primary text-on-primary">
            <th className="hidden sm:table-cell w-44 px-3 py-2 text-left">{deleteButton}</th>
            <th className="px-2 sm:px-3 py-2 font-semibold w-24 sm:w-36">วันที่</th>
            <th className="px-1 sm:px-3 py-2 font-semibold w-12 sm:w-20">เริ่ม</th>
            <th className="px-1 sm:px-3 py-2 font-semibold w-12 sm:w-20">จบ</th>
            <th className="px-2 sm:px-3 py-2 font-semibold text-left">
              <div className="flex items-center justify-between gap-2">
                รายละเอียด
                {deleteButton && <span className="sm:hidden">{deleteButton}</span>}
              </div>
            </th>
          </tr>
        </thead>
        {schedules.map((s) => {
          const href = hrefFor?.(s.id);
          const blocks = buildTimetable(s.days);
          const blockRows = blocks.map((b) =>
            Math.max(1, b.slots.reduce((n, sl) => n + Math.max(1, sl.items.length), 0)),
          );
          const totalRows = Math.max(1, blockRows.reduce((a, b) => a + b, 0));
          const rows: ReactNode[] = [];
          let first = true;
          const actions = onSavePhase
            ? [
                {
                  label: "แก้ไข",
                  onClick: () =>
                    startEdit({
                      kind: "phase",
                      id: s.id,
                      newDate: "",
                      info: { title: s.title, location: s.location, locationNote: s.locationNote, dateMode: s.dateMode },
                    }),
                },
              ]
            : [];
          const phase = phaseEditor(s) ?? <Phase s={s} href={href} actions={actions} />;

          const phaseCell = () => {
            if (!first) return null;
            first = false;
            return (
              <td rowSpan={totalRows} className={`${cell} hidden sm:table-cell bg-coral-100/60 text-right`}>
                {phase}
              </td>
            );
          };

          if (blocks.length === 0) {
            rows.push(
              <tr key="empty">
                {phaseCell()}
                <td colSpan={4} className={`${cell} text-muted-soft`}>ยังไม่มีวันซ้อม</td>
              </tr>,
            );
          }

          blocks.forEach((b, bi) => {
            const blockKey = b.days[0]?.id ?? `${s.id}-${bi}`;
            const addSlot = editing?.kind === "addSlot" && editing.id === blockKey ? editing : null;
            const dayMenu = editing?.kind === "dateCell" && editing.id === blockKey;
            const submitAddSlot = () => {
              if (!addSlot || !onAddSlot) return;
              if (!addSlot.start || !addSlot.end || addSlot.start >= addSlot.end) return setError("เวลาจบต้องหลังเวลาเริ่ม");
              run(() =>
                onAddSlot(
                  b.days.map((d) => d.id),
                  { startTime: addSlot.start, endTime: addSlot.end, label: "", location: addSlot.location.trim(), isSpecial: false },
                ),
              );
            };
            const lastEnd = b.slots.at(-1)?.endTime;
            const dateTd = (
              <td rowSpan={blockRows[bi]} className={`${cell} bg-coral-100/40`}>
                <DateCell lines={b.dateLines} any={s.dateMode === "ANY"} />
                {addSlot && (
                  <div
                    className="mt-2 flex flex-col gap-1.5 text-left font-normal"
                    onKeyDown={(e) => {
                      if (e.key === "Escape") setEditing(null);
                      if (e.key === "Enter") submitAddSlot();
                    }}
                  >
                    <input autoFocus type="time" value={addSlot.start} onChange={(e) => setEditing({ ...addSlot, start: e.target.value })} className={`${field} px-1`} />
                    <input type="time" value={addSlot.end} onChange={(e) => setEditing({ ...addSlot, end: e.target.value })} className={`${field} px-1`} />
                    <input value={addSlot.location} onChange={(e) => setEditing({ ...addSlot, location: e.target.value })} placeholder="สถานที่ (ไม่บังคับ)" className={field} />
                    {b.days.length > 1 && <p className="text-[11px] text-muted-soft">เพิ่มให้ทั้ง {b.days.length} วัน</p>}
                    {error && <p className="text-xs text-error">{error}</p>}
                    <SaveCancel onSave={submitAddSlot} onCancel={() => setEditing(null)} busy={saving} />
                  </div>
                )}
                {dayMenu && (
                  <div className="mt-2 flex flex-col items-center gap-1.5">
                    {onAddSlot && (
                      <button
                        type="button"
                        onClick={() => startEdit({ kind: "addSlot", id: blockKey, start: lastEnd ?? "18:00", end: "", location: "" })}
                        className={linkBtn}
                      >
                        + เพิ่มช่วงเวลา
                      </button>
                    )}
                    {onDeleteDay &&
                      b.days.map((d) => {
                        const label = formatDateLines([d.date])[0];
                        return (
                          <button
                            key={d.id}
                            type="button"
                            onClick={async () => {
                              if (await onDeleteDay(d.id, label)) setEditing(null);
                            }}
                            className="text-xs text-muted hover:text-error transition-colors"
                          >
                            ลบ {label}
                          </button>
                        );
                      })}
                    <button type="button" onClick={() => setEditing(null)} className={linkBtn}>
                      ปิด
                    </button>
                  </div>
                )}
                {!addSlot && !dayMenu && (onDeleteDay || onAddSlot) && (
                  <div className="mt-1 text-center">
                    <button type="button" onClick={() => startEdit({ kind: "dateCell", id: blockKey })} className={linkBtn}>
                      แก้ไข
                    </button>
                  </div>
                )}
              </td>
            );
            if (b.slots.length === 0) {
              rows.push(
                <tr key={`${bi}-none`}>
                  {phaseCell()}
                  {dateTd}
                  <td className={cell} />
                  <td className={cell} />
                  <td className={cell} />
                </tr>,
              );
              return;
            }
            let dateShown = false;
            b.slots.forEach((sl, si) => {
              const items = sl.items.length > 0 ? sl.items : [""];
              const shade = si % 2 === 1 ? "bg-surface-cream-strong/40" : "";
              const timeTone = sl.isSpecial ? "text-coral font-semibold" : "text-ink";
              // Only flag a slot held somewhere other than the schedule's usual place.
              const elsewhere = sl.location && sl.location !== s.location ? sl.location : "";
              const placeTag = (ii: number) =>
                ii === 0 && elsewhere ? (
                  <span className="mr-2 inline-flex items-center gap-0.5 rounded-[var(--radius-pill)] border border-coral/40 bg-coral-100 px-2 py-px text-[11px] font-medium text-coral-700 align-middle">
                    <MapPin size={10} strokeWidth={2} />
                    {elsewhere}
                  </span>
                ) : null;
              const editLabel = editing?.kind === "label" && editing.id === sl.id ? editing : null;
              const editTime = editing?.kind === "time" && editing.id === sl.id ? editing : null;
              const openTime = onSaveTimes
                ? () => startEdit({ kind: "time", id: sl.id, start: sl.startTime, end: sl.endTime, location: sl.location })
                : undefined;

              const submitTime = () => {
                if (!editTime || !onSaveTimes) return;
                if (!editTime.start || !editTime.end || editTime.start >= editTime.end) {
                  return setError("เวลาจบต้องหลังเวลาเริ่ม");
                }
                run(() => onSaveTimes(sl.ids, editTime.start, editTime.end, editTime.location));
              };
              const submitLabel = () => {
                if (!editLabel || !onSaveLabel) return;
                if (editLabel.draft.trim() === sl.label.trim()) return setEditing(null);
                run(() => onSaveLabel(sl.ids, editLabel.draft));
              };

              items.forEach((item, ii) => {
                const showDate = !dateShown;
                dateShown = true;
                rows.push(
                  <tr key={`${bi}-${sl.id}-${ii}`} className={shade}>
                    {phaseCell()}
                    {showDate && dateTd}
                    {ii === 0 &&
                      (editTime ? (
                        <td colSpan={2} rowSpan={items.length} className={`${cell} p-1 sm:p-1`}>
                          <div
                            className="flex flex-col gap-1.5"
                            onKeyDown={(e) => {
                              if (e.key === "Escape") setEditing(null);
                              if (e.key === "Enter") submitTime();
                            }}
                          >
                            <div className="flex items-center gap-1">
                              <input
                                autoFocus
                                type="time"
                                value={editTime.start}
                                onChange={(e) => setEditing({ ...editTime, start: e.target.value })}
                                className={`${field} px-1`}
                              />
                              <span className="text-muted">–</span>
                              <input
                                type="time"
                                value={editTime.end}
                                onChange={(e) => setEditing({ ...editTime, end: e.target.value })}
                                className={`${field} px-1`}
                              />
                            </div>
                            <input
                              value={editTime.location}
                              onChange={(e) => setEditing({ ...editTime, location: e.target.value })}
                              placeholder={`สถานที่ (ว่าง = ${s.location || "ตามตาราง"})`}
                              className={field}
                            />
                            {error && <p className="text-xs text-error">{error}</p>}
                            <div className="flex items-center justify-between gap-2">
                              <SaveCancel onSave={submitTime} onCancel={() => setEditing(null)} busy={saving} />
                              {onDeleteSlot && (
                                <button
                                  type="button"
                                  disabled={saving}
                                  onClick={() => run(() => onDeleteSlot(sl.ids))}
                                  className="text-xs text-muted hover:text-error disabled:opacity-50"
                                >
                                  ลบช่วงนี้
                                </button>
                              )}
                            </div>
                          </div>
                        </td>
                      ) : (
                        [sl.startTime, sl.endTime].map((t, ti) => (
                          <td
                            key={ti}
                            rowSpan={items.length}
                            onClick={openTime}
                            title={openTime ? "คลิกเพื่อแก้เวลา" : undefined}
                            className={`${cell} text-center ${timeTone} ${openTime ? editableCell : ""}`}
                          >
                            {t}
                          </td>
                        ))
                      ))}
                    {editLabel ? (
                      ii === 0 && (
                        <td rowSpan={items.length} className={`${cell} p-1 sm:p-1`}>
                          <textarea
                            autoFocus
                            value={editLabel.draft}
                            disabled={saving}
                            rows={Math.max(2, items.length + 1)}
                            onChange={(e) => setEditing({ ...editLabel, draft: e.target.value })}
                            onBlur={submitLabel}
                            onKeyDown={(e) => {
                              if (e.key === "Escape") setEditing(null);
                              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submitLabel();
                            }}
                            placeholder="บรรทัดละรายการ"
                            className={`${field} min-w-[160px] resize-y`}
                          />
                        </td>
                      )
                    ) : onSaveLabel ? (
                      <td
                        className={`${cell} text-ink ${editableCell}`}
                        title="คลิกเพื่อแก้ไข"
                        onClick={() => startEdit({ kind: "label", id: sl.id, draft: sl.items.join("\n") })}
                      >
                        {placeTag(ii)}
                        {item || <span className="text-muted-soft">+ เพิ่มรายละเอียด</span>}
                      </td>
                    ) : (
                      <td className={`${cell} text-ink`}>
                        {placeTag(ii)}
                        {item}
                      </td>
                    )}
                  </tr>,
                );
              });
            });
          });

          return (
            <tbody key={s.id}>
              {/* Phone width: the phase column is hidden, so it gets its own row. */}
              <tr className="sm:hidden">
                <td colSpan={4} className={`${cell} relative bg-coral-100/60 ${deleteButton ? "pt-7" : ""}`}>
                  {deleteButton}
                  {phase}
                </td>
              </tr>
              {rows}
            </tbody>
          );
        })}
      </table>
    </div>
  );
}
