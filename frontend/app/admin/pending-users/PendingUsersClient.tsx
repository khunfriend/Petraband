"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

type PendingUser = {
  id: string;
  email: string;
  nickname: string;
  generation: string;
  createdAt: string;
  emailVerifiedAt: string | null;
};

export default function PendingUsersClient({ users }: { users: PendingUser[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function act(id: string, action: "approve" | "reject") {
    setError(null);
    setBusyId(id);
    let reason: string | null = null;
    if (action === "reject") {
      reason = window.prompt("เหตุผลที่ปฏิเสธ (ตัวเลือก)");
      if (reason === null) {
        setBusyId(null);
        return;
      }
    }
    try {
      const res = await fetch(`/api/admin/users/${id}/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "ดำเนินการไม่สำเร็จ");
        setBusyId(null);
        return;
      }
      startTransition(() => {
        router.refresh();
        setBusyId(null);
      });
    } catch {
      setError("เกิดข้อผิดพลาด กรุณาลองใหม่");
      setBusyId(null);
    }
  }

  if (users.length === 0) {
    return (
      <div className="rounded-[var(--radius-lg)] border border-hairline-soft bg-surface-card p-8 text-center">
        <p className="text-sm text-muted-soft">ไม่มีสมาชิกรอการอนุมัติ</p>
      </div>
    );
  }

  return (
    <div className="rounded-[var(--radius-lg)] border border-hairline-soft bg-surface-card overflow-hidden">
      {error && (
        <div className="px-4 py-3 border-b border-hairline-soft bg-error/5 text-sm text-error">{error}</div>
      )}
      <table className="w-full text-sm">
        <thead className="bg-surface-soft border-b border-hairline-soft">
          <tr className="text-left text-xs font-semibold text-muted uppercase tracking-wide">
            <th className="px-4 py-3">ชื่อเล่น</th>
            <th className="px-4 py-3">อีเมล</th>
            <th className="px-4 py-3">รุ่น</th>
            <th className="px-4 py-3">สมัครเมื่อ</th>
            <th className="px-4 py-3 text-right">การดำเนินการ</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="border-t border-hairline-soft">
              <td className="px-4 py-3 font-medium text-ink">{u.nickname}</td>
              <td className="px-4 py-3 text-body">{u.email}</td>
              <td className="px-4 py-3 text-muted">{u.generation || "—"}</td>
              <td className="px-4 py-3 text-muted-soft">
                {new Date(u.createdAt).toLocaleDateString("th-TH")}
              </td>
              <td className="px-4 py-3 text-right space-x-2">
                <Button
                  size="sm"
                  variant="primary"
                  disabled={isPending || busyId === u.id}
                  onClick={() => act(u.id, "approve")}
                >
                  อนุมัติ
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={isPending || busyId === u.id}
                  onClick={() => act(u.id, "reject")}
                >
                  ปฏิเสธ
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
