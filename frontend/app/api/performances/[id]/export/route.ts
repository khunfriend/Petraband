import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

export const runtime = "nodejs";
export const maxDuration = 60;

import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import ImageModule from "docxtemplater-image-module-free";
import { Resvg } from "@resvg/resvg-js";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { renderStageSvg } from "@/lib/stage-svg";

function formatDate(d: Date) {
  return d.toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" });
}

function formatDateShort(d: Date) {
  return d.toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "numeric" });
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN" && session.user.role !== "HEAD") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const performance = await prisma.performance.findUnique({
    where: { id },
    include: {
      dates: { orderBy: { date: "asc" } },
      heads: { include: { user: { select: { nickname: true, firstName: true, lastName: true } } } },
      members: {
        include: {
          user: { select: { nickname: true, firstName: true, lastName: true } },
        },
        orderBy: [{ position: "asc" }, { joinedAt: "asc" }],
      },
      songs: {
        include: { song: { select: { title: true, songCode: true } } },
        orderBy: { order: "asc" },
      },
      stageLayouts: {
        take: 1,
        include: {
          items: {
            include: { instrument: { select: { nameThai: true } } },
          },
        },
      },
    },
  });

  if (!performance) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Fetch song assignments to map member → songs and instruments
  const songAssignments = await prisma.songAssignment.findMany({
    where: { performanceSong: { performanceId: id } },
    include: {
      performanceSong: { include: { song: { select: { title: true } } } },
      instrument: { select: { nameThai: true } },
    },
  });

  // Build member → songs/instruments map
  const memberSongs = new Map<string, string[]>();
  const memberInsts = new Map<string, string[]>();
  for (const a of songAssignments) {
    const arr = memberSongs.get(a.userId) ?? [];
    arr.push(a.performanceSong.song.title);
    memberSongs.set(a.userId, arr);
    const iarr = memberInsts.get(a.userId) ?? [];
    if (a.instrument?.nameThai) iarr.push(a.instrument.nameThai);
    memberInsts.set(a.userId, iarr);
  }

  const dateTimeStr = performance.dates
    .map((d) => {
      const time = d.startTime ? ` ${d.startTime}${d.endTime ? `–${d.endTime}` : ""}` : "";
      return `${formatDate(d.date)}${time}`;
    })
    .join(" · ");

  const memberSlots = 5;
  const scheduleSlots = 6;

  // Render stage plot (SVG → PNG) if present
  let stagePlotPng: Buffer | null = null;
  const layout = performance.stageLayouts[0];
  if (layout && layout.items.length > 0) {
    const svg = renderStageSvg({
      widthUnits: layout.widthUnits,
      heightUnits: layout.heightUnits,
      unitLabel: layout.unitLabel,
      items: layout.items,
    });
    try {
      const resvg = new Resvg(svg, { fitTo: { mode: "width", value: 1200 } });
      stagePlotPng = resvg.render().asPng();
    } catch (e) {
      console.error("[stage svg render]", e);
    }
  }

  const data: Record<string, string> = {
    name: performance.name,
    dateTime: dateTimeStr,
    location: performance.location ?? "",
    description: performance.description ?? "",
    organizer: "",
    contactPerson: "",
    attire: performance.costume ?? "",
    remarks: "",
    day1Date: performance.dates[0] ? formatDateShort(performance.dates[0].date) : "",
    day2Date: performance.dates[1] ? formatDateShort(performance.dates[1].date) : "",
    // Image module reads this key via getImage; pass a marker so template's {%stagePlot} triggers
    stagePlot: stagePlotPng ? "stage" : "",
  };

  // Fill schedule slots empty (no schedule data model — user fills in Word)
  for (let i = 1; i <= scheduleSlots; i++) {
    data[`day1_t${i}`] = "";
    data[`day1_d${i}`] = "";
    data[`day2_t${i}`] = "";
    data[`day2_d${i}`] = "";
  }

  // Songs
  performance.songs.forEach((s, idx) => {
    if (idx < 4) data[`song${idx + 1}`] = s.song.title;
  });
  for (let i = 1; i <= 4; i++) if (!data[`song${i}`]) data[`song${i}`] = "";

  // Members
  performance.members.slice(0, memberSlots).forEach((m, idx) => {
    const i = idx + 1;
    const fullName = [m.user.firstName, m.user.lastName].filter(Boolean).join(" ");
    data[`m${i}_name`] = fullName ? `${m.user.nickname} (${fullName})` : m.user.nickname;
    data[`m${i}_songs`] = (memberSongs.get(m.userId) ?? []).join(", ");
    data[`m${i}_position`] = m.position || (memberInsts.get(m.userId) ?? []).join(", ");
  });
  for (let i = 1; i <= memberSlots; i++) {
    if (!data[`m${i}_name`]) { data[`m${i}_name`] = ""; data[`m${i}_songs`] = ""; data[`m${i}_position`] = ""; }
  }

  // Load template
  const templatePath = path.join(process.cwd(), "public", "templates", "performance-report.docx");
  const templateBuffer = await readFile(templatePath);
  const zip = new PizZip(templateBuffer);

  const imageModule = new ImageModule({
    centered: true,
    fileType: "docx",
    getImage: () => stagePlotPng ?? Buffer.alloc(0),
    getSize: () => [600, 300],
  });

  const dtpl = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    modules: [imageModule],
  });

  try {
    dtpl.render(data);
  } catch (err) {
    console.error("[docx render error]", err);
    return NextResponse.json({ error: "Render failed" }, { status: 500 });
  }

  const output = dtpl.getZip().generate({ type: "nodebuffer" });
  const filename = `บันทึกการแสดง-${performance.name.replace(/[^\p{L}\p{N}_-]+/gu, "_")}.docx`;

  return new NextResponse(output as BodyInit, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
    },
  });
}
