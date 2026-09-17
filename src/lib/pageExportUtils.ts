/**
 * Utilities for extracting, downloading, and printing specific pages or page ranges.
 */

import { Editor } from "@tiptap/react";

/**
 * Split document HTML into distinct page blocks by <hr> dividers
 */
export function getDocumentPages(editor: Editor): string[] {
  if (!editor) return [];
  const html = editor.getHTML();
  // Split on <hr> tags (which act as page breaks)
  const pages = html.split(/<hr[^>]*>/gi);
  return pages.length > 0 ? pages : [html];
}

/**
 * Parse a user input string like "1, 3, 5-7" into a list of 1-indexed page numbers
 */
export function parsePageRange(rangeStr: string, totalPages: number): number[] {
  if (!rangeStr.trim() || rangeStr.toLowerCase() === "all") {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const result = new Set<number>();
  const parts = rangeStr.split(/[,;\s]+/);

  for (const part of parts) {
    if (part.includes("-")) {
      const [startStr, endStr] = part.split("-");
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);
      if (!isNaN(start) && !isNaN(end)) {
        const min = Math.max(1, Math.min(start, end));
        const max = Math.min(totalPages, Math.max(start, end));
        for (let i = min; i <= max; i++) {
          result.add(i);
        }
      }
    } else {
      const num = parseInt(part, 10);
      if (!isNaN(num) && num >= 1 && num <= totalPages) {
        result.add(num);
      }
    }
  }

  return Array.from(result).sort((a, b) => a - b);
}

/**
 * Download specific pages as Markdown
 */
export function exportPagesAsMarkdown(
  editor: Editor,
  pageNumbers: number[],
  documentTitle: string
) {
  const pages = getDocumentPages(editor);
  const selectedSections = pageNumbers
    .map((num) => {
      const pageHtml = pages[num - 1] || "";
      // Convert basic HTML to plain text/markdown
      const temp = document.createElement("div");
      temp.innerHTML = pageHtml;
      return `<!-- PAGE ${num} -->\n` + (temp.innerText || temp.textContent || "").trim();
    })
    .join("\n\n---\n\n");

  const blob = new Blob([selectedSections], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const pageSuffix = pageNumbers.length === 1 ? `_page_${pageNumbers[0]}` : `_pages_${pageNumbers.join("-")}`;
  a.download = `${documentTitle || "document"}${pageSuffix}.md`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Download specific pages as HTML
 */
export function exportPagesAsHTML(
  editor: Editor,
  pageNumbers: number[],
  documentTitle: string
) {
  const pages = getDocumentPages(editor);
  const selectedHtml = pageNumbers
    .map((num) => {
      const pageHtml = pages[num - 1] || "";
      return `<div class="docfix-page" data-page="${num}">\n${pageHtml}\n</div>`;
    })
    .join('\n<div style="page-break-after: always; margin: 2rem 0; border-top: 1px dashed #cbd5e1;"></div>\n');

  const fullHTML = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${documentTitle} - Pages ${pageNumbers.join(", ")}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; max-width: 816px; margin: 2rem auto; padding: 2rem; line-height: 1.6; color: #1e293b; }
    h1 { font-size: 2em; margin-bottom: 0.5em; }
    h2 { font-size: 1.5em; margin-top: 1em; }
    blockquote { border-left: 3px solid #6366f1; background: #f8fafc; padding: 0.5rem 1rem; border-radius: 0 8px 8px 0; font-style: italic; }
    table { width: 100%; border-collapse: collapse; margin: 1rem 0; }
    th, td { border: 1px solid #cbd5e1; padding: 8px 12px; }
    th { background: #f1f5f9; font-weight: 600; }
    @media print { .docfix-page { page-break-after: always; } }
  </style>
</head>
<body>
  ${selectedHtml}
</body>
</html>`;

  const blob = new Blob([fullHTML], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const pageSuffix = pageNumbers.length === 1 ? `_page_${pageNumbers[0]}` : `_pages_${pageNumbers.join("-")}`;
  a.download = `${documentTitle || "document"}${pageSuffix}.html`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Print / Save as PDF for specific pages
 */
export function printSpecificPages(
  editor: Editor,
  pageNumbers: number[],
  documentTitle: string
) {
  const pages = getDocumentPages(editor);
  const selectedHtml = pageNumbers
    .map((num) => {
      const pageHtml = pages[num - 1] || "";
      return `<div class="print-sheet">${pageHtml}</div>`;
    })
    .join("");

  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    window.print();
    return;
  }

  printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${documentTitle} - Pages ${pageNumbers.join(", ")}</title>
  <style>
    @page { size: A4; margin: 20mm; }
    body { font-family: system-ui, -apple-system, sans-serif; color: #0f172a; margin: 0; padding: 0; }
    .print-sheet { page-break-after: always; min-height: 90vh; }
    .print-sheet:last-child { page-break-after: auto; }
    h1 { font-size: 24pt; font-weight: 800; margin-bottom: 12pt; }
    h2 { font-size: 18pt; font-weight: 700; margin-top: 16pt; }
    h3 { font-size: 14pt; font-weight: 600; }
    p { line-height: 1.7; font-size: 11pt; margin: 8pt 0; }
    blockquote { border-left: 3pt solid #6366f1; background: #f8fafc; padding: 6pt 12pt; font-style: italic; }
    table { width: 100%; border-collapse: collapse; margin: 12pt 0; }
    th, td { border: 1px solid #cbd5e1; padding: 6pt 10pt; font-size: 10pt; }
    th { background: #f1f5f9; font-weight: 700; text-align: left; }
    img { max-width: 100%; border-radius: 6pt; }
  </style>
</head>
<body>
  ${selectedHtml}
  <script>
    window.onload = function() {
      window.print();
      setTimeout(function() { window.close(); }, 500);
    };
  </script>
</body>
</html>`);
  printWindow.document.close();
}
