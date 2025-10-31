let links = [];
let panel = null;
let isPanelVisible = false;

function createPanel() {
  if (panel) return;

  panel = document.createElement('div');
  panel.id = 'le-link-extractor-panel';

  const header = document.createElement('div');
  header.id = 'le-panel-header';
  header.innerHTML = `
    <span>Link Extractor</span>
    <button id="le-close-btn" style="background: none; border: none; color: #ffffff; cursor: pointer; font-size: 16px;">×</button>
  `;

  const content = document.createElement('div');
  content.id = 'le-panel-content';
  content.innerHTML = `
    <button id="le-detect-btn">检测链接 (Detect Links)</button>
    <div id="le-results-list"></div>
    <div id="le-button-row">
      <button id="le-copy-btn">一键复制 (Copy All)</button>
      <button id="le-export-btn">导出 TXT (Export)</button>
    </div>
  `;

  panel.appendChild(header);
  panel.appendChild(content);
  document.body.appendChild(panel);

  let isDragging = false;
  let currentX, currentY, initialX, initialY;
  header.addEventListener('mousedown', (e) => {
    if (e.target.id === 'le-close-btn') return;
    isDragging = true;
    initialX = e.clientX - panel.offsetLeft;
    initialY = e.clientY - panel.offsetTop;
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  });

  function onMouseMove(e) {
    if (isDragging) {
      e.preventDefault();
      currentX = e.clientX - initialX;
      currentY = e.clientY - initialY;
      panel.style.left = `${Math.max(0, currentX)}px`;
      panel.style.top = `${Math.max(0, currentY)}px`;
    }
  }

  function onMouseUp() {
    isDragging = false;
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
  }

  document.getElementById('le-close-btn').addEventListener('click', togglePanel);
  document.getElementById('le-detect-btn').addEventListener('click', detectLinks);
  document.getElementById('le-copy-btn').addEventListener('click', copyAll);
  document.getElementById('le-export-btn').addEventListener('click', exportToTxt);
}

function detectLinks() {
  links = Array.from(new Set(
    Array.from(document.querySelectorAll('a[href]'))
      .map(a => a.href)
      .filter(url => url && (url.startsWith('http://') || url.startsWith('https://')))
  ));
  displayResults();
}

function displayResults() {
  const list = document.getElementById('le-results-list');
  list.innerHTML = '';
  links.forEach((url, index) => {
    const item = document.createElement('div');
    item.className = 'le-result-item';
    item.innerHTML = `
      <span class="le-result-text">${url}</span>
      <button class="le-delete-btn" data-index="${index}">删除</button>
    `;
    list.appendChild(item);
  });
  document.querySelectorAll('.le-delete-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const index = parseInt(e.target.dataset.index);
      links.splice(index, 1);
      displayResults();
    });
  });
}

function copyAll() {
  const text = links.join('\n');
  navigator.clipboard.writeText(text).then(() => alert('已复制到剪贴板!')).catch(console.error);
}

function exportToTxt() {
  const blob = new Blob([links.join('\n')], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'extracted_links.txt';
  a.click();
  URL.revokeObjectURL(url);
}

function togglePanel() {
  isPanelVisible = !isPanelVisible;
  panel.style.display = isPanelVisible ? 'block' : 'none';
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'togglePanel') {
    if (!panel) createPanel();
    togglePanel();
    sendResponse({ success: true });
  }
});

// 页面加载时自动创建并显示面板，确保悬浮容器可见
window.addEventListener('load', () => {
  createPanel();
  if (!isPanelVisible) {
    togglePanel(); // 强制显示
  }
});