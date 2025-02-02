# Jupyter Notebook to PDF Converter

A client-side HTML tool that converts Jupyter Notebook (.ipynb) files to text-based PDFs while preserving code formatting and cell structure.

## Features
- 🚀 100% client-side (no data leaves your computer)
- 📖 Text-based PDF output (searchable/selectable text)
- 💻 Preserves code/markdown formatting
- 📁 Multiple file conversion support
- 🎯 Automatic page breaking
- 🔒 Works offline after initial load

## Usage
1. Open the converter: [Live Demo](https://mahdialaaaldin.github.io/ipynb-to-pdf-converter/)
2. Click "Choose Files" and select your .ipynb files
3. PDFs will automatically download when conversion completes

## Installation
```bash
git clone https://github.com/mahdialaaaldin/ipynb-to-pdf-converter.git
```
- Simply open `index.html` in any modern browser

## Deploy to GitHub Pages
1. Go to your repository Settings
2. Under "Pages", select branch `main` and folder `/(root)`
3. Save - Your converter will be live at:  
`https://mahdialaaaldin.github.io/ipynb-to-pdf-converter/`

## How It Works
The converter uses:
- [jsPDF](https://parall.ax/products/jspdf) for PDF generation
- FileReader API for local file processing
- JSON parsing of .ipynb file structure

## Limitations
- Very large notebooks (>10MB) might cause browser memory issues
- Complex markdown formatting is rendered as plain text
- No image support in output PDFs

## Contributing
Contributions welcome! Please open an issue first to discuss proposed changes.

## License
[MIT](LICENSE)
