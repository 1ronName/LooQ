const { ipcRenderer } = require('electron');

// 获取表单元素
const editTodoForm = document.getElementById('editTodoForm');
const cancelButton = document.getElementById('cancelButton');
const contentInput = document.getElementById('content');
const dateInput = document.getElementById('dateTime');

let data_index;

// 监听从主进程发送的记录数据
ipcRenderer.on('edit-todo', (event, { index, todo }) => {
  // 填充表单数据
  contentInput.value = todo.content;
  dateInput.value = todo.date;

  // 保存索引以便后续更新
  data_index = index;
});

// 处理表单提交
editTodoForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const updatedTodo = {
    content: contentInput.value,
    date: dateInput.value,
  };

  // 发送更新后的记录数据到主进程
  ipcRenderer.send('update-todo', { index: data_index, todo: updatedTodo });
  ipcRenderer.send('close-edit-todo-window');
});

// 处理取消按钮点击
cancelButton.addEventListener('click', () => {
  ipcRenderer.send('close-edit-todo-window');
});