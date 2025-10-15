const { ipcRenderer } = require('electron');
const path = require('path');
const recordsPath = path.join(__dirname, '..', 'data', 'records.json');

document
.getElementById('close-button').addEventListener('click', () => {
  ipcRenderer.send('close-window');
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