import { describe, it, expect, beforeEach } from "vitest";
import {
  normalizeRuns,
  runsToPlainText,
  runsToHtml,
  domToRuns,
  applyStyleToSelection,
} from "./richText";
import type { CellRun } from "./types";

// ─── normalizeRuns ─────────────────────────────────────────

describe("normalizeRuns", () => {
  it("merges adjacent runs with identical styling", () => {
    const runs: CellRun[] = [
      { text: "a", fontSize: 14 },
      { text: "b", fontSize: 14 },
      { text: "c", fontSize: 14 },
    ];
    expect(normalizeRuns(runs)).toEqual([{ text: "abc", fontSize: 14 }]);
  });

  it("keeps runs with different fontSize separate", () => {
    const runs: CellRun[] = [
      { text: "ด", fontSize: 16 },
      { text: "4", fontSize: 4 },
    ];
    expect(normalizeRuns(runs)).toEqual([
      { text: "ด", fontSize: 16 },
      { text: "4", fontSize: 4 },
    ]);
  });

  it("keeps runs with different bold/italic/underline separate", () => {
    const runs: CellRun[] = [
      { text: "a", isBold: true },
      { text: "b", isBold: false },
      { text: "c", isItalic: true },
    ];
    expect(normalizeRuns(runs)).toHaveLength(3);
  });

  it("drops empty runs", () => {
    const runs: CellRun[] = [{ text: "" }, { text: "hi" }, { text: "" }];
    expect(normalizeRuns(runs)).toEqual([{ text: "hi" }]);
  });

  it("handles empty input", () => {
    expect(normalizeRuns([])).toEqual([]);
  });
});

// ─── runsToPlainText ───────────────────────────────────────

describe("runsToPlainText", () => {
  it("joins all run texts", () => {
    const runs: CellRun[] = [
      { text: "ด", fontSize: 16 },
      { text: "4", fontSize: 4 },
      { text: ".", fontSize: 16 },
    ];
    expect(runsToPlainText(runs)).toBe("ด4.");
  });

  it("returns empty string for null/undefined", () => {
    expect(runsToPlainText(null)).toBe("");
    expect(runsToPlainText(undefined)).toBe("");
    expect(runsToPlainText([])).toBe("");
  });
});

// ─── runsToHtml ────────────────────────────────────────────

describe("runsToHtml", () => {
  it("emits plain text (no span) when run has no styling", () => {
    expect(runsToHtml([{ text: "hello" }])).toBe("hello");
  });

  it("wraps fontSize in span with px", () => {
    expect(runsToHtml([{ text: "x", fontSize: 16 }])).toBe(
      '<span style="font-size:16px">x</span>'
    );
  });

  it("emits multiple styles combined", () => {
    const html = runsToHtml([
      { text: "x", fontSize: 12, isBold: true, isItalic: true, isUnderline: true, textColor: "#ff0000" },
    ]);
    expect(html).toContain("font-size:12px");
    expect(html).toContain("font-weight:bold");
    expect(html).toContain("font-style:italic");
    expect(html).toContain("text-decoration:underline");
    expect(html).toContain("color:#ff0000");
  });

  it("escapes HTML in text", () => {
    expect(runsToHtml([{ text: "<script>&\"'" }])).toBe("&lt;script&gt;&amp;\"'");
  });

  it("concatenates multiple runs", () => {
    const html = runsToHtml([
      { text: "ด", fontSize: 16 },
      { text: "4", fontSize: 4 },
    ]);
    expect(html).toBe(
      '<span style="font-size:16px">ด</span><span style="font-size:4px">4</span>'
    );
  });

  it("returns empty for null/empty", () => {
    expect(runsToHtml(null)).toBe("");
    expect(runsToHtml([])).toBe("");
  });
});

// ─── domToRuns ─────────────────────────────────────────────

describe("domToRuns", () => {
  function make(html: string): HTMLElement {
    const div = document.createElement("div");
    div.innerHTML = html;
    return div;
  }

  it("returns single run for plain text", () => {
    const runs = domToRuns(make("hello"));
    expect(runs).toEqual([{ text: "hello" }]);
  });

  it("parses fontSize from span style", () => {
    const runs = domToRuns(make('<span style="font-size:16px">ด</span><span style="font-size:4px">4</span>'));
    expect(runs).toEqual([
      { text: "ด", fontSize: 16 },
      { text: "4", fontSize: 4 },
    ]);
  });

  it("parses bold/italic/underline from styles and legacy tags", () => {
    const runs = domToRuns(
      make(
        '<b>a</b><i>b</i><u>c</u><span style="font-weight:bold">d</span>'
      )
    );
    expect(runs[0]).toMatchObject({ text: "a", isBold: true });
    expect(runs[1]).toMatchObject({ text: "b", isItalic: true });
    expect(runs[2]).toMatchObject({ text: "c", isUnderline: true });
    expect(runs[3]).toMatchObject({ text: "d", isBold: true });
  });

  it("takes nearest ancestor's fontSize when nested", () => {
    // Inner span wins visually — reflect that in the runs.
    const runs = domToRuns(make('<span style="font-size:20px"><span style="font-size:8px">x</span></span>'));
    expect(runs).toEqual([{ text: "x", fontSize: 8 }]);
  });

  it("merges adjacent identical spans automatically via normalize", () => {
    const runs = domToRuns(
      make('<span style="font-size:14px">a</span><span style="font-size:14px">b</span>')
    );
    expect(runs).toEqual([{ text: "ab", fontSize: 14 }]);
  });

  it("round-trip: runs → html → dom → runs (mixed sizes)", () => {
    const original: CellRun[] = [
      { text: "ด", fontSize: 16 },
      { text: "4", fontSize: 4 },
      { text: ".", fontSize: 16 },
    ];
    const html = runsToHtml(original);
    const parsed = domToRuns(make(html));
    expect(parsed).toEqual(original);
  });
});

// ─── applyStyleToSelection ─────────────────────────────────

describe("applyStyleToSelection", () => {
  let root: HTMLElement;

  beforeEach(() => {
    document.body.innerHTML = "";
    root = document.createElement("div");
    root.contentEditable = "true";
    document.body.appendChild(root);
  });

  function selectAllInRoot() {
    const range = document.createRange();
    range.selectNodeContents(root);
    const sel = window.getSelection()!;
    sel.removeAllRanges();
    sel.addRange(range);
  }

  function selectSubstring(node: Text, start: number, end: number) {
    const range = document.createRange();
    range.setStart(node, start);
    range.setEnd(node, end);
    const sel = window.getSelection()!;
    sel.removeAllRanges();
    sel.addRange(range);
  }

  it("returns false when selection is collapsed", () => {
    root.textContent = "abc";
    const sel = window.getSelection()!;
    const range = document.createRange();
    range.setStart(root.firstChild!, 1);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
    expect(applyStyleToSelection(root, { fontSize: 12 })).toBe(false);
  });

  it("wraps selected text with span carrying the style", () => {
    root.textContent = "ด4";
    selectSubstring(root.firstChild as Text, 1, 2);
    expect(applyStyleToSelection(root, { fontSize: 4 })).toBe(true);
    const runs = domToRuns(root);
    expect(runs).toEqual([{ text: "ด" }, { text: "4", fontSize: 4 }]);
  });

  it("strips inner conflicting fontSize so new outer span wins", () => {
    // Existing inner span with size 1 — applying 16 to full range should end up 16, not 1.
    root.innerHTML = '<span style="font-size:1px">abc</span>';
    selectAllInRoot();
    applyStyleToSelection(root, { fontSize: 16 });
    const runs = domToRuns(root);
    expect(runs).toEqual([{ text: "abc", fontSize: 16 }]);
  });

  it("does not strip unrelated styles from inner spans", () => {
    root.innerHTML = '<span style="color:#ff0000">abc</span>';
    selectAllInRoot();
    applyStyleToSelection(root, { fontSize: 20 });
    const runs = domToRuns(root);
    // Color preserved on inner run, fontSize applied
    expect(runs[0].fontSize).toBe(20);
    expect(runs[0].textColor).toBeTruthy();
  });

  it("does nothing when selection is outside root", () => {
    root.textContent = "abc";
    const outside = document.createElement("div");
    outside.textContent = "xyz";
    document.body.appendChild(outside);
    const range = document.createRange();
    range.selectNodeContents(outside);
    const sel = window.getSelection()!;
    sel.removeAllRanges();
    sel.addRange(range);
    expect(applyStyleToSelection(root, { fontSize: 12 })).toBe(false);
  });
});
