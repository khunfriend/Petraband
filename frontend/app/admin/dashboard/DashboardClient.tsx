"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

export type MemberStats = {
  id: string;
  nickname: string;
  fullName: string;
  generation: string;
  role: "ADMIN" | "HEAD" | "MEMBER";
  avatarUrl: string | null;
  /** Performances they're in the lineup of. */
  shows: number;
  /** Performances they head. */
  headOf: number;
  attendance: { PRESENT: number; LATE: number; EXCUSED: number; ABSENT: number };
  /** Main instrument first, then the rest in skill order. */
  instruments: string[];
};

const ROLE_LABEL = { ADMIN: "Admin", HEAD: "Head", MEMBER: "Member" } as const;
const ROLE_TONE = {
  ADMIN: "bg-primary text-on-primary",
  HEAD: "bg-amber-100 text-amber-800",
  MEMBER: "bg-surface-cream-strong text-body",
} as const;
const SHOWN_INSTRUMENTS = 3;

type SortKey = "nickname" | "role" | "shows" | "presence" | "punctual";

/** Came (on time or late) out of every day they were checked, leave excluded. */
function presence(a: MemberStats["attendance"]) {
  const counted = a.PRESENT + a.LATE + a.ABSENT;
  return counted ? (a.PRESENT + a.LATE) / counted : null;
}
/** On time out of the days they came. */
function punctual(a: MemberStats["attendance"]) {
  const came = a.PRESENT + a.LATE;
  return came ? a.PRESENT / came : null;
}
const pct = (v: number | null) => (v === null ? "—" : `${Math.round(v * 100)}%`);
const tone = (v: number | null) =>
  v === null ? "text-muted-soft" : v >= 0.8 ? "text-emerald-700" : v >= 0.5 ? "text-amber-700" : "text-red-700";

export default function DashboardClient({ members, rollCallDays }: { members: MemberStats[]; rollCallDays: number }) {
  const [role, setRole] = useState<"" | MemberStats["role"]>("");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<{ key: SortKey; desc: boolean }>({ key: "role", desc: false });
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const rows = useMemo(() => {
    const ql = q.trim().toLowerCase();
    const list = members.filter(
      (m) =>
        (!role || m.role === role) &&
        (!ql || [m.nickname, m.fullName, m.generation, ...m.instruments].some((t) => t.toLowerCase().includes(ql))),
    );
    const roleOrder = { ADMIN: 0, HEAD: 1, MEMBER: 2 };
    const value = (m: MemberStats): number | string => {
      switch (sort.key) {
        case "nickname":
          return m.nickname;
        case "role":
          return roleOrder[m.role];
        case "shows":
          return m.shows;
        case "presence":
          return presence(m.attendance) ?? -1;
        case "punctual":
          return punctual(m.attendance) ?? -1;
      }
    };
    return [...list].sort((a, b) => {
      const va = value(a);
      const vb = value(b);
      const c = typeof va === "string" ? va.localeCompare(vb as string, "th") : va - (vb as number);
      return (sort.desc ? -c : c) || a.nickname.localeCompare(b.nickname, "th");
    });
  }, [members, role, q, sort]);

  const byRole = (r: MemberStats["role"]) => members.filter((m) => m.role === r).length;
  const totals = members.reduce(
    (t, m) => ({
      PRESENT: t.PRESENT + m.attendance.PRESENT,
      LATE: t.LATE + m.attendance.LATE,
      EXCUSED: t.EXCUSED + m.attendance.EXCUSED,
      ABSENT: t.ABSENT + m.attendance.ABSENT,
    }),
    { PRESENT: 0, LATE: 0, EXCUSED: 0, ABSENT: 0 },
  );

  const header = (key: SortKey, label: string, className = "") => (
    <th className={cn("px-3 py-2 font-semibold whitespace-nowrap", className)}>
      <button
        type="button"
        onClick={() => setSort((s) => ({ key, desc: s.key === key ? !s.desc : key !== "nickname" && key !== "role" }))}
        className="inline-flex items-center gap-1 hover:underline"
      >
        {label}
        {sort.key === key && (sort.desc ? <ArrowDown size={12} /> : <ArrowUp size={12} />)}
      </button>
    </th>
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="สมาชิกทั้งหมด" value={members.length} unit="คน" />
        <Stat label="Admin / Head" value={`${byRole("ADMIN")} / ${byRole("HEAD")}`} unit="คน" />
        <Stat label="วันที่เช็คชื่อแล้ว" value={rollCallDays} unit="วัน" />
        <Stat label="ตรงเวลาทั้งวง" value={pct(punctual(totals))} sub={`มาซ้อม ${pct(presence(totals))}`} />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {(["", "ADMIN", "HEAD", "MEMBER"] as const).map((r) => (
          <button
            key={r || "all"}
            type="button"
            onClick={() => setRole(r)}
            className={cn(
              "h-8 px-3 rounded-[var(--radius-pill)] border text-xs font-medium",
              role === r ? "bg-primary text-on-primary border-primary" : "border-hairline bg-surface-card text-body hover:border-primary/50",
            )}
          >
            {r ? ROLE_LABEL[r] : "ทั้งหมด"} {r ? byRole(r) : members.length}
          </button>
        ))}
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="ค้นหาชื่อ รุ่น หรือเครื่อง"
          className="ml-auto h-9 w-full sm:w-64 rounded-[var(--radius-md)] border border-hairline bg-surface-soft px-3 text-sm text-ink outline-none focus:border-primary"
        />
      </div>

      <div className="overflow-x-auto rounded-[var(--radius-md)] border border-hairline bg-surface-card">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-primary text-on-primary text-left">
              {header("nickname", "สมาชิก")}
              {header("role", "ยศ")}
              {header("shows", "งานที่ร่วม", "text-right")}
              {header("presence", "มาซ้อม", "text-right")}
              {header("punctual", "ตรงเวลา", "text-right")}
              <th className="px-3 py-2 font-semibold whitespace-nowrap">มา / สาย / ลา / ขาด</th>
              <th className="px-3 py-2 font-semibold">เครื่องที่เล่นได้</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-muted">
                  ไม่พบสมาชิก
                </td>
              </tr>
            )}
            {rows.map((m) => {
              const a = m.attendance;
              const open = expanded.has(m.id);
              const shown = open ? m.instruments : m.instruments.slice(0, SHOWN_INSTRUMENTS);
              const more = m.instruments.length - SHOWN_INSTRUMENTS;
              return (
                <tr key={m.id} className="border-t border-hairline-soft align-top">
                  <td className="px-3 py-2.5">
                    <Link href={`/members/${m.id}`} className="flex items-center gap-2.5 hover:text-primary">
                      <span className="w-8 h-8 shrink-0 rounded-full bg-surface-cream-strong overflow-hidden flex items-center justify-center text-xs font-bold text-body">
                        {m.avatarUrl ? (
                          <Image src={m.avatarUrl} alt="" width={32} height={32} className="w-full h-full object-cover" />
                        ) : (
                          m.nickname.charAt(0)
                        )}
                      </span>
                      <span className="min-w-0">
                        <span className="block font-medium text-ink truncate">{m.nickname}</span>
                        <span className="block text-xs text-muted truncate">
                          {[m.fullName, m.generation].filter(Boolean).join(" · ")}
                        </span>
                      </span>
                    </Link>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className={cn("inline-block rounded-[var(--radius-pill)] px-2 py-0.5 text-xs font-medium", ROLE_TONE[m.role])}>
                      {ROLE_LABEL[m.role]}
                    </span>
                    {m.headOf > 0 && <span className="block mt-1 text-xs text-muted">คุม {m.headOf} งาน</span>}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{m.shows}</td>
                  <td className={cn("px-3 py-2.5 text-right tabular-nums font-medium", tone(presence(a)))}>{pct(presence(a))}</td>
                  <td className={cn("px-3 py-2.5 text-right tabular-nums font-medium", tone(punctual(a)))}>{pct(punctual(a))}</td>
                  <td className="px-3 py-2.5 tabular-nums text-body whitespace-nowrap">
                    {a.PRESENT} / {a.LATE} / {a.EXCUSED} / {a.ABSENT}
                  </td>
                  <td className="px-3 py-2.5">
                    {m.instruments.length === 0 ? (
                      <span className="text-muted-soft">—</span>
                    ) : (
                      <ol className="flex flex-col gap-0.5">
                        {shown.map((name, i) => (
                          <li key={name} className="flex items-baseline gap-1.5">
                            <span className="w-4 text-xs font-bold text-muted tabular-nums">{i + 1}.</span>
                            <span className={i === 0 ? "font-medium text-ink" : "text-body"}>{name}</span>
                          </li>
                        ))}
                        {more > 0 && (
                          <li>
                            <button
                              type="button"
                              onClick={() =>
                                setExpanded((s) => {
                                  const n = new Set(s);
                                  if (open) n.delete(m.id);
                                  else n.add(m.id);
                                  return n;
                                })
                              }
                              className="ml-5 text-xs text-muted hover:text-primary"
                            >
                              {open ? "ย่อ" : `+ อีก ${more} เครื่อง`}
                            </button>
                          </li>
                        )}
                      </ol>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted-soft">
        มาซ้อม = (มา + สาย) ÷ วันที่ถูกเช็ค ไม่นับวันลา · ตรงเวลา = มา ÷ (มา + สาย) · เครื่องอันดับ 1 คือเครื่องหลัก อันดับถัดไปตามที่สมาชิกเรียงในโปรไฟล์
      </p>
    </div>
  );
}

function Stat({ label, value, unit, sub }: { label: string; value: number | string; unit?: string; sub?: string }) {
  return (
    <div className="rounded-[var(--radius-md)] border border-hairline bg-surface-card px-4 py-3">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 flex items-baseline gap-1.5">
        <span className="text-2xl font-semibold text-ink leading-none">{value}</span>
        {unit && <span className="text-xs text-muted">{unit}</span>}
      </p>
      {sub && <p className="mt-1 text-xs text-muted">{sub}</p>}
    </div>
  );
}
