"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { type ReactNode } from "react";

const TABS = [
  { key: "list", label: "รายอุปกรณ์" },
  { key: "settings", label: "ตั้งค่าอุปกรณ์ในการแสดง" },
];

interface Props {
  activeTab: string;
  children: ReactNode;
}

export default function EquipmentTabs({ activeTab, children }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function switchTab(tab: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div>
      {/* Tab bar */}
      <div className="flex gap-1 mb-6 border-b border-hairline">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => switchTab(t.key)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === t.key
                ? "border-coral text-coral"
                : "border-transparent text-muted hover:text-ink"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {children}
    </div>
  );
}
