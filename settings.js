const {ipcRenderer } = require('electron');

document.getElementById('back-button').addEventListener('click', () => {
  ipcRenderer.send('change-main-window');
});

document.addEventListener('DOMContentLoaded', () => {
  const autoStartCheckbox = document.getElementById('auto-start-checkbox');
  const backButton = document.getElementById('back-button');

  // 加载当前设置
  ipcRenderer.invoke('get-auto-start-setting').then(isEnabled => {
    autoStartCheckbox.checked = isEnabled;
  });

  // 保存设置变化
  autoStartCheckbox.addEventListener('change', () => {
    ipcRenderer.send('set-auto-start-setting', autoStartCheckbox.checked);
  });

  // 返回按钮
  backButton.addEventListener('click', () => {
    ipcRenderer.send('navigate-to', 'main');
  });
});

let isDragging = false;
let startX, startY;
let accumulatedDx = 0;
let accumulatedDy = 0;

document.getElementById('top').addEventListener('mousedown', (e) => {
  isDragging = true;
  startX = e.clientX;
  startY = e.clientY;
});

document.addEventListener('mousemove', (e) => {
  if (!isDragging) return;

  const dx = e.clientX - startX;
  const dy = e.clientY - startY;

  // 累积偏移量
  accumulatedDx += dx;
  accumulatedDy += dy;

  // 发送累积的偏移量到主进程
  ipcRenderer.send('move-window', accumulatedDx, accumulatedDy);

  // 更新起始位置
  startX = e.clientX;
  startY = e.clientY;
});

document.addEventListener('mouseup', () => {
  if (isDragging) {
    isDragging = false;
    accumulatedDx = 0;
    accumulatedDy = 0;
  }
});