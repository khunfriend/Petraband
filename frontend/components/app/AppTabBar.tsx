"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { CalendarDays, Home, Music, UserRound, Users, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/", label: "หน้าหลัก", icon: Home },
  { href: "/performances", label: "งานแสดง", icon: CalendarDays },
  { href: "/songs", label: "เพลง", icon: Music },
  { href: "/members", label: "สมาชิก", icon: Users },
  { href: "/profile", label: "โปรไฟล์", icon: UserRound },
];

/** Bottom tab bar, shown only when opened as the installed app. */
export function AppTabBar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  if (!session) return null;

  return (
    <nav
      aria-label="แถบเมนูแอป"
      className="hidden standalone:flex fixed inset-x-0 bottom-0 z-40 bg-surface-card border-t border-hairline px-2 pt-1.5 pb-[calc(env(safe-area-inset-bottom)+6px)]"
    >
      {TABS.map(({ href, label, icon: Icon }) => {
        const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex-1 flex flex-col items-center gap-0.5 rounded-2xl py-1.5 text-[11px] font-medium transition-colors",
              active ? "bg-blue-50 text-primary" : "text-muted",
            )}
          >
            <Icon size={24} strokeWidth={1.6} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
