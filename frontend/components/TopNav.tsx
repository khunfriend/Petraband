"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { isGuestEmail } from "@/lib/guest";
import { PENDING_USERS_CHANGED } from "@/lib/pendingUsers";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/songs", label: "เพลง" },
  { href: "/performances", label: "งานแสดง" },
  { href: "/members", label: "สมาชิก" },
  { href: "/equipment", label: "อุปกรณ์", roles: ["ADMIN", "HEAD"] as const },
  { href: "/admin/pending-users", label: "อนุมัติสมาชิก", roles: ["ADMIN"] as const, pendingBadge: true },
];

// Pending sign-ups for the admin badge. Refreshes on navigation, when the tab
// regains focus, every minute, and right after an approve/reject.
function usePendingCount(enabled: boolean, pathname: string) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    const load = () =>
      fetch("/api/admin/users/pending-count")
        .then((r) => (r.ok ? r.json() : { count: 0 }))
        .then((d) => alive && setCount(d.count ?? 0))
        .catch(() => {});
    load();
    const timer = setInterval(load, 60_000);
    window.addEventListener("focus", load);
    window.addEventListener(PENDING_USERS_CHANGED, load);
    return () => {
      alive = false;
      clearInterval(timer);
      window.removeEventListener("focus", load);
      window.removeEventListener(PENDING_USERS_CHANGED, load);
    };
  }, [enabled, pathname]);
  return enabled ? count : 0;
}

export function TopNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  // Link under the mouse — its underline pops up while hovered.
  const [hoveredHref, setHoveredHref] = useState<string | null>(null);

  const role = session?.user.role;
  const pendingCount = usePendingCount(role === "ADMIN", pathname);

  // Hide the whole nav bar (logo + links) when not signed in — auth pages
  // stand on their own without the header
  if (!session) return null;

  const visibleLinks = navLinks.filter(
    (l) => !l.roles || (role && (l.roles as readonly string[]).includes(role)),
  );

  return (
    <nav className="h-16 bg-surface-dark/95 backdrop-blur-md border-b border-white/10 sticky top-0 z-40 shadow-[0_8px_24px_-16px_rgb(13_27_51/0.8)]">
      <div className="max-w-[1200px] mx-auto h-full px-4 md:px-8 flex items-center gap-4 md:gap-8">
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <Image
            src="/petraband-logo.png"
            alt="PETRAband"
            width={36}
            height={36}
            className="rounded-full ring-2 ring-gold/70 ring-offset-2 ring-offset-surface-dark"
          />
          <span className="hidden sm:inline font-display text-[15px] font-semibold text-on-dark tracking-wide">PETRAband</span>
        </Link>

        <div className="flex items-center gap-0.5 flex-1 overflow-x-auto [scrollbar-width:none]">
          {visibleLinks.map((link) => {
            const active = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                onMouseEnter={() => setHoveredHref(link.href)}
                onMouseLeave={() => setHoveredHref((h) => (h === link.href ? null : h))}
                className={cn(
                  "group relative shrink-0 px-3 md:px-3.5 py-2 text-sm font-medium transition-colors duration-[var(--duration-pb-base)] ease-[var(--ease-pb)]",
                  active ? "text-white" : "text-on-dark-soft hover:text-white"
                )}
              >
                {link.label}
                {/* Underline: always rendered, scaled to zero when inactive so
                    it grows in when the page becomes active. Inline styles keep
                    it independent of generated utility classes. */}
                <span
                  aria-hidden
                  className="absolute bg-gold rounded-full"
                  style={{
                    left: "0.875rem",
                    right: "0.875rem",
                    height: 2,
                    bottom: 2,
                    transform: active || hoveredHref === link.href ? "scaleX(1)" : "scaleX(0)",
                    // Overshoot curve: pops a touch past full width, then settles.
                    transition: "transform 260ms cubic-bezier(0.34, 1.56, 0.64, 1)",
                  }}
                />
                {"pendingBadge" in link && pendingCount > 0 && (
                  <span
                    key={pendingCount}
                    aria-label={`รออนุมัติ ${pendingCount} คน`}
                    className="pb-badge-pop absolute top-0 right-0 min-w-[18px] h-[18px] px-1 rounded-full bg-coral text-white text-[10px] font-bold leading-[18px] text-center ring-2 ring-surface-dark"
                  >
                    {pendingCount > 99 ? "99+" : pendingCount}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        <div className="relative shrink-0">
          {session ? (
            <>
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="w-9 h-9 rounded-full bg-surface-dark-elevated text-on-dark ring-1 ring-gold/60 flex items-center justify-center text-xs font-bold hover:ring-gold transition-shadow overflow-hidden"
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
                <div className="pb-menu-in absolute right-0 top-12 w-52 bg-surface-card border border-hairline rounded-[var(--radius-lg)] py-1 z-50">
                  <div className="px-4 py-2 border-b border-hairline-soft">
                    <p className="text-xs font-medium text-ink">{session.user.name}</p>
                    {!isGuestEmail(session.user.email) && (
                      <p className="text-xs text-muted">{session.user.email}</p>
                    )}
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
