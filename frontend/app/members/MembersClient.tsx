"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

type Role = "MEMBER" | "HEAD" | "ADMIN";

type User = {
  id: string;
  email: string;
  nickname: string;
  generation: string;
  role: Role;
  primaryInstrument: { id: string; name: string; nameThai: string } | null;
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

export default function MembersClient({
  initialUsers,
  currentUserId,
  isAdmin,
}: {
  initialUsers: User[];
  currentUserId: string;
  isAdmin: boolean;
}) {
  const [users, setUsers] = useState(initialUsers);
  const [loadingId, setLoadingId] = useState<string | null>(null);

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

  const ROLES: Role[] = ["MEMBER", "HEAD", "ADMIN"];

  return (
    <div className="flex flex-col gap-3">
      {users.map((user) => (
        <div
          key={user.id}
          className="flex items-center gap-4 px-4 py-3 bg-surface-card border border-hairline-soft rounded-[var(--radius-md)]"
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-medium text-ink">{user.nickname}</p>
              <span className="text-xs text-muted-soft">{user.generation}</span>
              {user.primaryInstrument && (
                <span className="text-xs text-muted">{user.primaryInstrument.nameThai}</span>
              )}
            </div>
            <p className="text-xs text-muted mt-0.5">{user.email}</p>
          </div>

          <RoleBadge role={user.role} />

          {isAdmin && user.id !== currentUserId && (
            <div className="flex gap-1 shrink-0">
              {ROLES.filter((r) => r !== user.role).map((r) => (
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
          )}
        </div>
      ))}
    </div>
  );
}
