import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import SheetEditorClient from "./SheetEditorClient";

type Params = { params: Promise<{ id: string }> };

export default async function NotebookPage({ params }: Params) {
  const { id } = await params;

  const notebook = await prisma.notebook.findUnique({
    where: { id },
    include: {
      song: { select: { id: true, title: true, songCode: true } },
      sheets: {
        select: {
          id: true,
          name: true,
          sheetOrder: true,
          columnCount: true,
          rowCount: true,
          isPublished: true,
        },
        orderBy: { sheetOrder: "asc" },
      },
    },
  });

  if (!notebook) notFound();

  // Auto-create default 3 sheets if none exist
  if (notebook.sheets.length === 0) {
    const defaultSheets = ["เครื่องตาม", "เครื่องนำ", "เครื่องสาย/ขลุ่ย"];
    const created = await prisma.$transaction(
      defaultSheets.map((name, i) =>
        prisma.sheet.create({
          data: { notebookId: notebook.id, name, sheetOrder: i },
          select: { id: true, name: true, sheetOrder: true, columnCount: true, rowCount: true, isPublished: true },
        })
      )
    );
    notebook.sheets = created;
  }

  return (
    <SheetEditorClient
      notebook={{
        id: notebook.id,
        name: notebook.name,
        song: notebook.song,
        sheets: notebook.sheets,
      }}
    />
  );
}
