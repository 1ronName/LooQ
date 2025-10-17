const { ipcRenderer } = require('electron');

// 获取今天的日期
const today = new Date();
const year = today.getFullYear();
const month = String(today.getMonth() + 1).padStart(2, '0'); // 月份从0开始，需要加1
const day = String(today.getDate()).padStart(2, '0');
const todayDate = `${year}-${month}-${day}`;

// 设置日期输入框的默认值为今天
document.getElementById('date').value = todayDate;

document.getElementById('cancelButton').addEventListener('click', () => {
    ipcRenderer.send('close-add-record-window');
});

document.getElementById('addRecordForm').addEventListener('submit', (e) => {
    e.preventDefault();
    // 获取表单数据
    const formData = new FormData(e.target);
    const content = formData.get('content');
    const date = formData.get('date');
    const goal = formData.get('goal');

    // 可以在这里发送数据到主进程
    ipcRenderer.send('save-record', { goal, content, date });
    ipcRenderer.send('close-add-record-window');
});