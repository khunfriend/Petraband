// The app's sections, shared by the top nav and the home launcher so both
// list the same places for the same roles.
export type NavLink = {
  href: string;
  label: string;
  roles?: readonly string[];
  pendingBadge?: boolean;
};

export const NAV_LINKS: NavLink[] = [
  { href: "/songs", label: "เพลง" },
  { href: "/performances", label: "งานแสดง" },
  { href: "/members", label: "สมาชิก" },
  { href: "/equipment", label: "อุปกรณ์", roles: ["ADMIN", "HEAD"] },
  { href: "/admin/dashboard", label: "แดชบอร์ด", roles: ["ADMIN"] },
  { href: "/admin/pending-users", label: "อนุมัติสมาชิก", roles: ["ADMIN"], pendingBadge: true },
];

export function linksForRole(role: string | undefined) {
  return NAV_LINKS.filter((l) => !l.roles || (role !== undefined && l.roles.includes(role)));
}
