import { prisma } from "@/lib/prisma";
import { ensureSlug } from "@/lib/performanceSlug";
import { looksLikeId, slugify } from "@/lib/slug";

// Polls are named after their performance: "poll-cbs-night", then -2, -3 for
// the next polls of the same show. Old slugs are kept so shared links still open.

async function autoPollSlug(performanceId: string, name: string) {
  const perfSlug = await ensureSlug(performanceId);
  return perfSlug ? `poll-${perfSlug}` : `poll-${slugify(name) || "x"}`;
}

/** `base`, or `base-2`, `base-3`… — whichever no other poll uses (now or before). */
export async function uniquePollSlug(base: string, excludeId?: string): Promise<string> {
  for (let n = 1; ; n++) {
    const candidate = n === 1 ? base : `${base}-${n}`;
    const taken = await prisma.availabilityPoll.findFirst({
      where: {
        OR: [{ slug: candidate }, { previousSlugs: { has: candidate } }],
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
      select: { id: true },
    });
    if (!taken) return candidate;
  }
}

/** The poll's slug, creating one from its performance if it has none yet. */
export async function ensurePollSlug(id: string): Promise<string | null> {
  const s = await prisma.availabilityPoll.findUnique({ where: { id }, select: { slug: true, name: true, performanceId: true } });
  if (!s) return null;
  if (s.slug) return s.slug;
  const slug = await uniquePollSlug(await autoPollSlug(s.performanceId, s.name), id);
  await prisma.availabilityPoll.update({ where: { id }, data: { slug } });
  return slug;
}

/** Resolve /polls/[param]: an id, the current slug or an old one. */
export async function resolvePollParam(raw: string): Promise<{ id: string; slug: string | null } | null> {
  let param = raw;
  try {
    param = decodeURIComponent(raw);
  } catch {}
  param = param.normalize("NFC");
  return looksLikeId(param)
    ? prisma.availabilityPoll.findUnique({ where: { id: param }, select: { id: true, slug: true } })
    : prisma.availabilityPoll.findFirst({
        where: { OR: [{ slug: param }, { previousSlugs: { has: param } }] },
        select: { id: true, slug: true },
      });
}
