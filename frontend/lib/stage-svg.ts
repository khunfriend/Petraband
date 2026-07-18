// Render a stage layout as an SVG string.
// Coordinates in layout are in "units" (typically meters); we scale to a fixed-width canvas.

type Item = {
  x: number;
  y: number;
  rotation: number;
  label: string | null;
  customName?: string | null;
  instrument: { nameThai: string } | null;
};

type Layout = {
  widthUnits: number;
  heightUnits: number;
  unitLabel: string;
  items: Item[];
};

const CANVAS_W = 800;
const PADDING = 24;

export function renderStageSvg(layout: Layout): string {
  const scale = (CANVAS_W - PADDING * 2) / layout.widthUnits;
  const canvasH = layout.heightUnits * scale + PADDING * 2;

  const items = layout.items
    .map((it) => {
      const cx = PADDING + it.x * scale;
      const cy = PADDING + it.y * scale;
      const r = Math.max(18, Math.min(32, scale * 0.35));
      const text = (it.label || it.customName || it.instrument?.nameThai || "").replace(/[<>&]/g, (c) =>
        c === "<" ? "&lt;" : c === ">" ? "&gt;" : "&amp;"
      );
      return `
        <g transform="translate(${cx.toFixed(1)},${cy.toFixed(1)}) rotate(${it.rotation})">
          <circle r="${r}" fill="#FFF3E9" stroke="#FF6B6B" stroke-width="2" />
          <text text-anchor="middle" dominant-baseline="central" font-family="Sarabun, Arial, sans-serif" font-size="10" fill="#333">${text}</text>
        </g>`;
    })
    .join("");

  // Grid: 1-unit lines
  const gridLines: string[] = [];
  for (let x = 0; x <= layout.widthUnits; x++) {
    const px = PADDING + x * scale;
    gridLines.push(`<line x1="${px}" y1="${PADDING}" x2="${px}" y2="${canvasH - PADDING}" stroke="#EEE" stroke-width="1"/>`);
  }
  for (let y = 0; y <= layout.heightUnits; y++) {
    const py = PADDING + y * scale;
    gridLines.push(`<line x1="${PADDING}" y1="${py}" x2="${CANVAS_W - PADDING}" y2="${py}" stroke="#EEE" stroke-width="1"/>`);
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${CANVAS_W} ${canvasH.toFixed(0)}" width="${CANVAS_W}" height="${canvasH.toFixed(0)}">
  <rect x="${PADDING}" y="${PADDING}" width="${CANVAS_W - PADDING * 2}" height="${canvasH - PADDING * 2}" fill="#FAFAFA" stroke="#CCC" stroke-width="1.5"/>
  ${gridLines.join("\n  ")}
  <text x="${CANVAS_W / 2}" y="${PADDING - 6}" text-anchor="middle" font-family="Sarabun, Arial, sans-serif" font-size="11" fill="#666">ด้านหน้าเวที (${layout.widthUnits} × ${layout.heightUnits} ${layout.unitLabel})</text>
  ${items}
</svg>`;
}
