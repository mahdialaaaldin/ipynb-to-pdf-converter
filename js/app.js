/**
 * app.js
 * Wires UI events to file state and the PDF generator. Owns the queue state.
 */
(function () {
  const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB safety cap per notebook
  let queue = []; // [{ id, file, status: 'pending'|'processing'|'done'|'error', progress }]
  let idCounter = 0;

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    UI.cacheElements();
    UI.applyTheme(ThemeStorage.getPreferredTheme());

    document.getElementById('themeToggle').addEventListener('click', toggleTheme);
    document.getElementById('year').textContent = new Date().getFullYear();

    UI.bindDropzone(handleFilesAdded);
    document.getElementById('clearAllBtn').addEventListener('click', clearAll);
    document.getElementById('convertBtn').addEventListener('click', convertAll);

    render();
  }

  function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    UI.applyTheme(next);
    ThemeStorage.set(next);
  }

  /* ---------------- Queue management ---------------- */

  function handleFilesAdded(files) {
    const accepted = [];
    const rejected = [];

    files.forEach((file) => {
      const validationError = validateFile(file);
      if (validationError) {
        rejected.push({ file, reason: validationError });
      } else {
        accepted.push(file);
      }
    });

    accepted.forEach((file) => {
      queue.push({ id: `f${++idCounter}`, file, status: 'pending', progress: 0 });
    });

    render();

    if (rejected.length > 0) {
      const names = rejected.map((r) => r.file.name).join(', ');
      UI.setStatus(`Skipped ${rejected.length} file${rejected.length > 1 ? 's' : ''}: ${names}`, 'error');
    } else if (accepted.length > 0) {
      UI.clearStatus();
    }
  }

  function validateFile(file) {
    if (!file.name.toLowerCase().endsWith('.ipynb')) {
      return 'not a .ipynb file';
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'file too large (max 15MB)';
    }
    if (file.size === 0) {
      return 'file is empty';
    }
    return null;
  }

  function removeFile(id) {
    queue = queue.filter((item) => item.id !== id);
    render();
  }

  function clearAll() {
    queue = [];
    UI.clearStatus();
    render();
  }

  function render() {
    UI.renderFileList(queue, { onRemove: removeFile });
  }

  /* ---------------- Conversion ---------------- */

  async function convertAll() {
    if (queue.length === 0) return;

    document.getElementById('convertBtn').disabled = true;
    document.getElementById('clearAllBtn').disabled = true;
    UI.setStatus(`Converting ${queue.length} file${queue.length > 1 ? 's' : ''}…`, 'processing');

    let successCount = 0;
    let errorCount = 0;

    for (const item of queue) {
      try {
        item.status = 'processing';
        await convertOne(item);
        item.status = 'done';
        item.progress = 100;
        UI.updateFileProgress(item.id, 100, 'done');
        successCount++;
      } catch (err) {
        item.status = 'error';
        UI.updateFileProgress(item.id, 100, 'error');
        console.error(`Failed to convert ${item.file.name}:`, err);
        errorCount++;
      }
    }

    document.getElementById('convertBtn').disabled = false;
    document.getElementById('clearAllBtn').disabled = false;

    if (errorCount === 0) {
      UI.setStatus(`Converted ${successCount} file${successCount > 1 ? 's' : ''}. Check your downloads.`, 'success');
    } else if (successCount === 0) {
      UI.setStatus(`Couldn't convert ${errorCount} file${errorCount > 1 ? 's' : ''}. See file status above.`, 'error');
    } else {
      UI.setStatus(`Converted ${successCount}, failed ${errorCount}. See file status above.`, 'error');
    }
  }

  async function convertOne(item) {
    const text = await readFileAsText(item.file);

    let notebook;
    try {
      notebook = JSON.parse(text);
    } catch {
      throw new Error('Malformed JSON — this file may be corrupted.');
    }

    const title = item.file.name.replace(/\.ipynb$/i, '');
    const doc = PdfGenerator.generate(notebook, title, (progress) => {
      UI.updateFileProgress(item.id, Math.round(progress * 100), 'processing');
    });

    doc.save(`${title}.pdf`);
  }

  function readFileAsText(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = () => reject(new Error('Could not read file from disk.'));
      reader.readAsText(file);
    });
  }
})();
