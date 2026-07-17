"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

export default function JoinButton({ performanceId }: { performanceId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleJoin() {
    setLoading(true);
    await fetch(`/api/performances/${performanceId}/join`, { method: "POST" });
    router.push(`/performances/${performanceId}`);
  }

  return (
    <Button variant="primary" size="sm" onClick={handleJoin} disabled={loading}>
      {loading ? "กำลังเข้าร่วม..." : "เข้าร่วม"}
    </Button>
  );
}
