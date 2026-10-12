import { prisma } from "@/lib/prisma";
import { autoSlug, looksLikeId, slugMatchesBase } from "@/lib/slug";

/** `base`, or `base-2`, `base-3`… — whichever no other performance uses (now or before). */
export async function uniqueSlug(base: string, excludeId?: string): Promise<string> {
  for (let n = 1; ; n++) {
    const candidate = n === 1 ? base : `${base}-${n}`;
    const taken = await prisma.performance.findFirst({
      where: {
        OR: [{ slug: candidate }, { previousSlugs: { has: candidate } }],
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
      select: { id: true },
    });
    if (!taken) return candidate;
  }
}

/** The performance's slug, creating one from name + first date if it has none yet. */
export async function ensureSlug(id: string): Promise<string | null> {
  const p = await prisma.performance.findUnique({
    where: { id },
    select: { slug: true, name: true, dates: { orderBy: { date: "asc" }, take: 1, select: { date: true } } },
  });
  if (!p) return null;
  if (p.slug) return p.slug;
  const slug = await uniqueSlug(autoSlug(p.name, p.dates[0]?.date), id);
  await prisma.performance.update({ where: { id }, data: { slug } });
  return slug;
}

/**
 * Resolve a /performances/[param] value: an id, the current slug or an old
 * one. Returns the id and the slug the address bar should show.
 */
export async function resolvePerformanceParam(raw: string): Promise<{ id: string; slug: string | null } | null> {
  let param = raw;
  try {
    param = decodeURIComponent(raw);
  } catch {}
  param = param.normalize("NFC");
  const p = looksLikeId(param)
    ? await prisma.performance.findUnique({ where: { id: param }, select: { id: true, slug: true } })
    : await prisma.performance.findFirst({
        where: { OR: [{ slug: param }, { previousSlugs: { has: param } }] },
        select: { id: true, slug: true },
      });
  return p;
}

/**
 * Keep the link in step with the name: after a rename the slug becomes the
 * new name + first date (old one kept in previousSlugs so shared links still
 * open). Leaves it alone when it already matches.
 */
export async function syncSlug(id: string): Promise<string | null> {
  const p = await prisma.performance.findUnique({
    where: { id },
    select: { slug: true, name: true, previousSlugs: true, dates: { orderBy: { date: "asc" }, take: 1, select: { date: true } } },
  });
  if (!p) return null;
  const base = autoSlug(p.name, p.dates[0]?.date);
  if (slugMatchesBase(p.slug, base)) return p.slug;
  const slug = await uniqueSlug(base, id);
  const previous = p.slug && !p.previousSlugs.includes(p.slug) ? [...p.previousSlugs, p.slug] : p.previousSlugs;
  await prisma.performance.update({ where: { id }, data: { slug, previousSlugs: previous.filter((s) => s !== slug) } });
  return slug;
}
