"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

type Role = "MEMBER" | "HEAD" | "ADMIN";
type Status = "ACTIVE" | "EXPIRED";

type Instrument = { id: string; nameThai: string; name: string };
type UpcomingPerformance = { id: string; name: string; firstDate: string | null };

type User = {
  id: string;
  nickname: string;
  generation: string;
  role: Role;
  status: Status;
  isTemporary: boolean;
  contact: string | null;
  primaryInstrument: { id: string; name: string; nameThai: string } | null;
  secondaryInstruments: { instrument: { id: string; nameThai: string } }[];
  // Admin/Head only
  email?: string;
  firstName?: string | null;
  lastName?: string | null;
};

function RoleBadge({ role }: { role: Role }) {
  const map: Record<Role, { label: string; className: string }> = {
    ADMIN: { label: "Admin", className: "bg-coral/10 text-coral border-coral/20" },
    HEAD: { label: "Head", className: "bg-primary/10 text-primary border-primary/20" },
    MEMBER: { label: "Member", className: "bg-surface-cream-strong text-muted border-hairline" },
  };
  const { label, className } = map[role];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full border ${className}`}>
      {label}
    </span>
  );
}

const selectClass =
  "h-10 rounded-[var(--radius-md)] border border-hairline bg-surface-soft px-3.5 text-sm text-ink focus:outline-none focus:border-coral focus:ring-[3px] focus:ring-coral/20";

function getGenerations() {
  const currentYear = new Date().getFullYear();
  const currentGen = currentYear - 2006;
  const gens: string[] = [];
  for (let i = currentGen; i >= 1; i--) gens.push(`#${i}`);
  gens.push("#สมทบ", "#อาจารย์");
  return gens;
}

export default function MembersClient({
  initialUsers,
  currentUserId,
  isAdmin,
  isHead,
  instruments,
  upcomingPerformances,
}: {
  initialUsers: User[];
  currentUserId: string;
  isAdmin: boolean;
  isHead: boolean;
  instruments: Instrument[];
  upcomingPerformances: UpcomingPerformance[];
}) {
  const router = useRouter();
  const [users, setUsers] = useState(initialUsers);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [showExpired, setShowExpired] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [createMode, setCreateMode] = useState<"regular" | "temporary">("regular");
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState("");
  const [form, setForm] = useState({
    email: "",
    password: "",
    nickname: "",
    firstName: "",
    lastName: "",
    contact: "",
    generation: `#${new Date().getFullYear() - 2006}`,
    primaryInstrumentId: "",
    linkedPerformanceId: "",
    role: "MEMBER" as Role,
  });

  const canManageRoles = isAdmin || isHead;

  // Filters
  const [search, setSearch] = useState("");
  const [filterGeneration, setFilterGeneration] = useState("");
  const [filterInstrumentId, setFilterInstrumentId] = useState("");
  const [filterRole, setFilterRole] = useState<Role | "">("");

  const { generationOptions, instrumentOptions } = useMemo(() => {
    const gens = new Set<string>();
    const insts = new Map<string, string>();
    for (const u of users) {
      if (u.generation) gens.add(u.generation);
      if (u.primaryInstrument) insts.set(u.primaryInstrument.id, u.primaryInstrument.nameThai);
    }
    return {
      generationOptions: Array.from(gens).sort(),
      instrumentOptions: Array.from(insts, ([id, nameThai]) => ({ id, nameThai })).sort((a, b) => a.nameThai.localeCompare(b.nameThai)),
    };
  }, [users]);

  const visibleUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      if (!showExpired && u.status !== "ACTIVE") return false;
      if (filterGeneration && u.generation !== filterGeneration) return false;
      if (filterInstrumentId && u.primaryInstrument?.id !== filterInstrumentId) return false;
      if (filterRole && u.role !== filterRole) return false;
      if (q) {
        const haystack = [
          u.nickname,
          u.generation,
          u.contact ?? "",
          u.email ?? "",
          u.firstName ?? "",
          u.lastName ?? "",
          u.primaryInstrument?.nameThai ?? "",
          ...u.secondaryInstruments.map((s) => s.instrument.nameThai),
        ].join(" ").toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [users, showExpired, search, filterGeneration, filterInstrumentId, filterRole]);

  const hasActiveFilters = search || filterGeneration || filterInstrumentId || filterRole;

  async function changeRole(userId: string, newRole: Role) {
    setLoadingId(userId);
    try {
      const res = await fetch(`/api/users/${userId}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      if (!res.ok) return;
      const data = await res.json();
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: data.user.role } : u))
      );
    } finally {
      setLoadingId(null);
    }
  }

  async function deleteUser(userId: string) {
    setLoadingId(userId);
    try {
      const res = await fetch(`/api/users/${userId}`, { method: "DELETE" });
      if (!res.ok) return;
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      setConfirmDeleteId(null);
    } finally {
      setLoadingId(null);
    }
  }

  function setField<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreateError("");
    setCreateLoading(true);
    try {
      const isTemp = createMode === "temporary";
      const payload: Record<string, unknown> = {
        email: form.email,
        password: form.password,
        nickname: form.nickname,
        contact: form.contact || undefined,
        primaryInstrumentId: form.primaryInstrumentId || undefined,
        isTemporary: isTemp,
      };
      if (isTemp) {
        payload.linkedPerformanceId = form.linkedPerformanceId || undefined;
      } else {
        payload.firstName = form.firstName || undefined;
        payload.lastName = form.lastName || undefined;
        payload.generation = form.generation;
        payload.role = form.role;
      }

      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setCreateError(data.error || "เกิดข้อผิดพลาด");
        return;
      }
      setShowCreate(false);
      setForm({
        email: "", password: "", nickname: "", firstName: "", lastName: "",
        contact: "", generation: `#${new Date().getFullYear() - 2006}`,
        primaryInstrumentId: "", linkedPerformanceId: "", role: "MEMBER",
      });
      router.refresh();
    } finally {
      setCreateLoading(false);
    }
  }

  const ROLES: Role[] = ["MEMBER", "HEAD", "ADMIN"];

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-baseline gap-3">
          <h1 className="text-2xl font-bold text-ink">สมาชิก</h1>
          <span className="text-sm text-muted">{visibleUsers.length} คน</span>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <label className="flex items-center gap-2 text-sm text-muted cursor-pointer">
              <input
                type="checkbox"
                checked={showExpired}
                onChange={(e) => setShowExpired(e.target.checked)}
                className="rounded"
              />
              แสดงบัญชีหมดอายุ
            </label>
          )}
          {isAdmin && (
            <Button size="sm" variant="coral" onClick={() => setShowCreate((v) => !v)}>
              {showCreate ? "ยกเลิก" : "+ เพิ่มสมาชิก"}
            </Button>
          )}
        </div>
      </div>

      {canManageRoles && (
        <p className="text-sm text-muted">
          คลิกปุ่มเพื่อเปลี่ยน Role ของสมาชิก (ไม่สามารถเปลี่ยน Role ของตัวเองได้)
          {isHead && !isAdmin && " · Head ไม่สามารถตั้ง Admin ได้"}
        </p>
      )}

      {/* Search + filters */}
      <div className="flex flex-col sm:flex-row gap-2 flex-wrap">
        <Input
          id="search"
          placeholder="ค้นหา ชื่อ, เครื่องดนตรี, contact..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[200px]"
        />
        <select className={selectClass} value={filterGeneration} onChange={(e) => setFilterGeneration(e.target.value)}>
          <option value="">ทุกรุ่น</option>
          {generationOptions.map((g) => <option key={g} value={g}>{g}</option>)}
        </select>
        <select className={selectClass} value={filterInstrumentId} onChange={(e) => setFilterInstrumentId(e.target.value)}>
          <option value="">ทุกเครื่องดนตรี</option>
          {instrumentOptions.map((i) => <option key={i.id} value={i.id}>{i.nameThai}</option>)}
        </select>
        <select className={selectClass} value={filterRole} onChange={(e) => setFilterRole(e.target.value as Role | "")}>
          <option value="">ทุก Role</option>
          <option value="MEMBER">Member</option>
          <option value="HEAD">Head</option>
          <option value="ADMIN">Admin</option>
        </select>
        {hasActiveFilters && (
          <Button
            size="sm"
            variant="secondary"
            onClick={() => { setSearch(""); setFilterGeneration(""); setFilterInstrumentId(""); setFilterRole(""); }}
          >
            ล้างตัวกรอง
          </Button>
        )}
      </div>

      {/* Create form */}
      {isAdmin && showCreate && (
        <form
          onSubmit={handleCreate}
          className="bg-surface-card border border-hairline-soft rounded-[var(--radius-md)] p-5 flex flex-col gap-4"
        >
          <div className="flex rounded-[var(--radius-md)] border border-hairline overflow-hidden">
            <button
              type="button"
              onClick={() => setCreateMode("regular")}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                createMode === "regular" ? "bg-coral text-white" : "bg-canvas text-muted hover:text-ink"
              }`}
            >
              บัญชีทั่วไป
            </button>
            <button
              type="button"
              onClick={() => setCreateMode("temporary")}
              className={`flex-1 py-2 text-sm font-medium transition-colors border-l border-hairline ${
                createMode === "temporary" ? "bg-coral text-white" : "bg-canvas text-muted hover:text-ink"
              }`}
            >
              บัญชีชั่วคราว
            </button>
          </div>

          <Input label="ชื่อ User (ชื่อเล่น)" id="nickname" value={form.nickname} onChange={(e) => setField("nickname", e.target.value)} required />

          {createMode === "regular" && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Input label="ชื่อจริง" id="firstName" value={form.firstName} onChange={(e) => setField("firstName", e.target.value)} />
                <Input label="นามสกุล" id="lastName" value={form.lastName} onChange={(e) => setField("lastName", e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-ink">รุ่น Petra</label>
                  <select className={selectClass} value={form.generation} onChange={(e) => setField("generation", e.target.value)}>
                    {getGenerations().map((g) => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-ink">Role</label>
                  <select className={selectClass} value={form.role} onChange={(e) => setField("role", e.target.value as Role)}>
                    <option value="MEMBER">Member</option>
                    <option value="HEAD">Head</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
              </div>
            </>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-ink">เครื่องดนตรีหลัก</label>
            <select className={selectClass} value={form.primaryInstrumentId} onChange={(e) => setField("primaryInstrumentId", e.target.value)}>
              <option value="">-- เลือกเครื่องดนตรี --</option>
              {instruments.map((i) => <option key={i.id} value={i.id}>{i.nameThai}</option>)}
            </select>
          </div>

          {createMode === "temporary" && (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-ink">งานที่แสดง <span className="text-error">*</span></label>
              <select className={selectClass} value={form.linkedPerformanceId} onChange={(e) => setField("linkedPerformanceId", e.target.value)} required>
                <option value="">-- เลือกงานแสดง --</option>
                {upcomingPerformances.map((p) => {
                  const date = p.firstDate ? new Date(p.firstDate).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" }) : "";
                  return <option key={p.id} value={p.id}>{p.name}{date ? ` (${date})` : ""}</option>;
                })}
              </select>
            </div>
          )}

          <Input label="Contact" id="contact" value={form.contact} onChange={(e) => setField("contact", e.target.value)} placeholder="เบอร์, Line, IG ฯลฯ" />

          <div className="border-t border-hairline-soft pt-4 flex flex-col gap-3">
            <Input label="อีเมล" id="email" type="email" value={form.email} onChange={(e) => setField("email", e.target.value)} required />
            <Input label="รหัสผ่าน" id="password" type="password" value={form.password} onChange={(e) => setField("password", e.target.value)} required placeholder="อย่างน้อย 8 ตัวอักษร" error={createError} />
          </div>

          <Button type="submit" variant="primary" disabled={createLoading}>
            {createLoading ? "กำลังสร้าง..." : "สร้างบัญชี"}
          </Button>
        </form>
      )}

      {/* User list */}
      <div className="flex flex-col gap-3">
        {visibleUsers.map((user) => {
          const isExpired = user.status === "EXPIRED";
          return (
            <div
              key={user.id}
              className={`flex items-center gap-4 px-4 py-3 bg-surface-card border border-hairline-soft rounded-[var(--radius-md)] ${isExpired ? "opacity-60" : ""}`}
            >
              <Link href={`/members/${user.id}`} className="flex-1 min-w-0 hover:opacity-80 transition-opacity">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium text-ink">{user.nickname}</p>
                  <span className="text-xs text-muted-soft">{user.generation}</span>
                  {user.primaryInstrument && (
                    <span className="text-xs text-muted">{user.primaryInstrument.nameThai}</span>
                  )}
                  {user.secondaryInstruments.length > 0 && (
                    <span className="text-xs text-muted-soft">
                      · เล่นเป็น {user.secondaryInstruments.map((s) => s.instrument.nameThai).join(", ")}
                    </span>
                  )}
                  {user.isTemporary && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                      ชั่วคราว
                    </span>
                  )}
                  {isExpired && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 border border-gray-200">
                      หมดอายุ
                    </span>
                  )}
                </div>
                {user.contact && (
                  <p className="text-xs text-muted mt-0.5">📞 {user.contact}</p>
                )}
                {user.email && (
                  <p className="text-xs text-muted-soft mt-0.5">{user.email}</p>
                )}
              </Link>

              <RoleBadge role={user.role} />

              {canManageRoles && user.id !== currentUserId && !isExpired && (() => {
                if (isHead && !isAdmin && user.role === "ADMIN") return null;
                const options = ROLES.filter((r) => r !== user.role).filter(
                  (r) => !(isHead && !isAdmin && r === "ADMIN")
                );
                return (
                  <div className="flex gap-1 shrink-0">
                    {options.map((r) => (
                      <Button
                        key={r}
                        size="sm"
                        variant="secondary"
                        disabled={loadingId === user.id}
                        onClick={() => changeRole(user.id, r)}
                        className="text-xs py-1 px-2"
                      >
                        {loadingId === user.id ? "..." : `→ ${r === "ADMIN" ? "Admin" : r === "HEAD" ? "Head" : "Member"}`}
                      </Button>
                    ))}
                  </div>
                );
              })()}

              {isAdmin && user.id !== currentUserId && (
                <div className="shrink-0">
                  {confirmDeleteId === user.id ? (
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="coral" onClick={() => deleteUser(user.id)} disabled={loadingId === user.id} className="text-xs py-1 px-2">
                        {loadingId === user.id ? "..." : "ยืนยันลบ"}
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => setConfirmDeleteId(null)} className="text-xs py-1 px-2">
                        ยกเลิก
                      </Button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDeleteId(user.id)}
                      className="text-xs text-muted-soft hover:text-error transition-colors px-2 py-1"
                      aria-label="ลบบัญชี"
                    >
                      ลบ
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
