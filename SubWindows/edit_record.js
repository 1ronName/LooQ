const { ipcRenderer } = require('electron');

// 获取表单元素
const editRecordForm = document.getElementById('editRecordForm');
const cancelButton = document.getElementById('cancelButton');
const goalSelect = document.getElementById('goal');
const contentInput = document.getElementById('content');
const dateInput = document.getElementById('date');

// 当前编辑记录的索引
let data_index;
let goalList;
let goalId;

// 初始化目标下拉框
function initGoalSelect(goal_name) {
  goalSelect.innerHTML = '';
  
  // 添加"无"选项
  // const defaultOption = new Option('日常', 'goal0');
  // goalSelect.add(defaultOption);

  // 添加目标选项
  goalList.forEach(goal => {
    const option = new Option(goal.name, goal.id);
    goalSelect.add(option);
  });

  // const _goal = goalList.find(goal => goal.name == goal_name);
  goalSelect.value = goalId;
}

// 接收编辑数据
ipcRenderer.on('edit-record', (event, { index, record, goals }) => {
  data_index = index;
  goalSelect.value = record.goal || '';
  goalId = record.goal || '';
  contentInput.value = record.content || '';
  dateInput.value = record.date || '';
  goalList = goals;
  initGoalSelect(record.goal)
});

// 表单提交处理
editRecordForm.addEventListener('submit', (e) => {
  e.preventDefault();
  
  const updatedRecord = {
    goal: goalSelect.value,
    content: contentInput.value,
    date: dateInput.value
  };

  ipcRenderer.send('update-record', { 
    index: data_index, 
    record: updatedRecord 
  });
  ipcRenderer.send('close-edit-record-window');
});

cancelButton.addEventListener('click', async () => {
  ipcRenderer.send('close-edit-record-window');
});

