/**
 * ui.js
 * DOM rendering and small interaction helpers. No conversion logic lives here —
 * app.js owns state and calls into these functions to reflect it.
 */
const UI = (() => {
  const els = {};

  function cacheElements() {
    els.dropzone = document.getElementById('dropzone');
    els.fileInput = document.getElementById('ipynbFiles');
    els.fileList = document.getElementById('fileList');
    els.queueSection = document.getElementById('queueSection');
    els.queueCount = document.getElementById('queueCount');
    els.emptyState = document.getElementById('emptyState');
    els.convertBtn = document.getElementById('convertBtn');
    els.clearAllBtn = document.getElementById('clearAllBtn');
    els.status = document.getElementById('status');
    els.themeToggle = document.getElementById('themeToggle');
  }

  function formatBytes(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  /** Render the current file queue. `files` is an array of {id, file, status, progress} */
  function renderFileList(files, handlers) {
    els.fileList.innerHTML = '';

    files.forEach(({ id, file, progress = 0, status = 'pending' }) => {
      const li = document.createElement('li');
      li.dataset.id = id;
      li.innerHTML = `
        <div class="file-item">
          <div class="file-meta">
            <span class="file-name" title="${escapeHtml(file.name)}">${escapeHtml(file.name)}</span>
            <span class="file-size">${formatBytes(file.size)}</span>
          </div>
          <div class="file-controls">
            <div class="progress-bar">
              <div class="progress-fill ${status === 'error' ? 'is-error' : ''}" style="width:${progress}%"></div>
            </div>
            <button type="button" class="delete-btn" aria-label="Remove ${escapeHtml(file.name)}">
              <svg class="delete-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6"/>
              </svg>
            </button>
          </div>
        </div>`;
      li.querySelector('.delete-btn').addEventListener('click', () => handlers.onRemove(id));
      els.fileList.appendChild(li);
    });

    els.queueCount.textContent = files.length;
    const hasFiles = files.length > 0;
    els.queueSection.hidden = !hasFiles;
    els.emptyState.style.display = hasFiles ? 'none' : 'block';
    els.convertBtn.disabled = !hasFiles;
  }

  function updateFileProgress(id, progress, status) {
    const li = els.fileList.querySelector(`li[data-id="${id}"]`);
    if (!li) return;
    const fill = li.querySelector('.progress-fill');
    fill.style.width = `${progress}%`;
    fill.classList.toggle('is-error', status === 'error');
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function setStatus(message, type) {
    els.status.className = `status is-visible status-${type}`;
    if (type === 'processing') {
      els.status.innerHTML = `<span class="spinner" aria-hidden="true"></span><span>${escapeHtml(message)}</span>`;
    } else {
      els.status.textContent = message;
    }
  }

  function clearStatus() {
    els.status.className = 'status';
    els.status.textContent = '';
  }

  /* ---------------- Theme ---------------- */

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    els.themeToggle.setAttribute('aria-pressed', theme === 'light' ? 'true' : 'false');
  }

  /* ---------------- Dropzone wiring ---------------- */

  function bindDropzone(onFilesAdded) {
    const dz = els.dropzone;

    dz.addEventListener('click', (e) => {
      if (e.target.closest('label')) return; // let the native label handle it
      els.fileInput.click();
    });

    dz.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        els.fileInput.click();
      }
    });

    ['dragenter', 'dragover'].forEach((evt) => {
      dz.addEventListener(evt, (e) => {
        e.preventDefault();
        dz.classList.add('drag-over');
      });
    });

    ['dragleave', 'drop'].forEach((evt) => {
      dz.addEventListener(evt, (e) => {
        e.preventDefault();
        dz.classList.remove('drag-over');
      });
    });

    dz.addEventListener('drop', (e) => {
      const files = Array.from(e.dataTransfer.files || []);
      onFilesAdded(files);
    });

    els.fileInput.addEventListener('change', (e) => {
      const files = Array.from(e.target.files || []);
      onFilesAdded(files);
      els.fileInput.value = ''; // allow re-adding the same file after removal
    });
  }

  return {
    cacheElements,
    els,
    renderFileList,
    updateFileProgress,
    setStatus,
    clearStatus,
    applyTheme,
    bindDropzone,
  };
})();
