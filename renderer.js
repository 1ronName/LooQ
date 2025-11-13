const { ipcRenderer} = require('electron');
const path = require('path');

// 获取记录列表和待办列表元素
const recordList = document.getElementById('recordList');
const todoList = document.getElementById('todoList');

const container = document.querySelector('.activity-container');
container.scrollLeft = container.scrollWidth;


function renderActivityGraph(records) {
  const graph = document.getElementById("activity-graph");
  const monthLabels = document.getElementById("month-labels");
  graph.innerHTML = '';
  monthLabels.innerHTML = '';

  const today = new Date();
  const start = new Date(today.getFullYear(), 0, 1);
  const end = new Date(today);
  end.setDate(end.getDate());

  // 统计
  const dateMap = {};
  records.forEach(record => {
    const date = new Date(record.date);
    if (date >= start && date <= end) {
      const key = date.toISOString().split('T')[0];
      dateMap[key] = (dateMap[key] || 0) + 1;
    }
  });

  // 生成日期数组
  const dates = [];
  const temp = new Date(start);
  while (temp <= end) {
    dates.push(new Date(temp));
    temp.setDate(temp.getDate() + 1);
  }

  // 计算周数（每列为一周）
  const numWeeks = Math.ceil(dates.length / 7);

  // 动态设置列数（保证 grid 与 monthLabels 对齐）
  graph.style.gridTemplateColumns = `repeat(${numWeeks}, 12px)`;
  monthLabels.style.gridTemplateColumns = `repeat(${numWeeks}, 12px)`;

  const maxValue = Math.max(1, ...Object.values(dateMap));

  // 月份标签：放在对应的列（以weekIndex为基准）
  const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  let lastMonth = -1;
  dates.forEach((d, i) => {
    const weekIndex = Math.floor(i / 7);
    const m = d.getMonth();
    if (m !== lastMonth) {
      const label = document.createElement("div");
      label.className = 'month-label';
      label.textContent = monthNames[m];
      // 将 label 放到对应的列（gridColumn 从 1 开始）
      label.style.gridColumnStart = (weekIndex + 1);
      monthLabels.appendChild(label);
      lastMonth = m;
    }
  });

  // 绘制格子：顺序为日期顺序，CSS 的 grid-auto-flow: column 会按列装填
  dates.forEach(d => {
    const key = d.toISOString().split('T')[0];
    const count = dateMap[key] || 0;
    const level = count === 0 ? 0 : Math.ceil((count / maxValue) * 4);
    const cell = document.createElement("div");
    cell.classList.add("activity-cell");
    if (level > 0) cell.dataset.level = level;
    cell.title = `${key}：${count} 次`;
    graph.appendChild(cell);
  });
}

// 请求主进程发送数据
ipcRenderer.send('request-data');

ipcRenderer.on('receive-data', (event, data) => {
  renderActivityGraph(data.records);
  document.querySelector('.activity-container').scrollLeft = document.querySelector('.activity-container').scrollWidth;
  // 清空现有列表
  recordList.innerHTML = '';
  todoList.innerHTML = '';

  // 对记录数组按日期降序排序（最新的在前）
  const sortedRecords = [...data.records].sort((a, b) => {
    return new Date(b.date) - new Date(a.date); // 降序排列
    // 如需升序排列（旧的在前）： return new Date(a.date) - new Date(b.date);
  });

  // 对待办数组按日期降序排序
  const sortedTodos = [...data.todos].sort((a, b) => {
    return new Date(a.date) - new Date(b.date);
  });

  const goals = [...data.goals];

  // 遍历记录数组并创建列表项
  sortedRecords.forEach((record, index) => {
    const listItem = document.createElement('li');
    // 创建包含方框样式的元素
    const dateSpan = document.createElement('span');
    dateSpan.className = 'info-box date-box';
    dateSpan.textContent = formatDate(record.date);
  
    const goalSpan = document.createElement('span');
    // 使用 find 方法查找具有特定 id 的对象
    const goal = goals.find(goal => goal.id === record.goal);
    goalSpan.className = 'info-box goal-box';
    goalSpan.textContent = `${goal.name}`;
    
    const contentSpan = document.createElement('span');
    contentSpan.className = 'content-text';
    contentSpan.textContent = record.content;
    
    // 将元素添加到列表项
    listItem.appendChild(dateSpan);
    listItem.appendChild(goalSpan);
    listItem.appendChild(contentSpan);

    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'button-container';

    const editButton = document.createElement('button');
    editButton.textContent = '编辑';
    editButton.className='edit-button'
    editButton.addEventListener('click', () => {
      ipcRenderer.send('open-record-edit-window', { 
        index: data.records.findIndex(r => r.date === record.date && r.content === record.content), 
        record 
      });
    });

    const deleteButton = document.createElement('button');
    deleteButton.textContent = '删除';
    deleteButton.className='delete-button'
    deleteButton.addEventListener('click', () => {
      confirmDelete('record', 
        data.records.findIndex(r => r.date === record.date && r.content === record.content)
      );
    });

    buttonContainer.appendChild(editButton);
    buttonContainer.appendChild(deleteButton);
    listItem.appendChild(buttonContainer);
    recordList.appendChild(listItem);
  });

  // 遍历待办数组并创建列表项
  sortedTodos.forEach((todo, index) => {
    const listItem = document.createElement('li');

    const dateTimeSpan = document.createElement('span');
    dateTimeSpan.className = 'info-box date-box';
    dateTimeSpan.textContent = formatDate(todo.date);
  
    const contentSpan = document.createElement('span');
    contentSpan.className = 'content-text';
    contentSpan.textContent = todo.content;
    
    listItem.appendChild(dateTimeSpan);
    listItem.appendChild(contentSpan);

    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'button-container';

    const editButton = document.createElement('button');
    editButton.textContent = '编辑';
    editButton.className='edit-button'
    editButton.addEventListener('click', () => {
      ipcRenderer.send('open-todo-edit-window', { 
        index: data.todos.findIndex(t => t.date === todo.date && t.content === todo.content), 
        todo 
      });
    });

    const deleteButton = document.createElement('button');
    deleteButton.textContent = '删除';
    deleteButton.className='delete-button'
    deleteButton.addEventListener('click', () => {
      confirmDelete('todo', 
        data.todos.findIndex(t => t.date === todo.date && t.content === todo.content)
      );
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

// 新增日期格式化函数
function formatDate(dateString) {
    const now = new Date();
    const currentYear = now.getFullYear();
    
    // 分割日期和时间部分
    const [datePart, timePart] = dateString.split(' ');
    const [year, month, day] = datePart.split('-');
    
    // 如果是今年，只显示月-日；否则显示完整年月日
    const formattedDate = parseInt(year) === currentYear
        ? `${month}-${day}`
        : `${year}-${month}-${day}`;
    
    // 如果有时间部分，附加时间
    return timePart ? `${formattedDate} ${timePart}` : formattedDate;
}

ipcRenderer.on('item-deleted', () => {
  // 请求主进程重新发送数据
  ipcRenderer.send('request-data');
});

document.getElementById('settings-button').addEventListener('click', () => {
  ipcRenderer.send('change-settings-window');
});

document.getElementById('goal-manage-button').addEventListener('click', () => {
  ipcRenderer.send('open-goal-manage-window');
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