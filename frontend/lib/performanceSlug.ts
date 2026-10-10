import { prisma } from "@/lib/prisma";
import { autoSlug, cleanCustomSlug, looksLikeId } from "@/lib/slug";

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
 * Set the link name from the "ชื่อในลิงก์" box. Empty → back to name + date.
 * The old slug is kept so links already shared still open the page.
 */
export async function setPerformanceSlug(
  id: string,
  input: string,
): Promise<{ slug: string } | { error: string }> {
  const p = await prisma.performance.findUnique({
    where: { id },
    select: { slug: true, name: true, previousSlugs: true, dates: { orderBy: { date: "asc" }, take: 1, select: { date: true } } },
  });
  if (!p) return { error: "ไม่พบงานแสดง" };

  const custom = cleanCustomSlug(input);
  if (input.trim() && !custom) return { error: "ชื่อในลิงก์ใช้ได้เฉพาะตัวอักษรไทย a–z และตัวเลข" };
  if (custom && looksLikeId(custom)) return { error: "ชื่อในลิงก์นี้ใช้ไม่ได้" };

  let slug: string;
  if (custom) {
    const taken = await prisma.performance.findFirst({
      where: { OR: [{ slug: custom }, { previousSlugs: { has: custom } }], NOT: { id } },
      select: { id: true },
    });
    if (taken) return { error: "ชื่อในลิงก์นี้มีงานอื่นใช้แล้ว" };
    slug = custom;
  } else {
    slug = await uniqueSlug(autoSlug(p.name, p.dates[0]?.date), id);
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
