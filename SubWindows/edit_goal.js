const { ipcRenderer } = require('electron');

// 获取表单元素
const editRecordForm = document.getElementById('editGoalForm');
const cancelButton = document.getElementById('cancelButton');
const contentInput = document.getElementById('content');

let data_index;
let goal_id;

// 接收编辑数据
ipcRenderer.on('edit-goal', (event, {index, goal}) => {
  data_index = index;
  contentInput.value = goal.name || '';
  goal_id = goal.id;
});

// 表单提交处理
editRecordForm.addEventListener('submit', (e) => {
  e.preventDefault();
  
  const updatedGoal = {
    name: contentInput.value,
    id:goal_id
  };

  ipcRenderer.send('update-goal', { 
    index: data_index, 
    goal: updatedGoal
  });
  ipcRenderer.send('close-edit-goal-window');
});

cancelButton.addEventListener('click', async () => {
  ipcRenderer.send('close-edit-goal-window');
});

