# NoteToPDF

A free, privacy-first tool that converts Jupyter Notebooks (`.ipynb`) into polished, paginated PDFs — entirely inside your browser. No upload, no account, no backend.

**Live demo:** [mahdialaaaldin.github.io/ipynb-to-pdf-converter](https://mahdialaaaldin.github.io/ipynb-to-pdf-converter/)

![theme](https://img.shields.io/badge/theme-dark%20%2F%20light-1c2430)
![license](https://img.shields.io/badge/license-MIT-35D0BA)

<img width="1459" height="843" alt="image" src="https://github.com/user-attachments/assets/5e603f25-2377-461a-b8ce-6cb16a7d3ade" />


## Why it exists

Sharing a notebook usually means sending a `.ipynb` file to someone without Jupyter installed, or fighting `nbconvert` and LaTeX toolchains just to get a readable PDF. NoteToPDF skips all of that: drop files in, get formatted PDFs out, nothing leaves your machine.

## Features

- **Drag-and-drop batch upload** — convert one file or a hundred in a single pass
- **Full file management** — reorder by removing, clear the whole queue, per-file progress
- **Syntax-highlighted code cells** — keywords, strings, numbers, and comments are colour-coded
- **Real markdown rendering** — headings, bold/italic, inline code, and lists render properly instead of showing raw markdown syntax
- **Document-grade PDF output** — title page, generation timestamp, consistent margins, numbered pages, cell labels
- **Dark and light themes** — remembered across visits via `localStorage`
- **Fully offline-capable** — works with no network connection once loaded
- **Zero data collection** — no analytics, no tracking, no server component at all

## Project structure

```
/
├── index.html              Landing page + converter UI (single entry point)
├── css/
│   └── style.css           Design tokens, layout, dark/light theme, responsive rules
├── js/
│   ├── app.js              State management: file queue, validation, conversion flow
│   ├── pdf-generator.js    Notebook parsing, markdown rendering, syntax highlighting, PDF layout
│   ├── ui.js                DOM rendering: file list, dropzone, status messages, theme toggle
│   └── storage.js           localStorage wrapper for theme preference
└── assets/
    ├── favicon.svg
    └── manifest.json        Basic PWA manifest
```

Each JS module has one job:

- `storage.js` — the only file that touches `localStorage`
- `pdf-generator.js` — the only file that touches `jsPDF`; pure function in, `jsPDF` document out
- `ui.js` — the only file that touches the DOM directly
- `app.js` — orchestrates the above; no direct DOM or PDF calls

## Running locally

No build step, no dependencies to install.

```bash
git clone https://github.com/yourusername/notetopdf.git
cd notetopdf
python3 -m http.server 8000
```

Open `http://localhost:8000`. Or just open `index.html` directly in a modern browser — everything works from the filesystem too.

## Deployment

Static files only — deploy anywhere that serves HTML:

- **GitHub Pages** — push to a repo, enable Pages on the `main` branch
- **Netlify / Vercel** — point either at the repo root, no build command needed

## How privacy is actually preserved

1. Files are read with the browser's native `FileReader` API, in memory only.
2. Notebook JSON is parsed with `JSON.parse` — never `eval`, never injected as HTML.
3. PDF content is drawn with `jsPDF` text/shape primitives, not by rendering notebook content as HTML — so nothing in a notebook can execute as markup.
4. The only external network calls are the initial page load and web font/CDN script fetch. Once loaded, conversion works fully offline.
5. `localStorage` is used for exactly one thing: remembering your theme choice.

## Known limitations

- Embedded images and rich plot output (matplotlib figures, etc.) are not rendered in the PDF — only text-based outputs
- Very large notebooks (over 15MB or 2000+ cells) are rejected to avoid freezing the tab
- Markdown support covers headings, bold/italic, inline code, and lists — not full CommonMark (no nested blockquotes, footnotes, or embedded HTML)
- Tables in markdown cells render as plain wrapped text, not as gridlines

## Roadmap (possible paid tier)

The free tool has no artificial limits. A future Pro version could reasonably add:

- Custom branded PDF templates and cover pages
- Rendered plot/image output from notebook cells
- Merging multiple notebooks into a single PDF
- Cloud sync and team sharing
- A CLI for CI/CD pipeline integration

## License

MIT — see `LICENSE`.
