"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Phone, Plus, Trash2, ChevronRight, Search } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { PageHeader } from "@/components/ui/PageHeader";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";

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
  // ADMIN = navy filled, HEAD = navy outline, MEMBER = pill (no coral — 1 coral point rule)
  if (role === "ADMIN")
    return <Badge variant="navy">Admin</Badge>;
  if (role === "HEAD")
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-[var(--radius-pill)] text-[12px] font-medium text-primary border border-primary/40">
        Head
      </span>
    );
  return <Badge variant="pill">Member</Badge>;
}

const selectClass =
  "h-10 rounded-[var(--radius-md)] border border-hairline bg-white px-3.5 text-sm text-ink transition-colors duration-[var(--duration-pb-base)] focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/15";

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
  const confirm = useConfirm();
  const toast = useToast();
  const [users, setUsers] = useState(initialUsers);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [showExpired, setShowExpired] = useState(false);

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

  const [search, setSearch] = useState("");
  const [filterGeneration, setFilterGeneration] = useState("");
  const [filterInstrumentId, setFilterInstrumentId] = useState("");
  const [filterRole, setFilterRole] = useState<Role | "">("");

  const { generationOptions, instrumentOptions } = useMemo(() => {
    const gens = new Set<string>();
    const insts = new Map<string, string>();
    for (const u of users) {
      if (u.generation) gens.add(u.generation);
      if (u.primaryInstrument)
        insts.set(u.primaryInstrument.id, u.primaryInstrument.nameThai);
    }
    return {
      generationOptions: Array.from(gens).sort(),
      instrumentOptions: Array.from(insts, ([id, nameThai]) => ({
        id,
        nameThai,
      })).sort((a, b) => a.nameThai.localeCompare(b.nameThai)),
    };
  }, [users]);

  const visibleUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      if (!showExpired && u.status !== "ACTIVE") return false;
      if (filterGeneration && u.generation !== filterGeneration) return false;
      if (filterInstrumentId && u.primaryInstrument?.id !== filterInstrumentId)
        return false;
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
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [users, showExpired, search, filterGeneration, filterInstrumentId, filterRole]);

  const hasActiveFilters =
    search || filterGeneration || filterInstrumentId || filterRole;

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
    const target = users.find((u) => u.id === userId);
    const nickname = target?.nickname ?? "";
    const ok = await confirm({
      title: "ลบบัญชีสมาชิก",
      message: `ต้องการลบบัญชี "${nickname}" ทั้งหมด? การเข้าร่วมงาน ผังเวที และการซ้อมที่เกี่ยวข้องจะถูกลบไปด้วย`,
      confirmLabel: "ลบบัญชี",
      variant: "danger",
      requireText: nickname,
    });
    if (!ok) return;
    setLoadingId(userId);
    try {
      const res = await fetch(`/api/users/${userId}`, { method: "DELETE" });
      if (!res.ok) {
        toast.error("ลบไม่สำเร็จ");
        return;
      }
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      toast.success(`ลบบัญชี ${nickname} แล้ว`);
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
        email: "",
        password: "",
        nickname: "",
        firstName: "",
        lastName: "",
        contact: "",
        generation: `#${new Date().getFullYear() - 2006}`,
        primaryInstrumentId: "",
        linkedPerformanceId: "",
        role: "MEMBER",
      });
      router.refresh();
    } finally {
      setCreateLoading(false);
    }
  }

  const ROLES: Role[] = ["MEMBER", "HEAD", "ADMIN"];

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Members · สมาชิก"
        title="สมาชิกวง"
        description={`${visibleUsers.length} คน${
          canManageRoles ? " · คลิกปุ่ม role เพื่อเปลี่ยน" : ""
        }`}
        actions={
          <div className="flex items-center gap-3">
            {isAdmin && (
              <label className="flex items-center gap-2 text-sm text-muted cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showExpired}
                  onChange={(e) => setShowExpired(e.target.checked)}
                  className="accent-[color:var(--color-primary)]"
                />
                แสดงบัญชีหมดอายุ
              </label>
            )}
            {isAdmin && (
              <Button
                size="md"
                variant={showCreate ? "secondary" : "primary"}
                onClick={() => setShowCreate((v) => !v)}
              >
                {showCreate ? (
                  "ยกเลิก"
                ) : (
                  <>
                    <Plus size={16} strokeWidth={1.75} />
                    เพิ่มสมาชิก
                  </>
                )}
              </Button>
            )}
          </div>
        }
      />

      {/* Search + filters */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search
              size={16}
              strokeWidth={1.75}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-soft pointer-events-none"
            />
            <Input
              id="search"
              placeholder="ค้นหา ชื่อ, เครื่องดนตรี, contact..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <select
            className={selectClass}
            value={filterGeneration}
            onChange={(e) => setFilterGeneration(e.target.value)}
          >
            <option value="">ทุกรุ่น</option>
            {generationOptions.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
          <select
            className={selectClass}
            value={filterInstrumentId}
            onChange={(e) => setFilterInstrumentId(e.target.value)}
          >
            <option value="">ทุกเครื่องดนตรี</option>
            {instrumentOptions.map((i) => (
              <option key={i.id} value={i.id}>
                {i.nameThai}
              </option>
            ))}
          </select>
          <select
            className={selectClass}
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value as Role | "")}
          >
            <option value="">ทุก Role</option>
            <option value="MEMBER">Member</option>
            <option value="HEAD">Head</option>
            <option value="ADMIN">Admin</option>
          </select>
          {hasActiveFilters && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                setSearch("");
                setFilterGeneration("");
                setFilterInstrumentId("");
                setFilterRole("");
              }}
            >
              ล้างตัวกรอง
            </Button>
          )}
        </div>
      </div>

      {/* Create form */}
      {isAdmin && showCreate && (
        <form
          onSubmit={handleCreate}
          className="bg-surface-card border border-hairline rounded-[var(--radius-lg)] p-5 md:p-6 flex flex-col gap-4"
        >
          {/* Mode switch — navy filled active, no coral */}
          <div className="flex rounded-[var(--radius-md)] border border-hairline overflow-hidden">
            {(["regular", "temporary"] as const).map((mode, i) => (
              <button
                key={mode}
                type="button"
                onClick={() => setCreateMode(mode)}
                className={cn(
                  "flex-1 py-2 text-sm font-medium transition-colors duration-[var(--duration-pb-base)]",
                  i > 0 && "border-l border-hairline",
                  createMode === mode
                    ? "bg-primary text-on-primary"
                    : "bg-canvas text-muted hover:text-ink hover:bg-surface-cream-strong"
                )}
              >
                {mode === "regular" ? "บัญชีทั่วไป" : "บัญชีชั่วคราว"}
              </button>
            ))}
          </div>

          <Input
            label="ชื่อ User (ชื่อเล่น)"
            id="nickname"
            value={form.nickname}
            onChange={(e) => setField("nickname", e.target.value)}
            required
          />

          {createMode === "regular" && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="ชื่อจริง"
                  id="firstName"
                  value={form.firstName}
                  onChange={(e) => setField("firstName", e.target.value)}
                />
                <Input
                  label="นามสกุล"
                  id="lastName"
                  value={form.lastName}
                  onChange={(e) => setField("lastName", e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-ink">รุ่น Petra</label>
                  <select
                    className={selectClass}
                    value={form.generation}
                    onChange={(e) => setField("generation", e.target.value)}
                  >
                    {getGenerations().map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-ink">Role</label>
                  <select
                    className={selectClass}
                    value={form.role}
                    onChange={(e) => setField("role", e.target.value as Role)}
                  >
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
            <select
              className={selectClass}
              value={form.primaryInstrumentId}
              onChange={(e) => setField("primaryInstrumentId", e.target.value)}
            >
              <option value="">-- เลือกเครื่องดนตรี --</option>
              {instruments.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.nameThai}
                </option>
              ))}
            </select>
          </div>

          {createMode === "temporary" && (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-ink">
                งานที่แสดง <span className="text-error">*</span>
              </label>
              <select
                className={selectClass}
                value={form.linkedPerformanceId}
                onChange={(e) =>
                  setField("linkedPerformanceId", e.target.value)
                }
                required
              >
                <option value="">-- เลือกงานแสดง --</option>
                {upcomingPerformances.map((p) => {
                  const date = p.firstDate
                    ? new Date(p.firstDate).toLocaleDateString("th-TH", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                    : "";
                  return (
                    <option key={p.id} value={p.id}>
                      {p.name}
                      {date ? ` (${date})` : ""}
                    </option>
                  );
                })}
              </select>
            </div>
          )}

          <Input
            label="Contact"
            id="contact"
            value={form.contact}
            onChange={(e) => setField("contact", e.target.value)}
            placeholder="เบอร์, Line, IG ฯลฯ"
          />

          <div className="border-t border-hairline-soft pt-4 flex flex-col gap-3">
            <Input
              label="อีเมล"
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => setField("email", e.target.value)}
              required
            />
            <Input
              label="รหัสผ่าน"
              id="password"
              type="password"
              value={form.password}
              onChange={(e) => setField("password", e.target.value)}
              required
              placeholder="อย่างน้อย 8 ตัวอักษร"
              error={createError}
            />
          </div>

          <Button type="submit" variant="primary" disabled={createLoading}>
            {createLoading ? "กำลังสร้าง..." : "สร้างบัญชี"}
          </Button>
        </form>
      )}

      {/* User list */}
      <div className="flex flex-col gap-2">
        {visibleUsers.map((user) => {
          const isExpired = user.status === "EXPIRED";
          return (
            <div
              key={user.id}
              className={cn(
                "group flex items-center gap-4 px-5 py-4 bg-surface-card border border-hairline rounded-[var(--radius-lg)] transition-colors duration-[var(--duration-pb-base)]",
                isExpired ? "opacity-60" : "hover:border-primary/40"
              )}
            >
              <Link
                href={`/members/${user.id}`}
                className="flex-1 min-w-0 flex flex-col gap-1"
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-ink group-hover:text-primary transition-colors">
                    {user.nickname}
                  </p>
                  <span className="text-xs text-muted-soft">
                    {user.generation}
                  </span>
                  {user.primaryInstrument && (
                    <span className="text-xs text-muted">
                      {user.primaryInstrument.nameThai}
                    </span>
                  )}
                  {user.secondaryInstruments.length > 0 && (
                    <span className="text-xs text-muted-soft">
                      · เล่นเป็น{" "}
                      {user.secondaryInstruments
                        .map((s) => s.instrument.nameThai)
                        .join(", ")}
                    </span>
                  )}
                  {user.isTemporary && (
                    <Badge variant="warning">ชั่วคราว</Badge>
                  )}
                  {isExpired && <Badge variant="slate">หมดอายุ</Badge>}
                </div>
                {user.contact && (
                  <p className="text-xs text-muted inline-flex items-center gap-1.5">
                    <Phone size={12} strokeWidth={1.75} />
                    {user.contact}
                  </p>
                )}
                {user.email && (
                  <p className="text-xs text-muted-soft">{user.email}</p>
                )}
              </Link>

              <RoleBadge role={user.role} />

              {canManageRoles &&
                user.id !== currentUserId &&
                !isExpired &&
                (() => {
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
                          className="text-xs"
                        >
                          {loadingId === user.id ? (
                            "..."
                          ) : (
                            <>
                              <ChevronRight size={12} strokeWidth={1.75} />
                              {r === "ADMIN"
                                ? "Admin"
                                : r === "HEAD"
                                ? "Head"
                                : "Member"}
                            </>
                          )}
                        </Button>
                      ))}
                    </div>
                  );
                })()}

              {isAdmin && user.id !== currentUserId && (
                <button
                  onClick={() => deleteUser(user.id)}
                  disabled={loadingId === user.id}
                  className="shrink-0 text-muted-soft hover:text-error transition-colors duration-[var(--duration-pb-base)] p-2 rounded-[var(--radius-sm)] disabled:opacity-50"
                  aria-label="ลบบัญชี"
                >
                  <Trash2 size={16} strokeWidth={1.75} />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
