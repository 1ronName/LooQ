const { ipcRenderer } = require('electron');

// 获取表单元素
const editRecordForm = document.getElementById('editRecordForm');
const cancelButton = document.getElementById('cancelButton');
const contentInput = document.getElementById('content');
const dateInput = document.getElementById('date');
const goalSelect = document.getElementById('goal');

let data_index;

ipcRenderer.on('edit-record', (event, { index, record }) => {
  // 填充表单数据
  goalSelect.value = record.goal;
  contentInput.value = record.content;
  dateInput.value = record.date;

  // 保存索引以便后续更新
  data_index = index;
});

// 处理表单提交
editRecordForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const updatedRecord = {
    goal: goalSelect.value,
    content: contentInput.value,
    date: dateInput.value,
  };

  // 发送更新后的记录数据到主进程
  ipcRenderer.send('update-record', { index: data_index, record: updatedRecord });
  ipcRenderer.send('close-edit-record-window');
});

// 处理取消按钮点击
cancelButton.addEventListener('click', () => {
  ipcRenderer.send('close-edit-record-window');
});