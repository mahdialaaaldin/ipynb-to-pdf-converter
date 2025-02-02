
# Jupyter Notebook to PDF Converter

A modern client-side tool for converting Jupyter Notebooks (.ipynb) to formatted PDFs with enhanced UI/UX and file management.

![image](https://github.com/user-attachments/assets/49b9ca2c-787d-47c2-b312-adb89077a503)

## Features ✨
- 🖥️ **Modern UI** - Clean, professional interface with progress tracking
- 📁 **Batch Processing** - Convert multiple notebooks at once
- 🔄 **File Management** - Review, delete, and track files before conversion
- 📊 **Real-time Progress** - Visual progress bars for each file
- 🎨 **Styled Output** - Preserves code/markdown structure in PDF
- 🛡️ **100% Client-side** - No data leaves your computer
- 📤 **Auto-download** - PDFs save automatically when ready
- 🚦 **Status Indicators** - Color-coded feedback for conversions

## Usage Guide 🚀
1. **Upload Files**  
   Click "Choose Files" or drag/drop .ipynb files

2. **Manage Files**  
   Review selected files, remove unwanted ones using trash icon 🗑️

3. **Convert**  
   Click "Convert All to PDF" when ready

4. **Download**  
   PDFs will automatically download with original filenames

## Technical Details 🔧
- **PDF Generation**: [jsPDF](https://parall.ax/products/jspdf) library
- **File Processing**: Browser FileReader API
- **JSON Parsing**: Native JSON handling of .ipynb structure
- **UI Framework**: Pure CSS with modern flexbox layouts

## Installation 💻
```bash
git clone https://github.com/mahdialaaaldin/ipynb-to-pdf-converter.git
cd ipynb-to-pdf-converter
```
- Open `index.html` in any modern browser (Chrome/Firefox/Edge)

## Limitations ⚠️
- 🖼️ No image support in output PDFs
- 📈 Limited to notebooks under 10MB for optimal performance
- 🎨 Complex markdown renders as plain text
- 📑 No table formatting preservation

## Development 🛠️
```bash
# Clone repository
git clone https://github.com/yourusername/ipynb-to-pdf-converter.git

# Serve locally (optional)
python3 -m http.server 8000
```
Open `http://localhost:8000` to test

## Contributing 🤝
1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## License 📄
MIT License - See [LICENSE](LICENSE) for full text

---

**Note**: Python icon by [Freepik](https://www.flaticon.com/authors/freepik) from [Flaticon](https://www.flaticon.com/)
```
