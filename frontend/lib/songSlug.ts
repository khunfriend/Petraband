import { prisma } from "@/lib/prisma";
import { cleanCustomSlug, looksLikeId, slugify } from "@/lib/slug";

// Songs work like performances (see lib/performanceSlug) but use the title
// alone: a song has no date to tell two of the same name apart, so clashes
// get -2, -3.

function autoSongSlug(title: string) {
  return slugify(title) || "song";
}

/** `base`, or `base-2`, `base-3`… — whichever no other song uses (now or before). */
export async function uniqueSongSlug(base: string, excludeId?: string): Promise<string> {
  for (let n = 1; ; n++) {
    const candidate = n === 1 ? base : `${base}-${n}`;
    const taken = await prisma.song.findFirst({
      where: {
        OR: [{ slug: candidate }, { previousSlugs: { has: candidate } }],
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
      select: { id: true },
    });
    if (!taken) return candidate;
  }
}

/** The song's slug, creating one from its title if it has none yet. */
export async function ensureSongSlug(id: string): Promise<string | null> {
  const s = await prisma.song.findUnique({ where: { id }, select: { slug: true, title: true } });
  if (!s) return null;
  if (s.slug) return s.slug;
  const slug = await uniqueSongSlug(autoSongSlug(s.title), id);
  await prisma.song.update({ where: { id }, data: { slug } });
  return slug;
}

/** Resolve /songs/[param]: an id, the current slug or an old one. */
export async function resolveSongParam(raw: string): Promise<{ id: string; slug: string | null } | null> {
  let param = raw;
  try {
    param = decodeURIComponent(raw);
  } catch {}
  param = param.normalize("NFC");
  return looksLikeId(param)
    ? prisma.song.findUnique({ where: { id: param }, select: { id: true, slug: true } })
    : prisma.song.findFirst({
        where: { OR: [{ slug: param }, { previousSlugs: { has: param } }] },
        select: { id: true, slug: true },
      });
}

/** Set the link name from the "ชื่อในลิงก์" box. Empty → back to the title. */
export async function setSongSlug(id: string, input: string): Promise<{ slug: string } | { error: string }> {
  const s = await prisma.song.findUnique({ where: { id }, select: { slug: true, title: true, previousSlugs: true } });
  if (!s) return { error: "ไม่พบเพลง" };

  const custom = cleanCustomSlug(input);
  if (input.trim() && !custom) return { error: "ชื่อในลิงก์ใช้ได้เฉพาะตัวอักษรไทย a–z และตัวเลข" };
  if (custom && looksLikeId(custom)) return { error: "ชื่อในลิงก์นี้ใช้ไม่ได้" };

  let slug: string;
  if (custom) {
    const taken = await prisma.song.findFirst({
      where: { OR: [{ slug: custom }, { previousSlugs: { has: custom } }], NOT: { id } },
      select: { id: true },
    });
    if (taken) return { error: "ชื่อในลิงก์นี้มีเพลงอื่นใช้แล้ว" };
    slug = custom;
  } else {
    slug = await uniqueSongSlug(autoSongSlug(s.title), id);
  }

  if (slug !== s.slug) {
    const previous = s.slug && !s.previousSlugs.includes(s.slug) ? [...s.previousSlugs, s.slug] : s.previousSlugs;
    await prisma.song.update({ where: { id }, data: { slug, previousSlugs: previous.filter((x) => x !== slug) } });
  }
  return { slug };
}
