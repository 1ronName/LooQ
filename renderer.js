const { ipcRenderer, dialog } = require('electron');
const path = require('path');
const recordsPath = path.join(__dirname, '..', 'data', 'records.json');

// 获取记录列表和待办列表元素
const recordList = document.getElementById('recordList');
const todoList = document.getElementById('todoList');

// 请求主进程发送数据
ipcRenderer.send('request-data');

ipcRenderer.on('receive-data', (event, data) => {
  // 清空现有列表
  recordList.innerHTML = '';
  todoList.innerHTML = '';

  // 遍历记录数组并创建列表项
  data.records.forEach((record, index) => {
    const listItem = document.createElement('li');
    listItem.textContent = `${record.date}[${record.goal}]${record.content}`;

    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'button-container';

    const editButton = document.createElement('button');
    editButton.textContent = '编辑';
    editButton.className='edit-button'
    editButton.addEventListener('click', () => {
      ipcRenderer.send('open-record-edit-window', { index, record });
    });

    const deleteButton = document.createElement('button');
    deleteButton.textContent = '删除';
    deleteButton.className='delete-button'
    deleteButton.addEventListener('click', () => {
      confirmDelete('record', index);
    });

    buttonContainer.appendChild(editButton);
    buttonContainer.appendChild(deleteButton);
    listItem.appendChild(buttonContainer);
    recordList.appendChild(listItem);
  });

  // 遍历待办数组并创建列表项
  data.todos.forEach((todo, index) => {
    const listItem = document.createElement('li');
    listItem.textContent = `${todo.date}-${todo.content}`;

    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'button-container';

    const editButton = document.createElement('button');
    editButton.textContent = '编辑';
    editButton.className='edit-button'
    editButton.addEventListener('click', () => {
      ipcRenderer.send('open-todo-edit-window', { index, todo });
    });

    const deleteButton = document.createElement('button');
    deleteButton.textContent = '删除';
    deleteButton.className='delete-button'
    deleteButton.addEventListener('click', () => {
      confirmDelete('todo', index);
    });

    buttonContainer.appendChild(editButton);
    buttonContainer.appendChild(deleteButton);
    listItem.appendChild(buttonContainer);
    todoList.appendChild(listItem);
  });
});

function openRecordEditWindow(type, index, item) {
  ipcRenderer.send('open-record-edit-window', { type, index, item });
}

function openTodoEditWindow(type, index, item) {
  ipcRenderer.send('open-todo-edit-window', { type, index, item });
}

function confirmDelete(type, index) {
  const result = confirm('是否确认删除这项数据？');
  if (result) {
    ipcRenderer.send('delete-item', { type, index });
  }
}

ipcRenderer.on('item-deleted', () => {
  // 请求主进程重新发送数据
  ipcRenderer.send('request-data');
});

document.getElementById('addTodoButton').addEventListener('click', () => {
  ipcRenderer.send('open-add-todo-window');
});

document.getElementById('addRecordButton').addEventListener('click', () => {
  ipcRenderer.send('open-add-record-window');
});

document.getElementById('close-button').addEventListener('click', () => {
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