/**
 * pdf-generator.js
 * Turns a parsed .ipynb object into a formatted jsPDF document.
 * No HTML injection anywhere — everything is drawn with jsPDF primitives,
 * so malicious notebook content can't execute or render as markup.
 */

const PdfGenerator = (() => {
  const PAGE_MARGIN = 16;
  const PAGE_HEIGHT = 297; // A4 mm
  const PAGE_WIDTH = 210;
  const CONTENT_WIDTH = PAGE_WIDTH - PAGE_MARGIN * 2;
  const LINE_HEIGHT = 5.6;
  const MAX_LINES_PER_CELL = 4000; // hard safety cap against runaway notebooks

  const PALETTE = {
    text: [30, 36, 45],
    muted: [110, 122, 138],
    keyword: [176, 98, 20],
    string: [110, 80, 160],
    comment: [140, 148, 158],
    number: [70, 120, 60],
    heading: [20, 26, 34],
    accent: [180, 100, 20],
    codeBg: [244, 241, 234],
    divider: [225, 220, 208],
  };

  const PY_KEYWORDS = new Set([
    'def','return','if','elif','else','for','while','in','import','from','as','class',
    'try','except','finally','with','lambda','yield','break','continue','pass','not',
    'and','or','is','None','True','False','self','async','await','raise','global','del'
  ]);

  /* ---------------- Public API ---------------- */

  /**
   * Convert a parsed notebook JSON object into a jsPDF document.
   * @param {object} notebook parsed .ipynb JSON
   * @param {string} title display title (usually filename)
   * @param {(progress:number)=>void} onProgress called with 0..1
   * @returns {jsPDF}
   */
  function generate(notebook, title, onProgress) {
    validateNotebook(notebook);

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });

    let cursorY = drawTitlePage(doc, title, notebook.cells.length);

    const cells = notebook.cells;
    cells.forEach((cell, index) => {
      cursorY = ensureSpace(doc, cursorY, 12);
      cursorY = drawCellLabel(doc, cursorY, cell.cell_type, index + 1);

      const source = normalizeSource(cell.source);

      if (cell.cell_type === 'markdown') {
        cursorY = renderMarkdown(doc, source, cursorY);
      } else if (cell.cell_type === 'code') {
        cursorY = renderCode(doc, source, cursorY);
        cursorY = renderOutputs(doc, cell.outputs, cursorY);
      } else {
        cursorY = renderPlainText(doc, source, cursorY);
      }

      cursorY += 4;
      if (onProgress) onProgress((index + 1) / cells.length);
    });

    paginate(doc);
    return doc;
  }

  /* ---------------- Validation ---------------- */

  function validateNotebook(notebook) {
    if (!notebook || typeof notebook !== 'object') {
      throw new Error('File is not a valid notebook (empty or unreadable JSON).');
    }
    if (!Array.isArray(notebook.cells)) {
      throw new Error('File is missing a "cells" array — this may not be a real .ipynb file.');
    }
    if (notebook.cells.length === 0) {
      throw new Error('This notebook has no cells to convert.');
    }
    if (notebook.cells.length > 2000) {
      throw new Error('This notebook is too large to convert safely (over 2000 cells).');
    }
  }

  function normalizeSource(source) {
    if (Array.isArray(source)) return source.join('');
    if (typeof source === 'string') return source;
    return '';
  }

  /* ---------------- Layout helpers ---------------- */

  function ensureSpace(doc, cursorY, needed) {
    if (cursorY + needed > PAGE_HEIGHT - PAGE_MARGIN) {
      doc.addPage();
      return PAGE_MARGIN;
    }
    return cursorY;
  }

  function drawTitlePage(doc, title, cellCount) {
    doc.setFillColor(...PALETTE.heading);
    doc.rect(0, 0, PAGE_WIDTH, 4, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(...PALETTE.heading);
    const safeTitle = doc.splitTextToSize(title || 'Untitled Notebook', CONTENT_WIDTH);
    doc.text(safeTitle, PAGE_MARGIN, 40);

    const dateY = 40 + safeTitle.length * 8 + 8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10.5);
    doc.setTextColor(...PALETTE.muted);
    const generatedOn = new Date().toLocaleString();
    doc.text(`Generated ${generatedOn}`, PAGE_MARGIN, dateY);
    doc.text(`${cellCount} cell${cellCount === 1 ? '' : 's'}`, PAGE_MARGIN, dateY + 6);

    doc.setDrawColor(...PALETTE.divider);
    doc.line(PAGE_MARGIN, dateY + 14, PAGE_WIDTH - PAGE_MARGIN, dateY + 14);

    doc.addPage();
    return PAGE_MARGIN;
  }

  function drawCellLabel(doc, cursorY, cellType, cellNumber) {
    const label = cellType === 'code' ? `In [${cellNumber}]` : cellType === 'markdown' ? `Markdown ${cellNumber}` : `Cell ${cellNumber}`;
    doc.setFont('courier', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...PALETTE.accent);
    doc.text(label.toUpperCase(), PAGE_MARGIN, cursorY);
    doc.setDrawColor(...PALETTE.divider);
    doc.line(PAGE_MARGIN, cursorY + 1.6, PAGE_WIDTH - PAGE_MARGIN, cursorY + 1.6);
    return cursorY + 6;
  }

  /* ---------------- Code rendering with light syntax highlighting ---------------- */

  function renderCode(doc, code, cursorY) {
    const lines = code.split('\n').slice(0, MAX_LINES_PER_CELL);
    doc.setFont('courier', 'normal');
    doc.setFontSize(9);

    lines.forEach((rawLine) => {
      cursorY = ensureSpace(doc, cursorY, LINE_HEIGHT);
      const tokens = tokenizeCodeLine(rawLine);
      let x = PAGE_MARGIN + 1;
      const maxX = PAGE_WIDTH - PAGE_MARGIN;

      // background band for the code line
      doc.setFillColor(...PALETTE.codeBg);
      doc.rect(PAGE_MARGIN, cursorY - 3.6, CONTENT_WIDTH, LINE_HEIGHT, 'F');

      tokens.forEach(({ text, color }) => {
        if (!text) return;
        doc.setTextColor(...color);
        const width = doc.getTextWidth(text);
        if (x + width > maxX) {
          // simple wrap: move to next visual line within same cell
          cursorY = ensureSpace(doc, cursorY + LINE_HEIGHT, LINE_HEIGHT);
          doc.setFillColor(...PALETTE.codeBg);
          doc.rect(PAGE_MARGIN, cursorY - 3.6, CONTENT_WIDTH, LINE_HEIGHT, 'F');
          x = PAGE_MARGIN + 1;
        }
        doc.text(text, x, cursorY);
        x += width;
      });
      cursorY += LINE_HEIGHT;
    });
    return cursorY;
  }

  function tokenizeCodeLine(line) {
    if (line.trim().startsWith('#')) {
      return [{ text: line, color: PALETTE.comment }];
    }
    const tokens = [];
    const regex = /("""[\s\S]*?"""|'[^']*'|"[^"]*"|#.*$|\b\d+\.?\d*\b|\b[A-Za-z_][A-Za-z0-9_]*\b|\s+|.)/g;
    let match;
    while ((match = regex.exec(line)) !== null) {
      const token = match[0];
      let color = PALETTE.text;
      if (token.startsWith('#')) color = PALETTE.comment;
      else if (/^['"]/.test(token)) color = PALETTE.string;
      else if (/^\d/.test(token)) color = PALETTE.number;
      else if (PY_KEYWORDS.has(token)) color = PALETTE.keyword;
      tokens.push({ text: token, color });
    }
    return tokens;
  }

  /* ---------------- Cell outputs (text-only, safely truncated) ---------------- */

  function renderOutputs(doc, outputs, cursorY) {
    if (!Array.isArray(outputs) || outputs.length === 0) return cursorY;

    cursorY = ensureSpace(doc, cursorY, LINE_HEIGHT + 2);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(...PALETTE.muted);
    doc.text('Output:', PAGE_MARGIN, cursorY);
    cursorY += 4.5;

    doc.setFont('courier', 'normal');
    doc.setFontSize(8.3);
    doc.setTextColor(...PALETTE.muted);

    outputs.slice(0, 20).forEach((output) => {
      const text = extractOutputText(output);
      if (!text) return;
      const lines = doc.splitTextToSize(text, CONTENT_WIDTH - 2).slice(0, 200);
      lines.forEach((line) => {
        cursorY = ensureSpace(doc, cursorY, LINE_HEIGHT);
        doc.text(line, PAGE_MARGIN + 1, cursorY);
        cursorY += LINE_HEIGHT - 1;
      });
    });
    return cursorY;
  }

  function extractOutputText(output) {
    if (!output || typeof output !== 'object') return '';
    if (output.text) return normalizeSource(output.text);
    if (output.data && output.data['text/plain']) return normalizeSource(output.data['text/plain']);
    if (output.ename && output.evalue) return `${output.ename}: ${output.evalue}`;
    return '';
  }

  /* ---------------- Minimal markdown renderer (no HTML, drawn text only) ---------------- */

  function renderMarkdown(doc, markdown, cursorY) {
    const lines = markdown.split('\n');

    lines.forEach((line) => {
      const trimmed = line.trim();
      if (trimmed === '') {
        cursorY += LINE_HEIGHT * 0.5;
        return;
      }

      const headingMatch = /^(#{1,4})\s+(.*)/.exec(trimmed);
      const listMatch = /^([-*]|\d+\.)\s+(.*)/.exec(trimmed);

      if (headingMatch) {
        const level = headingMatch[1].length;
        const size = [16, 14, 12, 11][level - 1] || 10;
        cursorY = ensureSpace(doc, cursorY, size / 2 + 4);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(size);
        doc.setTextColor(...PALETTE.heading);
        const wrapped = doc.splitTextToSize(headingMatch[2], CONTENT_WIDTH);
        wrapped.forEach((w) => {
          cursorY = ensureSpace(doc, cursorY, LINE_HEIGHT + 1);
          doc.text(w, PAGE_MARGIN, cursorY);
          cursorY += LINE_HEIGHT + 1;
        });
        return;
      }

      if (listMatch) {
        cursorY = ensureSpace(doc, cursorY, LINE_HEIGHT);
        const bullet = /\d+\./.test(listMatch[1]) ? listMatch[1] : '\u2022';
        cursorY = renderRichLine(doc, listMatch[2], cursorY, PAGE_MARGIN + 6, `${bullet} `);
        return;
      }

      cursorY = renderRichLine(doc, trimmed, cursorY, PAGE_MARGIN, '');
    });

    return cursorY;
  }

  /**
   * Renders one paragraph line supporting **bold**, *italic*, and `inline code`,
   * wrapping manually since spans have mixed fonts/widths.
   */
  function renderRichLine(doc, text, cursorY, xStart, prefix) {
    const spans = parseInlineMarkdown(text);
    doc.setFontSize(10.5);
    let x = xStart;
    const maxX = PAGE_WIDTH - PAGE_MARGIN;

    cursorY = ensureSpace(doc, cursorY, LINE_HEIGHT);
    if (prefix) {
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...PALETTE.text);
      doc.text(prefix, x, cursorY);
      x += doc.getTextWidth(prefix);
    }

    spans.forEach(({ text: word, bold, italic, code }) => {
      const parts = word.split(/(\s+)/); // keep spaces as their own tokens for wrapping
      parts.forEach((part) => {
        if (part === '') return;
        const style = code ? 'normal' : bold && italic ? 'bolditalic' : bold ? 'bold' : italic ? 'italic' : 'normal';
        doc.setFont(code ? 'courier' : 'helvetica', style);
        doc.setTextColor(...(code ? PALETTE.accent : PALETTE.text));
        const width = doc.getTextWidth(part);
        if (x + width > maxX && part.trim() !== '') {
          cursorY = ensureSpace(doc, cursorY + LINE_HEIGHT, LINE_HEIGHT);
          x = xStart;
        }
        if (part.trim() !== '') doc.text(part, x, cursorY);
        x += width;
      });
    });

    return cursorY + LINE_HEIGHT;
  }

  function parseInlineMarkdown(text) {
    const spans = [];
    const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
    let lastIndex = 0;
    let match;
    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        spans.push({ text: text.slice(lastIndex, match.index) });
      }
      const token = match[0];
      if (token.startsWith('**')) spans.push({ text: token.slice(2, -2), bold: true });
      else if (token.startsWith('`')) spans.push({ text: token.slice(1, -1), code: true });
      else spans.push({ text: token.slice(1, -1), italic: true });
      lastIndex = regex.lastIndex;
    }
    if (lastIndex < text.length) spans.push({ text: text.slice(lastIndex) });
    return spans;
  }

  function renderPlainText(doc, text, cursorY) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10.5);
    doc.setTextColor(...PALETTE.text);
    const lines = doc.splitTextToSize(text, CONTENT_WIDTH);
    lines.forEach((line) => {
      cursorY = ensureSpace(doc, cursorY, LINE_HEIGHT);
      doc.text(line, PAGE_MARGIN, cursorY);
      cursorY += LINE_HEIGHT;
    });
    return cursorY;
  }

  /* ---------------- Page numbers ---------------- */

  function paginate(doc) {
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(...PALETTE.muted);
      doc.text(`${i} / ${pageCount}`, PAGE_WIDTH - PAGE_MARGIN, PAGE_HEIGHT - 9, { align: 'right' });
      doc.text('NoteToPDF', PAGE_MARGIN, PAGE_HEIGHT - 9);
    }
  }

  return { generate };
})();
