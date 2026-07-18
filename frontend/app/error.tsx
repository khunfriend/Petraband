"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-16">
      <Card className="w-full max-w-md text-center">
        <div className="flex flex-col items-center gap-3">
          <p className="text-5xl leading-none" aria-hidden>⚠️</p>
          <h2 className="text-xl font-bold text-ink">เกิดข้อผิดพลาด</h2>
          <p className="text-sm text-muted leading-relaxed">
            ลองรีเฟรชหรือกดปุ่ม &quot;ลองใหม่&quot; ด้านล่าง หากยังไม่ได้แจ้งแอดมิน
          </p>
          {error.digest && (
            <p className="text-xs text-muted-soft font-mono">รหัส: {error.digest}</p>
          )}
          <div className="flex gap-2 mt-2">
            <Button variant="primary" size="sm" onClick={reset}>ลองใหม่</Button>
            <Link href="/">
              <Button variant="secondary" size="sm">หน้าหลัก</Button>
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
}
