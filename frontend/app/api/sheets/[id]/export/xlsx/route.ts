import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: NextRequest, { params }: Params) {
  const { id: sheetId } = await params;
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sheet = await prisma.sheet.findUnique({
    where: { id: sheetId },
    include: {
      cells: { include: { style: true } },
      mergedCells: true,
      columnWidths: { orderBy: { colIndex: "asc" } },
      rowHeights: { orderBy: { rowIndex: "asc" } },
      notebook: { select: { name: true } },
    },
  });

  if (!sheet) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Build worksheet data
  const wsData: (string | null)[][] = [];
  for (let r = 0; r < sheet.rowCount; r++) {
    wsData.push(Array(sheet.columnCount).fill(null));
  }

  for (const cell of sheet.cells) {
    if (cell.rowIndex < sheet.rowCount && cell.colIndex < sheet.columnCount) {
      wsData[cell.rowIndex][cell.colIndex] = cell.cellValue ?? null;
    }
  }

  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Apply merged cells
  if (sheet.mergedCells.length > 0) {
    ws["!merges"] = sheet.mergedCells.map((m) => ({
      s: { r: m.startRow, c: m.startCol },
      e: { r: m.endRow, c: m.endCol },
    }));
  }

  // Apply column widths
  if (sheet.columnWidths.length > 0) {
    const colInfo: XLSX.ColInfo[] = [];
    for (const col of sheet.columnWidths) {
      colInfo[col.colIndex] = { wpx: col.widthPx };
    }
    ws["!cols"] = colInfo;
  }

  // Apply row heights
  if (sheet.rowHeights.length > 0) {
    const rowInfo: XLSX.RowInfo[] = [];
    for (const row of sheet.rowHeights) {
      rowInfo[row.rowIndex] = { hpx: row.heightPx };
    }
    ws["!rows"] = rowInfo;
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheet.name);

  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  const filename = encodeURIComponent(`${sheet.notebook.name}_${sheet.name}.xlsx`);

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
