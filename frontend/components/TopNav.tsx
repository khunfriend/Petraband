"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/songs", label: "เพลง" },
  { href: "/performances", label: "งานแสดง" },
  { href: "/members", label: "สมาชิก" },
  { href: "/equipment", label: "อุปกรณ์", roles: ["ADMIN", "HEAD"] as const },
  { href: "/admin/pending-users", label: "อนุมัติสมาชิก", roles: ["ADMIN"] as const },
];

export function TopNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);

  const role = session?.user.role;
  const visibleLinks = navLinks.filter((l) => !l.roles || (role && (l.roles as readonly string[]).includes(role)));

  return (
    <nav className="h-16 bg-canvas border-b border-hairline sticky top-0 z-40">
      <div className="max-w-[1200px] mx-auto h-full px-8 flex items-center gap-8">
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <Image
            src="/petraband-logo.png"
            alt="PETRAband"
            width={36}
            height={36}
            className="rounded-full"
          />
          <span className="text-sm font-bold text-ink tracking-tight">PETRAband</span>
        </Link>

        <div className="flex items-center gap-1 flex-1">
          {visibleLinks.map((link) => {
            const active = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative px-3.5 py-2 text-sm font-medium transition-colors duration-[var(--duration-pb-base)] ease-[var(--ease-pb)]",
                  active
                    ? "text-ink after:content-[''] after:absolute after:left-3.5 after:right-3.5 after:-bottom-[calc(1rem+1px)] after:h-[2px] after:bg-primary"
                    : "text-muted hover:text-ink"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        <div className="relative shrink-0">
          {session ? (
            <>
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center text-xs font-bold hover:bg-primary-active transition-colors overflow-hidden"
              >
                {session.user.avatarUrl ? (
                  <Image
                    src={session.user.avatarUrl}
                    alt={session.user.name ?? ""}
                    width={32}
                    height={32}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  session.user.name?.charAt(0).toUpperCase() ?? "?"
                )}
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-10 w-44 bg-surface-card border border-hairline rounded-[var(--radius-lg)] py-1 z-50">
                  <div className="px-4 py-2 border-b border-hairline-soft">
                    <p className="text-xs font-medium text-ink">{session.user.name}</p>
                    <p className="text-xs text-muted">{session.user.email}</p>
                  </div>
                  <Link
                    href="/profile"
                    className="block px-4 py-2 text-sm text-ink hover:bg-surface-cream-strong"
                    onClick={() => setMenuOpen(false)}
                  >
                    โปรไฟล์
                  </Link>
                  <button
                    onClick={() => signOut({ callbackUrl: "/login" })}
                    className="w-full text-left px-4 py-2 text-sm text-error hover:bg-surface-cream-strong"
                  >
                    ออกจากระบบ
                  </button>
                </div>
              )}
            </>
          ) : (
            <Link
              href="/login"
              className="text-sm font-medium text-muted hover:text-ink transition-colors"
            >
              เข้าสู่ระบบ
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
