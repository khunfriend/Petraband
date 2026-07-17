"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";

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
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <h2 className="text-xl font-bold text-ink">เกิดข้อผิดพลาด</h2>
      <p className="text-muted text-sm">{error.message}</p>
      <Button variant="coral" size="sm" onClick={reset}>ลองใหม่</Button>
    </div>
  );
}
