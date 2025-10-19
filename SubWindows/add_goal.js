const { ipcRenderer } = require('electron');

document.getElementById('cancelButton').addEventListener('click', () => {
    ipcRenderer.send('close-add-goal-window');
});

// 获取当前时间并格式化为YYYY-MM-DDTHH:mm格式
const now = new Date();
const year = now.getFullYear();
const month = String(now.getMonth() + 1).padStart(2, '0');
const day = String(now.getDate()).padStart(2, '0');
const hours = String(now.getHours()).padStart(2, '0');
const minutes = String(now.getMinutes()).padStart(2, '0');
const seconds = String(now.getSeconds()).padStart(2, '0');

document.getElementById('addGoalForm').addEventListener('submit', (e) => {
    e.preventDefault();
    // 获取表单数据
    const formData = new FormData(e.target);
    const name = formData.get('name');

    const id = `${seconds}${year}${month}${day}${hours}${minutes}`;

    // 可以在这里发送数据到主进程
    ipcRenderer.send('save-goal', { name, id });
    ipcRenderer.send('close-add-goal-window');
});
