const { ipcRenderer } = require('electron');

// 获取表单元素
const editRecordForm = document.getElementById('editRecordForm');
const cancelButton = document.getElementById('cancelButton');
const goalSelect = document.getElementById('goal');
const contentInput = document.getElementById('content');
const dateInput = document.getElementById('date');
const createGoalBtn = document.getElementById('createGoalBtn');
const deleteGoalBtn = document.getElementById('deleteGoalBtn');

// 当前编辑记录的索引
let data_index;

// 初始化目标下拉框
function initGoalSelect() {
  ipcRenderer.send('get-goals');
}

// 接收目标列表
ipcRenderer.on('receive-goals', (event, goals) => {
  // 清空所有选项（包括"无"）
  goalSelect.innerHTML = '';
  
  // 添加"无"选项
  const defaultOption = new Option('无', '无');
  goalSelect.add(defaultOption);

  // 添加目标选项
  goals.forEach(goal => {
    const option = new Option(goal.name, goal.name);
    goalSelect.add(option);
  });

  // 初始化删除按钮状态
  updateDeleteButtonState();
});

// 选择变化时更新按钮状态
goalSelect.addEventListener('change', updateDeleteButtonState);

// 更新删除按钮状态
function updateDeleteButtonState() {
  const hasSelectableGoals = goalSelect.options.length > 1;
  const isValidSelection = goalSelect.value && goalSelect.value !== 'new';
  
  deleteGoalBtn.disabled = !hasSelectableGoals || !isValidSelection;
}

// 接收编辑数据
ipcRenderer.on('edit-record', (event, { index, record }) => {
  data_index = index;
  goalSelect.value = record.goal || '';
  contentInput.value = record.content || '';
  dateInput.value = record.date || '';
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
  try {
    // 获取当前表单中的目标值
    const currentGoal = goalSelect.value;
    const currentGoalName = goalSelect.options[goalSelect.selectedIndex].text;
    
      const existingGoals = await ipcRenderer.send('get-goals');
      
      // 检查当前目标是否不存在于目标列表中
      const goalExists = existingGoals.some(g => g.id === currentGoal);
      
      if (!goalExists) {
        const newGoal = await ipcRenderer.invoke('add-goal', currentGoalName);
      }
    
    // 关闭窗口
    ipcRenderer.send('close-edit-record-window');
  } catch (error) {
    console.error('取消时检查目标出错:', error);
    ipcRenderer.send('close-edit-record-window');
  }
});

document.addEventListener('DOMContentLoaded', () => {
  initGoalSelect();
  
  // 确保按钮元素已加载后再绑定事件
  createGoalBtn.addEventListener('click', async () => {
    const goalName = prompt('请输入新目标名称:');
    if (goalName && goalName.trim()) {
      const newGoal = await ipcRenderer.send('add-goal', goalName);
      if (newGoal) {
        initGoalSelect();
        goalSelect.value = newGoal.id;
      }
    }
  });

  // 删除按钮状态控制
  goalSelect.addEventListener('change', () => {
    deleteGoalBtn.disabled = !goalSelect.value || goalSelect.value === 'new';
  });
});

// 创建新目标
createGoalBtn.addEventListener('click', () => {
  const goalName = prompt('请输入新目标名称:');
  if (goalName && goalName.trim()) {
    console.log('发送添加目标请求:', goalName);
    ipcRenderer.send('add-goal', goalName);
  }
});

// 接收添加目标的结果
ipcRenderer.on('add-goal-result', (event, newGoal) => {
  if (newGoal) {
    console.log('收到新目标:', newGoal);
    initGoalSelect();
    goalSelect.value = newGoal.id;
  } else {
    console.error('添加目标失败');
  }
});

// 删除目标
deleteGoalBtn.addEventListener('click', async () => {
  const goalId = goalSelect.value;
  if (goalId && !['', 'new'].includes(goalId)) {
    const goalName = goalSelect.options[goalSelect.selectedIndex].text;
    const confirmed = confirm(`确定要删除目标 "${goalName}" 吗？`);
    
    if (confirmed) {
      try {
        // 发送删除请求（根据名称删除）
        ipcRenderer.send('delete-goal-by-name', goalName);
        
        // 等待删除完成
        ipcRenderer.once('delete-goal-result', (event, success) => {
          if (success) {
            // 删除成功后重置选择为"无"
            goalSelect.value = '';
            console.log(`目标 "${goalName}" 已删除`);
            
            // 刷新目标列表
            initGoalSelect();
          } else {
            console.error('删除目标失败');
          }
        });
      } catch (error) {
        console.error('删除目标时出错:', error);
      }
    }
  }
});
