import type { CellRun, CellStyle } from "./types";

// Merge adjacent runs with identical styling to keep JSON compact.
export function normalizeRuns(runs: CellRun[]): CellRun[] {
  const out: CellRun[] = [];
  for (const r of runs) {
    if (!r.text) continue;
    const last = out[out.length - 1];
    if (
      last &&
      last.fontSize === r.fontSize &&
      last.isBold === r.isBold &&
      last.isItalic === r.isItalic &&
      last.isUnderline === r.isUnderline &&
      last.textColor === r.textColor
    ) {
      last.text += r.text;
    } else {
      out.push({ ...r });
    }
  }
  return out;
}

export function runsToPlainText(runs: CellRun[] | null | undefined): string {
  if (!runs) return "";
  return runs.map((r) => r.text).join("");
}

// Build HTML string for a contentEditable / read-only render. Escapes text.
export function runsToHtml(runs: CellRun[] | null | undefined, defaults?: CellStyle): string {
  if (!runs || runs.length === 0) return "";
  return runs
    .map((r) => {
      const styles: string[] = [];
      if (r.fontSize != null) styles.push(`font-size:${r.fontSize}px`);
      if (r.isBold) styles.push(`font-weight:bold`);
      if (r.isItalic) styles.push(`font-style:italic`);
      if (r.isUnderline) styles.push(`text-decoration:underline`);
      if (r.textColor) styles.push(`color:${r.textColor}`);
      const text = escapeHtml(r.text);
      if (styles.length === 0) return text;
      return `<span style="${styles.join(";")}">${text}</span>`;
    })
    .join("");
}

function stripInnerStyles(root: HTMLElement, patch: Partial<CellRun>) {
  const descendants = root.querySelectorAll<HTMLElement>("*");
  descendants.forEach((el) => {
    if (patch.fontSize != null && el.style.fontSize) el.style.fontSize = "";
    if (patch.isBold != null && el.style.fontWeight) el.style.fontWeight = "";
    if (patch.isItalic != null && el.style.fontStyle) el.style.fontStyle = "";
    if (patch.isUnderline != null && el.style.textDecoration) el.style.textDecoration = "";
    if (patch.textColor != null && el.style.color) el.style.color = "";
    if (el.tagName === "SPAN" && !el.getAttribute("style")?.trim()) {
      // Unwrap empty spans
      const parent = el.parentNode;
      if (parent) {
        while (el.firstChild) parent.insertBefore(el.firstChild, el);
        parent.removeChild(el);
      }
    }
  });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// Parse a contentEditable DOM subtree back to runs.
// Walks text nodes and collects nearest ancestor styles.
export function domToRuns(root: HTMLElement): CellRun[] {
  const runs: CellRun[] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node: Node | null;
  while ((node = walker.nextNode())) {
    const text = (node.nodeValue ?? "").replace(/ /g, " ");
    if (!text) continue;
    const run: CellRun = { text };
    let el: HTMLElement | null = node.parentElement;
    while (el && el !== root) {
      const style = el.style;
      if (run.fontSize == null && style.fontSize) {
        const n = parseFloat(style.fontSize);
        if (!Number.isNaN(n)) run.fontSize = Math.round(n);
      }
      if (run.isBold == null && (style.fontWeight === "bold" || parseInt(style.fontWeight, 10) >= 600)) {
        run.isBold = true;
      }
      if (run.isItalic == null && style.fontStyle === "italic") run.isItalic = true;
      if (run.isUnderline == null && style.textDecoration.includes("underline")) run.isUnderline = true;
      if (!run.textColor && style.color) run.textColor = style.color;
      // Also respect legacy tag names
      const tag = el.tagName;
      if (run.isBold == null && (tag === "B" || tag === "STRONG")) run.isBold = true;
      if (run.isItalic == null && (tag === "I" || tag === "EM")) run.isItalic = true;
      if (run.isUnderline == null && tag === "U") run.isUnderline = true;
      el = el.parentElement;
    }
    runs.push(run);
  }
  return normalizeRuns(runs);
}

// Wrap the current selection in a visible marker span so the user still sees
// what's "selected" after focus moves to a toolbar control. Returns the marker.
export function addFakeSelection(root: HTMLElement, range: Range): HTMLElement | null {
  if (range.collapsed) return null;
  if (!root.contains(range.commonAncestorContainer)) return null;
  // Clean any stale markers first
  removeFakeSelection(root);
  const span = document.createElement("span");
  span.setAttribute("data-fake-selection", "");
  span.style.backgroundColor = "rgba(96, 165, 250, 0.45)";
  try {
    span.appendChild(range.extractContents());
    range.insertNode(span);
    return span;
  } catch {
    return null;
  }
}

// Remove all fake selection markers and return a Range spanning the unwrapped
// content (so the caller can restore a real Selection over the same text).
export function removeFakeSelection(root: HTMLElement): Range | null {
  const markers = Array.from(root.querySelectorAll<HTMLElement>("span[data-fake-selection]"));
  if (markers.length === 0) return null;
  let firstNode: Node | null = null;
  let lastNode: Node | null = null;
  for (const m of markers) {
    const parent = m.parentNode;
    if (!parent) continue;
    while (m.firstChild) {
      const child = m.firstChild;
      parent.insertBefore(child, m);
      if (!firstNode) firstNode = child;
      lastNode = child;
    }
    parent.removeChild(m);
  }
  if (!firstNode || !lastNode) return null;
  const range = document.createRange();
  range.setStartBefore(firstNode);
  range.setEndAfter(lastNode);
  return range;
}

// Apply a style patch to the current DOM selection inside `root`.
// If no text is selected, does nothing.
export function applyStyleToSelection(root: HTMLElement, patch: Partial<CellRun>): boolean {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return false;
  const range = sel.getRangeAt(0);
  if (range.collapsed) return false;
  if (!root.contains(range.commonAncestorContainer)) return false;

  const span = document.createElement("span");
  const styles: string[] = [];
  if (patch.fontSize != null) styles.push(`font-size:${patch.fontSize}px`);
  if (patch.isBold) styles.push(`font-weight:bold`);
  if (patch.isItalic) styles.push(`font-style:italic`);
  if (patch.isUnderline) styles.push(`text-decoration:underline`);
  if (patch.textColor) styles.push(`color:${patch.textColor}`);
  span.setAttribute("style", styles.join(";"));

  try {
    span.appendChild(range.extractContents());
    // Strip conflicting styles from descendants so the new outer span wins.
    stripInnerStyles(span, patch);
    range.insertNode(span);
    // Restore selection over the inserted span
    const newRange = document.createRange();
    newRange.selectNodeContents(span);
    sel.removeAllRanges();
    sel.addRange(newRange);
    return true;
  } catch {
    return false;
  }
}
