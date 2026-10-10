import { prisma } from "@/lib/prisma";
import { autoSlug, cleanCustomSlug, englishNameError, looksLikeId } from "@/lib/slug";

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
 * Set the link name from the required English name. `suffixIfTaken` (used on
 * create) adds -2, -3 instead of refusing a taken name. The old slug is kept so
 * links already shared still open the page.
 */
export async function setPerformanceSlug(
  id: string,
  input: string,
  opts: { suffixIfTaken?: boolean } = {},
): Promise<{ slug: string } | { error: string }> {
  const p = await prisma.performance.findUnique({
    where: { id },
    select: { slug: true, name: true, previousSlugs: true, dates: { orderBy: { date: "asc" }, take: 1, select: { date: true } } },
  });
  if (!p) return { error: "ไม่พบงานแสดง" };

  const invalid = englishNameError(input);
  if (invalid) return { error: invalid };
  const custom = cleanCustomSlug(input);

  let slug: string;
  if (opts.suffixIfTaken) {
    slug = await uniqueSlug(custom, id);
  } else {
    const taken = await prisma.performance.findFirst({
      where: { OR: [{ slug: custom }, { previousSlugs: { has: custom } }], NOT: { id } },
      select: { id: true },
    });
    if (taken) return { error: "ชื่อภาษาอังกฤษนี้มีงานอื่นใช้แล้ว" };
    slug = custom;
  }

  if (slug !== p.slug) {
    const previous = p.slug && !p.previousSlugs.includes(p.slug) ? [...p.previousSlugs, p.slug] : p.previousSlugs;
    await prisma.performance.update({
      where: { id },
      data: { slug, previousSlugs: previous.filter((s) => s !== slug) },
    });
  }
  return { slug };
}
