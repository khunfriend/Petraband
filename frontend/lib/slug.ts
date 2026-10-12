// Readable URL names made from the Thai name, e.g. "ลาวดวงเดือน" or
// "CBS Night" on 12 Nov 2026 → "cbs-night-2569-11-12". Thai letters are kept;
// LINE and browsers show them as they are.

const MAX = 80;

/** Lower-case, keep Thai and a–z/0–9, everything else becomes single dashes. */
export function slugify(text: string): string {
  return text
    .normalize("NFC")
    .toLowerCase()
    .replace(/[^a-z0-9฀-๿]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, MAX)
    .replace(/-+$/g, "");
}

/** Buddhist-year date suffix, matching how dates are shown in the app. */
export function dateSuffix(date: Date | null | undefined): string {
  if (!date) return "";
  const [y, m, d] = date.toISOString().slice(0, 10).split("-");
  return `${Number(y) + 543}-${m}-${d}`;
}

/** Name + first show date; the date tells yearly repeats apart. */
export function autoSlug(name: string, firstDate?: Date | null): string {
  const base = slugify(name) || "performance";
  const suffix = dateSuffix(firstDate);
  return suffix ? `${base}-${suffix}` : base;
}

/** True when `slug` is `base` or a clash variant of it (`base-2`, `base-3`…). */
export function slugMatchesBase(slug: string | null | undefined, base: string): boolean {
  if (!slug) return false;
  if (slug === base) return true;
  return slug.startsWith(`${base}-`) && /^\d+$/.test(slug.slice(base.length + 1));
}

/** cuid ids look like this; slugs never do (they always contain a dash or Thai). */
export function looksLikeId(value: string): boolean {
  return /^c[a-z0-9]{20,}$/.test(value);
}
